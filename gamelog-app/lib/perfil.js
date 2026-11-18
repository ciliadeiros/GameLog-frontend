/**
 * @fileoverview Funções puras das telas de perfil (/perfil e /perfil/editar):
 * estatísticas da biblioteca e validações dos formulários. Nenhuma delas mexe
 * em estado ou chama a API, então são fáceis de testar.
 */

/** Tamanho mínimo da senha (igual ao do cadastro no back-end). */
export const SENHA_MINIMA = 8;

/** Tamanho máximo da senha (o bcrypt só considera os primeiros 72 bytes). */
export const SENHA_MAXIMA = 72;

/** Tamanho máximo do nome de usuário, do nome completo e do e-mail no banco. */
const TEXTO_MAXIMO = 80;

/** Tamanho mínimo do nome de usuário (igual ao do cadastro). */
const USUARIO_MINIMO = 3;

/** Tamanho máximo da URL da foto (coluna VARCHAR(255) no banco). */
const URL_FOTO_MAXIMA = 255;

/**
 * Conta os jogos da biblioteca que aparecem no card do perfil.
 *
 * @param {object[]} entradas Entradas da biblioteca (GET /library/).
 * @returns {{total: number, finalizados: number, jogando: number}} Total de
 * jogos, jogos finalizados e jogos em andamento.
 */
export function calcularEstatisticas(entradas) {
  return {
    total: entradas.length,
    finalizados: entradas.filter((e) => e.bib_status === "finalizado").length,
    jogando: entradas.filter((e) => e.bib_status === "jogando").length,
  };
}

/**
 * Pega o ano de uma data no formato "AAAA-MM-DD" (como o back-end envia).
 * Lê o texto direto, sem criar um Date, para o fuso horário não mudar o dia.
 *
 * @param {string|null|undefined} data Data de cadastro.
 * @returns {string} O ano, ou "—" se a data não for válida.
 */
export function anoDeCadastro(data) {
  const ano = String(data ?? "").slice(0, 4);
  return /^\d{4}$/.test(ano) ? ano : "—";
}

/**
 * Confere os dados pessoais antes de enviar ao back-end.
 *
 * @param {object} dados
 * @param {string} dados.nomeCompleto
 * @param {string} dados.nomeUsuario
 * @param {string} dados.email
 * @returns {string|null} Mensagem de erro, ou null se estiver tudo certo.
 */
export function validarDadosPessoais({ nomeCompleto, nomeUsuario, email }) {
  const nome = nomeCompleto.trim();
  const usuario = nomeUsuario.trim();
  const correio = email.trim();

  if (!nome) return "Informe o nome completo.";
  if (nome.length > TEXTO_MAXIMO) {
    return `O nome completo deve ter no máximo ${TEXTO_MAXIMO} caracteres.`;
  }
  if (usuario.length < USUARIO_MINIMO) {
    return `O nome de usuário deve ter pelo menos ${USUARIO_MINIMO} caracteres.`;
  }
  if (usuario.length > TEXTO_MAXIMO) {
    return `O nome de usuário deve ter no máximo ${TEXTO_MAXIMO} caracteres.`;
  }
  if (!/^\S+@\S+\.\S+$/.test(correio)) return "Informe um e-mail válido.";
  if (correio.length > TEXTO_MAXIMO) {
    return `O e-mail deve ter no máximo ${TEXTO_MAXIMO} caracteres.`;
  }
  return null;
}

/**
 * Compara o formulário com o usuário logado e monta o corpo do PATCH /auth/me
 * só com o que mudou. Assim o back-end não reclama de "e-mail já cadastrado"
 * quando a pessoa não mexeu no e-mail.
 *
 * @param {object} usuario Usuário logado (campos usr_*).
 * @param {object} form Valores do formulário.
 * @param {string} form.nomeCompleto
 * @param {string} form.nomeUsuario
 * @param {string} form.email
 * @returns {object} Campos alterados (vazio se nada mudou).
 */
export function montarAlteracoes(
  usuario,
  { nomeCompleto, nomeUsuario, email },
) {
  const alteracoes = {};

  if (nomeCompleto.trim() !== usuario.usr_nome_completo) {
    alteracoes.usr_nome_completo = nomeCompleto.trim();
  }
  if (nomeUsuario.trim() !== usuario.usr_nome_usuario) {
    alteracoes.usr_nome_usuario = nomeUsuario.trim();
  }
  if (email.trim() !== usuario.usr_email) {
    alteracoes.usr_email = email.trim();
  }

  return alteracoes;
}

/**
 * Confere o formulário de troca de senha antes de enviar ao back-end.
 *
 * @param {object} dados
 * @param {string} dados.senhaAtual
 * @param {string} dados.novaSenha
 * @param {string} dados.confirmacao Repetição da nova senha.
 * @returns {string|null} Mensagem de erro, ou null se estiver tudo certo.
 */
export function validarNovaSenha({ senhaAtual, novaSenha, confirmacao }) {
  if (!senhaAtual) return "Informe a senha atual.";
  if (novaSenha.length < SENHA_MINIMA) {
    return `A nova senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`;
  }
  if (novaSenha.length > SENHA_MAXIMA) {
    return `A nova senha deve ter no máximo ${SENHA_MAXIMA} caracteres.`;
  }
  if (!/\d/.test(novaSenha))
    return "A nova senha deve ter pelo menos 1 número.";
  if (novaSenha === senhaAtual) {
    return "A nova senha deve ser diferente da atual.";
  }
  if (novaSenha !== confirmacao)
    return "A confirmação não é igual à nova senha.";
  return null;
}

/**
 * Confere o endereço da foto de perfil (o back-end guarda uma URL).
 *
 * @param {string} url Endereço digitado.
 * @returns {string|null} Mensagem de erro, ou null se a URL servir.
 */
export function validarUrlFoto(url) {
  const texto = url.trim();
  if (!texto) return "Cole o endereço (URL) de uma imagem.";
  if (texto.length > URL_FOTO_MAXIMA) {
    return `O endereço deve ter no máximo ${URL_FOTO_MAXIMA} caracteres.`;
  }

  try {
    const { protocol } = new URL(texto);
    if (protocol !== "http:" && protocol !== "https:") throw new Error();
  } catch {
    return "Informe um endereço que comece com http:// ou https://.";
  }
  return null;
}
