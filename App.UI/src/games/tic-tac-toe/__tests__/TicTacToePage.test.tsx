import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TicTacToePage from "../TicTacToePage";

function renderPage() {
  return render(
    <MemoryRouter>
      <TicTacToePage />
    </MemoryRouter>,
  );
}

describe("TicTacToePage", () => {
  it("renders controls and board", () => {
    renderPage();
    expect(screen.getByText("Tic-Tac-Toe")).toBeInTheDocument();
    expect(screen.getByLabelText("Who starts")).toBeInTheDocument();
    expect(screen.getByLabelText("Human mark")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start or reset game" }),
    ).toBeInTheDocument();
  });

  it("human starts as X and can place a mark", () => {
    renderPage();
    const cell = screen.getByLabelText("Cell 0,0");
    fireEvent.click(cell);
    expect(cell).toHaveTextContent("X");
  });

  it("bot can start and move immediately", () => {
    renderPage();
    const whoStarts = screen.getByLabelText("Who starts") as HTMLSelectElement;
    fireEvent.change(whoStarts, { target: { value: "O" } });
    const humanMark = screen.getByLabelText("Human mark") as HTMLSelectElement;
    fireEvent.change(humanMark, { target: { value: "X" } });
    // Start/reset to apply new settings
    fireEvent.click(
      screen.getByRole("button", { name: "Start or reset game" }),
    );
    // Bot is O and should have moved
    const anyCellHasO = Array.from({ length: 3 }).some((_, r) =>
      Array.from({ length: 3 }).some((__, c) =>
        screen.getByLabelText(`Cell ${r},${c}`).textContent?.includes("O"),
      ),
    );
    expect(anyCellHasO).toBe(true);
  });

  it("human as O places O when clicking a cell", () => {
    renderPage();
    const humanMark = screen.getByLabelText("Human mark") as HTMLSelectElement;
    fireEvent.change(humanMark, { target: { value: "O" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Start or reset game" }),
    );
    // Ensure it's human's turn (X bot would have moved if starting)
    const whoStarts = screen.getByLabelText("Who starts") as HTMLSelectElement;
    fireEvent.change(whoStarts, { target: { value: "O" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Start or reset game" }),
    );
    const cell = screen.getByLabelText("Cell 0,0");
    fireEvent.click(cell);
    expect(cell).toHaveTextContent("O");
  });

  it("swap marks toggles human mark", () => {
    renderPage();
    const humanMark = screen.getByLabelText("Human mark") as HTMLSelectElement;
    expect(humanMark.value).toBe("X");
    fireEvent.click(screen.getByRole("button", { name: "Swap marks" }));
    expect(humanMark.value).toBe("O");
  });
});
