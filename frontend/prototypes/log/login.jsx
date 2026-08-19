import React, { useState } from "react";
import "./LoginPage.css";

/**
 * Tela de Login
 * Estrutura:
 * login de usu (frame)
 *  ├─ logo (componente)
 *  └─ content (agrupamento)
 *      ├─ titulo
 *      ├─ input1 (E-mail)
 *      ├─ input2 (Senha)
 *      ├─ BOTAO DE CADASTRAR (componente) → "FAZER LOG IN"
 *      └─ link → leva à página de cadastro
 */

function Logo() {
  return (
    <div className="logo">
      <span className="logo__game">GAME</span>
      <span className="logo__log">LOG</span>
    </div>
  );
}

function FormInput({ id, label, type = "text", value, onChange }) {
  return (
    <div className="input-group">
      <label className="input-group__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        className="input-group__field"
        placeholder="Digite:"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    senha: "",
  });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // integrar com a API GameLog aqui
    console.log("login:", form);
  };

  return (
    <div className="login-page">
      <div className="login-page__bg" aria-hidden="true" />
      <div className="login-page__overlay" aria-hidden="true" />

      <Logo />

      <div className="content">
        <h1 className="titulo">LOG IN</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <FormInput
            id="email"
            label="E-mail:"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
          />
          <FormInput
            id="senha"
            label="Senha:"
            type="password"
            value={form.senha}
            onChange={handleChange("senha")}
          />

          <button type="submit" className="botao-login">FAZER LOG IN</button>
        </form>

        <a href="/cadastro" className="link-cadastro">Não possui uma conta? Clique aqui e faça seu cadastro!</a>
      </div>
    </div>
  );
}
