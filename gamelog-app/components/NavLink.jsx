/** @fileoverview Link interno que avisa o app quando uma navegação começa. */

"use client";

import { useNavegacao } from "@/context/TransitionContext";

/**
 * Link que se comporta como um <a> normal (botão do meio, ctrl/cmd + clique e
 * "abrir em nova aba" continuam funcionando). A diferença é que o clique simples
 * passa pelo TransitionProvider, e é assim que o app sabe que uma navegação está
 * em andamento e pode mostrar o LoadingOverlay.
 *
 * @param {object} props
 * @param {string} props.href Destino do link.
 * @param {string} [props.className] Classe do link.
 * @param {React.ReactNode} props.children Conteúdo do link.
 * @param {function(Event): void} [props.onClick] Chamada antes da navegação.
 * Props extras (target, aria-label...) vão direto para o <a>.
 * @returns {JSX.Element}
 */
export function NavLink({ href, className, children, onClick, ...props }) {
  const { navegar } = useNavegacao();

  function handleClick(e) {
    onClick?.(e);

    const ehCliqueSimples =
      e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

    if (e.defaultPrevented || !ehCliqueSimples || props.target === "_blank") {
      return;
    }

    e.preventDefault();
    navegar(href);
  }

  return (
    <a href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
