/**
 * @fileoverview Edição do perfil (/perfil/editar) — RF016.
 *
 * Um único formulário com dois cartões: dados pessoais (PATCH /auth/me) e troca
 * de senha (PATCH /auth/me/senha). A senha é opcional: se os três campos ficam
 * em branco, só os dados pessoais são salvos.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CampoPerfil } from "@/components/CampoPerfil";
import { Header } from "@/components/Header";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { changePassword, mensagemErro } from "@/lib/api";
import {
  SENHA_MAXIMA,
  montarAlteracoes,
  validarDadosPessoais,
  validarNovaSenha,
} from "@/lib/perfil";
import compartilhado from "../../styles/perfil.module.css";
import styles from "./page.module.css";

/** Texto de dica dos campos de senha. */
const DICA = "Digite:";

/**
 * Formulário completo de edição. Começa com os dados atuais do usuário.
 * Ao enviar, valida tudo antes de chamar o back-end; troca a senha primeiro
 * (é o passo que mais falha, por causa da senha atual) e depois salva os dados.
 *
 * @param {object} props
 * @param {object} props.usuario Usuário logado (campos usr_*).
 * @param {string} props.token Token do usuário logado.
 * @param {function(object): Promise<object>} props.onSalvarDados Envia as
 * alterações dos dados pessoais.
 * @param {function(): void} props.onConcluir Chamada depois de salvar tudo.
 * @returns {JSX.Element}
 */
function EditarPerfilForm({ usuario, token, onSalvarDados, onConcluir }) {
  const [dados, setDados] = useState({
    nomeCompleto: usuario.usr_nome_completo,
    nomeUsuario: usuario.usr_nome_usuario,
    email: usuario.usr_email,
  });
  const [senhas, setSenhas] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmacao: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleDados = (campo) => (e) =>
    setDados((prev) => ({ ...prev, [campo]: e.target.value }));
  const handleSenhas = (campo) => (e) =>
    setSenhas((prev) => ({ ...prev, [campo]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    const problemaDados = validarDadosPessoais(dados);
    if (problemaDados) {
      setErro(problemaDados);
      return;
    }

    // Senha é opcional: tudo em branco significa "não quero trocar".
    const quererTrocarSenha = Object.values(senhas).some((v) => v !== "");
    if (quererTrocarSenha) {
      const problemaSenha = validarNovaSenha(senhas);
      if (problemaSenha) {
        setErro(problemaSenha);
        return;
      }
    }

    const alteracoes = montarAlteracoes(usuario, dados);

    setSalvando(true);
    try {
      if (quererTrocarSenha) {
        await changePassword(token, {
          senhaAtual: senhas.senhaAtual,
          novaSenha: senhas.novaSenha,
        });
      }
      if (Object.keys(alteracoes).length > 0) {
        await onSalvarDados(alteracoes);
      }
      onConcluir();
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível salvar as alterações."));
      setSalvando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={handleSubmit}>
      <section className={compartilhado.cartao}>
        <h2 className={compartilhado.titulo}>Dados Pessoais</h2>

        <div className={compartilhado.campos}>
          <CampoPerfil
            id="nome-completo"
            label="Nome Completo:"
            value={dados.nomeCompleto}
            onChange={handleDados("nomeCompleto")}
            autoComplete="name"
            maxLength={80}
          />
          <CampoPerfil
            id="nome-usuario"
            label="Nome de Usuário:"
            value={dados.nomeUsuario}
            onChange={handleDados("nomeUsuario")}
            autoComplete="username"
            maxLength={80}
          />
          <CampoPerfil
            id="email"
            label="E-mail:"
            type="email"
            value={dados.email}
            onChange={handleDados("email")}
            autoComplete="email"
            maxLength={80}
          />
        </div>
      </section>

      <section className={compartilhado.cartao}>
        <h2 className={compartilhado.titulo}>Alterar senha</h2>
        <p className={styles.nota}>
          Deixe em branco se não quiser alterar sua senha.
        </p>

        <div className={compartilhado.campos}>
          <CampoPerfil
            id="senha-atual"
            label="Senha atual:"
            type="password"
            value={senhas.senhaAtual}
            onChange={handleSenhas("senhaAtual")}
            autoComplete="current-password"
            maxLength={SENHA_MAXIMA}
            placeholder={DICA}
          />
          <CampoPerfil
            id="nova-senha"
            label="Nova senha:"
            type="password"
            value={senhas.novaSenha}
            onChange={handleSenhas("novaSenha")}
            autoComplete="new-password"
            maxLength={SENHA_MAXIMA}
            placeholder={DICA}
          />
          <CampoPerfil
            id="confirmacao"
            label="Confirmar nova senha:"
            type="password"
            value={senhas.confirmacao}
            onChange={handleSenhas("confirmacao")}
            autoComplete="new-password"
            maxLength={SENHA_MAXIMA}
            placeholder={DICA}
          />
        </div>

        <p className={styles.requisito}>
          Mínimo de 8 caracteres e pelo menos 1 número
        </p>
      </section>

      {erro && (
        <p role="alert" className={compartilhado.erro}>
          {erro}
        </p>
      )}

      <div className={styles.acoesPagina}>
        <NavLink href="/perfil" className={compartilhado.botaoSecundario}>
          CANCELAR
        </NavLink>
        <button
          type="submit"
          className={compartilhado.botao}
          disabled={salvando}
        >
          {salvando ? "SALVANDO..." : "EDITAR"}
        </button>
      </div>
    </form>
  );
}

/**
 * Página de edição do perfil. É uma rota protegida: sem sessão, redireciona
 * para o login.
 *
 * @returns {JSX.Element|null}
 */
export default function EditarPerfilPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, atualizarPerfil } = useAuth();

  // Rota protegida: sem sessão, manda o usuário para o login.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className={compartilhado.pagina}>
      <Header />

      <main className={styles.conteudo}>
        <nav className={styles.caminho} aria-label="Você está em">
          <NavLink href="/perfil" className={styles.caminhoLink}>
            Perfil
          </NavLink>
          <span aria-hidden="true"> / </span>
          <strong aria-current="page">Editar Informações</strong>
        </nav>

        <EditarPerfilForm
          usuario={user}
          token={token}
          onSalvarDados={atualizarPerfil}
          onConcluir={() => router.push("/perfil")}
        />
      </main>
    </div>
  );
}
