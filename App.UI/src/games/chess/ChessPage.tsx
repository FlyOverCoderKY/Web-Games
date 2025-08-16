import React from "react";
import Card from "../../components/UI/Card";
import Grid from "../../components/UI/Grid";
import Button from "../../components/UI/Button";
import { Select } from "../../components/UI/Select";
import {
  createInitialState,
  getStatus,
  getBoard,
  listLegalMoves,
  applyMove,
  chooseBotMoveWithDifficulty,
  undo as undoGame,
  redo as redoGame,
  canUndo,
  canRedo,
  type GameState,
  type Color,
  type ChessDifficulty,
  type SerializableMove,
} from "./domain";
import type { Move } from "chess.js";

const BOARD_SIZE = 8;
const squareSize = 56;

function filesForOrientation(orientation: Color): string[] {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  return orientation === "w" ? files : [...files].reverse();
}

function ranksForOrientation(orientation: Color): number[] {
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  return orientation === "w" ? ranks : [...ranks].reverse();
}

function indexToSquare(rowIndex: number, colIndex: number, orientation: Color): string {
  const files = filesForOrientation(orientation);
  const ranks = ranksForOrientation(orientation);
  const file = files[colIndex];
  const rank = ranks[rowIndex];
  return `${file}${rank}`;
}

function isDarkSquareByIndex(rowIndex: number, colIndex: number): boolean {
  return (rowIndex + colIndex) % 2 === 1;
}

function pieceUnicode(piece: { type: string; color: Color } | null): string {
  if (!piece) return "";
  const map: Record<string, { w: string; b: string }> = {
    p: { w: "♙", b: "♟" },
    r: { w: "♖", b: "♜" },
    n: { w: "♘", b: "♞" },
    b: { w: "♗", b: "♝" },
    q: { w: "♕", b: "♛" },
    k: { w: "♔", b: "♚" },
  };
  return map[piece.type][piece.color];
}

const ChessPage: React.FC = () => {
  const [humanColor, setHumanColor] = React.useState<Color>("w");
  const [difficulty, setDifficulty] = React.useState<ChessDifficulty>("Medium");
  const [state, setState] = React.useState<GameState>(() => createInitialState("w"));
  const [selected, setSelected] = React.useState<string | null>(null);
  const [moves, setMoves] = React.useState<Move[]>([]);
  const status = getStatus(state.fen);
  const turn: Color = status.kind === "InProgress" ? status.turn : state.humanColor;
  const botColor: Color = humanColor === "w" ? "b" : "w";

  const reset = React.useCallback(() => {
    setSelected(null);
    setMoves([]);
    setState(createInitialState(humanColor));
  }, [humanColor]);

  React.useEffect(() => {
    // When settings change, reset game. If bot starts, make its move.
    setSelected(null);
    setMoves([]);
    setState(createInitialState(humanColor));
  }, [humanColor]);

  React.useEffect(() => {
    if (status.kind !== "InProgress") return;
    if (turn !== botColor) return;
    const choice = chooseBotMoveWithDifficulty(state.fen, botColor, difficulty);
    if (!choice) return;
    const id = setTimeout(() => {
      setState((prev) => applyMove(prev, choice as SerializableMove));
    }, 300);
    return () => clearTimeout(id);
  }, [status.kind, turn, botColor, difficulty, state.fen]);

  function onSquareClick(rowIndex: number, colIndex: number) {
    if (status.kind !== "InProgress") return;
    if (turn !== humanColor) return;
    const square = indexToSquare(rowIndex, colIndex, humanColor);

    // If selecting a piece
    if (!selected) {
      const legalFrom = listLegalMoves(state.fen, square as any);
      if (legalFrom.length === 0) return;
      setSelected(square);
      setMoves(legalFrom);
      return;
    }

    // If clicking the same square, deselect
    if (selected === square) {
      setSelected(null);
      setMoves([]);
      return;
    }

    // If clicking a target
    const target = moves.find((m) => (m as any).to === square);
    if (target) {
      const move: SerializableMove = {
        from: selected as any,
        to: square as any,
        promotion: "q",
      };
      setSelected(null);
      setMoves([]);
      setState((prev) => applyMove(prev, move));
      return;
    }

    // Else, switch selection if new square has moves
    const legalFrom = listLegalMoves(state.fen, square as any);
    if (legalFrom.length > 0) {
      setSelected(square);
      setMoves(legalFrom);
    } else {
      setSelected(null);
      setMoves([]);
    }
  }

  function undo() {
    setSelected(null);
    setMoves([]);
    setState((prev) => undoGame(prev));
  }
  function redo() {
    setSelected(null);
    setMoves([]);
    setState((prev) => redoGame(prev));
  }

  const statusText = React.useMemo(() => {
    if (status.kind === "InProgress") {
      const t = status.turn === "w" ? "White" : "Black";
      return status.inCheck ? `Turn: ${t} — Check` : `Turn: ${t}`;
    }
    if (status.kind === "Checkmate") {
      const w = status.winner === "w" ? "White" : "Black";
      return `${w} wins by checkmate!`;
    }
    if (status.kind === "Draw") {
      return `Draw (${status.reason})`;
    }
    return "";
  }, [status]);

  const board = getBoard(state.fen);
  const renderRows = ranksForOrientation(humanColor).map((rank) => 8 - rank);
  const renderCols = filesForOrientation(humanColor).map((_, i) => i);

  return (
    <section className="gradient-bg" style={{ padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}>
        <h2>Chess</h2>

        <Card title="Controls">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            <Select
              label="Human Color"
              value={humanColor}
              onChange={(v) => setHumanColor(v as Color)}
              style={{ width: "100%" }}
              options={[
                { value: "w", label: "White" },
                { value: "b", label: "Black" },
              ]}
            />
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(v) => setDifficulty(v as ChessDifficulty)}
              style={{ width: "100%" }}
              options={[
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
              ]}
            />
            <div className="ui-field">
              <div className="ui-label">Start/Reset</div>
              <Button onClick={reset} aria-label="Start or reset game" fullWidth>
                Start/Reset
              </Button>
            </div>
            <div className="ui-field">
              <div className="ui-label">Undo</div>
              <Button variant="secondary" onClick={undo} disabled={!canUndo(state)} fullWidth>
                Undo
              </Button>
            </div>
            <div className="ui-field">
              <div className="ui-label">Redo</div>
              <Button variant="secondary" onClick={redo} disabled={!canRedo(state)} fullWidth>
                Redo
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Board" subtitle={statusText}>
          <Grid columns={BOARD_SIZE} gap={4} style={{ maxWidth: squareSize * BOARD_SIZE, margin: "0 auto" }}>
            {renderRows.map((r) =>
              renderCols.map((c) => {
                const dark = isDarkSquareByIndex(r, c);
                const square = indexToSquare(r, c, humanColor);
                const legal = moves.some((m) => (m as any).to === square);
                const piece = board[r][c] as any;
                return (
                  <button
                    key={`${r}-${c}`}
                    className="ui-btn ui-btn--ghost"
                    onClick={() => onSquareClick(r, c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSquareClick(r, c);
                      }
                    }}
                    aria-label={`Square ${square}`}
                    disabled={status.kind !== "InProgress"}
                    style={{
                      width: squareSize,
                      height: squareSize,
                      padding: 0,
                      display: "grid",
                      placeItems: "center",
                      background: dark ? "#b58863" : "#f0d9b5",
                      borderColor: legal ? "var(--color-accent)" : "var(--color-border)",
                      position: "relative",
                      fontSize: 28,
                    }}
                  >
                    {selected === square && (
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
                    <span aria-hidden>{pieceUnicode(piece)}</span>
                  </button>
                );
              })
            )}
          </Grid>
        </Card>
      </div>
    </section>
  );
};

export default ChessPage;


