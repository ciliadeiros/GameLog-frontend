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

const TransitionContext = createContext(null);

// Só mostra a telinha de carregamento se a troca de página demorar mais
// que isso. Navegações instantâneas (rota já carregada, dado em cache)
// não chegam a acionar o overlay — evita o "flash" chato de uma
// animação que aparece e some em 40ms.
const ATRASO_PARA_MOSTRAR_MS = 200;

/**
 * Envolve toda navegação interna (NavLink, ou navegar() chamado direto)
 * num useTransition, então dá pra saber, em qualquer lugar da árvore,
 * se tem uma troca de página em andamento — é o que o LoadingOverlay
 * usa pra decidir quando aparecer.
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
        ATRASO_PARA_MOSTRAR_MS
      );
      return () => clearTimeout(timeoutRef.current);
    }

    // isPending virou false: cancela o timer de "mostrar" (se ainda
    // não tiver disparado) e esconde a telinha. O setState acontece
    // dentro do callback do setTimeout (não direto no corpo do efeito)
    // pra não disparar o aviso de "cascading renders" do React.
    clearTimeout(timeoutRef.current);
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

export function useNavegacao() {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error("useNavegacao precisa estar dentro de <TransitionProvider>");
  }
  return ctx;
}
