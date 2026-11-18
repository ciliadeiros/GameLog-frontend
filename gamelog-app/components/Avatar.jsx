/** @fileoverview Foto de perfil redonda, com um círculo vermelho de reserva. */

"use client";

import { useState } from "react";
import styles from "./Avatar.module.css";

/**
 * Mostra a foto do usuário. Se não houver foto (ou se a imagem não carregar),
 * mostra o círculo vermelho com a estrela do protótipo. O tamanho vem do
 * `className`, que define a largura e a altura do círculo.
 *
 * @param {object} props
 * @param {string|null} [props.url] Endereço da foto (usr_avatar_url).
 * @param {string} [props.className] Classe que define o tamanho do círculo.
 * @returns {JSX.Element}
 */
export function Avatar({ url, className = "" }) {
  const [urlComFalha, setUrlComFalha] = useState(null);
  const mostrarFoto = Boolean(url) && url !== urlComFalha;

  return (
    <div className={`${styles.avatar} ${className}`}>
      {mostrarFoto ? (
        <img
          src={url}
          alt="Foto de perfil"
          className={styles.foto}
          onError={() => setUrlComFalha(url)}
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          className={styles.estrela}
          role="img"
          aria-label="Sem foto de perfil"
        >
          <path
            fill="currentColor"
            d="m12 2.5 2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5Z"
          />
        </svg>
      )}
    </div>
  );
}
