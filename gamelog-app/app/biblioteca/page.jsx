"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import {
  EntradaBibliotecaForm,
  STATUS_LABEL,
} from "@/components/EntradaBibliotecaForm";
import { useAuth } from "@/context/AuthContext";
import { listGames, listLibrary, ApiError } from "@/lib/api";
import styles from "./page.module.css";

// Cor de cada badge de status no card, direto do Figma.
const STATUS_COR = {
  planejado: "#1E8BB3",
  jogando: "#E4A700",
  finalizado: "#348850",
  abandonado: "#413E3B",
};

// Categorias do painel "FILTRAR POR:". Por enquanto só a estrutura
// visual do Figma — nenhuma delas filtra a lista ainda (isso é o
// próximo passo, depois que a gente decidir se o filtro roda no
// back-end ou no front).
const CATEGORIAS_FILTRO = [
  "Avaliações",
  "Classificação Indicativa",
  "Data de Lançamento",
  "Gênero",
  "Progresso de Jogo",
  "Tempo de Jogo",
];

export default function BibliotecaPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [entradas, setEntradas] = useState([]);
  const [jogosPorId, setJogosPorId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Qual card está com o formulário de edição aberto (só um por vez).
  const [entradaExpandidaId, setEntradaExpandidaId] = useState(null);

  // Rota protegida: manda pro login se não tiver sessão
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!token) return;

    Promise.all([listLibrary(token), listGames()])
      .then(([biblioteca, jogos]) => {
        setEntradas(biblioteca);
        setJogosPorId(
          Object.fromEntries(jogos.map((jogo) => [jogo.jgs_id, jogo]))
        );
      })
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Não foi possível carregar sua biblioteca."
        )
      )
      .finally(() => setLoading(false));
  }, [token]);

  function handleAtualizada(atualizada) {
    setEntradas((prev) =>
      prev.map((e) => (e.bib_id === atualizada.bib_id ? atualizada : e))
    );
  }

  function handleRemovida(entrada) {
    setEntradas((prev) => prev.filter((e) => e.bib_id !== entrada.bib_id));
    setEntradaExpandidaId(null);
  }

  function toggleExpandida(bibId) {
    setEntradaExpandidaId((atual) => (atual === bibId ? null : bibId));
  }

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className={styles.pagina}>
      <Header active="biblioteca" />

      <div className={styles.conteudo}>
        {/* ---------- Sidebar de filtros ---------- */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitulo}>FILTRAR POR:</div>
          <ul className={styles.listaFiltros}>
            {CATEGORIAS_FILTRO.map((categoria) => (
              <li key={categoria} className={styles.itemFiltro}>
                {categoria}
              </li>
            ))}
          </ul>
        </aside>

        {/* ---------- Grade de jogos ---------- */}
        <div className={styles.grade}>
          {loading && <p className={styles.info}>Carregando sua biblioteca...</p>}
          {error && <p className={styles.erro}>{error}</p>}

          {!loading && !error && entradas.length === 0 && (
            <p className={styles.info}>
              Sua biblioteca está vazia. Vá até o{" "}
              <a href="/catalogo" className={styles.link}>
                catálogo
              </a>{" "}
              e adicione um jogo.
            </p>
          )}

          <div className={styles.grid}>
            {entradas.map((entrada) => {
              const jogo = jogosPorId[entrada.bib_jgs_id];
              const expandida = entradaExpandidaId === entrada.bib_id;

              return (
                <div key={entrada.bib_id} className={styles.card}>
                  <button
                    type="button"
                    className={styles.capaBotao}
                    onClick={() => toggleExpandida(entrada.bib_id)}
                    aria-expanded={expandida}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className={styles.capa}
                      alt={jogo?.jgs_titulo || "Jogo"}
                      src={jogo?.jgs_capa_url || "/images/placeholder.svg"}
                    />
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: STATUS_COR[entrada.bib_status] }}
                    >
                      {STATUS_LABEL[entrada.bib_status] ?? entrada.bib_status}
                    </span>
                  </button>

                  <p className={styles.tituloCard}>
                    {jogo?.jgs_titulo || `Jogo #${entrada.bib_jgs_id}`}
                  </p>

                  {expandida && (
                    <EntradaBibliotecaForm
                      token={token}
                      entrada={entrada}
                      onAtualizada={handleAtualizada}
                      onRemovida={() => handleRemovida(entrada)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
