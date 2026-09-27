import "./styles/base.css";
import { AuthProvider } from "@/context/AuthContext";
import { TransitionProvider } from "@/context/TransitionContext";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export const metadata = {
  title: "GameLog",
  description:
    "GameLog - organize, avalie e acompanhe sua biblioteca de jogos.",
};

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
