/** @fileoverview Cabeçalho das páginas internas (logo, navegação e perfil). */

"use client";

import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import styles from "./Header.module.css";

/**
 * Cabeçalho com a logo, os links de Catálogo e Biblioteca e o atalho de perfil.
 *
 * AVISO: o botão de configurações ainda não tem ação.
 *
 * @param {object} props
 * @param {"catalogo"|"biblioteca"|"pesquisa"} props.active Link que fica
 * destacado como a página atual.
 * @returns {JSX.Element}
 */
export function Header({ active }) {
  const { user } = useAuth();

  return (
    <header className={styles.topo}>
      <NavLink
        href="/catalogo"
        className={styles.logoLink}
        aria-label="Ir para o catálogo"
      >
        <Logo className={styles.logo} />
      </NavLink>

      <nav className={styles.nav}>
        <NavLink
          href="/catalogo"
          className={
            active === "catalogo" ? styles.navLinkAtivo : styles.navLink
          }
        >
          Catálogo
        </NavLink>
        <NavLink
          href="/biblioteca"
          className={
            active === "biblioteca" ? styles.navLinkAtivo : styles.navLink
          }
        >
          Biblioteca
        </NavLink>
      </nav>

      <NavLink href={user ? "/perfil" : "/login"} className={styles.perfil}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>Perfil</span>
      </NavLink>
    </header>
  );
}
