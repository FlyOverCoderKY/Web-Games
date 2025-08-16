import React from "react";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import Grid from "../../components/UI/Grid";
import {
  createInitialState,
  getValidMoves,
  applyMove,
  chooseBotMoveWithDifficulty,
  computeWinner,
  type CheckersDifficulty,
  type GameState,
  type Move,
  type Position,
} from "./domain";

const BOARD_SIZE = 8;

function isDarkSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 1;
}

const squareSize = 56;

const CheckersPage: React.FC = () => {
  const [state, setState] = React.useState<GameState>(() =>
    createInitialState(),
  );
  const [selected, setSelected] = React.useState<Position | null>(null);
  const [moves, setMoves] = React.useState<Move[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [difficulty, setDifficulty] =
    React.useState<CheckersDifficulty>("Medium");
  const [humanColor, setHumanColor] = React.useState<"red" | "black">("red");

  function reset() {
    setSelected(null);
    setMoves([]);
    setError(null);
    setState(createInitialState());
  }

  function selectSquare(row: number, col: number) {
    setError(null);
    const cell = state.board[row][col];
    if (cell && cell.color === state.currentPlayer) {
      // If a capture chain is forced, only allow selecting that origin
      if (
        state.forcedFrom &&
        (state.forcedFrom.row !== row || state.forcedFrom.col !== col)
      ) {
        setSelected(null);
        setMoves([]);
        return;
      }
      const all = getValidMoves(state.board, { row, col });
      const legal = state.forcedFrom ? all.filter((m) => !!m.captured) : all;
      setSelected({ row, col });
      setMoves(legal);
      return;
    }
    // Clicking empty or opponent: clear selection
    setSelected(null);
    setMoves([]);
  }

  function tryMove(toRow: number, toCol: number) {
    if (!selected) return;
    const candidate = moves.find(
      (m) => m.to.row === toRow && m.to.col === toCol,
    );
    if (!candidate) {
      setError("Invalid move");
      return;
    }
    const next = applyMove(state, candidate);
    setState(next);
    setSelected(null);
    setMoves([]);
  }

  function handleSquareClick(row: number, col: number) {
    if (!isDarkSquare(row, col)) return;
    if (state.winner) return;
    if (state.currentPlayer !== humanColor) return;
    if (!selected) {
      selectSquare(row, col);
      return;
    }
    const hasMove = moves.some((m) => m.to.row === row && m.to.col === col);
    if (hasMove) {
      tryMove(row, col);
      return;
    }
    selectSquare(row, col);
  }

  function renderPieceSymbol(row: number, col: number) {
    const piece = state.board[row][col];
    if (!piece) return null;
    const isSelected = selected && selected.row === row && selected.col === col;
    const fill = piece.color === "red" ? "#d64545" : "#2e2e2e";
    const ring = isSelected
      ? "2px solid var(--color-accent)"
      : "1px solid var(--color-border-strong)";
    return (
      <div
        aria-hidden
        style={{
          width: squareSize - 12,
          height: squareSize - 12,
          borderRadius: "50%",
          background: fill,
          border: ring,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontWeight: 800,
        }}
      >
        {piece.kind === "king" ? "K" : ""}
      </div>
    );
  }

  const statusText = React.useMemo(() => {
    if (!state.winner) return `Turn: ${state.currentPlayer}`;
    const pieceElimWinner = computeWinner(state.board);
    if (pieceElimWinner) return `${state.winner} wins!`;
    const stuckSide = state.winner === "red" ? "black" : "red";
    return `${state.winner} wins — ${stuckSide} has no legal moves.`;
  }, [state.winner, state.currentPlayer, state.board]);

  // Bot turn automation
  React.useEffect(() => {
    if (state.winner) return;
    const player = state.currentPlayer;
    if (player === humanColor) return;
    const move = chooseBotMoveWithDifficulty(
      state.board,
      player,
      difficulty,
      state.forcedFrom,
    );
    if (!move) return;
    const id = setTimeout(() => {
      setState((prev) => applyMove(prev, move));
    }, 300);
    return () => clearTimeout(id);
  }, [state, humanColor, difficulty]);

  // Auto-select forced chain for human
  React.useEffect(() => {
    if (!state.forcedFrom) return;
    if (state.currentPlayer !== humanColor) return;
    const from = state.forcedFrom;
    const all = getValidMoves(state.board, from);
    const caps = all.filter((m) => !!m.captured);
    setSelected(from);
    setMoves(caps);
  }, [state.forcedFrom, state.currentPlayer, state.board, humanColor]);

  return (
    <section className="gradient-bg" style={{ padding: "2rem 1rem" }}>
      <div
        style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}
      >
        <h2>Checkers</h2>

        <Card title="Controls">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            <div className="ui-field">
              <div className="ui-label">Human Color</div>
              <select
                className="ui-input"
                value={humanColor}
                onChange={(e) =>
                  setHumanColor(e.target.value as "red" | "black")
                }
              >
                <option value="red">Red</option>
                <option value="black">Black</option>
              </select>
            </div>
            <div className="ui-field">
              <div className="ui-label">Difficulty</div>
              <select
                className="ui-input"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as CheckersDifficulty)
                }
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="ui-field">
              <div className="ui-label">Start/Reset</div>
              <Button onClick={reset} fullWidth>
                Start/Reset
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Board" subtitle={statusText}>
          {error && (
            <div
              role="alert"
              className="ui-help"
              style={{ marginBottom: 8, color: "var(--color-error)" }}
            >
              {error}
            </div>
          )}
          <Grid
            columns={BOARD_SIZE}
            gap={4}
            style={{ maxWidth: squareSize * BOARD_SIZE, margin: "0 auto" }}
          >
            {Array.from({ length: BOARD_SIZE }).map((_, r) =>
              Array.from({ length: BOARD_SIZE }).map((__, c) => {
                const dark = isDarkSquare(r, c);
                const isMoveTarget = moves.some(
                  (m) => m.to.row === r && m.to.col === c,
                );
                return (
                  <button
                    key={`${r}-${c}`}
                    className="ui-btn ui-btn--ghost"
                    onClick={() => handleSquareClick(r, c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSquareClick(r, c);
                      }
                    }}
                    aria-label={`Square ${r},${c}`}
                    disabled={!!state.winner || !dark}
                    style={{
                      width: squareSize,
                      height: squareSize,
                      padding: 0,
                      display: "grid",
                      placeItems: "center",
                      background: dark ? "#2d2d2d" : "#e5e5e5",
                      borderColor: isMoveTarget
                        ? "var(--color-accent)"
                        : "var(--color-border)",
                      position: "relative",
                    }}
                  >
                    {isMoveTarget && (
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          inset: 6,
                          border: "2px dashed var(--color-accent)",
                          borderRadius: 6,
                        }}
                      />
                    )}
                    {renderPieceSymbol(r, c)}
                  </button>
                );
              }),
            )}
          </Grid>
        </Card>
      </div>
    </section>
  );
};

export default CheckersPage;
