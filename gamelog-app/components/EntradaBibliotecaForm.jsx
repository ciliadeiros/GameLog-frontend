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
 * Status + nota (RF010) + review (RF011) + horas jogadas (RF012) de
 * UMA entrada da biblioteca, num formulário só. Usado nos cards de
 * app/biblioteca e na página de detalhes do jogo (quando o jogo já
 * está na biblioteca) — por isso o visual é "auto-contido" (fundo
 * claro próprio) em vez de herdar cor de texto da página: uma dessas
 * duas telas é clara e a outra é escura, e um componente só não dava
 * pra acertar as duas herdando variável de tema.
 *
 * Props:
 * - token: token do usuário logado
 * - entrada: a entrada da biblioteca (LibraryDetailResponse)
 * - onAtualizada(novaEntrada): chamado depois de qualquer alteração salva
 * - onRemovida(): chamado depois de remover da biblioteca
 */
export function EntradaBibliotecaForm({ token, entrada, onAtualizada, onRemovida }) {
  const [nota, setNota] = useState(entrada.bib_usr_nota ?? "");
  const [avaliacao, setAvaliacao] = useState(entrada.bib_usr_avaliacao ?? "");
  const [horas, setHoras] = useState(entrada.bib_jgs_horas_jogadas ?? 0);

  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState(null);

  async function handleStatusChange(novoStatus) {
    setErro(null);
    try {
      const atualizada = await updateLibraryEntry(token, entrada.bib_id, {
        bib_status: novoStatus,
      });
      onAtualizada(atualizada);
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível atualizar o status."));
    }
  }

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
      <label className={styles.label}>
        Status
        <select
          className={styles.select}
          value={entrada.bib_status}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          {Object.entries(STATUS_LABEL).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
      </label>

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
