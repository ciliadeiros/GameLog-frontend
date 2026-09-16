"use client";

import { useState } from "react";
import { ApiError, removeFromLibrary, updateLibraryEntry } from "@/lib/api";
import styles from "./EntradaBibliotecaForm.module.css";

// RF008 — mesmos 4 status do documento de requisitos. Fica aqui (não
// duplicado em cada página) porque tanto app/biblioteca quanto esse
// formulário precisam do mesmo mapa de rótulos.
export const STATUS_LABEL = {
  planejado: "Quero jogar",
  jogando: "Jogando",
  finalizado: "Finalizado",
  abandonado: "Abandonado",
};

function mensagemErro(err, fallback) {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * Nota (RF010) + review (RF011) + horas jogadas (RF012) de UMA entrada
 * da biblioteca. O status NÃO mora aqui — muda direto pela badge
 * colorida do card (é um <select> estilizado pra parecer a badge),
 * já que é a única troca rápida o suficiente pra não precisar abrir
 * nada. Este formulário é o conteúdo do modal que abre ao clicar no
 * card.
 *
 * Props:
 * - token: token do usuário logado
 * - entrada: a entrada da biblioteca (LibraryDetailResponse)
 * - onAtualizada(novaEntrada): chamado depois de salvar
 * - onRemovida(): chamado depois de remover da biblioteca
 */
export function EntradaBibliotecaForm({ token, entrada, onAtualizada, onRemovida }) {
  const [nota, setNota] = useState(entrada.bib_usr_nota ?? "");
  const [avaliacao, setAvaliacao] = useState(entrada.bib_usr_avaliacao ?? "");
  const [horas, setHoras] = useState(entrada.bib_jgs_horas_jogadas ?? 0);

  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState(null);

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
          <button type="submit" className={styles.botaoSalvar} disabled={salvando}>
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
