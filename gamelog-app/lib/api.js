/**
 * @fileoverview Cliente da API do GameLog.
 *
 * Todas as conversas com o back-end (FastAPI) passam por este arquivo. Cada
 * rota tem uma função própria, então as páginas nunca precisam montar URL ou
 * header na mão.
 */

/** Endereço do back-end. Usa NEXT_PUBLIC_API_URL e, se ela não existir, o servidor local. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Erro lançado quando o back-end responde com falha (status fora de 2xx). */
export class ApiError extends Error {
  /**
   * @param {string} message Mensagem pronta para mostrar ao usuário.
   * @param {number} status Código HTTP da resposta (ex.: 401).
   * @param {*} detail Conteúdo original do campo "detail" enviado pelo FastAPI.
   */
  constructor(message, status, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Escolhe a mensagem de erro que vai para a tela.
 *
 * @param {unknown} err Erro capturado.
 * @param {string} fallback Mensagem usada quando o erro não vem da API.
 * @returns {string} A mensagem do ApiError ou o texto padrão.
 */
export function mensagemErro(err, fallback) {
  return err instanceof ApiError ? err.message : fallback;
}

/** Nome de cada campo do back-end como aparece nas mensagens de erro de validação. */
const NOMES_DOS_CAMPOS = {
  usr_nome_usuario: "nome de usuário",
  usr_nome_completo: "nome completo",
  usr_email: "e-mail",
  usr_senha: "senha",
  usr_senha_atual: "senha atual",
  usr_senha_nova: "nova senha",
};

/**
 * Transforma o campo "detail" de um erro do FastAPI em texto para a tela.
 *
 * Erros de regra de negócio vêm como texto (ex.: "Email já cadastrado") e passam
 * direto. Já os erros de validação (status 422) vêm como uma lista, e a primeira
 * falha é traduzida (ex.: "A senha deve ter pelo menos 8 caracteres.").
 *
 * @param {*} detail Conteúdo do campo "detail" da resposta.
 * @returns {string} Mensagem pronta para mostrar ao usuário.
 */
export function mensagemDoDetail(detail) {
  if (typeof detail === "string") return detail;

  const falha = Array.isArray(detail) ? detail[0] : null;
  if (!falha) return "Erro na requisição";

  const campo = NOMES_DOS_CAMPOS[falha.loc?.[falha.loc.length - 1]];
  if (!campo) return "Dados inválidos. Confira os campos e tente novamente.";

  if (falha.type === "string_too_short") {
    return `O campo ${campo} deve ter pelo menos ${falha.ctx?.min_length} caracteres.`;
  }
  if (falha.type === "string_too_long") {
    return `O campo ${campo} deve ter no máximo ${falha.ctx?.max_length} caracteres.`;
  }
  return `O campo ${campo} é inválido.`;
}

/**
 * Faz a requisição ao back-end e devolve o JSON da resposta.
 *
 * Se receber um token, manda o header "Authorization: Bearer <token>". Se a
 * resposta não for OK, lança um ApiError com a mensagem do campo "detail" do
 * FastAPI (ex.: "Email ou senha inválidos").
 *
 * @param {string} path Caminho da rota, começando com "/" (ex.: "/games/").
 * @param {object} [opcoes]
 * @param {string} [opcoes.method="GET"] Método HTTP.
 * @param {object|URLSearchParams} [opcoes.body] Corpo da requisição. Vai como JSON,
 * a menos que isForm seja true.
 * @param {string} [opcoes.token] Token JWT do usuário logado.
 * @param {boolean} [opcoes.isForm=false] Se true, o corpo vai como formulário.
 * @returns {Promise<*>} Dados da resposta, ou null se ela não for JSON.
 * @throws {ApiError} Quando o status da resposta indica falha.
 */
async function request(
  path,
  { method = "GET", body, token, isForm = false } = {},
) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const detail = data?.detail || res.statusText;
    throw new ApiError(mensagemDoDetail(detail), res.status, detail);
  }

  return data;
}

/**
 * Cadastra um novo usuário (POST /auth/register).
 *
 * @param {object} dados
 * @param {string} dados.nomeCompleto
 * @param {string} dados.nomeUsuario
 * @param {string} dados.email
 * @param {string} dados.senha
 * @returns {Promise<object>} Dados do usuário criado.
 */
export function registerUser({ nomeCompleto, nomeUsuario, email, senha }) {
  return request("/auth/register", {
    method: "POST",
    body: {
      usr_nome_usuario: nomeUsuario,
      usr_nome_completo: nomeCompleto,
      usr_email: email,
      usr_senha: senha,
    },
  });
}

/**
 * Faz login (POST /auth/login).
 *
 * O back-end usa o formulário padrão do OAuth2, por isso o corpo vai como
 * formulário e o e-mail é enviado no campo "username".
 *
 * @param {object} dados
 * @param {string} dados.email
 * @param {string} dados.senha
 * @returns {Promise<{access_token: string}>} Token JWT da sessão.
 */
export function loginUser({ email, senha }) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", senha);

  return request("/auth/login", {
    method: "POST",
    body,
    isForm: true,
  });
}

/**
 * Busca os dados do usuário logado (GET /auth/me).
 *
 * @param {string} token Token JWT.
 * @returns {Promise<object>} Usuário logado.
 */
export function getMe(token) {
  return request("/auth/me", { token });
}

/**
 * Atualiza o perfil do usuário logado (PATCH /auth/me). Só os campos enviados
 * são alterados.
 *
 * @param {string} token Token JWT.
 * @param {object} dados Campos do perfil (usr_nome_completo, usr_nome_usuario,
 * usr_email, usr_avatar_url ou usr_bio). Mandar usr_avatar_url como null remove a foto.
 * @returns {Promise<object>} Usuário já atualizado.
 */
export function updateMe(token, dados) {
  return request("/auth/me", { method: "PATCH", body: dados, token });
}

/**
 * Troca a senha do usuário logado (PATCH /auth/me/senha). O back-end confere a
 * senha atual e responde 204 (sem corpo) quando dá certo.
 *
 * @param {string} token Token JWT.
 * @param {object} dados
 * @param {string} dados.senhaAtual
 * @param {string} dados.novaSenha
 * @returns {Promise<null>}
 */
export function changePassword(token, { senhaAtual, novaSenha }) {
  return request("/auth/me/senha", {
    method: "PATCH",
    token,
    body: { usr_senha_atual: senhaAtual, usr_senha_nova: novaSenha },
  });
}

/** Lista os jogos que já estão salvos no banco do GameLog (GET /games/). */
export function listGames() {
  return request("/games/");
}

/**
 * Busca um jogo do banco do GameLog pelo id local (GET /games/{id}).
 *
 * @param {number|string} id Id do jogo no banco local.
 */
export function getGame(id) {
  return request(`/games/${id}`);
}

/**
 * Busca os detalhes completos de um jogo direto na RAWG (GET /games/rawg/{id}).
 * É o que alimenta a página de detalhes do jogo.
 *
 * @param {number|string} rawgId Id do jogo na RAWG.
 */
export function getGameDetailsRawg(rawgId) {
  return request(`/games/rawg/${rawgId}`);
}

/**
 * Garante que o jogo da RAWG exista no banco do GameLog (cria se ainda não
 * existir) e devolve o registro local, já com jgs_id.
 * (POST /games/rawg/{id}/importar-um)
 *
 * Precisa rodar antes de adicionar à biblioteca, que só aceita o id local.
 *
 * @param {string} token Token JWT.
 * @param {number|string} rawgId Id do jogo na RAWG.
 * @returns {Promise<object>} Jogo salvo no banco local.
 */
export function importarUmJogoRawg(token, rawgId) {
  return request(`/games/rawg/${rawgId}/importar-um`, {
    method: "POST",
    token,
  });
}

/**
 * Pesquisa jogos na RAWG pelo nome (GET /games/rawg/search).
 *
 * @param {object} filtros
 * @param {string} filtros.nome Texto da busca.
 * @param {number} [filtros.page=1] Página dos resultados.
 * @param {number} [filtros.pageSize=10] Jogos por página.
 */
export function searchRawg({ nome, page = 1, pageSize = 10 }) {
  const params = new URLSearchParams({
    nome,
    page: String(page),
    page_size: String(pageSize),
  });
  return request(`/games/rawg/search?${params}`);
}

/**
 * Lista jogos direto da RAWG, sem gravar nada no banco (GET /games/rawg/lista).
 * O catálogo e a pesquisa usam esta mesma função, só mudando os filtros.
 *
 * @param {object} [filtros] Todos os filtros são opcionais.
 * @param {string} [filtros.nome] Texto da busca.
 * @param {string} [filtros.genero] Slug(s) de gênero da RAWG, separados por vírgula.
 * @param {string} [filtros.tag] Slug(s) de tag da RAWG, separados por vírgula.
 * @param {string} [filtros.ordering] Ordenação da RAWG (ex.: "-rating"). Só é enviada
 * se for informada: forçar a ordem por nota numa busca por nome tira a
 * relevância dos resultados.
 * @param {boolean} [filtros.aleatorio] Pede uma amostra sorteada de jogos populares
 * (o back-end ignora isso quando há "nome").
 * @param {number} [filtros.page=1] Página dos resultados.
 * @param {number} [filtros.pageSize=20] Jogos por página.
 * @returns {Promise<{results: object[], next: (string|null)}>} Página de jogos no
 * formato da RAWG.
 */
export function listarRawg({
  nome,
  genero,
  tag,
  ordering,
  aleatorio,
  page = 1,
  pageSize = 20,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (nome) params.set("nome", nome);
  if (genero) params.set("genero", genero);
  if (tag) params.set("tag", tag);
  if (ordering) params.set("ordering", ordering);
  if (aleatorio) params.set("aleatorio", "true");

  return request(`/games/rawg/lista?${params}`);
}

/**
 * Lista a biblioteca do usuário logado (GET /library/).
 *
 * @param {string} token Token JWT.
 */
export function listLibrary(token) {
  return request("/library/", { token });
}

/**
 * Adiciona um jogo à biblioteca do usuário (POST /library/).
 *
 * @param {string} token Token JWT.
 * @param {object} dados Precisa de bib_status e bib_jgs_id (id local do jogo).
 */
export function addToLibrary(token, dados) {
  return request("/library/", { method: "POST", body: dados, token });
}

/**
 * Atualiza uma entrada da biblioteca: status, nota, review ou horas
 * (PUT /library/{id}).
 *
 * @param {string} token Token JWT.
 * @param {number} id Id da entrada (bib_id).
 * @param {object} dados Só os campos que serão alterados.
 */
export function updateLibraryEntry(token, id, dados) {
  return request(`/library/${id}`, { method: "PUT", body: dados, token });
}

/**
 * Remove uma entrada da biblioteca (DELETE /library/{id}).
 *
 * @param {string} token Token JWT.
 * @param {number} id Id da entrada (bib_id).
 */
export function removeFromLibrary(token, id) {
  return request(`/library/${id}`, { method: "DELETE", token });
}

/**
 * Diz se o usuário já tem este jogo da RAWG na biblioteca
 * (GET /games/rawg/{id}/minha-biblioteca).
 *
 * @param {string} token Token JWT.
 * @param {number|string} rawgId Id do jogo na RAWG.
 * @returns {Promise<object|null>} A entrada da biblioteca, ou null se o jogo não
 * estiver nela.
 */
export function getMinhaEntradaBiblioteca(token, rawgId) {
  return request(`/games/rawg/${rawgId}/minha-biblioteca`, { token });
}

/**
 * Busca as reviews públicas (nota e texto) dos outros usuários para um jogo
 * (GET /games/rawg/{id}/reviews, RF013). Não precisa de token.
 *
 * @param {number|string} rawgId Id do jogo na RAWG.
 * @returns {Promise<object[]>} Lista de reviews (vazia se ninguém avaliou).
 */
export function getReviewsRawg(rawgId) {
  return request(`/games/rawg/${rawgId}/reviews`);
}
