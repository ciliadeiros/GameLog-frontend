import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import LoginPage from "@/app/login/page";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));

let login;
let push;

beforeEach(() => {
  login = vi.fn().mockResolvedValue({ usr_nome_usuario: "ana" });
  push = vi.fn();
  useAuth.mockReturnValue({ login });
  useRouter.mockReturnValue({ push });
});

describe("Tela de login", () => {
  it("renderiza os campos e o botão de entrada", () => {
    render(<LoginPage />);
    expect(screen.getByRole("textbox", { name: "E-mail:" })).toBeInTheDocument();
    expect(screen.getByLabelText("Senha:")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "FAZER LOG IN" })).toBeInTheDocument();
  });

  it("envia e-mail e senha ao AuthContext e navega após login", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByRole("textbox", { name: "E-mail:" }), { target: { value: "ana@exemplo.com" } });
    fireEvent.change(screen.getByLabelText("Senha:"), { target: { value: "senha123" } });
    fireEvent.click(screen.getByRole("button", { name: "FAZER LOG IN" }));
    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: "ana@exemplo.com", senha: "senha123" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("mostra o erro retornado pela API sem redirecionar", async () => {
    login.mockRejectedValueOnce(new ApiError("E-mail ou senha inválidos", 401));
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "FAZER LOG IN" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos");
    expect(push).not.toHaveBeenCalled();
  });
});
