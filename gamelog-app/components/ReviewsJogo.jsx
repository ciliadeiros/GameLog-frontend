"use client";

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
 * Biblioteca (RF010-012).
 *
 * As reviews agora vêm por prop (buscadas uma única vez em
 * app/jogo/[id]/page.jsx, via GET /games/rawg/{rawgId}/reviews) em vez
 * de cada componente buscar sozinho — a própria página já precisa
 * dessa mesma lista pra calcular a nota do GameLog (média em estrelas)
 * mostrada ao lado da imagem, então evitamos duas chamadas iguais.
 *
 * Props:
 * - reviews: array de reviews (já carregado)
 * - loading: true enquanto a página ainda está buscando
 * - erro: mensagem de erro, se a busca falhou
 */
export function ReviewsJogo({ reviews = [], loading = false, erro = null }) {
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
