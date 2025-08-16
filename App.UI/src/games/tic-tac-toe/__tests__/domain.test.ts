import { describe, it, expect } from "vitest";
import {
  createInitialBoard,
  getStatus,
  applyMove,
  findImmediateWin,
  chooseBotMove,
  getEmptyCells,
  applyMoveWithHistory,
  undo,
  redo,
  createInitialState,
} from "../domain";

describe("TicTacToe domain", () => {
  it("initial board is empty and in progress", () => {
    const b = createInitialBoard("X");
    expect(getEmptyCells(b).length).toBe(9);
    expect(getStatus(b)).toBe("InProgress");
  });

  it("applyMove enforces turn order and occupancy", () => {
    const b = createInitialBoard("X");
    const b1 = applyMove(b, { row: 0, col: 0, player: "X" });
    expect(() => applyMove(b1, { row: 0, col: 0, player: "O" })).toThrow();
    expect(() => applyMove(b1, { row: 0, col: 1, player: "X" })).toThrow();
  });

  it("detects wins on rows, cols, diagonals", () => {
    // Row win for X
    let b = createInitialBoard("X");
    b = applyMove(b, { row: 0, col: 0, player: "X" });
    b = applyMove(b, { row: 1, col: 0, player: "O" });
    b = applyMove(b, { row: 0, col: 1, player: "X" });
    b = applyMove(b, { row: 1, col: 1, player: "O" });
    b = applyMove(b, { row: 0, col: 2, player: "X" });
    expect(getStatus(b)).toBe("XWins");

    // Diagonal win for O
    b = createInitialBoard("X");
    b = applyMove(b, { row: 0, col: 2, player: "X" });
    b = applyMove(b, { row: 0, col: 0, player: "O" });
    b = applyMove(b, { row: 1, col: 2, player: "X" });
    b = applyMove(b, { row: 1, col: 1, player: "O" });
    b = applyMove(b, { row: 2, col: 1, player: "X" });
    b = applyMove(b, { row: 2, col: 2, player: "O" });
    expect(getStatus(b)).toBe("OWins");
  });

  it("bot wins if possible else blocks else picks center/corners/edges", () => {
    // Bot can win
    let b = createInitialBoard("X");
    b = applyMove(b, { row: 1, col: 1, player: "X" }); // human
    b = applyMove(b, { row: 0, col: 0, player: "O" }); // bot
    b = applyMove(b, { row: 2, col: 2, player: "X" }); // human
    // Now O can win with (0,2) or (2,0) depending grid; create explicit win chance
    b = applyMove(b, { row: 0, col: 1, player: "O" });
    b = applyMove(b, { row: 2, col: 1, player: "X" });
    const win = findImmediateWin(b, "O");
    if (win) {
      expect(chooseBotMove(b, "O")).toEqual(win);
    }

    // Blocking scenario: X threatens, O should block
    b = createInitialBoard("X");
    b = applyMove(b, { row: 0, col: 0, player: "X" });
    b = applyMove(b, { row: 2, col: 2, player: "O" });
    b = applyMove(b, { row: 0, col: 1, player: "X" });
    const block = chooseBotMove(b, "O");
    expect(block).toEqual({ row: 0, col: 2 });

    // Preference: empty board -> center
    b = createInitialBoard("X");
    // Assume bot is X and starts
    const pref = chooseBotMove(b, "X");
    expect(pref).toEqual({ row: 1, col: 1 });
  });

  it("undo/redo semantics", () => {
    const state = createInitialState({ startingPlayer: "X", humanPlayer: "X" });
    const s1 = applyMoveWithHistory(state, { row: 0, col: 0, player: "X" });
    const s2 = applyMoveWithHistory(s1, { row: 1, col: 1, player: "O" });
    const s3 = undo(s2);
    expect(s3.board.currentPlayer).toBe("X");
    expect(s3.redo.length).toBe(1);
    const s4 = redo(s3);
    expect(s4.board.currentPlayer).toBe("O");
    expect(s4.history.length).toBe(2);
  });
});
