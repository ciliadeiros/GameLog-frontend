"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import {
  EntradaBibliotecaForm,
  STATUS_LABEL,
} from "@/components/EntradaBibliotecaForm";
import { useAuth } from "@/context/AuthContext";
import { listGames, listLibrary, updateLibraryEntry, ApiError } from "@/lib/api";
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

  // Qual entrada está com o modal de nota/review/horas aberto (null = nenhuma).
  const [entradaModal, setEntradaModal] = useState(null);
  const [erroStatus, setErroStatus] = useState(null);

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
    setEntradaModal(null);
  }

  // Muda o status direto pela badge (dropdown) — não passa pelo modal.
  async function handleStatusChange(entrada, novoStatus) {
    setErroStatus(null);
    try {
      const atualizada = await updateLibraryEntry(token, entrada.bib_id, {
        bib_status: novoStatus,
      });
      handleAtualizada(atualizada);
    } catch (err) {
      setErroStatus(
        err instanceof ApiError ? err.message : "Não foi possível atualizar o status."
      );
    }
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
          {erroStatus && <p className={styles.erro}>{erroStatus}</p>}

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

              return (
                <div key={entrada.bib_id} className={styles.card}>
                  <div className={styles.capaWrapper}>
                    <button
                      type="button"
                      className={styles.capaBotao}
                      onClick={() => setEntradaModal(entrada)}
                      aria-label={`Editar nota e review de ${jogo?.jgs_titulo || "jogo"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.capa}
                        alt={jogo?.jgs_titulo || "Jogo"}
                        src={jogo?.jgs_capa_url || "/images/placeholder.svg"}
                      />
                    </button>

                    {/* Badge de status — um <select> nativo estilizado
                        pra parecer o badge colorido do Figma. Clicar
                        nele já troca o status direto, sem abrir modal. */}
                    <select
                      className={styles.badge}
                      style={{ backgroundColor: STATUS_COR[entrada.bib_status] }}
                      value={entrada.bib_status}
                      onChange={(e) => handleStatusChange(entrada, e.target.value)}
                      aria-label="Status na biblioteca"
                    >
                      {Object.entries(STATUS_LABEL).map(([valor, label]) => (
                        <option key={valor} value={valor}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className={styles.tituloCard}>
                    {jogo?.jgs_titulo || `Jogo #${entrada.bib_jgs_id}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {entradaModal && (
        <Modal
          titulo={jogosPorId[entradaModal.bib_jgs_id]?.jgs_titulo || "Avaliação"}
          onFechar={() => setEntradaModal(null)}
        >
          <EntradaBibliotecaForm
            token={token}
            entrada={entradaModal}
            onAtualizada={(atualizada) => {
              handleAtualizada(atualizada);
              setEntradaModal(null);
            }}
            onRemovida={() => handleRemovida(entradaModal)}
          />
        </Modal>
      )}
    </div>
  );
}
