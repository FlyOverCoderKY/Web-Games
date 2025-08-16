import { describe, it, expect, vi } from "vitest";
import type { Difficulty, GameState } from "../domain";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock the domain to produce a known secret and stable best-score behavior
vi.mock("../domain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../domain")>();
  return {
    ...actual,
    createNewGameState: (difficulty: Difficulty) => {
      const base = actual.createNewGameState(difficulty);
      return { ...base, secret: 42, range: { min: 1, max: 100 } };
    },
    startNewRound: (state: GameState) => ({
      ...state,
      secret: 42,
      attemptCount: 0,
      previousDistance: null,
      isRunning: true,
    }),
    loadBestScore: () => null,
  };
});

import NumberGuessPage from "../NumberGuessPage";

describe("NumberGuessPage success flow", () => {
  it("submits correct guess, shows attempts, score, best, and play again", () => {
    render(
      <MemoryRouter>
        <NumberGuessPage />
      </MemoryRouter>,
    );

    // Enter the known secret (42) and submit
    const input = screen.getByLabelText(
      "Enter your guess (1-100)",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "42" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    // Status announces success and best score
    const status = screen.getByRole("status");
    expect(status.textContent || "").toContain("Correct!");
    expect(status.textContent || "").toContain("New best score:");

    // Play again button available
    expect(
      screen.getByRole("button", { name: "Play again" }),
    ).toBeInTheDocument();
  });
});
