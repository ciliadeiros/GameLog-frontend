import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReviewsJogo } from "@/components/ReviewsJogo";

describe("Componente ReviewsJogo", () => {
  it("exibe a mensagem de carregamento", () => {
    render(<ReviewsJogo loading />);
    expect(screen.getByText("Carregando reviews...")).toBeInTheDocument();
  });

  it("exibe a mensagem de erro recebida", () => {
    render(<ReviewsJogo erro="Não foi possível carregar reviews" />);
    expect(screen.getByText("Não foi possível carregar reviews")).toBeInTheDocument();
  });

  it("orienta o usuário quando o jogo ainda não tem reviews", () => {
    render(<ReviewsJogo reviews={[]} />);
    expect(screen.getByText(/ainda não tem reviews/i)).toBeInTheDocument();
  });

  it("lista o autor, a avaliação e a nota", () => {
    render(
      <ReviewsJogo
        reviews={[
          {
            bib_id: 42,
            bib_usr_nota: 9,
            bib_usr_avaliacao: "Jogo excelente!",
            usuario: { usr_nome_usuario: "ana" },
          },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Reviews (1)" })).toBeInTheDocument();
    expect(screen.getByText("ana")).toBeInTheDocument();
    expect(screen.getByText(/9\/10/)).toBeInTheDocument();
    expect(screen.getByText("Jogo excelente!")).toBeInTheDocument();
  });

  it("usa um nome alternativo quando os dados do usuário não vêm da API", () => {
    render(<ReviewsJogo reviews={[{ bib_id: 1, bib_usr_avaliacao: "Legal" }]} />);
    expect(screen.getByText("Usuário")).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
