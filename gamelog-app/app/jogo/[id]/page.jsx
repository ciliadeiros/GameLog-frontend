"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { ReviewsJogo } from "@/components/ReviewsJogo";
import { STATUS_LABEL } from "@/components/EntradaBibliotecaForm";
import { useAuth } from "@/context/AuthContext";
import { classindDoEsrb, descritoresDeTags } from "@/lib/classificacaoIndicativa";
import { traduzirGenero } from "@/lib/generos";
import {
  addToLibrary,
  ApiError,
  getGameDetailsRawg,
  getMinhaEntradaBiblioteca,
  getReviewsRawg,
  importarUmJogoRawg,
  removeFromLibrary,
} from "@/lib/api";
import styles from "./page.module.css";

// A RAWG não tem um campo pronto de "modo de jogo" — dá pra aproximar
// olhando pras tags que ela já retorna em cada jogo. Só traduzo as
// mais comuns; o resto das tags (gênero, tema etc.) a gente ignora
// aqui, elas não servem pra essa linha específica da ficha técnica.
const MODOS_POR_TAG = {
  singleplayer: "Single Player (um jogador)",
  multiplayer: "Multiplayer",
  "co-op": "Cooperativo",
  "split-screen": "Tela dividida",
  "local-co-op": "Cooperativo local",
  "online-co-op": "Cooperativo online",
};

function formatarData(iso) {
  if (!iso) return null;
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return null;
  return `${dia}/${mes}/${ano}`;
}

function nomes(lista) {
  return (lista ?? []).map((item) => item?.name).filter(Boolean);
}

function mensagemErro(err, fallback) {
  return err instanceof ApiError ? err.message : fallback;
}

// Estrelas cheias/vazias (0 a 5) a partir de uma média — usado tanto
// pra nota do GameLog (convertida de 0-10 pra 0-5) quanto poderia
// servir pra outras médias em estrela no futuro.
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

// Ícone de bookmark (mesma silhueta do "salvar" do Instagram):
// contorno quando ainda não está salvo, preenchido quando já está.
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

// Seta grossa e centralizada pro botão de voltar — trocada pelo
// caractere "←" porque o glifo variava de alinhamento entre fontes e
// ficava torto dentro do círculo.
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

export default function DetalhesJogoPage() {
  const { id } = useParams();
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Rota protegida: manda pro login se não tiver sessão (mesmo padrão
  // já usado em app/biblioteca/page.jsx e app/catalogo/page.jsx).
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const [jogo, setJogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------- Biblioteca (se o jogo já estiver, guarda a entrada aqui;
  // se não estiver, fica null e mostramos o botão "Adicionar") ----------
  const [entradaBiblioteca, setEntradaBiblioteca] = useState(null);
  const [carregandoEntrada, setCarregandoEntrada] = useState(true);
  const [removendo, setRemovendo] = useState(false);

  // Pop-up que abre ao clicar em "Adicionar à Biblioteca", só pra
  // escolher o status inicial. Edição de nota/review/horas depois
  // disso acontece só na Biblioteca — aqui é só o momento de adicionar.
  const [modalAberto, setModalAberto] = useState(false);
  const [statusEscolhido, setStatusEscolhido] = useState("planejado");
  const [adicionando, setAdicionando] = useState(false);
  const [erroBiblioteca, setErroBiblioteca] = useState(null);

  // ---------- Reviews (RF013) — carregadas aqui, uma única vez, porque
  // tanto a nota do GameLog (estrelas ao lado da imagem) quanto a
  // lista completa (componente ReviewsJogo, mais abaixo na página)
  // precisam dos mesmos dados. ----------
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
        if (!cancelado) setError(mensagemErro(err, "Não foi possível carregar esse jogo."));
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
        // se der erro aqui, não é grave o suficiente pra travar a página
        // inteira — só assume que não está na biblioteca e mostra o
        // botão de adicionar normalmente.
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
          setErroReviews(mensagemErro(err, "Não foi possível carregar as reviews."));
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
      // 1) garante que o jogo exista em tb_jogos (importa se preciso)
      const jogoLocal = await importarUmJogoRawg(token, id);
      // 2) só então adiciona na biblioteca do usuário, com o id local
      const novaEntrada = await addToLibrary(token, {
        bib_status: statusEscolhido,
        bib_jgs_id: jogoLocal.jgs_id,
      });
      setEntradaBiblioteca(novaEntrada);
      setModalAberto(false);
    } catch (err) {
      setErroBiblioteca(mensagemErro(err, "Não foi possível adicionar à biblioteca."));
    } finally {
      setAdicionando(false);
    }
  }

  // Remover direto da página de detalhes (clicando no mesmo botão que
  // virou "Remover da Biblioteca") — sem precisar ir até a Biblioteca.
  async function handleRemover() {
    if (!entradaBiblioteca) return;
    setRemovendo(true);
    setErroBiblioteca(null);

    try {
      await removeFromLibrary(token, entradaBiblioteca.bib_id);
      setEntradaBiblioteca(null);
    } catch (err) {
      setErroBiblioteca(mensagemErro(err, "Não foi possível remover da biblioteca."));
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

  // ---------- Classificação indicativa (modelo brasileiro, não o ESRB
  // americano que a RAWG devolve cru) ----------
  const classind = classindDoEsrb(jogo?.esrb_rating);
  const descritores = descritoresDeTags(jogo?.tags);

  // ---------- Nota do GameLog: média das notas (0-10) das reviews dos
  // próprios usuários, convertida pra 0-5 estrelas ----------
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
        <button type="button" className={styles.voltar} onClick={() => router.back()}>
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        style={{ backgroundColor: classind.cor, color: classind.corTexto }}
                      >
                        {classind.chave}
                      </span>
                      <span className={styles.classificacaoTextos}>
                        <span className={styles.classificacaoRotulo}>{classind.rotulo}</span>
                        {descritores.length > 0 && (
                          <span className={styles.classificacaoDescritores}>
                            {descritores.join(", ")}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Nota do GameLog (média das reviews dos usuários,
                     0-10 convertida pra 0-5 estrelas), sempre no canto
                     oposto ao selo de classificação. */}
                  <div className={styles.avaliacaoGameLog}>
                    {mediaGameLog5 != null ? (
                      <>
                        <Estrelas media={mediaGameLog5} />
                        <span className={styles.avaliacaoGameLogNota}>
                          {mediaGameLog5.toFixed(1)}
                        </span>
                        <span className={styles.numAvaliacoes}>
                          {notasValidas.length}{" "}
                          {notasValidas.length === 1 ? "avaliação" : "avaliações"}
                        </span>
                      </>
                    ) : (
                      !carregandoReviews && (
                        <span className={styles.semAvaliacoes}>Ainda sem avaliações</span>
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

                {/* Nota da RAWG (0-5, escala própria dela) — visual
                   totalmente diferente da nota do GameLog acima, pra não
                   dar a entender que são a mesma coisa. */}
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
                        <p className={styles.erroBiblioteca}>{erroBiblioteca}</p>
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
                        <p className={styles.erroBiblioteca}>{erroBiblioteca}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {jogo.description_raw && (
              <div className={styles.sinopse}>{jogo.description_raw}</div>
            )}

            <ReviewsJogo reviews={reviews} loading={carregandoReviews} erro={erroReviews} />
          </>
        )}
      </div>

      {modalAberto && (
        <Modal titulo="Adicionar à Biblioteca" onFechar={() => setModalAberto(false)}>
          <form className={styles.formAdicionar} onSubmit={handleConfirmarAdicionar}>
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

            {erroBiblioteca && <p className={styles.erroBiblioteca}>{erroBiblioteca}</p>}

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
