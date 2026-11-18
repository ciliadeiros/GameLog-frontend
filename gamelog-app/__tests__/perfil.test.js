import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { changePassword, updateMe } from "@/lib/api";
import {
  anoDeCadastro,
  calcularEstatisticas,
  montarAlteracoes,
  validarDadosPessoais,
  validarNovaSenha,
  validarUrlFoto,
} from "@/lib/perfil";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const USUARIO = {
  usr_nome_completo: "Fulano de Tal",
  usr_nome_usuario: "fulaninho01",
  usr_email: "fulano@gmail.com",
};

describe("calcularEstatisticas", () => {
  it("conta total, finalizados e em andamento", () => {
    const entradas = [
      { bib_status: "finalizado" },
      { bib_status: "finalizado" },
      { bib_status: "jogando" },
      { bib_status: "planejado" },
      { bib_status: "abandonado" },
    ];
    expect(calcularEstatisticas(entradas)).toEqual({
      total: 5,
      finalizados: 2,
      jogando: 1,
    });
  });

  it("devolve zeros para uma biblioteca vazia", () => {
    expect(calcularEstatisticas([])).toEqual({
      total: 0,
      finalizados: 0,
      jogando: 0,
    });
  });
});

describe("anoDeCadastro", () => {
  it("pega o ano de uma data AAAA-MM-DD sem mexer com fuso horário", () => {
    expect(anoDeCadastro("2026-01-01")).toBe("2026");
  });

  it("devolve um traço quando não há data válida", () => {
    expect(anoDeCadastro(null)).toBe("—");
    expect(anoDeCadastro("abc")).toBe("—");
  });
});

describe("validarDadosPessoais", () => {
  const valido = {
    nomeCompleto: "Fulano de Tal",
    nomeUsuario: "fulaninho01",
    email: "fulano@gmail.com",
  };

  it("aceita dados válidos", () => {
    expect(validarDadosPessoais(valido)).toBeNull();
  });

  it("recusa nome em branco, usuário curto e e-mail inválido", () => {
    expect(validarDadosPessoais({ ...valido, nomeCompleto: "  " })).toMatch(
      /nome completo/i,
    );
    expect(validarDadosPessoais({ ...valido, nomeUsuario: "ab" })).toMatch(
      /usuário/i,
    );
    expect(validarDadosPessoais({ ...valido, email: "fulano" })).toMatch(
      /e-mail/i,
    );
  });
});

describe("montarAlteracoes", () => {
  it("devolve vazio quando nada mudou", () => {
    expect(
      montarAlteracoes(USUARIO, {
        nomeCompleto: "Fulano de Tal",
        nomeUsuario: "fulaninho01",
        email: "fulano@gmail.com",
      }),
    ).toEqual({});
  });

  it("envia só os campos alterados, sem espaços nas pontas", () => {
    expect(
      montarAlteracoes(USUARIO, {
        nomeCompleto: "Fulano da Silva ",
        nomeUsuario: "fulaninho01",
        email: "fulano@gmail.com",
      }),
    ).toEqual({ usr_nome_completo: "Fulano da Silva" });
  });
});

describe("validarNovaSenha", () => {
  const valida = {
    senhaAtual: "antiga123",
    novaSenha: "novasenha1",
    confirmacao: "novasenha1",
  };

  it("aceita uma troca válida", () => {
    expect(validarNovaSenha(valida)).toBeNull();
  });

  it("recusa os casos inválidos", () => {
    expect(validarNovaSenha({ ...valida, senhaAtual: "" })).toMatch(/atual/i);
    expect(
      validarNovaSenha({ ...valida, novaSenha: "curta", confirmacao: "curta" }),
    ).toMatch(/pelo menos 8/i);
    expect(
      validarNovaSenha({
        ...valida,
        novaSenha: "antiga123",
        confirmacao: "antiga123",
      }),
    ).toMatch(/diferente/i);
    expect(
      validarNovaSenha({
        ...valida,
        novaSenha: "semnumero",
        confirmacao: "semnumero",
      }),
    ).toMatch(/1 número/i);
    expect(validarNovaSenha({ ...valida, confirmacao: "outra1234" })).toMatch(
      /confirmação/i,
    );
  });
});

describe("validarUrlFoto", () => {
  it("aceita endereços http e https", () => {
    expect(validarUrlFoto("https://exemplo.com/foto.png")).toBeNull();
    expect(validarUrlFoto("http://exemplo.com/foto.png")).toBeNull();
  });

  it("recusa vazio, texto solto e outros protocolos", () => {
    expect(validarUrlFoto("   ")).toMatch(/cole/i);
    expect(validarUrlFoto("foto.png")).toMatch(/http/i);
    expect(validarUrlFoto("javascript:alert(1)")).toMatch(/http/i);
  });
});

describe("API do perfil", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        statusText: "No Content",
        headers: { get: () => null },
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updateMe faz PATCH em /auth/me com o token", async () => {
    await updateMe("tok", { usr_nome_completo: "Novo Nome" });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/auth/me`,
      expect.objectContaining({
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer tok",
        },
        body: JSON.stringify({ usr_nome_completo: "Novo Nome" }),
      }),
    );
  });

  it("changePassword manda os campos esperados pelo FastAPI", async () => {
    await expect(
      changePassword("tok", {
        senhaAtual: "antiga123",
        novaSenha: "novasenha1",
      }),
    ).resolves.toBeNull();

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE}/auth/me/senha`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          usr_senha_atual: "antiga123",
          usr_senha_nova: "novasenha1",
        }),
      }),
    );
  });
});
