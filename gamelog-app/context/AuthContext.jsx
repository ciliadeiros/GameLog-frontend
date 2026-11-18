/**
 * @fileoverview Contexto de autenticação.
 *
 * Guarda o token JWT e o usuário logado e oferece login, cadastro e logout para
 * o resto do app.
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getMe, loginUser, registerUser, updateMe } from "@/lib/api";

/** Contexto interno. Quem consome usa o hook useAuth. */
const AuthContext = createContext(null);

/** Chave do localStorage onde o token JWT fica salvo entre as visitas. */
const TOKEN_KEY = "gamelog_token";

/**
 * Provedor de autenticação. Precisa envolver o app inteiro (ver app/layout.jsx).
 *
 * Ao carregar a página, recupera o token salvo e busca o usuário em GET /auth/me.
 * Se o token expirou ou não vale mais, a sessão é descartada.
 *
 * Valor exposto:
 * - token: token JWT, ou null se não há sessão.
 * - user: dados do usuário logado, ou null.
 * - loading: true enquanto a sessão salva ainda está sendo verificada.
 * - login({ email, senha }): faz login e devolve o usuário.
 * - register(dados): cadastra e já faz login em seguida (o back-end não loga
 * sozinho depois do cadastro).
 * - logout(): apaga o token e limpa o usuário.
 * - atualizarPerfil(dados): salva alterações do perfil (PATCH /auth/me) e já
 * atualiza o usuário guardado aqui, então o resto do app vê o dado novo.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const saved = window.localStorage.getItem(TOKEN_KEY);
      if (!saved) return;

      setToken(saved);
      try {
        const me = await getMe(saved);
        setUser(me);
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    }

    restoreSession().finally(() => setLoading(false));
  }, []);

  async function login({ email, senha }) {
    const { access_token } = await loginUser({ email, senha });
    window.localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const me = await getMe(access_token);
    setUser(me);
    return me;
  }

  async function register(dados) {
    await registerUser(dados);

    return login({ email: dados.email, senha: dados.senha });
  }

  async function atualizarPerfil(dados) {
    const atualizado = await updateMe(token, dados);
    setUser(atualizado);
    return atualizado;
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        logout,
        atualizarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Acessa a sessão atual. Só funciona dentro de um <AuthProvider>.
 *
 * @returns {{token: (string|null), user: (object|null), loading: boolean,
 * login: Function, register: Function, logout: Function,
 * atualizarPerfil: Function}}
 * @throws {Error} Se for usado fora do <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
