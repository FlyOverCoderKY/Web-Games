import { Chess, Move, Square } from "chess.js";

export type ChessDifficulty = "Easy" | "Medium" | "Hard";
export type Color = "w" | "b";

export interface SerializableMove {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
}

export interface GameState {
  fen: string;
  history: string[]; // stack of previous FENs
  future: string[]; // stack of undone FENs for redo
  humanColor: Color;
}

export type DrawReason =
  | "stalemate"
  | "insufficient"
  | "repetition"
  | "fiftyMove"
  | "other";
export type GameStatus =
  | { kind: "InProgress"; turn: Color; inCheck: boolean }
  | { kind: "Checkmate"; winner: Color }
  | { kind: "Draw"; reason: DrawReason };

export function createInitialState(humanColor: Color = "w"): GameState {
  const chess = new Chess();
  return {
    fen: chess.fen(),
    history: [],
    future: [],
    humanColor,
  };
}

export function loadChess(fen: string): Chess {
  return new Chess(fen);
}

export function getStatus(fen: string): GameStatus {
  const chess = loadChess(fen);
  if (chess.isCheckmate()) {
    const winner: Color = chess.turn() === "w" ? "b" : "w";
    return { kind: "Checkmate", winner };
  }
  if (chess.isDraw()) {
    let reason: DrawReason = "other";
    if (chess.isStalemate()) reason = "stalemate";
    else if (chess.isInsufficientMaterial()) reason = "insufficient";
    else if (chess.isThreefoldRepetition()) reason = "repetition";
    else {
      const parts = chess.fen().split(" ");
      const halfmove = parseInt(parts[4] ?? "0", 10);
      if (!Number.isNaN(halfmove) && halfmove >= 100) reason = "fiftyMove";
    }
    return { kind: "Draw", reason };
  }
  return {
    kind: "InProgress",
    turn: chess.turn() as Color,
    inCheck: chess.inCheck(),
  };
}

export function getBoard(fen: string) {
  const chess = loadChess(fen);
  return chess.board();
}

export function listLegalMoves(fen: string, square?: Square): Move[] {
  const chess = loadChess(fen);
  return chess.moves({ square, verbose: true }) as Move[];
}

export function applyMove(state: GameState, move: SerializableMove): GameState {
  const chess = loadChess(state.fen);
  const result = chess.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion ?? "q",
  });
  if (!result) throw new Error("Illegal move");
  return {
    fen: chess.fen(),
    history: [...state.history, state.fen],
    future: [],
    humanColor: state.humanColor,
  };
}

export function canUndo(state: GameState): boolean {
  return state.history.length > 0;
}

export function canRedo(state: GameState): boolean {
  return state.future.length > 0;
}

export function undo(state: GameState): GameState {
  if (!canUndo(state)) return state;
  const previous = state.history[state.history.length - 1];
  return {
    fen: previous,
    history: state.history.slice(0, -1),
    future: [state.fen, ...state.future],
    humanColor: state.humanColor,
  };
}

export function redo(state: GameState): GameState {
  if (!canRedo(state)) return state;
  const next = state.future[0];
  return {
    fen: next,
    history: [...state.history, state.fen],
    future: state.future.slice(1),
    humanColor: state.humanColor,
  };
}

// Evaluation: simple material + mobility
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

function evaluateBoard(chess: Chess, perspective: Color): number {
  let score = 0;
  const board = chess.board();
  for (const row of board) {
    for (const sq of row) {
      if (!sq) continue;
      const value = PIECE_VALUES[sq.type];
      score += sq.color === perspective ? value : -value;
    }
  }
  // Mobility bonus
  const myMoves = (chess.moves({ verbose: true }) as Move[]).length;
  const mobility = myMoves;
  score += mobility * 2;
  return score;
}

function chooseRandomMove(chess: Chess): Move | null {
  const moves = chess.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;
  const idx = Math.floor(Math.random() * moves.length);
  return moves[idx] as Move;
}

function chooseGreedyMove(chess: Chess, color: Color): Move | null {
  let best: { move: Move; score: number } | null = null;
  const moves = chess.moves({ verbose: true }) as Move[];
  for (const move of moves) {
    const next = new Chess(chess.fen());
    next.move(move);
    const score = evaluateBoard(next, color);
    if (!best || score > best.score) best = { move, score };
  }
  return best?.move ?? null;
}

function minimax(
  chess: Chess,
  depth: number,
  maximizingColor: Color,
  alpha: number,
  beta: number,
): { score: number; move: Move | null } {
  const statusOver = chess.isGameOver();
  if (depth === 0 || statusOver) {
    // If game over, prefer checkmates highly
    if (chess.isCheckmate()) {
      const winner: Color = chess.turn() === "w" ? "b" : "w";
      const score = winner === maximizingColor ? 1_000_000 : -1_000_000;
      return { score, move: null };
    }
    if (chess.isDraw()) {
      return { score: 0, move: null };
    }
    return { score: evaluateBoard(chess, maximizingColor), move: null };
  }

  const turn: Color = chess.turn() as Color;
  let bestMove: Move | null = null;
  const moves = chess.moves({ verbose: true }) as Move[];
  if (moves.length === 0) {
    return { score: evaluateBoard(chess, maximizingColor), move: null };
  }

  if (turn === maximizingColor) {
    let bestScore = -Infinity;
    for (const move of moves) {
      const next = new Chess(chess.fen());
      next.move(move);
      const { score } = minimax(next, depth - 1, maximizingColor, alpha, beta);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move as Move;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return { score: bestScore, move: bestMove };
  } else {
    let bestScore = Infinity;
    for (const move of moves) {
      const next = new Chess(chess.fen());
      next.move(move);
      const { score } = minimax(next, depth - 1, maximizingColor, alpha, beta);
      if (score < bestScore) {
        bestScore = score;
        bestMove = move as Move;
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return { score: bestScore, move: bestMove };
  }
}

export function chooseBotMoveWithDifficulty(
  fen: string,
  botColor: Color,
  difficulty: ChessDifficulty,
): SerializableMove | null {
  const chess = loadChess(fen);
  if (chess.turn() !== botColor) return null;
  let chosen: Move | null = null;
  if (difficulty === "Easy") {
    chosen = chooseRandomMove(chess);
  } else if (difficulty === "Medium") {
    chosen = chooseGreedyMove(chess, botColor);
  } else {
    const depth = 3;
    const { move } = minimax(chess, depth, botColor, -Infinity, Infinity);
    chosen = move;
  }
  if (!chosen) return null;
  return {
    from: chosen.from as Square,
    to: chosen.to as Square,
    promotion: (chosen.promotion as SerializableMove["promotion"]) ?? "q",
  };
}
