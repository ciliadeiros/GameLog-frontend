/** @fileoverview Logo do GameLog. */

import styles from "./Logo.module.css";

/**
 * Logo oficial do GameLog (public/images/logo.png).
 *
 * @param {object} props
 * @param {string} [props.className] Classe extra para ajustar o tamanho.
 * @returns {JSX.Element}
 */
export function Logo({ className = "" }) {
  return (
    <img
      src="/images/logo.png"
      alt="GameLog"
      className={`${styles.logo} ${className}`}
    />
  );
}
