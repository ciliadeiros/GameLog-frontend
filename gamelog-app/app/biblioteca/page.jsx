"use client";

import { useEffect, useMemo, useState } from "react";
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

// Opções de cada filtro, do jeito que apareciam no protótipo. Os
// filtros rodam aqui no front, sobre a lista que já veio de
// GET /library/ — não existe (ainda) um endpoint de busca filtrada no
// back-end, e como a biblioteca de um usuário não costuma ter
// milhares de jogos, filtrar no cliente é suficiente.
const OPCOES_PROGRESSO = [
  { valor: "planejado", label: "Quero Jogar" },
  { valor: "jogando", label: "Jogando" },
  { valor: "finalizado", label: "Finalizado" },
  { valor: "abandonado", label: "Abandonei" },
];

// A nota (bib_usr_nota) é salva de 0 a 10, mas o protótipo mostra 5
// níveis (1,0 a 5,0) — tratei cada nível como "nota em estrelas"
// (nota do usuário dividida por 2 e arredondada). É uma conversão
// minha pra encaixar os dois formatos, não veio explícita no protótipo.
const OPCOES_AVALIACAO = [1, 2, 3, 4, 5];

// Bate direto com jgs_classificacao_indicativa (a aproximação a partir
// do ESRB da RAWG — ver rawg_import_service.py).
const OPCOES_CLASSIFICACAO = ["Livre", "10", "12", "14", "16", "+18"];

// Interpretei "Tempo de Jogo" como as horas que O USUÁRIO já jogou
// (bib_jgs_horas_jogadas) — não o tempo médio do jogo
// (jgs_tempo_medio_horas) — porque as faixas pequenas (<1h, 1~3h...)
// fazem mais sentido pra acompanhar o que a pessoa já jogou do que
// pra duração de um jogo.
const OPCOES_TEMPO_JOGO = [
  { valor: "menos1", label: "Menos de 1h", teste: (h) => h < 1 },
  { valor: "1a3", label: "1h ~ 3h", teste: (h) => h >= 1 && h < 3 },
  { valor: "3a5", label: "3h ~ 5h", teste: (h) => h >= 3 && h < 5 },
  { valor: "mais5", label: "Mais de 5h", teste: (h) => h >= 5 },
];

const CATEGORIAS_FILTRO = [
  { chave: "avaliacoes", label: "Avaliações" },
  { chave: "classificacao", label: "Classificação Indicativa" },
  { chave: "data", label: "Data de Lançamento" },
  { chave: "genero", label: "Gênero" },
  { chave: "progresso", label: "Progresso de Jogo" },
  { chave: "tempo", label: "Tempo de Jogo" },
];

function useConjuntoFiltro(inicial = []) {
  const [conjunto, setConjunto] = useState(new Set(inicial));

  function alternar(valor) {
    setConjunto((atual) => {
      const novo = new Set(atual);
      if (novo.has(valor)) {
        novo.delete(valor);
      } else {
        novo.add(valor);
      }
      return novo;
    });
  }

  return [conjunto, alternar, () => setConjunto(new Set())];
}

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

  // ---------- Filtros ----------
  const [categoriaAberta, setCategoriaAberta] = useState(null);
  const [avaliacoes, toggleAvaliacao, limparAvaliacoes] = useConjuntoFiltro();
  const [classificacoes, toggleClassificacao, limparClassificacoes] = useConjuntoFiltro();
  const [progresso, toggleProgresso, limparProgresso] = useConjuntoFiltro();
  const [tempoJogo, toggleTempoJogo, limparTempoJogo] = useConjuntoFiltro();
  const [genero, setGenero] = useState("");
  const [dataDe, setDataDe] = useState("");
  const [dataAte, setDataAte] = useState("");

  const filtrosAtivos =
    avaliacoes.size > 0 ||
    classificacoes.size > 0 ||
    progresso.size > 0 ||
    tempoJogo.size > 0 ||
    genero.trim() !== "" ||
    dataDe !== "" ||
    dataAte !== "";

  function limparTodosFiltros() {
    limparAvaliacoes();
    limparClassificacoes();
    limparProgresso();
    limparTempoJogo();
    setGenero("");
    setDataDe("");
    setDataAte("");
  }

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

  const entradasFiltradas = useMemo(() => {
    const termosGenero = genero
      .toLowerCase()
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    return entradas.filter((entrada) => {
      const jogo = jogosPorId[entrada.bib_jgs_id];

      if (progresso.size > 0 && !progresso.has(entrada.bib_status)) {
        return false;
      }

      if (avaliacoes.size > 0) {
        if (entrada.bib_usr_nota == null) return false;
        const estrelas = Math.round(entrada.bib_usr_nota / 2);
        if (!avaliacoes.has(estrelas)) return false;
      }

      if (classificacoes.size > 0) {
        if (!jogo?.jgs_classificacao_indicativa) return false;
        if (!classificacoes.has(jogo.jgs_classificacao_indicativa)) return false;
      }

      if (tempoJogo.size > 0) {
        const horas = entrada.bib_jgs_horas_jogadas ?? 0;
        const bateAlgumaFaixa = OPCOES_TEMPO_JOGO.some(
          (opcao) => tempoJogo.has(opcao.valor) && opcao.teste(horas)
        );
        if (!bateAlgumaFaixa) return false;
      }

      if (termosGenero.length > 0) {
        const generosDoJogo = (jogo?.generos ?? []).map((g) =>
          g.gen_nome.toLowerCase()
        );
        const bateAlgumTermo = termosGenero.some((termo) =>
          generosDoJogo.some((g) => g.includes(termo))
        );
        if (!bateAlgumTermo) return false;
      }

      if (dataDe && jogo?.jgs_lancamento && jogo.jgs_lancamento < dataDe) {
        return false;
      }
      if (dataAte && jogo?.jgs_lancamento && jogo.jgs_lancamento > dataAte) {
        return false;
      }

      return true;
    });
  }, [
    entradas,
    jogosPorId,
    progresso,
    avaliacoes,
    classificacoes,
    tempoJogo,
    genero,
    dataDe,
    dataAte,
  ]);

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
            {CATEGORIAS_FILTRO.map((categoria) => {
              const aberta = categoriaAberta === categoria.chave;
              return (
                <li key={categoria.chave}>
                  <button
                    type="button"
                    className={styles.itemFiltro}
                    onClick={() => setCategoriaAberta(aberta ? null : categoria.chave)}
                    aria-expanded={aberta}
                  >
                    {categoria.label}
                  </button>

                  {aberta && (
                    <div className={styles.painelFiltro}>
                      {categoria.chave === "avaliacoes" &&
                        OPCOES_AVALIACAO.map((n) => (
                          <label key={n} className={styles.opcaoFiltro}>
                            <input
                              type="checkbox"
                              checked={avaliacoes.has(n)}
                              onChange={() => toggleAvaliacao(n)}
                            />
                            {n.toFixed(1)}
                          </label>
                        ))}

                      {categoria.chave === "classificacao" &&
                        OPCOES_CLASSIFICACAO.map((valor) => (
                          <label key={valor} className={styles.opcaoFiltro}>
                            <input
                              type="checkbox"
                              checked={classificacoes.has(valor)}
                              onChange={() => toggleClassificacao(valor)}
                            />
                            {valor}
                          </label>
                        ))}

                      {categoria.chave === "data" && (
                        <div className={styles.dataRange}>
                          <label className={styles.dataLabel}>
                            De
                            <input
                              type="date"
                              className={styles.dataInput}
                              value={dataDe}
                              onChange={(e) => setDataDe(e.target.value)}
                            />
                          </label>
                          <label className={styles.dataLabel}>
                            Até
                            <input
                              type="date"
                              className={styles.dataInput}
                              value={dataAte}
                              onChange={(e) => setDataAte(e.target.value)}
                            />
                          </label>
                        </div>
                      )}

                      {categoria.chave === "genero" && (
                        <input
                          type="text"
                          className={styles.inputFiltro}
                          placeholder="Ex.: Fantasia, Terror"
                          value={genero}
                          onChange={(e) => setGenero(e.target.value)}
                        />
                      )}

                      {categoria.chave === "progresso" &&
                        OPCOES_PROGRESSO.map((opcao) => (
                          <label key={opcao.valor} className={styles.opcaoFiltro}>
                            <input
                              type="checkbox"
                              checked={progresso.has(opcao.valor)}
                              onChange={() => toggleProgresso(opcao.valor)}
                            />
                            {opcao.label}
                          </label>
                        ))}

                      {categoria.chave === "tempo" &&
                        OPCOES_TEMPO_JOGO.map((opcao) => (
                          <label key={opcao.valor} className={styles.opcaoFiltro}>
                            <input
                              type="checkbox"
                              checked={tempoJogo.has(opcao.valor)}
                              onChange={() => toggleTempoJogo(opcao.valor)}
                            />
                            {opcao.label}
                          </label>
                        ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {filtrosAtivos && (
            <button
              type="button"
              className={styles.limparFiltros}
              onClick={limparTodosFiltros}
            >
              Limpar filtros
            </button>
          )}
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

          {!loading && !error && entradas.length > 0 && (
            <p className={styles.contagem}>
              {entradasFiltradas.length} de {entradas.length} jogo(s)
            </p>
          )}

          {!loading && !error && entradas.length > 0 && entradasFiltradas.length === 0 && (
            <p className={styles.info}>Nenhum jogo bate com esses filtros.</p>
          )}

          <div className={styles.grid}>
            {entradasFiltradas.map((entrada) => {
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
