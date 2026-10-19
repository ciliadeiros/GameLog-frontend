/** @fileoverview Janela modal simples, sem dependências externas. */

"use client";

import { useEffect } from "react";
import styles from "./Modal.module.css";

/**
 * Modal com fundo escurecido e caixa centralizada. Fecha ao clicar fora, ao
 * apertar Esc ou pelo botão "×".
 *
 * @param {object} props
 * @param {string} props.titulo Título exibido no topo da caixa.
 * @param {function(): void} props.onFechar Chamada quando o modal deve fechar.
 * @param {React.ReactNode} props.children Conteúdo da caixa.
 * @returns {JSX.Element}
 */
export function Modal({ titulo, onFechar, children }) {
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onFechar]);

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.caixa} onClick={(e) => e.stopPropagation()}>
        <div className={styles.cabecalho}>
          <h2 className={styles.titulo}>{titulo}</h2>
          <button
            type="button"
            className={styles.fechar}
            onClick={onFechar}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className={styles.conteudo}>{children}</div>
      </div>
    </div>
  );
}
