const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Wrapper genérico de fetch pro backend.
 * - Junta a base URL (NEXT_PUBLIC_API_URL) com o path.
 * - Se `token` for passado, manda o header Authorization: Bearer <token>
 *   (é assim que o back-end (app/core/dependencies_auth.py) espera).
 * - Se a resposta não for OK, lança ApiError com a mensagem que o FastAPI
 *   manda em `detail` (ex.: "Email ou senha inválidos").
 */
async function request(path, { method = "GET", body, token, isForm = false } = {}) {
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
    throw new ApiError(
      typeof detail === "string" ? detail : "Erro na requisição",
      res.status,
      detail
    );
  }

  return data;
}

// ---------- Auth ----------
// POST /auth/register espera JSON com esses campos (app/schemas/user.py)
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

// POST /auth/login usa OAuth2PasswordRequestForm: espera
// application/x-www-form-urlencoded com "username" e "password"
// (username = e-mail, é o que o back-end usa pra autenticar)
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

export function getMe(token) {
  return request("/auth/me", { token });
}

// ---------- Games ----------
export function listGames() {
  return request("/games/");
}

export function getGame(id) {
  return request(`/games/${id}`);
}

// GET /games/rawg/{id} — detalhes completos de um jogo direto da RAWG.
// Alimenta a página de detalhes do jogo (app/jogo/[id]).
export function getGameDetailsRawg(rawgId) {
  return request(`/games/rawg/${rawgId}`);
}

// POST /games/rawg/{id}/importar-um — garante que o jogo exista em
// tb_jogos (cria se ainda não existir) e devolve o registro local, já
// com jgs_id. É o passo que roda antes de POST /library, porque a
// biblioteca só aceita o id local, não o id da RAWG.
export function importarUmJogoRawg(token, rawgId) {
  return request(`/games/rawg/${rawgId}/importar-um`, { method: "POST", token });
}

export function searchRawg({ nome, page = 1, pageSize = 10 }) {
  const params = new URLSearchParams({
    nome,
    page: String(page),
    page_size: String(pageSize),
  });
  return request(`/games/rawg/search?${params}`);
}

// GET /games/rawg/lista — lista jogos direto da RAWG (sem exigir nome
// e sem gravar nada no banco). Usada pelo catálogo: destaques,
// categorias e busca, todos com essa mesma função, só mudando os
// filtros. Todos os parâmetros são opcionais.
//
// IMPORTANTE sobre "ordering": só manda esse parâmetro quando for
// passado explicitamente. Quando tem "nome" (busca por texto) e a
// gente força "ordering=-rating", a RAWG ordena por nota em vez de
// relevância — é por isso que buscar "Counter-Strike 2", por exemplo,
// não trazia o jogo certo (ele existe, só não tem nota alta o
// suficiente pra aparecer nas 18 primeiras posições ordenadas por
// rating). Sem "ordering", a RAWG ordena por relevância quando há
// "search", que é o comportamento certo pra busca.
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

// ---------- Library (biblioteca do usuário logado) ----------
export function listLibrary(token) {
  return request("/library/", { token });
}

export function addToLibrary(token, dados) {
  return request("/library/", { method: "POST", body: dados, token });
}

export function updateLibraryEntry(token, id, dados) {
  return request(`/library/${id}`, { method: "PUT", body: dados, token });
}

export function removeFromLibrary(token, id) {
  return request(`/library/${id}`, { method: "DELETE", token });
}

// GET /games/rawg/{id}/minha-biblioteca — diz se ESTE usuário já tem
// esse jogo (da RAWG) na biblioteca dele, e devolve a entrada se tiver
// (senão devolve null). Usada na página de detalhes pra decidir entre
// mostrar "Adicionar à Biblioteca" ou o formulário de nota/review/horas.
export function getMinhaEntradaBiblioteca(token, rawgId) {
  return request(`/games/rawg/${rawgId}/minha-biblioteca`, { token });
}

// GET /games/rawg/{id}/reviews — reviews públicas (nota + texto) de
// outros usuários pra esse jogo (RF013). Rota pública, sem token: se
// o jogo nunca foi importado localmente, a API já devolve [].
export function getReviewsRawg(rawgId) {
  return request(`/games/rawg/${rawgId}/reviews`);
}
