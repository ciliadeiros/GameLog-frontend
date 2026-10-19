/** @fileoverview Lista de reviews públicas de um jogo (RF013). */

"use client";

import styles from "./ReviewsJogo.module.css";

/**
 * Converte uma data ISO para o formato brasileiro (dd/mm/aaaa).
 *
 * @param {string} [iso] Data em formato ISO.
 * @returns {string|null} Data formatada, ou null se estiver vazia ou inválida.
 */
function formatarData(iso) {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleDateString("pt-BR");
}

/**
 * Primeira letra do nome, em maiúscula, usada no avatar de quem não tem foto.
 *
 * @param {string} [nome] Nome do usuário.
 * @returns {string} A letra, ou "?" se não houver nome.
 */
function iniciais(nome) {
  if (!nome) return "?";
  return nome.trim().charAt(0).toUpperCase();
}

/**
 * Reviews dos outros usuários para o jogo, exibidas no fim da página de detalhes.
 * É só leitura: quem quiser avaliar faz isso pela Biblioteca.
 *
 * As reviews chegam por prop porque a página de detalhes já precisa delas para
 * calcular a nota do GameLog, então elas são buscadas uma vez só.
 *
 * @param {object} props
 * @param {object[]} [props.reviews=[]] Reviews já carregadas.
 * @param {boolean} [props.loading=false] true enquanto a página ainda busca.
 * @param {string|null} [props.erro=null] Mensagem de erro, se a busca falhou.
 * @returns {JSX.Element}
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
          Esse jogo ainda não tem reviews. Adicione-o à sua biblioteca pra ser o
          primeiro a avaliar.
        </p>
      )}

      {!loading && !erro && reviews.length > 0 && (
        <ul className={styles.lista}>
          {reviews.map((review) => (
            <li key={review.bib_id} className={styles.card}>
              <div className={styles.cabecalho}>
                <div className={styles.avatarWrapper}>
                  {review.usuario?.usr_avatar_url ? (
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
                    {review.bib_usr_nota}/10{" "}
                    <span className={styles.estrela}>★</span>
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
