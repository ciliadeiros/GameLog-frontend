/**
 * @fileoverview Botão usado nas telas de autenticação (login, cadastro e página
 * inicial).
 */

import Link from "next/link";
import styles from "./BotaoAuth.module.css";

/**
 * Botão reutilizável. Com `href` vira um link de navegação; sem `href` vira um
 * <button> comum (ou de envio, quando usado dentro de formulários).
 *
 * @param {object} props
 * @param {string} [props.text="ENTRAR"] Texto do botão.
 * @param {string} [props.href] Se informado, o botão é renderizado como <Link>.
 * @param {"button"|"submit"} [props.type="button"] Tipo do <button>.
 * @param {Function} [props.onClick] Função chamada ao clicar.
 * @param {boolean} [props.disabled=false] Desabilita o botão.
 * @param {string} [props.className] Classe extra do botão.
 * @param {string} [props.divClassName] Classe extra do texto interno.
 * @returns {JSX.Element}
 */
export function BotaoAuth({
  text = "ENTRAR",
  href,
  type = "button",
  onClick,
  disabled = false,
  className = "",
  divClassName = "",
}) {
  const content = (
    <span className={`${styles.texto} ${divClassName}`}>{text}</span>
  );

  if (href) {
    return (
      <Link href={href} className={`${styles.botao} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.botao} ${className}`}
    >
      {content}
    </button>
  );
}
