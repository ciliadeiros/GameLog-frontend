/**
 * @fileoverview Layout raiz do app: carrega o CSS base e monta os provedores
 * globais (autenticação e transições de página).
 */

import "./styles/base.css";
import { AuthProvider } from "@/context/AuthContext";
import { TransitionProvider } from "@/context/TransitionContext";
import { LoadingOverlay } from "@/components/LoadingOverlay";

/** Título e descrição da aba do navegador. */
export const metadata = {
  title: "GameLog",
  description:
    "GameLog - organize, avalie e acompanhe sua biblioteca de jogos.",
};

/**
 * Estrutura comum a todas as páginas.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children Página que está sendo exibida.
 * @returns {JSX.Element}
 */
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <TransitionProvider>
            {children}
            <LoadingOverlay />
          </TransitionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
