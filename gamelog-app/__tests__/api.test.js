import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  addToLibrary,
  getMe,
  importarUmJogoRawg,
  listarRawg,
  loginUser,
  mensagemErro,
  registerUser,
  removeFromLibrary,
  searchRawg,
  updateLibraryEntry,
} from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Uma resposta simulada: os testes não abrem conexões HTTP de verdade. */
function resposta({ status = 200, statusText = "OK", data = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: { get: () => "application/json; charset=utf-8" },
    json: vi.fn().mockResolvedValue(data),
  };
}

describe("Cliente da API GameLog", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resposta()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia o cadastro com os campos esperados pelo FastAPI", async () => {
    await registerUser({
      nomeCompleto: "Ana Silva",
      nomeUsuario: "ana",
      email: "ana@exemplo.com",
      senha: "123456",
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/auth/register`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usr_nome_usuario: "ana",
          usr_nome_completo: "Ana Silva",
          usr_email: "ana@exemplo.com",
          usr_senha: "123456",
        }),
      }),
    );
  });

  it("envia o login como formulário OAuth2 (username e password)", async () => {
    await loginUser({ email: "a@b.com", senha: "segredo" });
    const [url, options] = fetch.mock.calls[0];

    expect(url).toBe(`${API_BASE}/auth/login`);
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(URLSearchParams);
    expect(options.body.get("username")).toBe("a@b.com");
    expect(options.body.get("password")).toBe("segredo");
    expect(options.headers).not.toHaveProperty("Content-Type");
  });

  it("inclui o token JWT nas rotas protegidas", async () => {
    await getMe("token-teste");
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/auth/me`,
      expect.objectContaining({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-teste",
        },
      }),
    );
  });

  it("lista o catálogo RAWG com a paginação padrão", async () => {
    await listarRawg();
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/games/rawg/lista");
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("page_size")).toBe("20");
    expect(url.searchParams.has("ordering")).toBe(false);
    expect(url.searchParams.has("aleatorio")).toBe(false);
  });

  it("aplica filtros e ordenação sem perder a busca por nome", async () => {
    await listarRawg({
      nome: "Elden Ring",
      genero: "action,rpg",
      tag: "souls-like",
      ordering: "-rating",
      aleatorio: true,
      page: 3,
      pageSize: 12,
    });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: "3",
      page_size: "12",
      nome: "Elden Ring",
      genero: "action,rpg",
      tag: "souls-like",
      ordering: "-rating",
      aleatorio: "true",
    });
  });

  it("codifica a pesquisa RAWG e a paginação", async () => {
    await searchRawg({ nome: "The Witcher 3", page: 2, pageSize: 5 });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/games/rawg/search");
    expect(url.searchParams.get("nome")).toBe("The Witcher 3");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("page_size")).toBe("5");
  });

  it("importa um jogo da RAWG e associa um jogo à biblioteca", async () => {
    await importarUmJogoRawg("jwt", 123);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      `${API_BASE}/games/rawg/123/importar-um`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer jwt" }),
      }),
    );

    await addToLibrary("jwt", { bib_jgs_id: 15, bib_status: "jogando" });
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      `${API_BASE}/library/`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ bib_jgs_id: 15, bib_status: "jogando" }),
      }),
    );
  });

  it("envia atualização e remoção da biblioteca para as rotas corretas", async () => {
    await updateLibraryEntry("jwt", 15, { bib_usr_nota: 9 });
    await removeFromLibrary("jwt", 15);
    expect(fetch.mock.calls[0][0]).toBe(`${API_BASE}/library/15`);
    expect(fetch.mock.calls[0][1].method).toBe("PUT");
    expect(fetch.mock.calls[1][0]).toBe(`${API_BASE}/library/15`);
    expect(fetch.mock.calls[1][1].method).toBe("DELETE");
  });

  it("propaga a mensagem do FastAPI quando ocorre erro HTTP", async () => {
    fetch.mockResolvedValueOnce(
      resposta({ status: 401, statusText: "Unauthorized", data: { detail: "Credenciais inválidas" } }),
    );
    await expect(getMe("invalido")).rejects.toMatchObject({
      name: "Error",
      status: 401,
      message: "Credenciais inválidas",
      detail: "Credenciais inválidas",
    });
  });

  it("oferece mensagem genérica quando o detail não é texto", async () => {
    fetch.mockResolvedValueOnce(
      resposta({ status: 422, data: { detail: [{ msg: "erro" }] } }),
    );
    await expect(registerUser({})).rejects.toMatchObject({
      status: 422,
      message: "Erro na requisição",
    });
  });

  it("mostra a mensagem original apenas para ApiError", () => {
    expect(mensagemErro(new ApiError("Não autorizado", 401), "Padrão")).toBe(
      "Não autorizado",
    );
    expect(mensagemErro(new Error("Erro interno"), "Padrão")).toBe("Padrão");
  });
});
