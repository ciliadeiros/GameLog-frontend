/** @fileoverview Tela de cadastro (/cadastro) — RF001. */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { BotaoAuth } from "@/components/BotaoAuth";
import { useAuth } from "@/context/AuthContext";
import { mensagemErro } from "@/lib/api";

import styles from "./page.module.css";

/**
 * Tela de cadastro. Cria a conta e já deixa o usuário logado, voltando para a
 * página inicial.
 *
 * @returns {JSX.Element}
 */
export default function CadastroPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    nome: "",
    usuario: "",
    email: "",
    senha: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await register({
        nomeCompleto: form.nome,
        nomeUsuario: form.usuario,
        email: form.email,
        senha: form.senha,
      });

      router.push("/");
    } catch (err) {
      setError(mensagemErro(err, "Não foi possível concluir o cadastro."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["cadastro-de-usu"]}>
      <img
        className={styles["img-game-catalog"]}
        alt=""
        src="/images/fundo.png"
      />

      <form className={styles["cadastro-form"]} onSubmit={handleSubmit}>
        <h1 className={styles["cadastro-titulo"]}>CADASTRE-SE</h1>

        <div className={styles["form-group"]}>
          <label className={styles["form-label"]} htmlFor="nome">
            Nome Completo:
          </label>

          <div className={styles["field-wrapper"]}>
            <input
              id="nome"
              name="nome"
              type="text"
              className={styles.field}
              placeholder="Digite:"
              value={form.nome}
              onChange={handleChange("nome")}
              required
            />
          </div>
        </div>

        <div className={styles["form-group"]}>
          <label className={styles["form-label"]} htmlFor="usuario">
            Nome de Usuário:
          </label>

          <div className={styles["field-wrapper"]}>
            <input
              id="usuario"
              name="usuario"
              type="text"
              className={styles.field}
              placeholder="Digite:"
              value={form.usuario}
              onChange={handleChange("usuario")}
              required
            />
          </div>
        </div>

        <div className={styles["form-group"]}>
          <label className={styles["form-label"]} htmlFor="email">
            E-mail:
          </label>

          <div className={styles["field-wrapper"]}>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.field}
              placeholder="Digite:"
              value={form.email}
              onChange={handleChange("email")}
              required
            />
          </div>
        </div>

        <div className={styles["form-group"]}>
          <label className={styles["form-label"]} htmlFor="senha">
            Senha:
          </label>

          <div className={styles["field-wrapper"]}>
            <input
              id="senha"
              name="senha"
              type="password"
              className={styles.field}
              placeholder="Digite:"
              value={form.senha}
              onChange={handleChange("senha")}
              required
              minLength={8}
              maxLength={72}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className={styles.erro}>
            {error}
          </p>
        )}

        <BotaoAuth
          type="submit"
          disabled={loading}
          className={styles["botao-cadastrar"]}
          text={loading ? "Enviando..." : "CADASTRAR"}
        />

        <a href="/login" className={styles.link}>
          Já possui cadastro? Clique aqui e faça log in!
        </a>
      </form>

      <img
        className={styles["logo-instance"]}
        alt="GameLog"
        src="/images/logo.png"
      />
    </div>
  );
}
