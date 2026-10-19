/** @fileoverview Tela de carregamento exibida nas trocas de página demoradas. */

"use client";

import { useNavegacao } from "@/context/TransitionContext";
import styles from "./LoadingOverlay.module.css";

/**
 * Tela de carregamento (logo + controle de videogame sendo preenchido) que cobre
 * a página quando uma navegação demora. Só aparece enquanto mostrarOverlay (do
 * TransitionContext) for true.
 *
 * @returns {JSX.Element|null}
 */
export function LoadingOverlay() {
  const { mostrarOverlay } = useNavegacao();

  if (!mostrarOverlay) return null;

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.conteudo}>
        <img src="/images/logo.png" alt="GameLog" className={styles.logo} />

        <div className={styles.controle} aria-hidden="true">
          <img
            src="/images/controle-loading.png"
            alt=""
            className={styles.controleBase}
          />

          <img
            src="/images/controle-loading.png"
            alt=""
            className={styles.controlePreenchido}
          />
        </div>

        <p className={styles.texto}>Carregando</p>
      </div>
    </div>
  );
}
