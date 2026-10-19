/**
 * @fileoverview Catálogo de jogos (/catalogo) — RF003.
 *
 * Mostra um carrossel de destaques, categorias e uma grade de jogos. Tudo vem da
 * RAWG, pelo back-end, sem precisar de jogos salvos no banco.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { listarRawg, mensagemErro } from "@/lib/api";
import shared from "../styles/lista.module.css";
import styles from "./page.module.css";

/**
 * Categorias fixas do catálogo. Cada uma vira um filtro da RAWG: "genero" usa o
 * parâmetro genres e "tag" usa tags (a RAWG não tem gênero "Terror" nem
 * "Cooperativo", só tags). "imagem" é só a arte de fundo do card.
 */
const CATEGORIAS = [
  {
    label: "Cooperativo",
    tag: "co-op",
    imagem: "/images/categorias/cooperativo.jpg",
  },
  { label: "Ação", genero: "action", imagem: "/images/categorias/acao.jpg" },
  { label: "Indie", genero: "indie", imagem: "/images/categorias/indie.png" },
  { label: "Terror", tag: "horror", imagem: "/images/categorias/terror.jpg" },
  {
    label: "RPG",
    genero: "role-playing-games-rpg",
    imagem: "/images/categorias/rpg.jpg",
  },
  {
    label: "Plataforma",
    genero: "platformer",
    imagem: "/images/categorias/plataforma.jpg",
  },
];

/** Jogos na grade "Populares" (2 linhas de 5). */
const PAGE_SIZE = 10;
/** Jogos no carrossel de destaques. */
const PAGE_SIZE_DESTAQUES = 4;

/**
 * Página do catálogo. É uma rota protegida: sem sessão, redireciona para o login.
 *
 * A grade é recarregada sempre que o usuário escolhe (ou desmarca) uma categoria.
 *
 * @returns {JSX.Element|null}
 */
export default function CatalogoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Rota protegida: sem sessão, manda o usuário para o login.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const [destaques, setDestaques] = useState([]);
  const [destaqueIndex, setDestaqueIndex] = useState(0);
  const [destaqueErro, setDestaqueErro] = useState(null);

  useEffect(() => {
    listarRawg({ aleatorio: true, pageSize: PAGE_SIZE_DESTAQUES })
      .then((data) => setDestaques(data?.results ?? []))
      .catch((err) =>
        setDestaqueErro(
          mensagemErro(err, "Não foi possível carregar os destaques."),
        ),
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

  const [categoriaAtiva, setCategoriaAtiva] = useState(null);

  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function carregarJogos() {
      setLoading(true);
      setError(null);

      try {
        const data = await listarRawg({
          genero: categoriaAtiva?.genero,
          tag: categoriaAtiva?.tag,
          aleatorio: true,
          pageSize: PAGE_SIZE,
        });
        if (!cancelado) setJogos(data?.results ?? []);
      } catch (err) {
        if (!cancelado)
          setError(mensagemErro(err, "Não foi possível carregar o catálogo."));
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    carregarJogos();
    return () => {
      cancelado = true;
    };
  }, [categoriaAtiva]);

  function selecionarCategoria(categoria) {
    setCategoriaAtiva((atual) =>
      atual?.label === categoria.label ? null : categoria,
    );
  }

  const tituloGrade = useMemo(() => {
    if (categoriaAtiva) return categoriaAtiva.label;
    return "Populares";
  }, [categoriaAtiva]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className={styles.pagina}>
      <Header active="catalogo" />

      <div className={styles.buscaWrapper}>
        <NavLink href="/pesquisa" className={styles.buscaCaixa}>
          <span className={styles.buscaPlaceholder}>PESQUISAR JOGO</span>
          <svg
            className={styles.buscaIcone}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
            />
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
        </NavLink>
      </div>

      {destaqueErro && <p className={shared.erro}>{destaqueErro}</p>}

      {destaqueAtual && (
        <section className={styles.destaque}>
          <NavLink
            href={`/jogo/${destaqueAtual.id}`}
            className={styles.destaqueLink}
            style={{
              backgroundImage: destaqueAtual.background_image
                ? `linear-gradient(90deg, rgba(20,20,20,0.9) 10%, rgba(20,20,20,0.25) 60%, rgba(20,20,20,0.05) 100%), url(${destaqueAtual.background_image})`
                : undefined,
            }}
          >
            <div className={styles.destaqueConteudo}>
              <h1 className={styles.destaqueTitulo}>{destaqueAtual.name}</h1>
              <div className={styles.destaqueTags}>
                {(destaqueAtual.genres ?? []).slice(0, 2).map((g) => (
                  <span key={g.id} className={styles.destaqueTag}>
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          </NavLink>

          <button
            type="button"
            className={styles.setaEsquerda}
            onClick={destaqueAnterior}
            aria-label="Destaque anterior"
          >
            ←
          </button>

          <button
            type="button"
            className={styles.setaDireita}
            onClick={proximoDestaque}
            aria-label="Próximo destaque"
          >
            →
          </button>

          {destaques.length > 1 && (
            <div className={styles.destaqueBolinhas}>
              {destaques.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  className={`${styles.bolinha} ${
                    i === destaqueIndex ? styles.bolinhaAtiva : ""
                  }`}
                  onClick={() => setDestaqueIndex(i)}
                  aria-label={`Mostrar destaque: ${d.name}`}
                  aria-current={i === destaqueIndex}
                />
              ))}
            </div>
          )}
        </section>
      )}

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
              categoriaAtiva?.label === categoria.label
                ? styles.categoriaAtiva
                : ""
            }`}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.8) 100%), url(${categoria.imagem})`,
            }}
            onClick={() => selecionarCategoria(categoria)}
          >
            <span className={styles.categoriaLabel}>{categoria.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.gradeWrapper}>
        <div className={styles.gradeCabecalho}>
          <h2 className={`${shared.titulo} ${styles.tituloEscuro}`}>
            {tituloGrade}
          </h2>
        </div>

        {loading && (
          <p className={`${shared.info} ${styles.infoEscuro}`}>
            Carregando jogos...
          </p>
        )}
        {error && <p className={shared.erro}>{error}</p>}
        {!loading && !error && jogos.length === 0 && (
          <p className={`${shared.info} ${styles.infoEscuro}`}>
            Nenhum jogo encontrado.
          </p>
        )}

        <div className={`${shared.grid} ${styles.gradeFixa}`}>
          {jogos.map((jogo) => (
            <NavLink
              key={jogo.id}
              href={`/jogo/${jogo.id}`}
              className={shared.card}
            >
              <img
                className={`${shared.capa} ${styles.capaFixa}`}
                alt={jogo.name}
                src={jogo.background_image || "/images/placeholder.svg"}
              />
              <div className={styles.cardConteudo}>
                <h2 className={shared.cardTitulo}>{jogo.name}</h2>
                {(jogo.genres ?? []).length > 0 && (
                  <div className={styles.cardCategorias}>
                    {jogo.genres.slice(0, 2).map((g) => (
                      <span key={g.id} className={styles.cardCategoriaTag}>
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
