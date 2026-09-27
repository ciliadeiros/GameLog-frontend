"use client";

import { useNavegacao } from "@/context/TransitionContext";

/**
 * Igual a <Link> do next/navigation no visual e no href (funciona com
 * botão do meio, ctrl/cmd+clique, "abrir em nova aba" etc.), mas o
 * clique normal passa pela nossa TransitionProvider — é assim que o
 * app sabe que uma navegação está em andamento e pode mostrar o
 * LoadingOverlay se ela demorar.
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
