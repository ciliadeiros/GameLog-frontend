import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError, removeFromLibrary, updateLibraryEntry } from "@/lib/api";
import { EntradaBibliotecaForm, STATUS_LABEL } from "@/components/EntradaBibliotecaForm";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal()),
  updateLibraryEntry: vi.fn(),
  removeFromLibrary: vi.fn(),
}));

const entrada = {
  bib_id: 23,
  bib_usr_nota: 7,
  bib_usr_avaliacao: "Bom jogo",
  bib_jgs_horas_jogadas: 5,
};

function preparar() {
  const onAtualizada = vi.fn();
  const onRemovida = vi.fn();
  render(
    <EntradaBibliotecaForm
      token="jwt-teste"
      entrada={entrada}
      onAtualizada={onAtualizada}
      onRemovida={onRemovida}
    />,
  );
  return { onAtualizada, onRemovida };
}

describe("Edição da biblioteca pessoal", () => {
  beforeEach(() => {
    updateLibraryEntry.mockResolvedValue({ ...entrada, bib_usr_nota: 10 });
    removeFromLibrary.mockResolvedValue(null);
  });

  it("mantém os status oficiais de biblioteca", () => {
    expect(STATUS_LABEL).toEqual({
      planejado: "Quero jogar",
      jogando: "Jogando",
      finalizado: "Finalizado",
      abandonado: "Abandonado",
    });
  });

  it("preenche os campos com os dados da entrada selecionada", () => {
    preparar();
    expect(screen.getByRole("spinbutton", { name: "Sua nota (0 a 10)" })).toHaveValue(7);
    expect(screen.getByRole("textbox", { name: "Sua review" })).toHaveValue("Bom jogo");
    expect(screen.getByRole("spinbutton", { name: "Horas jogadas" })).toHaveValue(5);
  });

  it("salva a nota, review sem espaços nas pontas e horas como números", async () => {
    const { onAtualizada } = preparar();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Sua nota (0 a 10)" }), { target: { value: "10" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Sua review" }), { target: { value: "  Muito bom  " } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Horas jogadas" }), { target: { value: "35" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar avaliação" }));

    await waitFor(() => expect(updateLibraryEntry).toHaveBeenCalledWith("jwt-teste", 23, {
      bib_usr_nota: 10,
      bib_usr_avaliacao: "Muito bom",
      bib_jgs_horas_jogadas: 35,
    }));
    expect(onAtualizada).toHaveBeenCalledWith({ ...entrada, bib_usr_nota: 10 });
  });

  it("converte nota e review vazias para null e horas vazias para zero", async () => {
    preparar();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Sua nota (0 a 10)" }), { target: { value: "" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Sua review" }), { target: { value: "  " } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Horas jogadas" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar avaliação" }));
    await waitFor(() => expect(updateLibraryEntry).toHaveBeenCalledWith("jwt-teste", 23, {
      bib_usr_nota: null,
      bib_usr_avaliacao: null,
      bib_jgs_horas_jogadas: 0,
    }));
  });

  it("remove o jogo da biblioteca e avisa ao componente pai", async () => {
    const { onRemovida } = preparar();
    fireEvent.click(screen.getByRole("button", { name: "Remover da biblioteca" }));
    await waitFor(() => expect(removeFromLibrary).toHaveBeenCalledWith("jwt-teste", 23));
    expect(onRemovida).toHaveBeenCalledOnce();
  });

  it("exibe mensagem da API quando não consegue salvar", async () => {
    updateLibraryEntry.mockRejectedValueOnce(new ApiError("Nota inválida", 422));
    preparar();
    fireEvent.click(screen.getByRole("button", { name: "Salvar avaliação" }));
    expect(await screen.findByText("Nota inválida")).toBeInTheDocument();
  });

  it("exibe mensagem padrão quando a remoção falha", async () => {
    removeFromLibrary.mockRejectedValueOnce(new Error("Falha de rede"));
    preparar();
    fireEvent.click(screen.getByRole("button", { name: "Remover da biblioteca" }));
    expect(await screen.findByText("Não foi possível remover da biblioteca.")).toBeInTheDocument();
  });
});
