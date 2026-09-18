"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { ReviewsJogo } from "@/components/ReviewsJogo";
import { STATUS_LABEL } from "@/components/EntradaBibliotecaForm";
import { useAuth } from "@/context/AuthContext";
import {
  addToLibrary,
  ApiError,
  getGameDetailsRawg,
  getMinhaEntradaBiblioteca,
  importarUmJogoRawg,
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

  // Pop-up que abre ao clicar em "Adicionar à Biblioteca", só pra
  // escolher o status inicial. Edição de nota/review/horas depois
  // disso acontece só na Biblioteca — aqui é só o momento de adicionar.
  const [modalAberto, setModalAberto] = useState(false);
  const [statusEscolhido, setStatusEscolhido] = useState("planejado");
  const [adicionando, setAdicionando] = useState(false);
  const [erroBiblioteca, setErroBiblioteca] = useState(null);

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

  const plataformas = nomes(jogo?.platforms?.map((p) => p.platform));
  const desenvolvedores = nomes(jogo?.developers);
  const distribuidoras = nomes(jogo?.publishers);
  const generos = nomes(jogo?.genres);

  const modos = (jogo?.tags ?? [])
    .map((t) => MODOS_POR_TAG[t.slug])
    .filter(Boolean)
    .filter((valor, i, arr) => arr.indexOf(valor) === i);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className={styles.pagina}>
      <Header active="catalogo" />

      <div className={styles.conteudo}>
        <button type="button" className={styles.voltar} onClick={() => router.back()}>
          <span aria-hidden="true">←</span> voltar
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
                  {jogo.esrb_rating?.name && (
                    <span className={styles.classificacao}>{jogo.esrb_rating.name}</span>
                  )}
                  {jogo.rating > 0 && (
                    <span className={styles.avaliacao}>
                      {jogo.rating.toFixed(1)} <span className={styles.estrela}>★</span>
                      {jogo.ratings_count > 0 && (
                        <span className={styles.numAvaliacoes}>
                          {jogo.ratings_count} análises
                        </span>
                      )}
                    </span>
                  )}
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

                <div className={styles.acao}>
                  {carregandoEntrada ? (
                    <p className={styles.info}>Verificando sua biblioteca...</p>
                  ) : entradaBiblioteca ? (
                    <span className={styles.indicadorNaBiblioteca}>
                      ✓ ADICIONADO À BIBLIOTECA
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.botaoBiblioteca}
                        onClick={handleAbrirModalAdicionar}
                      >
                        ADICIONAR À BIBLIOTECA
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

            <ReviewsJogo rawgId={id} />
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
