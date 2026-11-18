/** @fileoverview Campo de texto com rótulo usado nas telas de perfil. */

import styles from "./CampoPerfil.module.css";

/**
 * Campo de formulário das telas de perfil. Com `readOnly`, serve só para
 * exibir o dado (tela /perfil); sem ele, a pessoa pode editar (/perfil/editar).
 *
 * @param {object} props
 * @param {string} props.id Id do campo (também liga o rótulo ao campo).
 * @param {string} props.label Texto do rótulo.
 * @param {string} props.value Valor atual.
 * @param {string} [props.type="text"] Tipo do <input>.
 * @param {boolean} [props.readOnly=false] Se true, o campo não pode ser editado.
 * @param {function(Event): void} [props.onChange] Chamada ao digitar.
 * @param {string} [props.autoComplete] Dica de preenchimento para o navegador.
 * @param {number} [props.maxLength] Limite de caracteres.
 * @param {string} [props.placeholder] Texto de dica quando o campo está vazio.
 * @returns {JSX.Element}
 */
export function CampoPerfil({
  id,
  label,
  value,
  type = "text",
  readOnly = false,
  onChange,
  autoComplete,
  maxLength,
  placeholder,
}) {
  return (
    <div className={styles.grupo}>
      <label className={styles.rotulo} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        className={styles.campo}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
      />
    </div>
  );
}
