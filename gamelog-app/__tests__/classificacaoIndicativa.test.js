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

  it("não inventa classificação se ela está ausente ou desconhecida", () => {
    expect(classindDoEsrb(null)).toBeNull();
    expect(classindDoEsrb(undefined)).toBeNull();
    expect(classindDoEsrb({ name: "Unknown" })).toBeNull();
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
