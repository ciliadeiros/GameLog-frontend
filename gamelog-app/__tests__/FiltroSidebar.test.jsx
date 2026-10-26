import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import {
  CampoTextoFiltro,
  FiltroSidebar,
  OpcaoFiltroCheckbox,
  useConjuntoFiltro,
} from "@/components/FiltroSidebar";

const categorias = [
  { chave: "generos", label: "Gêneros", render: () => <p>Ação</p> },
  { chave: "nota", label: "Nota", render: () => <p>9 ou mais</p> },
];

describe("Barra lateral de filtros", () => {
  it("mantém os painéis fechados inicialmente", () => {
    render(<FiltroSidebar categorias={categorias} filtrosAtivos={false} onLimparFiltros={() => {}} />);
    expect(screen.getByText("FILTRAR POR:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gêneros" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Ação")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
  });

  it("abre um acordeão por vez e fecha ao clicar de novo", () => {
    render(<FiltroSidebar categorias={categorias} filtrosAtivos={false} onLimparFiltros={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Gêneros" }));
    expect(screen.getByText("Ação")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nota" }));
    expect(screen.queryByText("Ação")).not.toBeInTheDocument();
    expect(screen.getByText("9 ou mais")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nota" }));
    expect(screen.queryByText("9 ou mais")).not.toBeInTheDocument();
  });

  it("permite limpar quando há filtros ativos", () => {
    const onLimparFiltros = vi.fn();
    render(<FiltroSidebar categorias={categorias} filtrosAtivos onLimparFiltros={onLimparFiltros} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onLimparFiltros).toHaveBeenCalledOnce();
  });

  it("encaminha a seleção de um checkbox e props do campo de texto", () => {
    const onChange = vi.fn();
    render(
      <>
        <OpcaoFiltroCheckbox label="Aventura" checked={false} onChange={onChange} />
        <CampoTextoFiltro placeholder="Buscar um título" />
      </>,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Aventura" }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByPlaceholderText("Buscar um título")).toHaveAttribute("type", "text");
  });
});

describe("Hook useConjuntoFiltro", () => {
  it("marca, desmarca e limpa múltiplas opções", () => {
    const { result } = renderHook(() => useConjuntoFiltro(["rpg"]));
    expect([...result.current[0]]).toEqual(["rpg"]);

    act(() => result.current[1]("acao"));
    expect([...result.current[0]]).toEqual(["rpg", "acao"]);

    act(() => result.current[1]("rpg"));
    expect([...result.current[0]]).toEqual(["acao"]);

    act(() => result.current[2]());
    expect(result.current[0].size).toBe(0);
  });
});
