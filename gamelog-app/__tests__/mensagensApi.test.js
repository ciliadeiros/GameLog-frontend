import { describe, expect, it } from "vitest";
import { mensagemDoDetail } from "@/lib/api";

describe("mensagemDoDetail (erros do FastAPI)", () => {
  it("devolve direto o texto de erros de regra de negócio", () => {
    expect(mensagemDoDetail("Email já cadastrado")).toBe("Email já cadastrado");
  });

  it("traduz senha curta de um erro 422", () => {
    const detail = [
      {
        type: "string_too_short",
        loc: ["body", "usr_senha"],
        ctx: { min_length: 8 },
      },
    ];
    expect(mensagemDoDetail(detail)).toBe(
      "O campo senha deve ter pelo menos 8 caracteres.",
    );
  });

  it("traduz texto longo demais e e-mail inválido", () => {
    expect(
      mensagemDoDetail([
        {
          type: "string_too_long",
          loc: ["body", "usr_nome_completo"],
          ctx: { max_length: 80 },
        },
      ]),
    ).toBe("O campo nome completo deve ter no máximo 80 caracteres.");
    expect(
      mensagemDoDetail([
        { type: "value_error", loc: ["body", "usr_email"], ctx: {} },
      ]),
    ).toBe("O campo e-mail é inválido.");
  });

  it("usa mensagens genéricas quando não reconhece o erro", () => {
    expect(mensagemDoDetail([{ type: "x", loc: ["body", "outro"] }])).toMatch(
      /dados inválidos/i,
    );
    expect(mensagemDoDetail([])).toBe("Erro na requisição");
    expect(mensagemDoDetail(undefined)).toBe("Erro na requisição");
  });
});
