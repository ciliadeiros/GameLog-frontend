"use client";

import { useNavegacao } from "@/context/TransitionContext";
import styles from "./LoadingOverlay.module.css";

export function LoadingOverlay() {
  const { mostrarOverlay } = useNavegacao();

  if (!mostrarOverlay) return null;

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.conteudo}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="GameLog" className={styles.logo} />

        <div className={styles.controle} aria-hidden="true">
          {/* Controle apagado ao fundo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/controle-loading.png"
            alt=""
            className={styles.controleBase}
          />

          {/* A versão iluminada vai sendo revelada da esquerda para a direita */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
