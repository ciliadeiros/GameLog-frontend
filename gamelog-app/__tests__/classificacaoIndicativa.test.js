import { describe, expect, it } from "vitest";
import {
  CLASSIND_INFO,
  classindDoEsrb,
  descritoresDeTags,
} from "@/lib/classificacaoIndicativa";

describe("Classificação indicativa de jogos (RAWG → Brasil)", () => {
  it.each([
    ["Everyone", "L"],
    ["Everyone 10+", "10"],
    ["Teen", "14"],
    ["Mature", "16"],
    ["Adults Only", "18"],
  ])("converte %s para o selo %s", (esrb, esperado) => {
    expect(classindDoEsrb({ name: esrb })).toEqual({
      chave: esperado,
      ...CLASSIND_INFO[esperado],
    });
  });

  it("trata jogo sem classificação (ausente ou desconhecida) como 18 anos", () => {
    const esperado = { chave: "18", ...CLASSIND_INFO[18] };
    expect(classindDoEsrb(null)).toEqual(esperado);
    expect(classindDoEsrb(undefined)).toEqual(esperado);
    expect(classindDoEsrb({ name: "Rating Pending" })).toEqual(esperado);
  });

  it("traduz tags em descritores sem duplicações e respeitando a ordem", () => {
    expect(
      descritoresDeTags([
        { slug: "violent" },
        { slug: "gore" },
        { slug: "horror" },
        { slug: "nudity" },
      ]),
    ).toEqual(["Violência", "Medo", "Nudez"]);
  });

  it("mostra no máximo três descritores, ignorando tags desconhecidas", () => {
    expect(
      descritoresDeTags([
        { slug: "action" },
        { slug: "violent" },
        { slug: "horror" },
        { slug: "drugs" },
        { slug: "nudity" },
      ]),
    ).toEqual(["Violência", "Medo", "Drogas"]);
  });

  it("aceita jogos sem tags", () => {
    expect(descritoresDeTags()).toEqual([]);
    expect(descritoresDeTags(null)).toEqual([]);
  });
});
