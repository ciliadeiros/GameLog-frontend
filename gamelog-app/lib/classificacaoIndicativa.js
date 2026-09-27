// Mapa aproximado de ESRB (o que a RAWG devolve) pro rótulo de
// classificação indicativa brasileira (ClassInd), só para EXIBIÇÃO na
// página de detalhes do jogo. Não é uma tradução oficial — ESRB e
// ClassInd usam critérios diferentes — é a mesma aproximação já usada
// no back-end (ver _ESRB_PARA_CLASSIND em
// app/services/rawg_import_service.py), duplicada aqui porque
// GET /games/rawg/{id} devolve o jogo cru da RAWG (esrb_rating), sem
// passar pelo mapeamento que só acontece quando o jogo é importado
// pra tb_jogos. Se o mapa do back-end mudar, replicar aqui também.
const ESRB_PARA_CLASSIND = {
  Everyone: "L",
  "Everyone 10+": "10",
  Teen: "14",
  Mature: "16",
  "Adults Only": "18",
};

// Cores e rótulo oficiais do ClassInd L verde,
// 10 azul, 12 amarelo, 14 laranja, 16 vermelho, 18 preto). "12" fica
// aqui só por completude — a aproximação a partir do ESRB nunca gera
// esse valor (a RAWG só tem 5 níveis de ESRB pros 6 do ClassInd).
export const CLASSIND_INFO = {
  L: { rotulo: "LIVRE", cor: "#2E9E3F", corTexto: "#ffffff" },
  10: { rotulo: "10 ANOS", cor: "#1976D2", corTexto: "#ffffff" },
  12: { rotulo: "12 ANOS", cor: "#F4C20D", corTexto: "#1a1a1a" },
  14: { rotulo: "14 ANOS", cor: "#F2802E", corTexto: "#ffffff" },
  16: { rotulo: "16 ANOS", cor: "#E02020", corTexto: "#ffffff" },
  18: { rotulo: "18 ANOS", cor: "#111111", corTexto: "#ffffff" },
};

// A RAWG não tem descritores de conteúdo ao estilo ClassInd (violência,
// nudez etc.) — só tags soltas. Aproximamos a partir das tags mais
// comuns, no mesmo espírito de MODOS_POR_TAG (app/jogo/[id]/page.jsx):
// aproximação pra preencher o selo, não a classificação oficial.
const DESCRITOR_POR_TAG = {
  violent: "Violência",
  gore: "Violência",
  "blood-and-gore": "Violência",
  horror: "Medo",
  "psychological-horror": "Medo",
  "sexual-content": "Conteúdo Sexual",
  nudity: "Nudez",
  drugs: "Drogas",
  "crude-humor": "Linguagem Imprópria",
  "mature-content": "Conteúdo Adulto",
};

/**
 * A partir do esrb_rating cru da RAWG (jogo.esrb_rating, formato
 * { id, name, slug }), devolve { chave, rotulo, cor, corTexto } pronto
 * pra exibir no selo, ou null se a RAWG não informou ESRB pra esse jogo.
 */
export function classindDoEsrb(esrbRating) {
  const chave = ESRB_PARA_CLASSIND[esrbRating?.name];
  if (!chave) return null;
  return { chave, ...CLASSIND_INFO[chave] };
}

/**
 * Descritores aproximados de conteúdo a partir das tags do jogo
 * (jogo.tags da RAWG). Só os primeiros 3, pra não estourar o selo.
 */
export function descritoresDeTags(tags) {
  const vistos = new Set();
  for (const tag of tags ?? []) {
    const descritor = DESCRITOR_POR_TAG[tag?.slug];
    if (descritor) vistos.add(descritor);
  }
  return Array.from(vistos).slice(0, 3);
}
