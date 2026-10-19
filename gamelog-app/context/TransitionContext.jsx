/**
 * @fileoverview Contexto das transições de página.
 *
 * Toda navegação interna passa por aqui, então qualquer componente consegue
 * saber se existe uma troca de página em andamento. O LoadingOverlay usa isso
 * para decidir quando aparecer.
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

/** Contexto interno. Quem consome usa o hook useNavegacao. */
const TransitionContext = createContext(null);

/**
 * Tempo mínimo (em ms) de espera antes de mostrar a tela de carregamento.
 * Navegações rápidas não chegam a acionar o overlay, o que evita um "flash".
 */
const ATRASO_PARA_MOSTRAR_MS = 200;

/**
 * Provedor das transições. Envolve a navegação em um useTransition e controla
 * quando o overlay de carregamento deve aparecer.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export function TransitionProvider({ children }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mostrarOverlay, setMostrarOverlay] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isPending) {
      timeoutRef.current = setTimeout(
        () => setMostrarOverlay(true),
        ATRASO_PARA_MOSTRAR_MS,
      );
      return () => clearTimeout(timeoutRef.current);
    }

    clearTimeout(timeoutRef.current);
    // O setState fica dentro de um setTimeout (e não direto no efeito) para não
    // causar renderizações em cascata.
    const id = setTimeout(() => setMostrarOverlay(false), 0);
    return () => clearTimeout(id);
  }, [isPending]);

  function navegar(href) {
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <TransitionContext.Provider value={{ navegar, isPending, mostrarOverlay }}>
      {children}
    </TransitionContext.Provider>
  );
}

/**
 * Acessa o controle de navegação. Só funciona dentro de um <TransitionProvider>.
 *
 * @returns {{navegar: function(string): void, isPending: boolean,
 * mostrarOverlay: boolean}} navegar(href) troca de página; mostrarOverlay diz se a
 * tela de carregamento deve estar visível.
 * @throws {Error} Se for usado fora do <TransitionProvider>.
 */
export function useNavegacao() {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error(
      "useNavegacao precisa estar dentro de <TransitionProvider>",
    );
  }
  return ctx;
}
