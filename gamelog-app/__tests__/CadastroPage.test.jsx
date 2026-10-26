import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import CadastroPage from "@/app/cadastro/page";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));

let register;
let push;

function preencherCadastro() {
  fireEvent.change(screen.getByRole("textbox", { name: "Nome Completo:" }), { target: { value: "Ana Silva" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Nome de Usuário:" }), { target: { value: "ana" } });
  fireEvent.change(screen.getByRole("textbox", { name: "E-mail:" }), { target: { value: "ana@exemplo.com" } });
  fireEvent.change(screen.getByLabelText("Senha:"), { target: { value: "senha123" } });
}

beforeEach(() => {
  register = vi.fn().mockResolvedValue({});
  push = vi.fn();
  useAuth.mockReturnValue({ register });
  useRouter.mockReturnValue({ push });
});

describe("Tela de cadastro", () => {
  it("renderiza os campos obrigatórios com senha de no mínimo 6 caracteres", () => {
    render(<CadastroPage />);
    expect(screen.getByRole("heading", { name: "CADASTRE-SE" })).toBeInTheDocument();
    expect(screen.getByLabelText("Senha:")).toHaveAttribute("minlength", "6");
    expect(screen.getByRole("textbox", { name: "E-mail:" })).toBeRequired();
  });

  it("envia os quatro campos para o contexto de autenticação", async () => {
    render(<CadastroPage />);
    preencherCadastro();
    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));
    await waitFor(() => expect(register).toHaveBeenCalledWith({
      nomeCompleto: "Ana Silva",
      nomeUsuario: "ana",
      email: "ana@exemplo.com",
      senha: "senha123",
    }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("exibe o erro da API sem redirecionar", async () => {
    register.mockRejectedValueOnce(new ApiError("E-mail já cadastrado", 409));
    render(<CadastroPage />);
    preencherCadastro();
    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail já cadastrado");
    expect(push).not.toHaveBeenCalled();
  });
});
