import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Modal } from "@/components/Modal";

describe("Componente Modal", () => {
  it("exibe o título e o conteúdo recebido", () => {
    render(
      <Modal titulo="Editar jogo" onFechar={() => {}}>
        <p>Nota e review</p>
      </Modal>,
    );
    expect(screen.getByRole("heading", { name: "Editar jogo" })).toBeInTheDocument();
    expect(screen.getByText("Nota e review")).toBeInTheDocument();
  });

  it("fecha ao clicar no botão Fechar", () => {
    const onFechar = vi.fn();
    render(<Modal titulo="Teste" onFechar={onFechar}>Conteúdo</Modal>);
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onFechar).toHaveBeenCalledOnce();
  });

  it("fecha ao apertar Escape", () => {
    const onFechar = vi.fn();
    render(<Modal titulo="Teste" onFechar={onFechar}>Conteúdo</Modal>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onFechar).toHaveBeenCalledOnce();
  });

  it("não fecha ao clicar no conteúdo, mas fecha ao clicar fora", () => {
    const onFechar = vi.fn();
    const { container } = render(
      <Modal titulo="Teste" onFechar={onFechar}><span>Dentro</span></Modal>,
    );
    fireEvent.click(screen.getByText("Dentro"));
    expect(onFechar).not.toHaveBeenCalled();
    // A camada de fundo é a primeira div criada pelo Modal.
    fireEvent.click(container.firstChild);
    expect(onFechar).toHaveBeenCalledOnce();
  });
});
