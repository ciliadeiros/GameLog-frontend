/**
 * @fileoverview Conversão da classificação etária da RAWG (ESRB) para a
 * classificação indicativa brasileira (ClassInd).
 *
 * Serve só para exibir o selo na página de detalhes do jogo. A conversão é
 * aproximada: ESRB e ClassInd usam critérios diferentes.
 */

/**
 * Mapa de ESRB (o que a RAWG devolve) para a classificação brasileira. É o mesmo
 * mapa do back-end (_ESRB_PARA_CLASSIND em rawg_import_service.py); se um mudar,
 * o outro precisa mudar também.
 */
const ESRB_PARA_CLASSIND = {
  Everyone: "L",
  "Everyone 10+": "10",
  Teen: "14",
  Mature: "16",
  "Adults Only": "18",
};

/**
 * Rótulo e cores de cada classificação (L verde, 10 azul, 12 amarelo, 14 laranja,
 * 16 vermelho, 18 preto). A faixa 12 existe só por completude: o ESRB nunca gera
 * esse valor.
 */
export const CLASSIND_INFO = {
  L: { rotulo: "LIVRE", cor: "#2E9E3F", corTexto: "#ffffff" },
  10: { rotulo: "10 ANOS", cor: "#1976D2", corTexto: "#ffffff" },
  12: { rotulo: "12 ANOS", cor: "#F4C20D", corTexto: "#1a1a1a" },
  14: { rotulo: "14 ANOS", cor: "#F2802E", corTexto: "#ffffff" },
  16: { rotulo: "16 ANOS", cor: "#E02020", corTexto: "#ffffff" },
  18: { rotulo: "18 ANOS", cor: "#111111", corTexto: "#ffffff" },
};

/**
 * Descritores de conteúdo (Violência, Medo...) aproximados a partir das tags da
 * RAWG, que não tem descritores como o ClassInd.
 */
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
 * Converte o esrb_rating cru da RAWG no selo de classificação indicativa.
 *
 * @param {{name: string}|null|undefined} esrbRating Campo esrb_rating do jogo.
 * @returns {{chave: string, rotulo: string, cor: string, corTexto: string}|null}
 * Dados prontos para o selo, ou null se a RAWG não informou ESRB.
 */
export function classindDoEsrb(esrbRating) {
  const chave = ESRB_PARA_CLASSIND[esrbRating?.name];
  if (!chave) return null;
  return { chave, ...CLASSIND_INFO[chave] };
}

/**
 * Monta os descritores de conteúdo a partir das tags do jogo (no máximo 3, para
 * o selo não estourar).
 *
 * @param {{slug: string}[]} [tags] Tags do jogo na RAWG.
 * @returns {string[]} Descritores sem repetição.
 */
export function descritoresDeTags(tags) {
  const vistos = new Set();
  for (const tag of tags ?? []) {
    const descritor = DESCRITOR_POR_TAG[tag?.slug];
    if (descritor) vistos.add(descritor);
  }
  return Array.from(vistos).slice(0, 3);
}
