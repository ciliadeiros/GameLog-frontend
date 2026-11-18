/**
 * @fileoverview Perfil do usuário (/perfil) — RF015 e RF016.
 *
 * Mostra a foto, o resumo da biblioteca e os dados pessoais. Daqui o usuário
 * troca a foto, vai para a edição das informações ou sai da conta.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { CampoPerfil } from "@/components/CampoPerfil";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { listLibrary, mensagemErro } from "@/lib/api";
import {
  anoDeCadastro,
  calcularEstatisticas,
  validarUrlFoto,
} from "@/lib/perfil";
import compartilhado from "../styles/perfil.module.css";
import styles from "./page.module.css";

/**
 * Formulário do modal "Trocar foto". O back-end guarda o endereço (URL) da
 * imagem, então a pessoa cola o link da foto que quer usar.
 *
 * @param {object} props
 * @param {string|null} props.urlAtual Foto atual do usuário (ou null).
 * @param {function(string|null): Promise<void>} props.onSalvar Recebe a nova
 * URL (ou null para remover a foto) e envia ao back-end.
 * @param {function(): void} props.onFechar Fecha o modal.
 * @returns {JSX.Element}
 */
function TrocarFotoForm({ urlAtual, onSalvar, onFechar }) {
  const [url, setUrl] = useState(urlAtual ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  /** Salva a URL digitada, ou remove a foto quando `remover` é true. */
  async function enviar(remover) {
    const novaUrl = remover ? null : url.trim();

    if (!remover) {
      const problema = validarUrlFoto(url);
      if (problema) {
        setErro(problema);
        return;
      }
    }

    setSalvando(true);
    setErro(null);
    try {
      await onSalvar(novaUrl);
      onFechar();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível salvar a foto."));
      setSalvando(false);
    }
  }

  return (
    <form
      className={styles.formFoto}
      onSubmit={(e) => {
        e.preventDefault();
        enviar(false);
      }}
    >
      <label htmlFor="foto-url" className={styles.formFotoRotulo}>
        Endereço (URL) da imagem
      </label>
      <input
        id="foto-url"
        type="url"
        className={styles.formFotoCampo}
        placeholder="https://..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      {erro && (
        <p role="alert" className={compartilhado.erro}>
          {erro}
        </p>
      )}

      <div className={styles.formFotoAcoes}>
        {urlAtual && (
          <button
            type="button"
            className={compartilhado.botaoSecundario}
            disabled={salvando}
            onClick={() => enviar(true)}
          >
            REMOVER
          </button>
        )}
        <button
          type="submit"
          className={compartilhado.botao}
          disabled={salvando}
        >
          {salvando ? "SALVANDO..." : "SALVAR"}
        </button>
      </div>
    </form>
  );
}

/**
 * Página de perfil. É uma rota protegida: sem sessão, redireciona para o login.
 *
 * Os números do card (jogos na biblioteca, concluídos e em andamento) são
 * calculados em cima de GET /library/, que já devolve o status de cada jogo.
 *
 * @returns {JSX.Element|null}
 */
export default function PerfilPage() {
  const router = useRouter();
  const {
    user,
    token,
    loading: authLoading,
    logout,
    atualizarPerfil,
  } = useAuth();

  const [entradas, setEntradas] = useState(null);
  const [erroBiblioteca, setErroBiblioteca] = useState(null);
  const [modalFoto, setModalFoto] = useState(false);

  // Rota protegida: sem sessão, manda o usuário para o login.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!token) return;

    listLibrary(token)
      .then(setEntradas)
      .catch((err) =>
        setErroBiblioteca(
          mensagemErro(
            err,
            "Não foi possível carregar o resumo da biblioteca.",
          ),
        ),
      );
  }, [token]);

  const estatisticas = useMemo(
    () => (entradas ? calcularEstatisticas(entradas) : null),
    [entradas],
  );

  function handleSair() {
    logout();
    router.push("/login");
  }

  if (authLoading || !user) {
    return null;
  }

  // Enquanto a biblioteca carrega (ou se der erro), os números ficam como "—".
  const numero = (valor) => (estatisticas ? valor : "—");

  return (
    <div className={compartilhado.pagina}>
      <Header />

      <main className={styles.conteudo}>
        <aside className={`${compartilhado.cartao} ${styles.lateral}`}>
          <Avatar url={user.usr_avatar_url} className={styles.avatar} />

          <h1 className={styles.nome}>{user.usr_nome_completo}</h1>
          <p className={styles.usuario}>@{user.usr_nome_usuario}</p>

          <button
            type="button"
            className={styles.trocarFoto}
            onClick={() => setModalFoto(true)}
          >
            TROCAR FOTO
          </button>

          <dl className={styles.estatisticas}>
            <div className={styles.linha}>
              <dt>Jogos na Biblioteca</dt>
              <dd>{numero(estatisticas?.total)}</dd>
            </div>
            <div className={styles.linha}>
              <dt>Jogos Concluídos</dt>
              <dd>{numero(estatisticas?.finalizados)}</dd>
            </div>
            <div className={styles.linha}>
              <dt>Jogos em Andamento</dt>
              <dd>{numero(estatisticas?.jogando)}</dd>
            </div>
            <div className={styles.linha}>
              <dt>Membro desde</dt>
              <dd>{anoDeCadastro(user.usr_created_at)}</dd>
            </div>
          </dl>

          {erroBiblioteca && (
            <p role="alert" className={compartilhado.erro}>
              {erroBiblioteca}
            </p>
          )}

          <button type="button" className={styles.sair} onClick={handleSair}>
            SAIR DA CONTA
          </button>
        </aside>

        <section className={compartilhado.cartao}>
          <h2 className={compartilhado.titulo}>Dados Pessoais</h2>

          <div className={compartilhado.campos}>
            <CampoPerfil
              id="nome-completo"
              label="Nome Completo:"
              value={user.usr_nome_completo}
              readOnly
            />
            <CampoPerfil
              id="nome-usuario"
              label="Nome de Usuário:"
              value={user.usr_nome_usuario}
              readOnly
            />
            <CampoPerfil
              id="email"
              label="E-mail:"
              value={user.usr_email}
              readOnly
            />
          </div>

          <div className={compartilhado.acoes}>
            <NavLink href="/perfil/editar" className={compartilhado.botao}>
              EDITAR
            </NavLink>
          </div>
        </section>
      </main>

      {modalFoto && (
        <Modal titulo="Trocar foto" onFechar={() => setModalFoto(false)}>
          <TrocarFotoForm
            urlAtual={user.usr_avatar_url}
            onSalvar={(url) => atualizarPerfil({ usr_avatar_url: url })}
            onFechar={() => setModalFoto(false)}
          />
        </Modal>
      )}
    </div>
  );
}
