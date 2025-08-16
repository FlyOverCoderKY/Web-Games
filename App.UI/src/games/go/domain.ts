export type Color = "b" | "w";
export type Cell = "empty" | Color;

export interface Point {
  row: number;
  col: number;
}

export type GoDifficulty = "Easy" | "Medium" | "Hard";

export type Move =
  | { kind: "place"; row: number; col: number }
  | { kind: "pass" };

export interface GameState {
  board: Cell[][];
  currentPlayer: Color;
  history: string[]; // serialized boards for undo
  future: string[]; // serialized boards for redo
  consecutivePasses: number;
  humanColor: Color;
  size: number;
}

export type GameStatus =
  | { kind: "InProgress"; turn: Color }
  | {
      kind: "Over";
      reason: "TwoPasses";
      score: { b: number; w: number };
      winner: Color | null;
    };

export function createInitialBoard(size = 9): Cell[][] {
  return Array.from({ length: size }, () => Array<Cell>(size).fill("empty"));
}

export function createInitialState(
  humanColor: Color = "b",
  size = 9,
): GameState {
  return {
    board: createInitialBoard(size),
    currentPlayer: "b",
    history: [],
    future: [],
    consecutivePasses: 0,
    humanColor,
    size,
  };
}

export function serializeBoard(board: Cell[][]): string {
  return board.map((row) => row.join("")).join("/");
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((r) => r.slice());
}

function inBounds(size: number, r: number, c: number): boolean {
  return r >= 0 && r < size && c >= 0 && c < size;
}

function neighbors(size: number, r: number, c: number): Point[] {
  const pts: Point[] = [];
  if (inBounds(size, r - 1, c)) pts.push({ row: r - 1, col: c });
  if (inBounds(size, r + 1, c)) pts.push({ row: r + 1, col: c });
  if (inBounds(size, r, c - 1)) pts.push({ row: r, col: c - 1 });
  if (inBounds(size, r, c + 1)) pts.push({ row: r, col: c + 1 });
  return pts;
}

function findGroup(
  board: Cell[][],
  start: Point,
): { stones: Point[]; liberties: Set<string> } {
  const size = board.length;
  const color = board[start.row][start.col];
  if (color === "empty") return { stones: [], liberties: new Set() };
  const visited = new Set<string>();
  const stones: Point[] = [];
  const liberties = new Set<string>();
  const stack: Point[] = [start];
  while (stack.length) {
    const p = stack.pop()!;
    const key = `${p.row},${p.col}`;
    if (visited.has(key)) continue;
    visited.add(key);
    stones.push(p);
    for (const n of neighbors(size, p.row, p.col)) {
      const v = board[n.row][n.col];
      if (v === "empty") {
        liberties.add(`${n.row},${n.col}`);
      } else if (v === color) {
        const nk = `${n.row},${n.col}`;
        if (!visited.has(nk)) stack.push(n);
      }
    }
  }
  return { stones, liberties };
}

function removeGroup(board: Cell[][], stones: Point[]): void {
  for (const s of stones) {
    board[s.row][s.col] = "empty";
  }
}

function countCapturedByMove(
  board: Cell[][],
  move: { row: number; col: number; color: Color },
): { next: Cell[][]; captured: number; suicide: boolean } {
  const size = board.length;
  if (board[move.row][move.col] !== "empty") {
    return { next: board, captured: 0, suicide: true };
  }
  const next = cloneBoard(board);
  next[move.row][move.col] = move.color;
  // Remove opponent groups without liberties
  const opponent: Color = move.color === "b" ? "w" : "b";
  let captured = 0;
  const seen = new Set<string>();
  for (const n of neighbors(size, move.row, move.col)) {
    if (next[n.row][n.col] !== opponent) continue;
    const key = `${n.row},${n.col}`;
    if (seen.has(key)) continue;
    const group = findGroup(next, n);
    for (const s of group.stones) seen.add(`${s.row},${s.col}`);
    if (group.liberties.size === 0) {
      captured += group.stones.length;
      removeGroup(next, group.stones);
    }
  }
  // Check suicide: our own group must have at least one liberty
  const selfGroup = findGroup(next, { row: move.row, col: move.col });
  const suicide = selfGroup.liberties.size === 0;
  return { next, captured, suicide };
}

export function isLegalPlacement(
  board: Cell[][],
  color: Color,
  row: number,
  col: number,
  previousBoard?: string | null,
): boolean {
  if (board[row][col] !== "empty") return false;
  const { next, suicide } = countCapturedByMove(board, { row, col, color });
  if (suicide) return false;
  // Simple ko: disallow returning to the immediate previous position
  if (previousBoard && serializeBoard(next) === previousBoard) return false;
  return true;
}

export function listLegalMoves(state: GameState, color: Color): Move[] {
  const moves: Move[] = [];
  const prev = state.history[state.history.length - 1] ?? null;
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      if (isLegalPlacement(state.board, color, r, c, prev)) {
        moves.push({ kind: "place", row: r, col: c });
      }
    }
  }
  moves.push({ kind: "pass" });
  return moves;
}

export function applyMove(state: GameState, move: Move): GameState {
  if (stateIsOver(state)) return state;
  if (move.kind === "pass") {
    const nextPasses = state.consecutivePasses + 1;
    const next: GameState = {
      ...state,
      currentPlayer: state.currentPlayer === "b" ? "w" : "b",
      history: [...state.history, serializeBoard(state.board)],
      future: [],
      consecutivePasses: nextPasses,
    };
    return next;
  }

  const prev = state.history[state.history.length - 1] ?? null;
  if (
    !isLegalPlacement(
      state.board,
      state.currentPlayer,
      move.row,
      move.col,
      prev,
    )
  ) {
    throw new Error("Illegal move");
  }
  const { next } = countCapturedByMove(state.board, {
    row: move.row,
    col: move.col,
    color: state.currentPlayer,
  });
  return {
    ...state,
    board: next,
    currentPlayer: state.currentPlayer === "b" ? "w" : "b",
    history: [...state.history, serializeBoard(state.board)],
    future: [],
    consecutivePasses: 0,
  };
}

export function stateIsOver(state: GameState): boolean {
  return state.consecutivePasses >= 2;
}

export function scoreBoard(board: Cell[][]): { b: number; w: number } {
  const size = board.length;
  let bStones = 0;
  let wStones = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = board[r][c];
      if (v === "b") bStones++;
      else if (v === "w") wStones++;
    }
  }

  // Territory: flood fill empty regions and attribute to single-color borders
  const visited = Array.from({ length: size }, () =>
    Array<boolean>(size).fill(false),
  );
  let bTerritory = 0;
  let wTerritory = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (visited[r][c] || board[r][c] !== "empty") continue;
      const queue: Point[] = [{ row: r, col: c }];
      const empties: Point[] = [];
      let touchesB = false;
      let touchesW = false;
      visited[r][c] = true;
      while (queue.length) {
        const p = queue.pop()!;
        empties.push(p);
        for (const n of neighbors(size, p.row, p.col)) {
          const v = board[n.row][n.col];
          if (v === "empty") {
            if (!visited[n.row][n.col]) {
              visited[n.row][n.col] = true;
              queue.push(n);
            }
          } else if (v === "b") touchesB = true;
          else if (v === "w") touchesW = true;
        }
      }
      if (touchesB && !touchesW) bTerritory += empties.length;
      else if (touchesW && !touchesB) wTerritory += empties.length;
    }
  }
  return { b: bStones + bTerritory, w: wStones + wTerritory };
}

export function getStatus(state: GameState): GameStatus {
  if (!stateIsOver(state)) {
    return { kind: "InProgress", turn: state.currentPlayer };
  }
  const score = scoreBoard(state.board);
  let winner: Color | null = null;
  if (score.b > score.w) winner = "b";
  else if (score.w > score.b) winner = "w";
  return { kind: "Over", reason: "TwoPasses", score, winner };
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
  const prevBoard = deserializeBoard(previous, state.size);
  return {
    ...state,
    board: prevBoard,
    currentPlayer: state.currentPlayer === "b" ? "w" : "b",
    history: state.history.slice(0, -1),
    future: [serializeBoard(state.board), ...state.future],
    // Reset passes if we reverted a pass; conservatively set to 0
    consecutivePasses: 0,
  };
}

export function redo(state: GameState): GameState {
  if (!canRedo(state)) return state;
  const nextSer = state.future[0];
  const nextBoard = deserializeBoard(nextSer, state.size);
  return {
    ...state,
    board: nextBoard,
    currentPlayer: state.currentPlayer === "b" ? "w" : "b",
    history: [...state.history, serializeBoard(state.board)],
    future: state.future.slice(1),
    consecutivePasses: 0,
  };
}

export function deserializeBoard(serialized: string, size: number): Cell[][] {
  const rows = serialized.split("/");
  const board: Cell[][] = Array.from({ length: size }, () =>
    Array<Cell>(size).fill("empty"),
  );
  for (let r = 0; r < size; r++) {
    const row = rows[r] ?? "";
    for (let c = 0; c < size; c++) {
      const ch = row[c];
      if (ch === "b") board[r][c] = "b";
      else if (ch === "w") board[r][c] = "w";
      else board[r][c] = "empty";
    }
  }
  return board;
}

function evaluate(state: GameState, perspective: Color): number {
  const s = scoreBoard(state.board);
  const diff = s.b - s.w;
  return perspective === "b" ? diff : -diff;
}

export function chooseBotMoveWithDifficulty(
  state: GameState,
  botColor: Color,
  difficulty: GoDifficulty,
): Move | null {
  const moves = listLegalMoves(state, botColor);
  if (moves.length === 0) return { kind: "pass" };
  const placeMoves = moves.filter((m) => m.kind === "place") as Array<{
    kind: "place";
    row: number;
    col: number;
  }>;
  if (difficulty === "Easy") {
    if (placeMoves.length === 0) return { kind: "pass" };
    const idx = Math.floor(Math.random() * placeMoves.length);
    return placeMoves[idx];
  }

  // Medium: prefer capturing moves
  if (difficulty === "Medium") {
    let best: Move | null = null;
    let bestCap = -1;
    for (const m of placeMoves) {
      const { captured } = countCapturedByMove(state.board, {
        row: m.row,
        col: m.col,
        color: botColor,
      });
      if (captured > bestCap) {
        bestCap = captured;
        best = m;
      }
    }
    return best ?? { kind: "pass" };
  }

  // Hard: 1-ply evaluation (stones + territory)
  let bestMove: Move | null = null;
  let bestScore = -Infinity;
  for (const m of placeMoves) {
    const applied = applyMove(state, m);
    const score = evaluate(applied, botColor);
    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }
  return bestMove ?? { kind: "pass" };
}
