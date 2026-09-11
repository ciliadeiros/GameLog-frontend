"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { listarRawg, ApiError } from "@/lib/api";
import shared from "../styles/lista.module.css";
import styles from "./page.module.css";

// Categorias fixas mostradas no catálogo. Cada uma mapeia pra um filtro
// da RAWG: "genero" usa o parâmetro "genres" e "tag" usa "tags" (a RAWG
// não tem gênero "Terror" nem "Cooperativo" — só existem como tags).
// Ver app/services/rawg_service.py::listar_jogos_rawg no back-end.
const CATEGORIAS = [
  { label: "Cooperativo", tag: "co-op" },
  { label: "Ação", genero: "action" },
  { label: "Indie", genero: "indie" },
  { label: "Terror", tag: "horror" },
  { label: "RPG", genero: "role-playing-games-rpg" },
  { label: "Plataforma", genero: "platformer" },
];

const PAGE_SIZE = 18;

function mensagemErro(err, fallback) {
  return err instanceof ApiError ? err.message : fallback;
}

export default function CatalogoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Rota protegida: manda pro login se não tiver sessão (mesmo padrão
  // já usado em app/biblioteca/page.jsx).
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // ---------- Destaque (carrossel do topo) ----------
  const [destaques, setDestaques] = useState([]);
  const [destaqueIndex, setDestaqueIndex] = useState(0);
  const [destaqueErro, setDestaqueErro] = useState(null);

  useEffect(() => {
    listarRawg({ ordering: "-added", pageSize: 6 })
      .then((data) => setDestaques(data?.results ?? []))
      .catch((err) =>
        setDestaqueErro(mensagemErro(err, "Não foi possível carregar os destaques."))
      );
  }, []);

  const destaqueAtual = destaques[destaqueIndex];

  function proximoDestaque() {
    if (destaques.length === 0) return;
    setDestaqueIndex((i) => (i + 1) % destaques.length);
  }

  function destaqueAnterior() {
    if (destaques.length === 0) return;
    setDestaqueIndex((i) => (i - 1 + destaques.length) % destaques.length);
  }

  // ---------- Busca + categoria ----------
  const [termoBusca, setTermoBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState(null); // item de CATEGORIAS ou null

  useEffect(() => {
    const id = setTimeout(() => setBuscaDebounced(termoBusca.trim()), 400);
    return () => clearTimeout(id);
  }, [termoBusca]);

  // ---------- Grade principal de jogos ----------
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    listarRawg({
      nome: buscaDebounced || undefined,
      genero: categoriaAtiva?.genero,
      tag: categoriaAtiva?.tag,
      pageSize: PAGE_SIZE,
    })
      .then((data) => setJogos(data?.results ?? []))
      .catch((err) => setError(mensagemErro(err, "Não foi possível carregar o catálogo.")))
      .finally(() => setLoading(false));
  }, [buscaDebounced, categoriaAtiva]);

  function selecionarCategoria(categoria) {
    setTermoBusca("");
    setCategoriaAtiva((atual) => (atual?.label === categoria.label ? null : categoria));
  }

  const tituloGrade = useMemo(() => {
    if (buscaDebounced) return `Resultados para "${buscaDebounced}"`;
    if (categoriaAtiva) return categoriaAtiva.label;
    return "Populares";
  }, [buscaDebounced, categoriaAtiva]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className={styles.pagina}>
      {/* ---------- Cabeçalho ---------- */}
      <Header active="catalogo" />

      {/* ---------- Busca ---------- */}
      <div className={styles.buscaWrapper}>
        <div className={styles.buscaCaixa}>
          <input
            className={styles.buscaInput}
            type="text"
            placeholder="PESQUISAR JOGO"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
          <svg
            className={styles.buscaIcone}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <line
              x1="21"
              y1="21"
              x2="16.65"
              y2="16.65"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* ---------- Destaque / carrossel ---------- */}
      {destaqueErro && <p className={shared.erro}>{destaqueErro}</p>}

      {destaqueAtual && (
        <section
          className={styles.destaque}
          style={{
            backgroundImage: destaqueAtual.background_image
              ? `linear-gradient(90deg, rgba(20,20,20,0.9) 10%, rgba(20,20,20,0.25) 60%, rgba(20,20,20,0.05) 100%), url(${destaqueAtual.background_image})`
              : undefined,
          }}
        >
          <button
            type="button"
            className={styles.setaEsquerda}
            onClick={destaqueAnterior}
            aria-label="Destaque anterior"
          >
            ←
          </button>

          <div className={styles.destaqueConteudo}>
            <Link href={`/jogo/${destaqueAtual.id}`} className={styles.destaqueTituloLink}>
              <h1 className={styles.destaqueTitulo}>{destaqueAtual.name}</h1>
            </Link>
            <div className={styles.destaqueTags}>
              {(destaqueAtual.genres ?? []).slice(0, 2).map((g) => (
                <span key={g.id} className={styles.destaqueTag}>
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={styles.setaDireita}
            onClick={proximoDestaque}
            aria-label="Próximo destaque"
          >
            →
          </button>
        </section>
      )}

      {/* ---------- Categorias ---------- */}
      <div className={styles.categoriasHeader}>
        <a href="#categorias" className={styles.verMaisLink}>
          Ver mais categorias →
        </a>
      </div>
      <div id="categorias" className={styles.categorias}>
        {CATEGORIAS.map((categoria) => (
          <button
            key={categoria.label}
            type="button"
            className={`${styles.categoriaCard} ${
              categoriaAtiva?.label === categoria.label ? styles.categoriaAtiva : ""
            }`}
            onClick={() => selecionarCategoria(categoria)}
          >
            {categoria.label}
          </button>
        ))}
      </div>

      {/* ---------- Grade de jogos ---------- */}
      <div className={styles.gradeWrapper}>
        <h2 className={`${shared.titulo} ${styles.tituloEscuro}`}>{tituloGrade}</h2>

        {loading && (
          <p className={`${shared.info} ${styles.infoEscuro}`}>Carregando jogos...</p>
        )}
        {error && <p className={shared.erro}>{error}</p>}
        {!loading && !error && jogos.length === 0 && (
          <p className={`${shared.info} ${styles.infoEscuro}`}>Nenhum jogo encontrado.</p>
        )}

        <div className={shared.grid}>
          {jogos.map((jogo) => (
            <Link key={jogo.id} href={`/jogo/${jogo.id}`} className={shared.card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={shared.capa}
                alt={jogo.name}
                src={jogo.background_image || "/images/placeholder.svg"}
              />
              <div className={styles.cardConteudo}>
                <h2 className={shared.cardTitulo}>{jogo.name}</h2>
                <p className={styles.cardNota}>
                  Nota: {jogo.rating?.toFixed ? jogo.rating.toFixed(1) : "—"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
