/** @fileoverview Tradução dos gêneros da RAWG (sempre em inglês) para português. */

/**
 * Gêneros traduzidos, indexados pelo "slug" da RAWG (e não pelo nome, que pode
 * variar). Gênero fora da lista cai no nome original em vez de sumir da tela.
 */
const GENEROS_PT = {
  action: "Ação",
  indie: "Indie",
  adventure: "Aventura",
  "role-playing-games-rpg": "RPG",
  strategy: "Estratégia",
  shooter: "Tiro",
  casual: "Casual",
  simulation: "Simulação",
  puzzle: "Quebra-cabeça",
  arcade: "Arcade",
  platformer: "Plataforma",
  "massively-multiplayer": "Multiplayer Massivo",
  racing: "Corrida",
  sports: "Esportes",
  fighting: "Luta",
  family: "Família",
  "board-games": "Jogos de Tabuleiro",
  educational: "Educativo",
  card: "Cartas",
};

/**
 * Traduz um gênero da RAWG para português.
 *
 * @param {{name: string, slug: string}} genero Gênero no formato da RAWG.
 * @returns {string} Nome em português, ou o nome original se não houver tradução.
 */
export function traduzirGenero(genero) {
  return GENEROS_PT[genero?.slug] ?? genero?.name;
}
