// Sudoku domain: board model, validation, solver, uniqueness counter, and generator
// Board uses 0 for empty cells; values are 1-9

import { createRng, type Rng } from "../../lib/random";

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Board = CellValue[][]; // 9x9

export type SudokuDifficulty = "Easy" | "Medium" | "Hard";

export interface GeneratedPuzzle {
  puzzle: Board;
  solution: Board;
  difficulty: SudokuDifficulty;
  seed?: string | number;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: 9 }, () =>
    Array<CellValue>(9).fill(0 as CellValue),
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice()) as Board;
}

function assertInBounds(row: number, col: number) {
  if (row < 0 || row >= 9 || col < 0 || col >= 9) {
    throw new Error(`Cell out of bounds: (${row}, ${col})`);
  }
}

export function isValidPlacement(
  board: Board,
  row: number,
  col: number,
  value: number,
): boolean {
  assertInBounds(row, col);
  if (value < 1 || value > 9) return false;
  // Row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === value) return false;
  }
  // Column
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === value) return false;
  }
  // Box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const rr = startRow + r;
      const cc = startCol + c;
      if ((rr !== row || cc !== col) && board[rr][cc] === value) return false;
    }
  }
  return true;
}

export function isComplete(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return false;
    }
  }
  return true;
}

export function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

/**
 * Finds next empty cell, preferring the one with the fewest candidates (MRV heuristic)
 */
function findBestEmptyCell(
  board: Board,
): { row: number; col: number; candidates: number[] } | null {
  let best: { row: number; col: number; candidates: number[] } | null = null;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const candidates: number[] = [];
        for (let v = 1; v <= 9; v++) {
          if (isValidPlacement(board, r, c, v)) candidates.push(v);
        }
        if (candidates.length === 0) return { row: r, col: c, candidates: [] }; // dead end
        if (!best || candidates.length < best.candidates.length) {
          best = { row: r, col: c, candidates };
          if (best.candidates.length === 1) return best; // cannot do better than 1
        }
      }
    }
  }
  return best;
}

/**
 * Solves a Sudoku board using backtracking; returns a solved copy or null if unsolvable.
 */
export function solve(board: Board): Board | null {
  const working = cloneBoard(board);

  function backtrack(): boolean {
    const next = findBestEmptyCell(working);
    if (next === null) return true; // complete
    if (next.candidates.length === 0) return false; // dead end
    for (const v of next.candidates) {
      working[next.row][next.col] = v as CellValue;
      if (backtrack()) return true;
      working[next.row][next.col] = 0;
    }
    return false;
  }

  return backtrack() ? working : null;
}

/** Counts the number of solutions up to a given limit (usually 2 to check uniqueness). */
export function countSolutions(board: Board, limit: number = 2): number {
  let solutions = 0;
  const working = cloneBoard(board);

  function backtrack(): boolean {
    if (solutions >= limit) return true; // stop early
    const next = findBestEmptyCell(working);
    if (next === null) {
      solutions++;
      return solutions >= limit;
    }
    if (next.candidates.length === 0) return false;
    for (const v of next.candidates) {
      working[next.row][next.col] = v as CellValue;
      if (backtrack()) {
        if (solutions >= limit) return true;
      }
      working[next.row][next.col] = 0;
    }
    return false;
  }

  backtrack();
  return solutions;
}

function shuffled<T>(items: T[], rng: Rng): T[] {
  return rng.shuffle(items);
}

/**
 * Generates a fully solved Sudoku grid by randomized backtracking.
 */
export function generateSolvedBoard(rng: Rng): Board {
  // Base canonical solved grid using a Latin pattern
  const base: Board = createEmptyBoard();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = ((r * 3 + Math.floor(r / 3) + c) % 9) + 1; // 1..9
      base[r][c] = v as CellValue;
    }
  }

  // Helper to permute by index mapping
  const applyPermutation = (arr: number[]): number[] =>
    rng.shuffle(arr.slice());

  // 1) Permute digits 1..9
  const digits = applyPermutation([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  // 2) Permute rows: shuffle bands and rows within each band
  const bandOrder = applyPermutation([0, 1, 2]);
  const rowsWithinBands = [
    applyPermutation([0, 1, 2]),
    applyPermutation([0, 1, 2]),
    applyPermutation([0, 1, 2]),
  ];
  const rowIndexMap: number[] = [];
  for (const b of bandOrder) {
    for (const r of rowsWithinBands[b]) {
      rowIndexMap.push(b * 3 + r);
    }
  }

  // 3) Permute cols: shuffle stacks and cols within each stack
  const stackOrder = applyPermutation([0, 1, 2]);
  const colsWithinStacks = [
    applyPermutation([0, 1, 2]),
    applyPermutation([0, 1, 2]),
    applyPermutation([0, 1, 2]),
  ];
  const colIndexMap: number[] = [];
  for (const s of stackOrder) {
    for (const c of colsWithinStacks[s]) {
      colIndexMap.push(s * 3 + c);
    }
  }

  // Build final grid by applying permutations
  const out: Board = createEmptyBoard();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const rr = rowIndexMap[r];
      const cc = colIndexMap[c];
      const baseVal = base[rr][cc];
      out[r][c] = digits[baseVal - 1] as CellValue;
    }
  }
  return out;
}

const DIFFICULTY_CLUES: Record<
  SudokuDifficulty,
  { minClues: number; maxClues: number }
> = {
  Easy: { minClues: 36, maxClues: 81 },
  Medium: { minClues: 30, maxClues: 40 },
  Hard: { minClues: 24, maxClues: 34 },
};

/**
 * Generates a Sudoku puzzle with a unique solution.
 * - Starts from a solved board and removes clues while preserving uniqueness
 * - Stops once minClues for difficulty is reached or no further removals maintain uniqueness
 */
export function generatePuzzle(options?: {
  difficulty?: SudokuDifficulty;
  seed?: string | number;
}): GeneratedPuzzle {
  const difficulty: SudokuDifficulty = options?.difficulty ?? "Medium";
  const rng =
    options?.seed === undefined ? createRng() : createRng(options.seed);
  const solution = generateSolvedBoard(rng);
  const puzzle = cloneBoard(solution);

  const indices = shuffled(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  );
  let clues = 81;
  const { minClues } = DIFFICULTY_CLUES[difficulty];

  for (const idx of indices) {
    if (clues <= minClues) break;
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    const prev = puzzle[r][c];
    if (prev === 0) continue;
    puzzle[r][c] = 0;
    const numSolutions = countSolutions(puzzle, 2);
    if (numSolutions !== 1) {
      // revert removal
      puzzle[r][c] = prev;
    } else {
      clues--;
    }
  }

  return { puzzle, solution, difficulty, seed: options?.seed };
}

export const __test__ = { findBestEmptyCell };
