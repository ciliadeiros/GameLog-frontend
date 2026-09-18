"use client";

import { useEffect, useState } from "react";
import { ApiError, getReviewsRawg } from "@/lib/api";
import styles from "./ReviewsJogo.module.css";

function formatarData(iso) {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleDateString("pt-BR");
}

function iniciais(nome) {
  if (!nome) return "?";
  return nome.trim().charAt(0).toUpperCase();
}

/**
 * RF013 — reviews públicas de outros usuários pra este jogo, exibidas
 * na página de detalhes (app/jogo/[id]/page.jsx). Só leitura: não tem
 * formulário aqui, quem quiser avaliar continua fazendo isso pela
 * Biblioteca (RF010-012). Recebe o id da RAWG do jogo já carregado
 * pela página, e busca as reviews sozinho via GET
 * /games/rawg/{rawgId}/reviews (rota pública, sem token).
 *
 * Props:
 * - rawgId: id do jogo na RAWG (mesmo usado por getGameDetailsRawg)
 */
export function ReviewsJogo({ rawgId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!rawgId) return;

    let cancelado = false;

    async function carregarReviews() {
      setLoading(true);
      setErro(null);

      try {
        const data = await getReviewsRawg(rawgId);
        if (!cancelado) setReviews(data ?? []);
      } catch (err) {
        if (!cancelado) {
          setErro(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar as reviews."
          );
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    carregarReviews();
    return () => {
      cancelado = true;
    };
  }, [rawgId]);

  return (
    <section className={styles.secao}>
      <h2 className={styles.titulo}>
        Reviews {reviews.length > 0 && `(${reviews.length})`}
      </h2>

      {loading && <p className={styles.info}>Carregando reviews...</p>}
      {erro && <p className={styles.erro}>{erro}</p>}

      {!loading && !erro && reviews.length === 0 && (
        <p className={styles.info}>
          Esse jogo ainda não tem reviews. Adicione-o à sua biblioteca pra
          ser o primeiro a avaliar.
        </p>
      )}

      {!loading && !erro && reviews.length > 0 && (
        <ul className={styles.lista}>
          {reviews.map((review) => (
            <li key={review.bib_id} className={styles.card}>
              <div className={styles.cabecalho}>
                <div className={styles.avatarWrapper}>
                  {review.usuario?.usr_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className={styles.avatar}
                      src={review.usuario.usr_avatar_url}
                      alt={review.usuario?.usr_nome_usuario || "Usuário"}
                    />
                  ) : (
                    <span className={styles.avatarPlaceholder}>
                      {iniciais(review.usuario?.usr_nome_usuario)}
                    </span>
                  )}
                </div>

                <div className={styles.identificacao}>
                  <span className={styles.nomeUsuario}>
                    {review.usuario?.usr_nome_usuario || "Usuário"}
                  </span>
                  {formatarData(review.bib_updated_at) && (
                    <span className={styles.data}>
                      {formatarData(review.bib_updated_at)}
                    </span>
                  )}
                </div>

                {review.bib_usr_nota != null && (
                  <span className={styles.nota}>
                    {review.bib_usr_nota}/10 <span className={styles.estrela}>★</span>
                  </span>
                )}
              </div>

              {review.bib_usr_avaliacao && (
                <p className={styles.texto}>{review.bib_usr_avaliacao}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
