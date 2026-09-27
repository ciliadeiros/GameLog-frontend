// Tabela associativa pra traduzir os gêneros da RAWG (sempre em
// inglês) pro português, já que o GameLog é um projeto pro Brasil. A
// chave é o "slug" que a RAWG devolve em cada gênero (jogo.genres[].slug),
// não o "name" (evita depender de como a RAWG escreve o nome em inglês).
// Cobre os gêneros padrão da RAWG; um gênero fora dessa lista cai no
// fallback (nome original da RAWG) em vez de sumir da tela.
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
 * Traduz um gênero da RAWG ({ id, name, slug }) pro português. Sem
 * correspondência na tabela, devolve o "name" original da RAWG (em
 * inglês) em vez de esconder o gênero.
 */
export function traduzirGenero(genero) {
  return GENEROS_PT[genero?.slug] ?? genero?.name;
}
