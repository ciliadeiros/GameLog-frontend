"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { NavLink } from "@/components/NavLink";
import { useConjuntoFiltro } from "@/components/FiltroSidebar";
import { useAuth } from "@/context/AuthContext";
import { listarRawg, ApiError } from "@/lib/api";
import shared from "../styles/lista.module.css";
import styles from "./page.module.css";

const PAGE_SIZE = 20;

// Gêneros do protótipo (Figma). "Terror" não existe como gênero na
// RAWG — só como tag ("horror"), igual já é tratado em
// app/catalogo/page.jsx (CATEGORIAS, categoria "Terror"). Os demais
// mapeiam direto pro slug de gênero da RAWG.
const OPCOES_GENERO = [
  { valor: "acao", label: "Ação", genero: "action" },
  { valor: "aventura", label: "Aventura", genero: "adventure" },
  { valor: "rpg", label: "RPG", genero: "role-playing-games-rpg" },
  { valor: "terror", label: "Terror", tag: "horror" },
  { valor: "estrategia", label: "Estratégia", genero: "strategy" },
  { valor: "simulacao", label: "Simulação", genero: "simulation" },
];

// A RAWG não tem campo de "modo de jogo" — aproximado pelas mesmas
// tags já usadas em app/jogo/[id]/page.jsx (MODOS_POR_TAG). "Duo" do
// protótipo não é um conceito da RAWG; tratei como sinônimo de
// cooperativo (tag "co-op"), igual à categoria "Cooperativo" do
// catálogo — não distingue duo de co-op com mais gente.
const OPCOES_MODO = [
  { valor: "multiplayer", label: "Multi Player", tag: "multiplayer" },
  { valor: "singleplayer", label: "Single Player", tag: "singleplayer" },
  { valor: "duo", label: "Duo", tag: "co-op" },
];

// RAWG traz "rating" de 0 a 5 (float) — bate direto com os 5 níveis do
// protótipo, sem precisar de conversão (diferente da nota de 0 a 10 da
// Biblioteca, que precisa dividir por 2 pra virar "estrelas").
const OPCOES_AVALIACAO = [1, 2, 3, 4, 5];

// Mesma aproximação ESRB → Classificação Indicativa usada no back-end
// (app/services/rawg_import_service.py::_ESRB_PARA_CLASSIND), replicada
// aqui porque a pesquisa usa os dados crus da RAWG (jogo.esrb_rating),
// não o campo já convertido — esse só existe pros jogos que já foram
// importados pro banco local (ver comentário lá pra mais detalhes,
// inclusive por que "12 anos" nunca bate com nada por essa aproximação).
const ESRB_PARA_CLASSIND = {
  Everyone: "Livre",
  "Everyone 10+": "10",
  Teen: "14",
  Mature: "16",
  "Adults Only": "+18",
};

const OPCOES_CLASSIFICACAO = [
  { valor: "Livre", label: "Livre" },
  { valor: "10", label: "10 anos" },
  { valor: "12", label: "12 anos" },
  { valor: "14", label: "14 anos" },
  { valor: "16", label: "16 anos" },
  { valor: "+18", label: "18 anos" },
];

function mensagemErro(err, fallback) {
  return err instanceof ApiError ? err.message : fallback;
}

function FilterGroup({ title, children }) {
  return (
    <section className={styles.filterGroup}>
      <h2>{title}</h2>
      <div className={styles.filterOptions}>{children}</div>
    </section>
  );
}

function FilterOption({ label, checked, onChange }) {
  return (
    <label className={styles.filterOption}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function PesquisaConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Rota protegida, mesmo padrão do catálogo/biblioteca/detalhes do jogo.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // ---------- Busca por texto (aceita ?q= vindo do catálogo) ----------
  const [termoBusca, setTermoBusca] = useState(searchParams.get("q") ?? "");
  const [buscaDebounced, setBuscaDebounced] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const id = setTimeout(() => setBuscaDebounced(termoBusca.trim()), 400);
    return () => clearTimeout(id);
  }, [termoBusca]);

  // Mantém a URL em sincronia com a busca (troca sem empilhar
  // histórico), pra dar pra copiar/compartilhar o link já com o termo.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (buscaDebounced) {
      params.set("q", buscaDebounced);
    } else {
      params.delete("q");
    }
    const query = params.toString();
    router.replace(query ? `/pesquisa?${query}` : "/pesquisa", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaDebounced]);

  // ---------- Filtros ----------
  const [generos, toggleGenero, limparGeneros] = useConjuntoFiltro();
  const [modos, toggleModo, limparModos] = useConjuntoFiltro();
  const [avaliacoes, toggleAvaliacao, limparAvaliacoes] = useConjuntoFiltro();
  const [classificacoes, toggleClassificacao, limparClassificacoes] = useConjuntoFiltro();

  const filtrosAtivos =
    generos.size > 0 || modos.size > 0 || avaliacoes.size > 0 || classificacoes.size > 0;

  function limparTodosFiltros() {
    limparGeneros();
    limparModos();
    limparAvaliacoes();
    limparClassificacoes();
  }

  // "Gênero" pode virar dois parâmetros diferentes na RAWG: os gêneros
  // de verdade (genres) e, no caso de "Terror", uma tag — mesma
  // limitação que o catálogo já tem com sua categoria "Terror".
  const generoParam = useMemo(
    () =>
      OPCOES_GENERO.filter((o) => generos.has(o.valor) && o.genero)
        .map((o) => o.genero)
        .join(",") || undefined,
    [generos]
  );

  const tagParam = useMemo(() => {
    const tagsDoGenero = OPCOES_GENERO.filter((o) => generos.has(o.valor) && o.tag).map(
      (o) => o.tag
    );
    const tagsDoModo = OPCOES_MODO.filter((o) => modos.has(o.valor)).map((o) => o.tag);
    const todas = [...tagsDoGenero, ...tagsDoModo];
    // Nota: se "Terror" e algum Modo forem marcados juntos, os dois
    // caem no mesmo parâmetro "tags" da RAWG e viram OU entre si (em
    // vez de E) — combinação rara, documentando aqui em vez de
    // resolver com uma segunda chamada só pra esse caso.
    return todas.length > 0 ? todas.join(",") : undefined;
  }, [generos, modos]);

  // ---------- Resultados ----------
  const [jogos, setJogos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [loading, setLoading] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [error, setError] = useState(null);

  // Recarrega do zero sempre que a busca ou os filtros que vão pro
  // servidor (gênero/modo) mudam. Avaliação e Classificação filtram só
  // no cliente (ver `jogosFiltrados` abaixo, mesmo espírito dos
  // filtros da Biblioteca), então não precisam disparar um novo fetch.
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      setLoading(true);
      setError(null);

      try {
        const data = await listarRawg({
          nome: buscaDebounced || undefined,
          genero: generoParam,
          tag: tagParam,
          page: 1,
          pageSize: PAGE_SIZE,
        });
        if (!cancelado) {
          setJogos(data?.results ?? []);
          setTemMais(Boolean(data?.next));
          setPagina(1);
        }
      } catch (err) {
        if (!cancelado) {
          setError(mensagemErro(err, "Não foi possível carregar a pesquisa."));
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [buscaDebounced, generoParam, tagParam]);

  async function carregarMais() {
    setCarregandoMais(true);
    try {
      const proximaPagina = pagina + 1;
      const data = await listarRawg({
        nome: buscaDebounced || undefined,
        genero: generoParam,
        tag: tagParam,
        page: proximaPagina,
        pageSize: PAGE_SIZE,
      });
      setJogos((atual) => [...atual, ...(data?.results ?? [])]);
      setTemMais(Boolean(data?.next));
      setPagina(proximaPagina);
    } catch (err) {
      setError(mensagemErro(err, "Não foi possível carregar mais jogos."));
    } finally {
      setCarregandoMais(false);
    }
  }

  const jogosFiltrados = useMemo(() => {
    return jogos.filter((jogo) => {
      if (avaliacoes.size > 0) {
        const estrelas = Math.round(jogo.rating ?? 0);
        if (!avaliacoes.has(estrelas)) return false;
      }

      if (classificacoes.size > 0) {
        const classind = ESRB_PARA_CLASSIND[jogo.esrb_rating?.name];
        if (!classind || !classificacoes.has(classind)) return false;
      }

      return true;
    });
  }, [jogos, avaliacoes, classificacoes]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className={styles.pagina}>
      <Header active="pesquisa" />

      <main className={styles.principal}>
        <div className={styles.buscaWrapper}>
          <div className={styles.buscaCaixa}>
            <input
              className={styles.buscaInput}
              type="text"
              placeholder="PESQUISAR JOGO"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            <svg className={styles.buscaIcone} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                stroke="#1E1E1E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className={styles.layout}>
          <aside className={styles.filtros}>
            <FilterGroup title="GÊNERO">
              {OPCOES_GENERO.map((opcao) => (
                <FilterOption
                  key={opcao.valor}
                  label={opcao.label}
                  checked={generos.has(opcao.valor)}
                  onChange={() => toggleGenero(opcao.valor)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="MODO">
              {OPCOES_MODO.map((opcao) => (
                <FilterOption
                  key={opcao.valor}
                  label={opcao.label}
                  checked={modos.has(opcao.valor)}
                  onChange={() => toggleModo(opcao.valor)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="AVALIAÇÃO">
              {OPCOES_AVALIACAO.map((n) => (
                <FilterOption
                  key={n}
                  label={n.toFixed(1).replace(".", ",")}
                  checked={avaliacoes.has(n)}
                  onChange={() => toggleAvaliacao(n)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="CLASSIFICAÇÃO INDICATIVA">
              {OPCOES_CLASSIFICACAO.map((opcao) => (
                <FilterOption
                  key={opcao.valor}
                  label={opcao.label}
                  checked={classificacoes.has(opcao.valor)}
                  onChange={() => toggleClassificacao(opcao.valor)}
                />
              ))}
            </FilterGroup>

            {filtrosAtivos && (
              <button type="button" className={styles.limparFiltros} onClick={limparTodosFiltros}>
                Limpar filtros
              </button>
            )}
          </aside>

          <section className={styles.resultados}>
            {loading && <p className={styles.infoEscuro}>Procurando jogos...</p>}
            {error && <p className={shared.erro}>{error}</p>}

            {!loading && !error && jogosFiltrados.length === 0 && (
              <p className={styles.infoEscuro}>
                {buscaDebounced || filtrosAtivos
                  ? "Nenhum jogo bate com essa pesquisa."
                  : "Digite um termo ou escolha um filtro pra começar."}
              </p>
            )}

            {!loading && !error && jogosFiltrados.length > 0 && (
              <div className={styles.grid}>
                {jogosFiltrados.map((jogo) => (
                  <NavLink key={jogo.id} href={`/jogo/${jogo.id}`} className={styles.card}>
                    <img
                      className={styles.capa}
                      alt={jogo.name}
                      src={jogo.background_image || "/images/placeholder.svg"}
                    />
                    <span className={styles.cardTitulo}>{jogo.name}</span>
                  </NavLink>
                ))}
              </div>
            )}

            {!loading && !error && temMais && (
              <button
                type="button"
                className={styles.carregarMais}
                onClick={carregarMais}
                disabled={carregandoMais}
              >
                {carregandoMais ? "Carregando..." : "Carregar mais jogos"}
              </button>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function PesquisaPage() {
  // useSearchParams precisa de um Suspense boundary em volta (senão o
  // Next reclama no build) — por isso a lógica de verdade fica isolada
  // em PesquisaConteudo, e esse componente só cuida do Suspense.
  return (
    <Suspense fallback={null}>
      <PesquisaConteudo />
    </Suspense>
  );
}
