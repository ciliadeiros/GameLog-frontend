"use client";

import { useState } from "react";
import styles from "./FiltroSidebar.module.css";

/**
 * Hook pequeno pra guardar um conjunto de valores selecionados (usado
 * pelos filtros de múltipla escolha, tipo checkboxes de gênero ou
 * avaliação). Vivia direto em app/biblioteca/page.jsx; movido pra cá
 * pra qualquer página com filtros poder usar o mesmo padrão.
 */
export function useConjuntoFiltro(inicial = []) {
  const [conjunto, setConjunto] = useState(new Set(inicial));

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
 * Sidebar de filtros em acordeão (título + lista de categorias que
 * abrem/fecham). `categorias` é uma lista de
 * { chave, label, render() }, onde render() devolve o conteúdo do
 * painel (checkboxes, inputs etc.) — essa parte fica por conta de
 * quem usa o componente, já que os filtros mudam de tela pra tela.
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

// Pequenos blocos reaproveitáveis pra montar o conteúdo de cada
// render() sem repetir marcação/classe em toda página que usar a
// sidebar.
export function OpcaoFiltroCheckbox({ label, checked, onChange }) {
  return (
    <label className={styles.opcaoFiltro}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export function CampoTextoFiltro(props) {
  return <input type="text" className={styles.inputFiltro} {...props} />;
}
