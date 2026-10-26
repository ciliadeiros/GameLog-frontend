import { describe, expect, it } from "vitest";
import { traduzirGenero } from "@/lib/generos";

describe("Tradução dos gêneros da RAWG", () => {
  it.each([
    ["action", "Ação"],
    ["adventure", "Aventura"],
    ["role-playing-games-rpg", "RPG"],
    ["puzzle", "Quebra-cabeça"],
  ])("traduz %s para %s", (slug, esperado) => {
    expect(traduzirGenero({ slug, name: "Original" })).toBe(esperado);
  });

  it("preserva o nome original quando não há tradução", () => {
    expect(traduzirGenero({ slug: "genero-novo", name: "New genre" })).toBe(
      "New genre",
    );
  });

  it("não falha se o gênero é desconhecido ou não informado", () => {
    expect(traduzirGenero({ name: "Sem slug" })).toBe("Sem slug");
    expect(traduzirGenero(null)).toBeUndefined();
  });
});
