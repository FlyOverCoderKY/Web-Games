export type PlayerColor = "red" | "black";

export interface Piece {
  color: PlayerColor;
  kind: "man" | "king";
}

export type Square = Piece | null;

export type Board = Square[][]; // 8x8

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Position; // position of captured piece if any
}

export interface GameState {
  board: Board;
  currentPlayer: PlayerColor;
  winner: PlayerColor | null;
  forcedFrom: Position | null;
}

export type CheckersDifficulty = "Easy" | "Medium" | "Hard";

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () =>
    Array<Square>(8).fill(null),
  );
  // Place black pieces on rows 0-2 on dark squares (row+col is odd)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: "black", kind: "man" };
      }
    }
  }
  // Place red pieces on rows 5-7
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: "red", kind: "man" };
      }
    }
  }
  return board;
}

export function createInitialState(): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: "red",
    winner: null,
    forcedFrom: null,
  };
}

export function isInsideBoard(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

function getForwardDirections(piece: Piece): number[] {
  if (piece.kind === "king") return [1, -1];
  return piece.color === "red" ? [-1] : [1];
}

export function getValidMoves(board: Board, from: Position): Move[] {
  if (!isInsideBoard(from)) return [];
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const directions = getForwardDirections(piece);
  const moves: Move[] = [];

  // Simple diagonal moves (no capture)
  for (const dr of directions) {
    for (const dc of [-1, 1]) {
      const to: Position = { row: from.row + dr, col: from.col + dc };
      if (isInsideBoard(to) && board[to.row][to.col] === null) {
        moves.push({ from, to });
      }
    }
  }

  // Capture moves (jump over opponent)
  for (const dr of directions) {
    for (const dc of [-1, 1]) {
      const mid: Position = { row: from.row + dr, col: from.col + dc };
      const to: Position = { row: from.row + dr * 2, col: from.col + dc * 2 };
      if (!isInsideBoard(to) || !isInsideBoard(mid)) continue;
      const midPiece = board[mid.row][mid.col];
      if (
        midPiece &&
        midPiece.color !== piece.color &&
        board[to.row][to.col] === null
      ) {
        moves.push({ from, to, captured: mid });
      }
    }
  }

  return moves;
}

export function applyMove(state: GameState, move: Move): GameState {
  const { board } = state;
  const piece = board[move.from.row][move.from.col];
  if (!piece) return state;

  const nextBoard = cloneBoard(board);
  nextBoard[move.from.row][move.from.col] = null;
  nextBoard[move.to.row][move.to.col] = piece;

  // Remove captured piece if applicable
  if (move.captured) {
    nextBoard[move.captured.row][move.captured.col] = null;
  }

  // Crown to king if reaches back rank
  let crowned = false;
  if (piece.kind === "man") {
    if (piece.color === "red" && move.to.row === 0) {
      nextBoard[move.to.row][move.to.col] = {
        color: piece.color,
        kind: "king",
      };
      crowned = true;
    }
    if (piece.color === "black" && move.to.row === 7) {
      nextBoard[move.to.row][move.to.col] = {
        color: piece.color,
        kind: "king",
      };
      crowned = true;
    }
  }

  // Determine if a capture chain must continue
  let nextPlayer: PlayerColor = state.currentPlayer === "red" ? "black" : "red";
  let forcedFrom: Position | null = null;
  if (move.captured && !crowned) {
    const more = getValidMoves(nextBoard, {
      row: move.to.row,
      col: move.to.col,
    }).filter((m) => !!m.captured);
    if (more.length > 0) {
      // same player continues capturing from the new position
      nextPlayer = state.currentPlayer;
      forcedFrom = { row: move.to.row, col: move.to.col };
    }
  }

  const maybeWinner = computeWinner(nextBoard);
  let winner: PlayerColor | null = maybeWinner;
  if (!winner && !forcedFrom) {
    const nextMoves = getAllValidMovesForPlayer(nextBoard, nextPlayer, null);
    if (nextMoves.length === 0) {
      winner = state.currentPlayer; // opponent is stuck
    }
  }

  return {
    board: nextBoard,
    currentPlayer: winner ? state.currentPlayer : nextPlayer,
    winner,
    forcedFrom,
  };
}

export function computeWinner(board: Board): PlayerColor | null {
  let redCount = 0;
  let blackCount = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.color === "red") redCount++;
      else blackCount++;
    }
  }
  if (redCount === 0) return "black";
  if (blackCount === 0) return "red";
  return null;
}

export function isMoveValidForPlayer(
  board: Board,
  move: Move,
  player: PlayerColor,
): boolean {
  const piece = board[move.from.row][move.from.col];
  if (!piece || piece.color !== player) return false;
  return getValidMoves(board, move.from).some(
    (m) => m.to.row === move.to.row && m.to.col === move.to.col,
  );
}

export function getAllValidMovesForPlayer(
  board: Board,
  player: PlayerColor,
  forcedFrom?: Position | null,
): Move[] {
  if (forcedFrom) {
    return getValidMoves(board, forcedFrom).filter((m) => !!m.captured);
  }
  const all: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== player) continue;
      const from: Position = { row: r, col: c };
      const moves = getValidMoves(board, from);
      for (const m of moves) all.push(m);
    }
  }
  const anyCaptures = all.some((m) => !!m.captured);
  if (anyCaptures) return all.filter((m) => !!m.captured);
  return all;
}

export function hasAnyMove(board: Board, player: PlayerColor): boolean {
  return getAllValidMovesForPlayer(board, player).length > 0;
}

export function applyMoveOnBoard(board: Board, move: Move): Board {
  const next = cloneBoard(board);
  const piece = board[move.from.row][move.from.col];
  if (!piece) return next;
  next[move.from.row][move.from.col] = null;
  next[move.to.row][move.to.col] = piece;
  if (move.captured) {
    next[move.captured.row][move.captured.col] = null;
  }
  if (piece.kind === "man") {
    if (piece.color === "red" && move.to.row === 0) {
      next[move.to.row][move.to.col] = { color: piece.color, kind: "king" };
    }
    if (piece.color === "black" && move.to.row === 7) {
      next[move.to.row][move.to.col] = { color: piece.color, kind: "king" };
    }
  }
  return next;
}

function evaluateBoard(board: Board, perspective: PlayerColor): number {
  let redMen = 0,
    redKings = 0,
    blackMen = 0,
    blackKings = 0,
    redAdvance = 0,
    blackAdvance = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.color === "red") {
        if (p.kind === "king") redKings++;
        else {
          redMen++;
          redAdvance += 7 - r;
        }
      } else {
        if (p.kind === "king") blackKings++;
        else {
          blackMen++;
          blackAdvance += r;
        }
      }
    }
  }
  const weightMan = 1;
  const weightKing = 1.7;
  const weightAdvance = 0.05;
  const redScore =
    redMen * weightMan + redKings * weightKing + redAdvance * weightAdvance;
  const blackScore =
    blackMen * weightMan +
    blackKings * weightKing +
    blackAdvance * weightAdvance;
  const score = redScore - blackScore; // positive favors red
  return perspective === "red" ? score : -score;
}

function minimax(
  board: Board,
  player: PlayerColor,
  perspective: PlayerColor,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  const winner = computeWinner(board);
  if (winner) {
    return winner === perspective ? 10000 : -10000;
  }
  if (depth === 0) {
    return evaluateBoard(board, perspective);
  }
  const moves = getAllValidMovesForPlayer(board, player);
  if (moves.length === 0) {
    return player === perspective ? -9999 : 9999;
  }

  if (maximizing) {
    let value = -Infinity;
    for (const m of moves) {
      const nextBoard = applyMoveOnBoard(board, m);
      const nextPlayer: PlayerColor = player === "red" ? "black" : "red";
      const score = minimax(
        nextBoard,
        nextPlayer,
        perspective,
        depth - 1,
        alpha,
        beta,
        false,
      );
      value = Math.max(value, score);
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  } else {
    let value = Infinity;
    for (const m of moves) {
      const nextBoard = applyMoveOnBoard(board, m);
      const nextPlayer: PlayerColor = player === "red" ? "black" : "red";
      const score = minimax(
        nextBoard,
        nextPlayer,
        perspective,
        depth - 1,
        alpha,
        beta,
        true,
      );
      value = Math.min(value, score);
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return value;
  }
}

export function chooseBotMoveWithDifficulty(
  board: Board,
  player: PlayerColor,
  difficulty: CheckersDifficulty,
  forcedFrom?: Position | null,
): Move | null {
  const moves = getAllValidMovesForPlayer(board, player, forcedFrom);
  if (moves.length === 0) return null;

  if (difficulty === "Easy") {
    const idx = Math.floor(Math.random() * moves.length);
    return moves[idx];
  }

  if (difficulty === "Medium") {
    let best: Move = moves[0];
    let bestScore = -Infinity;
    for (const m of moves) {
      const next = applyMoveOnBoard(board, m);
      const score = evaluateBoard(next, player);
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    }
    return best;
  }

  let chosen: Move = moves[0];
  let bestVal = -Infinity;
  for (const m of moves) {
    const next = applyMoveOnBoard(board, m);
    const nextPlayer: PlayerColor = player === "red" ? "black" : "red";
    const val = minimax(
      next,
      nextPlayer,
      player,
      4,
      -Infinity,
      Infinity,
      false,
    );
    if (val > bestVal) {
      bestVal = val;
      chosen = m;
    }
  }
  return chosen;
}
