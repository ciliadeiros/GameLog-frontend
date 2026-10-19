/**
 * @fileoverview Biblioteca pessoal do usuário (/biblioteca) — RF007, RF008 e RF009.
 *
 * Lista os jogos adicionados, permite filtrar, trocar o status direto no card e
 * abrir um modal para editar nota, review e horas jogadas.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { NavLink } from "@/components/NavLink";
import {
  FiltroSidebar,
  OpcaoFiltroCheckbox,
  CampoTextoFiltro,
  useConjuntoFiltro,
} from "@/components/FiltroSidebar";
import filtroStyles from "@/components/FiltroSidebar.module.css";
import {
  EntradaBibliotecaForm,
  STATUS_LABEL,
} from "@/components/EntradaBibliotecaForm";
import { useAuth } from "@/context/AuthContext";
import {
  listGames,
  listLibrary,
  updateLibraryEntry,
  mensagemErro,
} from "@/lib/api";
import styles from "./page.module.css";

/** Cor da badge de status de cada card. */
const STATUS_COR = {
  planejado: "#1E8BB3",
  jogando: "#E4A700",
  finalizado: "#348850",
  abandonado: "#413E3B",
};

/** Opções do filtro "Progresso de Jogo". O valor é o mesmo status salvo no back-end. */
const OPCOES_PROGRESSO = [
  { valor: "planejado", label: "Quero Jogar" },
  { valor: "jogando", label: "Jogando" },
  { valor: "finalizado", label: "Finalizado" },
  { valor: "abandonado", label: "Abandonei" },
];

/**
 * Níveis do filtro "Avaliações". A nota do usuário vai de 0 a 10, mas o filtro tem
 * 5 níveis: cada nível é a nota dividida por 2 e arredondada.
 */
const OPCOES_AVALIACAO = [1, 2, 3, 4, 5];

/**
 * Opções do filtro de classificação indicativa. Precisam bater com o valor de
 * jgs_classificacao_indicativa salvo no back-end.
 */
const OPCOES_CLASSIFICACAO = ["Livre", "10", "12", "14", "16", "+18"];

/**
 * Faixas do filtro "Tempo de Jogo", aplicadas sobre as horas que o próprio
 * usuário já jogou (bib_jgs_horas_jogadas). `teste` recebe as horas e diz se a
 * faixa bate.
 */
const OPCOES_TEMPO_JOGO = [
  { valor: "menos1", label: "Menos de 1h", teste: (h) => h < 1 },
  { valor: "1a3", label: "1h ~ 3h", teste: (h) => h >= 1 && h < 3 },
  { valor: "3a5", label: "3h ~ 5h", teste: (h) => h >= 3 && h < 5 },
  { valor: "mais5", label: "Mais de 5h", teste: (h) => h >= 5 },
];

/**
 * Página da biblioteca. É uma rota protegida: sem sessão, redireciona para o login.
 *
 * Busca a biblioteca e a lista de jogos ao mesmo tempo e cruza as duas, porque
 * GET /library/ só devolve o id do jogo (e não título ou capa). Os filtros rodam
 * aqui no front, em cima da lista que já foi carregada.
 *
 * @returns {JSX.Element|null}
 */
export default function BibliotecaPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [entradas, setEntradas] = useState([]);
  const [jogosPorId, setJogosPorId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [entradaModal, setEntradaModal] = useState(null);
  const [erroStatus, setErroStatus] = useState(null);

  const [avaliacoes, toggleAvaliacao, limparAvaliacoes] = useConjuntoFiltro();
  const [classificacoes, toggleClassificacao, limparClassificacoes] =
    useConjuntoFiltro();
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

  // Rota protegida: sem sessão, manda o usuário para o login.
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
          Object.fromEntries(jogos.map((jogo) => [jogo.jgs_id, jogo])),
        );
      })
      .catch((err) =>
        setError(
          mensagemErro(err, "Não foi possível carregar sua biblioteca."),
        ),
      )
      .finally(() => setLoading(false));
  }, [token]);

  function handleAtualizada(atualizada) {
    setEntradas((prev) =>
      prev.map((e) => (e.bib_id === atualizada.bib_id ? atualizada : e)),
    );
  }

  function handleRemovida(entrada) {
    setEntradas((prev) => prev.filter((e) => e.bib_id !== entrada.bib_id));
    setEntradaModal(null);
  }

  /**
   * Troca o status direto pela badge do card, sem abrir o modal.
   *
   * @param {object} entrada Entrada da biblioteca.
   * @param {string} novoStatus Novo status (planejado, jogando, finalizado ou abandonado).
   */
  async function handleStatusChange(entrada, novoStatus) {
    setErroStatus(null);
    try {
      const atualizada = await updateLibraryEntry(token, entrada.bib_id, {
        bib_status: novoStatus,
      });
      handleAtualizada(atualizada);
    } catch (err) {
      setErroStatus(mensagemErro(err, "Não foi possível atualizar o status."));
    }
  }

  // Um jogo só aparece se passar por todos os filtros ativos.
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
        // Converte a nota (0 a 10) para os 5 níveis do filtro.
        const estrelas = Math.round(entrada.bib_usr_nota / 2);
        if (!avaliacoes.has(estrelas)) return false;
      }

      if (classificacoes.size > 0) {
        if (!jogo?.jgs_classificacao_indicativa) return false;
        if (!classificacoes.has(jogo.jgs_classificacao_indicativa))
          return false;
      }

      if (tempoJogo.size > 0) {
        const horas = entrada.bib_jgs_horas_jogadas ?? 0;
        const bateAlgumaFaixa = OPCOES_TEMPO_JOGO.some(
          (opcao) => tempoJogo.has(opcao.valor) && opcao.teste(horas),
        );
        if (!bateAlgumaFaixa) return false;
      }

      if (termosGenero.length > 0) {
        const generosDoJogo = (jogo?.generos ?? []).map((g) =>
          g.gen_nome.toLowerCase(),
        );
        const bateAlgumTermo = termosGenero.some((termo) =>
          generosDoJogo.some((g) => g.includes(termo)),
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
        <FiltroSidebar
          filtrosAtivos={filtrosAtivos}
          onLimparFiltros={limparTodosFiltros}
          categorias={[
            {
              chave: "avaliacoes",
              label: "Avaliações",
              render: () => (
                <>
                  {OPCOES_AVALIACAO.map((n) => (
                    <OpcaoFiltroCheckbox
                      key={n}
                      label={n.toFixed(1)}
                      checked={avaliacoes.has(n)}
                      onChange={() => toggleAvaliacao(n)}
                    />
                  ))}
                </>
              ),
            },
            {
              chave: "classificacao",
              label: "Classificação Indicativa",
              render: () => (
                <>
                  {OPCOES_CLASSIFICACAO.map((valor) => (
                    <OpcaoFiltroCheckbox
                      key={valor}
                      label={valor}
                      checked={classificacoes.has(valor)}
                      onChange={() => toggleClassificacao(valor)}
                    />
                  ))}
                </>
              ),
            },
            {
              chave: "data",
              label: "Data de Lançamento",
              render: () => (
                <div className={filtroStyles.dataRange}>
                  <label className={filtroStyles.dataLabel}>
                    De
                    <input
                      type="date"
                      className={filtroStyles.dataInput}
                      value={dataDe}
                      onChange={(e) => setDataDe(e.target.value)}
                    />
                  </label>
                  <label className={filtroStyles.dataLabel}>
                    Até
                    <input
                      type="date"
                      className={filtroStyles.dataInput}
                      value={dataAte}
                      onChange={(e) => setDataAte(e.target.value)}
                    />
                  </label>
                </div>
              ),
            },
            {
              chave: "genero",
              label: "Gênero",
              render: () => (
                <CampoTextoFiltro
                  placeholder="Ex.: Fantasia, Terror"
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                />
              ),
            },
            {
              chave: "progresso",
              label: "Progresso de Jogo",
              render: () => (
                <>
                  {OPCOES_PROGRESSO.map((opcao) => (
                    <OpcaoFiltroCheckbox
                      key={opcao.valor}
                      label={opcao.label}
                      checked={progresso.has(opcao.valor)}
                      onChange={() => toggleProgresso(opcao.valor)}
                    />
                  ))}
                </>
              ),
            },
            {
              chave: "tempo",
              label: "Tempo de Jogo",
              render: () => (
                <>
                  {OPCOES_TEMPO_JOGO.map((opcao) => (
                    <OpcaoFiltroCheckbox
                      key={opcao.valor}
                      label={opcao.label}
                      checked={tempoJogo.has(opcao.valor)}
                      onChange={() => toggleTempoJogo(opcao.valor)}
                    />
                  ))}
                </>
              ),
            },
          ]}
        />

        <div className={styles.grade}>
          {loading && (
            <p className={styles.info}>Carregando sua biblioteca...</p>
          )}
          {error && <p className={styles.erro}>{error}</p>}
          {erroStatus && <p className={styles.erro}>{erroStatus}</p>}

          {!loading && !error && entradas.length === 0 && (
            <p className={styles.info}>
              Sua biblioteca está vazia. Vá até o{" "}
              <NavLink href="/catalogo" className={styles.link}>
                catálogo
              </NavLink>{" "}
              e adicione um jogo.
            </p>
          )}

          {!loading && !error && entradas.length > 0 && (
            <p className={styles.contagem}>
              {entradasFiltradas.length} de {entradas.length} jogo(s)
            </p>
          )}

          {!loading &&
            !error &&
            entradas.length > 0 &&
            entradasFiltradas.length === 0 && (
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
                      <img
                        className={styles.capa}
                        alt={jogo?.jgs_titulo || "Jogo"}
                        src={jogo?.jgs_capa_url || "/images/placeholder.svg"}
                      />
                    </button>

                    <select
                      className={styles.badge}
                      style={{
                        backgroundColor: STATUS_COR[entrada.bib_status],
                      }}
                      value={entrada.bib_status}
                      onChange={(e) =>
                        handleStatusChange(entrada, e.target.value)
                      }
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
          titulo={
            jogosPorId[entradaModal.bib_jgs_id]?.jgs_titulo || "Avaliação"
          }
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
