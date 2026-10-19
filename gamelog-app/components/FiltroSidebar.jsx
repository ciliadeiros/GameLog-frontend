/**
 * @fileoverview Peças da barra lateral de filtros usada na Biblioteca e na
 * Pesquisa.
 */

"use client";

import { useState } from "react";
import styles from "./FiltroSidebar.module.css";

/**
 * Hook que guarda o conjunto de valores marcados em um filtro de múltipla
 * escolha (checkboxes de gênero, avaliação etc.).
 *
 * @param {Array} [inicial=[]] Valores marcados no começo.
 * @returns {[Set, function(*): void, function(): void]} O conjunto atual, uma
 * função que marca/desmarca um valor e uma função que limpa tudo.
 */
export function useConjuntoFiltro(inicial = []) {
  const [conjunto, setConjunto] = useState(() => new Set(inicial));

  function alternar(valor) {
    setConjunto((atual) => {
      const novo = new Set(atual);
      if (novo.has(valor)) {
        novo.delete(valor);
      } else {
        novo.add(valor);
      }
      return novo;
    });
  }

  return [conjunto, alternar, () => setConjunto(new Set())];
}

/**
 * Barra lateral de filtros em acordeão: uma lista de categorias que abrem e
 * fecham, uma de cada vez.
 *
 * @param {object} props
 * @param {{chave: string, label: string, render: function(): JSX.Element}[]}
 * props.categorias Categorias da barra. render() devolve o conteúdo do painel
 * (checkboxes, campos etc.), que muda de tela para tela.
 * @param {boolean} props.filtrosAtivos Mostra o botão "Limpar filtros" quando true.
 * @param {function(): void} props.onLimparFiltros Chamada ao clicar em "Limpar
 * filtros".
 * @param {string} [props.titulo="FILTRAR POR:"] Título da barra.
 * @returns {JSX.Element}
 */
export function FiltroSidebar({
  categorias,
  filtrosAtivos,
  onLimparFiltros,
  titulo = "FILTRAR POR:",
}) {
  const [categoriaAberta, setCategoriaAberta] = useState(null);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTitulo}>{titulo}</div>
      <ul className={styles.listaFiltros}>
        {categorias.map((categoria) => {
          const aberta = categoriaAberta === categoria.chave;
          return (
            <li key={categoria.chave}>
              <button
                type="button"
                className={styles.itemFiltro}
                onClick={() =>
                  setCategoriaAberta(aberta ? null : categoria.chave)
                }
                aria-expanded={aberta}
              >
                {categoria.label}
              </button>

              {aberta && (
                <div className={styles.painelFiltro}>{categoria.render()}</div>
              )}
            </li>
          );
        })}
      </ul>

      {filtrosAtivos && (
        <button
          type="button"
          className={styles.limparFiltros}
          onClick={onLimparFiltros}
        >
          Limpar filtros
        </button>
      )}
    </aside>
  );
}

/**
 * Checkbox de uma opção de filtro.
 *
 * @param {object} props
 * @param {string} props.label Texto da opção.
 * @param {boolean} props.checked Se está marcada.
 * @param {function(): void} props.onChange Chamada ao marcar/desmarcar.
 * @returns {JSX.Element}
 */
export function OpcaoFiltroCheckbox({ label, checked, onChange }) {
  return (
    <label className={styles.opcaoFiltro}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

/**
 * Campo de texto de um filtro. Repassa todas as props para o <input>.
 *
 * @param {object} props Props de um <input> (value, onChange, placeholder...).
 * @returns {JSX.Element}
 */
export function CampoTextoFiltro(props) {
  return <input type="text" className={styles.inputFiltro} {...props} />;
}
