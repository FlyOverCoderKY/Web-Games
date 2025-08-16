import { describe, it, expect } from "vitest";
import {
  createEmptyBoard,
  isValidPlacement,
  solve,
  countSolutions,
  generateSolvedBoard,
  generatePuzzle,
  boardsEqual,
} from "../../sudoku/domain";
import { createRng } from "../../../lib/random";

describe("sudoku domain", () => {
  it("validates placements correctly", () => {
    const b = createEmptyBoard();
    b[0][0] = 5;
    expect(isValidPlacement(b, 0, 1, 5)).toBe(false); // same row
    expect(isValidPlacement(b, 1, 0, 5)).toBe(false); // same col
    expect(isValidPlacement(b, 1, 1, 5)).toBe(false); // same box
    expect(isValidPlacement(b, 0, 1, 4)).toBe(true);
  });

  it("solves a simple board", () => {
    const b = createEmptyBoard();
    // Minimal givens of an easy puzzle (not necessarily minimal globally)
    b[0][0] = 5;
    b[0][1] = 3;
    b[0][4] = 7;
    b[1][0] = 6;
    b[1][3] = 1;
    b[1][4] = 9;
    b[1][5] = 5;
    b[2][1] = 9;
    b[2][2] = 8;
    b[2][7] = 6;
    b[3][0] = 8;
    b[3][4] = 6;
    b[3][8] = 3;
    b[4][0] = 4;
    b[4][3] = 8;
    b[4][5] = 3;
    b[4][8] = 1;
    b[5][0] = 7;
    b[5][4] = 2;
    b[5][8] = 6;
    b[6][1] = 6;
    b[6][6] = 2;
    b[6][7] = 8;
    b[7][3] = 4;
    b[7][4] = 1;
    b[7][5] = 9;
    b[7][8] = 5;
    b[8][4] = 8;
    b[8][7] = 7;
    b[8][8] = 9;

    const solved = solve(b);
    expect(solved).not.toBeNull();
    expect(solved && solved.every((row) => row.every((v) => v !== 0))).toBe(
      true,
    );
  });

  it("can generate a solved board deterministically with a seed", () => {
    const rng = createRng(1234);
    const a = generateSolvedBoard(rng);
    const rng2 = createRng(1234);
    const b = generateSolvedBoard(rng2);
    expect(boardsEqual(a, b)).toBe(true);
  });

  it("generates unique-solution puzzles", () => {
    const { puzzle, solution } = generatePuzzle({
      difficulty: "Medium",
      seed: 42,
    });
    const num = countSolutions(puzzle, 2);
    expect(num).toBe(1);
    const solved = solve(puzzle);
    expect(solved).not.toBeNull();
    expect(solved && boardsEqual(solved, solution)).toBe(true);
  });
});
