/**
 * @fileoverview Detalhes de um jogo (/jogo/[id]) — RF004, RF005, RF006 e RF013.
 *
 * Mostra a ficha técnica vinda da RAWG, a nota do GameLog, o botão de
 * adicionar/remover da biblioteca e as reviews dos outros usuários. O [id] da
 * rota é o id do jogo na RAWG.
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { ReviewsJogo } from "@/components/ReviewsJogo";
import { STATUS_LABEL } from "@/components/EntradaBibliotecaForm";
import { useAuth } from "@/context/AuthContext";
import {
  classindDoEsrb,
  descritoresDeTags,
} from "@/lib/classificacaoIndicativa";
import { traduzirGenero } from "@/lib/generos";
import {
  addToLibrary,
  mensagemErro,
  getGameDetailsRawg,
  getMinhaEntradaBiblioteca,
  getReviewsRawg,
  importarUmJogoRawg,
  removeFromLibrary,
} from "@/lib/api";
import styles from "./page.module.css";

/**
 * A RAWG não tem um campo pronto de "modo de jogo", então ele é aproximado pelas
 * tags mais comuns. As outras tags (gênero, tema...) não entram nessa linha.
 */
const MODOS_POR_TAG = {
  singleplayer: "Single Player (um jogador)",
  multiplayer: "Multiplayer",
  "co-op": "Cooperativo",
  "split-screen": "Tela dividida",
  "local-co-op": "Cooperativo local",
  "online-co-op": "Cooperativo online",
};

/**
 * Converte uma data ISO (aaaa-mm-dd) para o formato brasileiro (dd/mm/aaaa).
 *
 * @param {string} [iso] Data em formato ISO.
 * @returns {string|null} Data formatada, ou null se estiver vazia ou inválida.
 */
function formatarData(iso) {
  if (!iso) return null;
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return null;
  return `${dia}/${mes}/${ano}`;
}

/**
 * Pega o campo "name" de uma lista de objetos da RAWG, ignorando os vazios.
 *
 * @param {{name?: string}[]} [lista]
 * @returns {string[]}
 */
function nomes(lista) {
  return (lista ?? []).map((item) => item?.name).filter(Boolean);
}

/**
 * Cinco estrelas (cheias ou vazias) a partir de uma média.
 *
 * @param {object} props
 * @param {number} props.media Média de 0 a 5.
 * @param {number} [props.tamanho=16] Tamanho de cada estrela, em pixels.
 * @returns {JSX.Element}
 */
function Estrelas({ media, tamanho = 16 }) {
  const preenchidas = Math.round(Math.min(5, Math.max(0, media)));
  return (
    <span className={styles.estrelasWrapper} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={tamanho}
          height={tamanho}
          viewBox="0 0 24 24"
          fill={i < preenchidas ? "#f5c518" : "none"}
          stroke="#f5c518"
          strokeWidth="1.5"
        >
          <path d="M12 2.5l2.95 6.28 6.85.82-5.1 4.86 1.42 6.79L12 17.9l-6.12 3.35 1.42-6.79-5.1-4.86 6.85-.82z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Ícone de marcador: só o contorno quando o jogo ainda não está salvo, e
 * preenchido quando já está.
 *
 * @param {object} props
 * @param {boolean} props.preenchido
 * @returns {JSX.Element}
 */
function IconeBookmark({ preenchido }) {
  return (
    <svg
      className={styles.iconeBookmark}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill={preenchido ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/**
 * Seta do botão de voltar. É um SVG porque o caractere "←" ficava torto dentro do
 * círculo, dependendo da fonte.
 *
 * @returns {JSX.Element}
 */
function IconeVoltar() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="11 6 5 12 11 18" />
    </svg>
  );
}

/**
 * Página de detalhes do jogo. É uma rota protegida: sem sessão, redireciona para
 * o login.
 *
 * @returns {JSX.Element|null}
 */
export default function DetalhesJogoPage() {
  const { id } = useParams();
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Rota protegida: sem sessão, manda o usuário para o login.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const [jogo, setJogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Se o jogo já está na biblioteca, guarda a entrada; se não está, fica null e a
  // página mostra o botão de adicionar.
  const [entradaBiblioteca, setEntradaBiblioteca] = useState(null);
  const [carregandoEntrada, setCarregandoEntrada] = useState(true);
  const [removendo, setRemovendo] = useState(false);

  // Modal de "Adicionar à Biblioteca": pede só o status inicial. Nota e review são
  // editadas depois, na Biblioteca.
  const [modalAberto, setModalAberto] = useState(false);
  const [statusEscolhido, setStatusEscolhido] = useState("planejado");
  const [adicionando, setAdicionando] = useState(false);
  const [erroBiblioteca, setErroBiblioteca] = useState(null);

  // As reviews são carregadas aqui, uma vez só, porque a nota do GameLog e a lista
  // (ReviewsJogo) usam os mesmos dados.
  const [reviews, setReviews] = useState([]);
  const [carregandoReviews, setCarregandoReviews] = useState(true);
  const [erroReviews, setErroReviews] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelado = false;

    async function carregarJogo() {
      setLoading(true);
      setError(null);

      try {
        const dados = await getGameDetailsRawg(id);
        if (!cancelado) setJogo(dados);
      } catch (err) {
        if (!cancelado)
          setError(mensagemErro(err, "Não foi possível carregar esse jogo."));
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    carregarJogo();
    return () => {
      cancelado = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelado = false;

    async function carregarEntrada() {
      if (!id || !token) {
        setCarregandoEntrada(false);
        return;
      }

      setCarregandoEntrada(true);

      try {
        const entrada = await getMinhaEntradaBiblioteca(token, id);
        if (!cancelado) setEntradaBiblioteca(entrada);
      } catch {
        // Falhar aqui não deve travar a página: assume que o jogo não está na
        // biblioteca e mostra o botão de adicionar.
        if (!cancelado) setEntradaBiblioteca(null);
      } finally {
        if (!cancelado) setCarregandoEntrada(false);
      }
    }

    carregarEntrada();
    return () => {
      cancelado = true;
    };
  }, [id, token]);

  useEffect(() => {
    if (!id) return;
    let cancelado = false;

    async function carregarReviews() {
      setCarregandoReviews(true);
      setErroReviews(null);

      try {
        const data = await getReviewsRawg(id);
        if (!cancelado) setReviews(data ?? []);
      } catch (err) {
        if (!cancelado) {
          setErroReviews(
            mensagemErro(err, "Não foi possível carregar as reviews."),
          );
        }
      } finally {
        if (!cancelado) setCarregandoReviews(false);
      }
    }

    carregarReviews();
    return () => {
      cancelado = true;
    };
  }, [id]);

  function handleAbrirModalAdicionar() {
    if (!user) {
      router.push("/login");
      return;
    }
    setStatusEscolhido("planejado");
    setErroBiblioteca(null);
    setModalAberto(true);
  }

  async function handleConfirmarAdicionar(e) {
    e.preventDefault();
    setAdicionando(true);
    setErroBiblioteca(null);

    try {
      // 1) Garante que o jogo exista no banco local (importa se for preciso).
      const jogoLocal = await importarUmJogoRawg(token, id);

      // 2) Só então adiciona à biblioteca, usando o id local.
      const novaEntrada = await addToLibrary(token, {
        bib_status: statusEscolhido,
        bib_jgs_id: jogoLocal.jgs_id,
      });
      setEntradaBiblioteca(novaEntrada);
      setModalAberto(false);
    } catch (err) {
      setErroBiblioteca(
        mensagemErro(err, "Não foi possível adicionar à biblioteca."),
      );
    } finally {
      setAdicionando(false);
    }
  }

  async function handleRemover() {
    if (!entradaBiblioteca) return;
    setRemovendo(true);
    setErroBiblioteca(null);

    try {
      await removeFromLibrary(token, entradaBiblioteca.bib_id);
      setEntradaBiblioteca(null);
    } catch (err) {
      setErroBiblioteca(
        mensagemErro(err, "Não foi possível remover da biblioteca."),
      );
    } finally {
      setRemovendo(false);
    }
  }

  const plataformas = nomes(jogo?.platforms?.map((p) => p.platform));
  const desenvolvedores = nomes(jogo?.developers);
  const distribuidoras = nomes(jogo?.publishers);
  const generos = (jogo?.genres ?? []).map(traduzirGenero).filter(Boolean);

  const modos = (jogo?.tags ?? [])
    .map((t) => MODOS_POR_TAG[t.slug])
    .filter(Boolean)
    .filter((valor, i, arr) => arr.indexOf(valor) === i);

  // Classificação indicativa no modelo brasileiro (a RAWG só devolve o ESRB).
  const classind = classindDoEsrb(jogo?.esrb_rating);
  const descritores = descritoresDeTags(jogo?.tags);

  // Nota do GameLog: média das notas (0 a 10) das reviews dos usuários, convertida
  // para 0 a 5 estrelas.
  const notasValidas = reviews
    .map((r) => r.bib_usr_nota)
    .filter((nota) => nota != null);
  const mediaGameLog10 =
    notasValidas.length > 0
      ? notasValidas.reduce((soma, n) => soma + n, 0) / notasValidas.length
      : null;
  const mediaGameLog5 = mediaGameLog10 != null ? mediaGameLog10 / 2 : null;

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className={styles.pagina}>
      <Header active="catalogo" />

      <div className={styles.conteudo}>
        <button
          type="button"
          className={styles.voltar}
          onClick={() => router.back()}
        >
          <span aria-hidden="true">
            <IconeVoltar />
          </span>
          Voltar
        </button>

        {loading && <p className={styles.info}>Carregando...</p>}
        {error && <p className={styles.erro}>{error}</p>}

        {jogo && (
          <>
            <div className={styles.grade}>
              <div className={styles.colunaImagem}>
                <img
                  className={styles.capa}
                  src={jogo.background_image || "/images/placeholder.svg"}
                  alt={jogo.name}
                />

                <div className={styles.linhaMeta}>
                  {classind && (
                    <div className={styles.classificacao}>
                      <span
                        className={styles.classificacaoNumero}
                        style={{
                          backgroundColor: classind.cor,
                          color: classind.corTexto,
                        }}
                      >
                        {classind.chave}
                      </span>
                      <span className={styles.classificacaoTextos}>
                        <span className={styles.classificacaoRotulo}>
                          {classind.rotulo}
                        </span>
                        {descritores.length > 0 && (
                          <span className={styles.classificacaoDescritores}>
                            {descritores.join(", ")}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className={styles.avaliacaoGameLog}>
                    {mediaGameLog5 != null ? (
                      <>
                        <Estrelas media={mediaGameLog5} />
                        <span className={styles.avaliacaoGameLogNota}>
                          {mediaGameLog5.toFixed(1)}
                        </span>
                        <span className={styles.numAvaliacoes}>
                          {notasValidas.length}{" "}
                          {notasValidas.length === 1
                            ? "avaliação"
                            : "avaliações"}
                        </span>
                      </>
                    ) : (
                      !carregandoReviews && (
                        <span className={styles.semAvaliacoes}>
                          Ainda sem avaliações
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.colunaInfo}>
                <h1 className={styles.titulo}>{jogo.name}</h1>

                <dl className={styles.ficha}>
                  {formatarData(jogo.released) && (
                    <div>
                      <dt>Data de Lançamento:</dt>
                      <dd>{formatarData(jogo.released)}</dd>
                    </div>
                  )}
                  {plataformas.length > 0 && (
                    <div>
                      <dt>Plataformas:</dt>
                      <dd>{plataformas.join(", ")}</dd>
                    </div>
                  )}
                  {distribuidoras.length > 0 && (
                    <div>
                      <dt>Distribuidor(a):</dt>
                      <dd>{distribuidoras.join(", ")}</dd>
                    </div>
                  )}
                  {jogo.playtime > 0 && (
                    <div>
                      <dt>Tempo de Gameplay:</dt>
                      <dd>~{jogo.playtime} horas</dd>
                    </div>
                  )}
                  {modos.length > 0 && (
                    <div>
                      <dt>Modo(s) de Jogo:</dt>
                      <dd>{modos.join(", ")}</dd>
                    </div>
                  )}
                  {desenvolvedores.length > 0 && (
                    <div>
                      <dt>Desenvolvedor(a):</dt>
                      <dd>{desenvolvedores.join(", ")}</dd>
                    </div>
                  )}
                </dl>

                {generos.length > 0 && (
                  <>
                    <h2 className={styles.subtitulo}>Gêneros:</h2>
                    <div className={styles.pills}>
                      {generos.map((g) => (
                        <span key={g} className={styles.pill}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {jogo.rating > 0 && (
                  <div className={styles.notaRawg}>
                    <span className={styles.notaRawgFonte}>RAWG</span>
                    <span className={styles.notaRawgValor}>
                      {jogo.rating.toFixed(1)}
                      <span className={styles.notaRawgMax}>/5</span>
                    </span>
                    {jogo.ratings_count > 0 && (
                      <span className={styles.notaRawgCount}>
                        {jogo.ratings_count} avaliações
                      </span>
                    )}
                  </div>
                )}

                <div className={styles.acao}>
                  {carregandoEntrada ? (
                    <p className={styles.info}>Verificando sua biblioteca...</p>
                  ) : entradaBiblioteca ? (
                    <>
                      <button
                        type="button"
                        className={styles.indicadorNaBiblioteca}
                        onClick={handleRemover}
                        disabled={removendo}
                      >
                        <IconeBookmark preenchido />
                        {removendo ? "Removendo..." : "Remover da Biblioteca"}
                      </button>
                      {erroBiblioteca && (
                        <p className={styles.erroBiblioteca}>
                          {erroBiblioteca}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.botaoBiblioteca}
                        onClick={handleAbrirModalAdicionar}
                      >
                        <IconeBookmark />
                        Adicionar à Biblioteca
                      </button>
                      {erroBiblioteca && (
                        <p className={styles.erroBiblioteca}>
                          {erroBiblioteca}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {jogo.description_raw && (
              <div className={styles.sinopse}>{jogo.description_raw}</div>
            )}

            <ReviewsJogo
              reviews={reviews}
              loading={carregandoReviews}
              erro={erroReviews}
            />
          </>
        )}
      </div>

      {modalAberto && (
        <Modal
          titulo="Adicionar à Biblioteca"
          onFechar={() => setModalAberto(false)}
        >
          <form
            className={styles.formAdicionar}
            onSubmit={handleConfirmarAdicionar}
          >
            <label className={styles.labelAdicionar}>
              Status
              <select
                className={styles.selectAdicionar}
                value={statusEscolhido}
                onChange={(e) => setStatusEscolhido(e.target.value)}
              >
                {Object.entries(STATUS_LABEL).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {erroBiblioteca && (
              <p className={styles.erroBiblioteca}>{erroBiblioteca}</p>
            )}

            <button
              type="submit"
              className={styles.botaoConfirmarAdicionar}
              disabled={adicionando}
            >
              {adicionando ? "Adicionando..." : "Adicionar"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
