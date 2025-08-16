export type Cell = "Empty" | "X" | "O";
export type Player = "X" | "O";

export type GameStatus = "InProgress" | "XWins" | "OWins" | "Draw";

export interface Move {
  row: number;
  col: number;
  player: Player;
}

export interface Board {
  cells: ReadonlyArray<Cell>; // length 9, row-major
  currentPlayer: Player;
}

export interface GameConfig {
  startingPlayer: Player;
  humanPlayer: Player;
}

export interface GameState {
  board: Board;
  config: GameConfig;
  history: ReadonlyArray<Board>;
  redo: ReadonlyArray<Board>;
}

export function createInitialBoard(startingPlayer: Player = "X"): Board {
  return { cells: Array<Cell>(9).fill("Empty"), currentPlayer: startingPlayer };
}

export function createInitialState(config: GameConfig): GameState {
  return {
    board: createInitialBoard(config.startingPlayer),
    config,
    history: [],
    redo: [],
  };
}

export function indexFor(row: number, col: number): number {
  return row * 3 + col;
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 3 && col >= 0 && col < 3;
}

export function getCell(board: Board, row: number, col: number): Cell {
  if (!inBounds(row, col)) throw new Error("Out of bounds");
  return board.cells[indexFor(row, col)];
}

export function setCell(
  board: Board,
  row: number,
  col: number,
  value: Cell,
): Board {
  if (!inBounds(row, col)) throw new Error("Out of bounds");
  const idx = indexFor(row, col);
  const next = board.cells.slice();
  (next as Cell[])[idx] = value;
  return { cells: next, currentPlayer: board.currentPlayer };
}

export function applyMove(board: Board, move: Move): Board {
  if (!inBounds(move.row, move.col)) throw new Error("Move out of bounds");
  if (board.currentPlayer !== move.player) throw new Error("Not your turn");
  const idx = indexFor(move.row, move.col);
  if (board.cells[idx] !== "Empty") throw new Error("Cell occupied");

  const nextCells = board.cells.slice();
  (nextCells as Cell[])[idx] = move.player;
  const nextPlayer: Player = move.player === "X" ? "O" : "X";
  return { cells: nextCells, currentPlayer: nextPlayer };
}

export function getEmptyCells(
  board: Board,
): Array<{ row: number; col: number }> {
  const empties: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (getCell(board, r, c) === "Empty") empties.push({ row: r, col: c });
    }
  }
  return empties;
}

export function getStatus(board: Board): GameStatus {
  const lines = [
    // rows
    [indexFor(0, 0), indexFor(0, 1), indexFor(0, 2)],
    [indexFor(1, 0), indexFor(1, 1), indexFor(1, 2)],
    [indexFor(2, 0), indexFor(2, 1), indexFor(2, 2)],
    // cols
    [indexFor(0, 0), indexFor(1, 0), indexFor(2, 0)],
    [indexFor(0, 1), indexFor(1, 1), indexFor(2, 1)],
    [indexFor(0, 2), indexFor(1, 2), indexFor(2, 2)],
    // diagonals
    [indexFor(0, 0), indexFor(1, 1), indexFor(2, 2)],
    [indexFor(0, 2), indexFor(1, 1), indexFor(2, 0)],
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    const v = board.cells[a];
    if (v !== "Empty" && v === board.cells[b] && v === board.cells[c]) {
      return v === "X" ? "XWins" : "OWins";
    }
  }
  const hasEmpty = board.cells.some((x) => x === "Empty");
  return hasEmpty ? "InProgress" : "Draw";
}

export function isBoardFull(board: Board): boolean {
  return board.cells.every((c) => c !== "Empty");
}

export function hasWinningMove(board: Board, player: Player): boolean {
  return findImmediateWin(board, player) !== null;
}

export function findImmediateWin(
  board: Board,
  player: Player,
): { row: number; col: number } | null {
  for (const pos of getEmptyCells(board)) {
    const next = placeMarkIgnoringTurn(board, pos.row, pos.col, player);
    const status = getStatus(next);
    if (
      (player === "X" && status === "XWins") ||
      (player === "O" && status === "OWins")
    ) {
      return pos;
    }
  }
  return null;
}

export function chooseBotMove(
  board: Board,
  bot: Player,
): { row: number; col: number } | null {
  if (getStatus(board) !== "InProgress") return null;
  // 1) Win if possible
  const winPos = findImmediateWin(board, bot);
  if (winPos) return winPos;
  // 2) Block opponent
  const opponent: Player = bot === "X" ? "O" : "X";
  const blockPos = findImmediateWin(board, opponent);
  if (blockPos) return blockPos;
  // 3) Center -> corners -> edges
  const preferences: Array<{ row: number; col: number }> = [
    { row: 1, col: 1 },
    { row: 0, col: 0 },
    { row: 0, col: 2 },
    { row: 2, col: 0 },
    { row: 2, col: 2 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 2 },
    { row: 2, col: 1 },
  ];
  for (const p of preferences) {
    if (getCell(board, p.row, p.col) === "Empty") return p;
  }
  return null;
}

// --- Difficulty-aware bot ---
import { getDefaultRng, type Rng } from "../../lib/random";

export type TicTacToeDifficulty = "Easy" | "Medium" | "Hard";

export function chooseBotMoveWithDifficulty(
  board: Board,
  bot: Player,
  difficulty: TicTacToeDifficulty,
  rng: Rng = getDefaultRng(),
): { row: number; col: number } | null {
  if (getStatus(board) !== "InProgress") return null;

  // Always take a winning move if we decide to play optimally this turn
  const opponent: Player = bot === "X" ? "O" : "X";
  const winPos = findImmediateWin(board, bot);
  const blockPos = findImmediateWin(board, opponent);

  if (difficulty === "Hard") {
    return chooseBotMove(board, bot);
  }

  if (difficulty === "Medium") {
    // Medium: play strong most of the time, but occasionally miss blocks or prefs
    if (winPos) return winPos;
    if (blockPos) {
      // 70% chance to block
      if (rng.next() < 0.7) return blockPos;
    }
    // Prefer good positions but with randomness
    const prefs: Array<{ row: number; col: number }> = [
      { row: 1, col: 1 },
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
    ];
    // Randomly pick among the first few preferred spots available
    const availablePrefs = prefs.filter(
      (p) => getCell(board, p.row, p.col) === "Empty",
    );
    if (availablePrefs.length > 0) {
      const idx = rng.nextInt(Math.min(availablePrefs.length, 3));
      return availablePrefs[idx];
    }
    // Fallback: any empty
    const empties = getEmptyCells(board);
    if (empties.length === 0) return null;
    return empties[rng.nextInt(empties.length)];
  }

  // Easy: mostly random; sometimes even misses a winning move
  if (difficulty === "Easy") {
    const takeWin = winPos && rng.next() < 0.3; // 30% chance to notice a win
    if (takeWin) return winPos!;
    const empties = getEmptyCells(board);
    if (empties.length === 0) return null;
    return empties[rng.nextInt(empties.length)];
  }

  // Default fallback
  return chooseBotMove(board, bot);
}

function placeMarkIgnoringTurn(
  board: Board,
  row: number,
  col: number,
  player: Player,
): Board {
  if (!inBounds(row, col)) throw new Error("Out of bounds");
  const idx = indexFor(row, col);
  if (board.cells[idx] !== "Empty") throw new Error("Cell occupied");
  const next = board.cells.slice();
  (next as Cell[])[idx] = player;
  // Do not flip currentPlayer for hypothetical evaluation
  return { cells: next, currentPlayer: board.currentPlayer };
}

export function applyMoveWithHistory(state: GameState, move: Move): GameState {
  const nextBoard = applyMove(state.board, move);
  return {
    ...state,
    board: nextBoard,
    history: [...state.history, state.board],
    redo: [],
  };
}

export function canUndo(state: GameState): boolean {
  return state.history.length > 0;
}

export function canRedo(state: GameState): boolean {
  return state.redo.length > 0;
}

export function undo(state: GameState): GameState {
  if (!canUndo(state)) return state;
  const prev = state.history[state.history.length - 1];
  const rest = state.history.slice(0, -1);
  // Keep currentPlayer as-is (the player who was about to move before undo)
  const adjustedPrev: Board = {
    ...prev,
    currentPlayer: state.board.currentPlayer,
  };
  return {
    ...state,
    board: adjustedPrev,
    history: rest,
    redo: [state.board, ...state.redo],
  };
}

export function redo(state: GameState): GameState {
  if (!canRedo(state)) return state;
  const [next, ...rest] = state.redo;
  const flipped: Player = state.board.currentPlayer === "X" ? "O" : "X";
  const adjustedNext: Board = { ...next, currentPlayer: flipped };
  return {
    ...state,
    board: adjustedNext,
    history: [...state.history, state.board],
    redo: rest,
  };
}
