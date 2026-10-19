/**
 * @fileoverview Formulário de nota, review e horas jogadas de uma entrada da
 * biblioteca (RF010, RF011 e RF012). Também guarda os rótulos de status, que
 * são usados em mais de uma tela.
 */

"use client";

import { useState } from "react";
import { mensagemErro, removeFromLibrary, updateLibraryEntry } from "@/lib/api";
import styles from "./EntradaBibliotecaForm.module.css";

/**
 * Texto exibido para cada status possível de um jogo na biblioteca (RF008).
 * A chave é o valor salvo no back-end.
 */
export const STATUS_LABEL = {
  planejado: "Quero jogar",
  jogando: "Jogando",
  finalizado: "Finalizado",
  abandonado: "Abandonado",
};

/**
 * Formulário de uma entrada da biblioteca. O status não é editado aqui (ele muda
 * direto pela badge do card). Este formulário é o conteúdo do modal que abre ao
 * clicar no card.
 *
 * @param {object} props
 * @param {string} props.token Token do usuário logado.
 * @param {object} props.entrada Entrada da biblioteca que está sendo editada.
 * @param {function(object): void} props.onAtualizada Chamada depois de salvar,
 * com a entrada atualizada.
 * @param {function(): void} props.onRemovida Chamada depois de remover da
 * biblioteca.
 * @returns {JSX.Element}
 */
export function EntradaBibliotecaForm({
  token,
  entrada,
  onAtualizada,
  onRemovida,
}) {
  const [nota, setNota] = useState(entrada.bib_usr_nota ?? "");
  const [avaliacao, setAvaliacao] = useState(entrada.bib_usr_avaliacao ?? "");
  const [horas, setHoras] = useState(entrada.bib_jgs_horas_jogadas ?? 0);

  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState(null);

  /** Envia nota, review e horas para o back-end. */
  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      const atualizada = await updateLibraryEntry(token, entrada.bib_id, {
        bib_usr_nota: nota === "" ? null : Number(nota),
        bib_usr_avaliacao: avaliacao.trim() === "" ? null : avaliacao.trim(),
        bib_jgs_horas_jogadas: horas === "" ? 0 : Number(horas),
      });
      onAtualizada(atualizada);
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível salvar sua avaliação."));
    } finally {
      setSalvando(false);
    }
  }

  /** Remove a entrada da biblioteca. */
  async function handleRemover() {
    setRemovendo(true);
    setErro(null);

    try {
      await removeFromLibrary(token, entrada.bib_id);
      onRemovida();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível remover da biblioteca."));
      setRemovendo(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSalvar}>
        <label className={styles.label}>
          Sua nota (0 a 10)
          <input
            className={styles.inputCurto}
            type="number"
            min="0"
            max="10"
            step="1"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Sua review
          <textarea
            className={styles.textarea}
            maxLength={500}
            rows={3}
            placeholder="O que você achou desse jogo?"
            value={avaliacao}
            onChange={(e) => setAvaliacao(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Horas jogadas
          <input
            className={styles.inputCurto}
            type="number"
            min="0"
            step="1"
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
          />
        </label>

        <div className={styles.acoes}>
          <button
            type="submit"
            className={styles.botaoSalvar}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar avaliação"}
          </button>
          <button
            type="button"
            className={styles.botaoRemover}
            onClick={handleRemover}
            disabled={removendo}
          >
            {removendo ? "Removendo..." : "Remover da biblioteca"}
          </button>
        </div>
      </form>

      {erro && <p className={styles.erro}>{erro}</p>}
    </div>
  );
}
