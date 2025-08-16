import React from "react";
import Card from "../../components/UI/Card";
import Grid from "../../components/UI/Grid";
import Button from "../../components/UI/Button";
import { Select } from "../../components/UI/Select";
import {
  createInitialState,
  getStatus,
  applyMove,
  chooseBotMoveWithDifficulty,
  undo as undoGame,
  redo as redoGame,
  canUndo,
  canRedo,
  type GameState,
  type Color,
  type GoDifficulty,
} from "./domain";

const BOARD_SIZE = 9;
const squareSize = 44;

function stoneUnicode(color: Color | "empty"): string {
  if (color === "b") return "●";
  if (color === "w") return "○";
  return "";
}

const GoPage: React.FC = () => {
  const [humanColor, setHumanColor] = React.useState<Color>("b");
  const [difficulty, setDifficulty] = React.useState<GoDifficulty>("Medium");
  const [state, setState] = React.useState<GameState>(() =>
    createInitialState("b", BOARD_SIZE),
  );
  const status = getStatus(state);
  const turn: Color =
    status.kind === "InProgress" ? status.turn : state.humanColor;
  const botColor: Color = humanColor === "b" ? "w" : "b";
  const [error, setError] = React.useState<string | null>(null);

  const reset = React.useCallback(() => {
    setState(createInitialState(humanColor, BOARD_SIZE));
    setError(null);
  }, [humanColor]);

  React.useEffect(() => {
    setState(createInitialState(humanColor, BOARD_SIZE));
    setError(null);
  }, [humanColor]);

  React.useEffect(() => {
    if (status.kind !== "InProgress") return;
    if (turn !== botColor) return;
    const choice = chooseBotMoveWithDifficulty(state, botColor, difficulty);
    if (!choice) return;
    const id = setTimeout(() => {
      setState((prev) => applyMove(prev, choice));
    }, 250);
    return () => clearTimeout(id);
  }, [status.kind, turn, botColor, difficulty, state]);

  function onCellClick(row: number, col: number) {
    if (status.kind !== "InProgress") return;
    if (turn !== humanColor) return;
    try {
      setError(null);
      setState((prev) => applyMove(prev, { kind: "place", row, col }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Illegal move";
      setError(msg);
    }
  }

  function onPass() {
    if (status.kind !== "InProgress") return;
    if (turn !== humanColor) return;
    setError(null);
    setState((prev) => applyMove(prev, { kind: "pass" }));
  }

  function undo() {
    setState((prev) => undoGame(prev));
  }
  function redo() {
    setState((prev) => redoGame(prev));
  }

  const statusText = React.useMemo(() => {
    if (status.kind === "InProgress") {
      const t = status.turn === "b" ? "Black" : "White";
      return `Turn: ${t}`;
    }
    const b = status.score.b;
    const w = status.score.w;
    const winner =
      status.winner === "b"
        ? "Black"
        : status.winner === "w"
          ? "White"
          : "None";
    return `Game over (two passes). Score — Black ${b}, White ${w}. Winner: ${winner}`;
  }, [status]);

  return (
    <section className="gradient-bg" style={{ padding: "2rem 1rem" }}>
      <div
        style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}
      >
        <h2>Go (9×9)</h2>

        <Card title="Controls">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 8,
            }}
          >
            <Select
              label="Human Color"
              value={humanColor}
              onChange={(v) => setHumanColor(v as Color)}
              style={{ width: "100%" }}
              options={[
                { value: "b", label: "Black (first)" },
                { value: "w", label: "White" },
              ]}
            />
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(v) => setDifficulty(v as GoDifficulty)}
              style={{ width: "100%" }}
              options={[
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
              ]}
            />
            <div className="ui-field">
              <div className="ui-label">Start/Reset</div>
              <Button
                onClick={reset}
                aria-label="Start or reset game"
                fullWidth
              >
                Start/Reset
              </Button>
            </div>
            <div className="ui-field">
              <div className="ui-label">Undo</div>
              <Button
                variant="secondary"
                onClick={undo}
                disabled={!canUndo(state)}
                fullWidth
              >
                Undo
              </Button>
            </div>
            <div className="ui-field">
              <div className="ui-label">Redo</div>
              <Button
                variant="secondary"
                onClick={redo}
                disabled={!canRedo(state)}
                fullWidth
              >
                Redo
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
          <div
            aria-live="polite"
            role="status"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(1px, 1px, 1px, 1px)",
            }}
          >
            {statusText}
          </div>
          <Grid
            columns={BOARD_SIZE}
            gap={2}
            style={{ maxWidth: squareSize * BOARD_SIZE, margin: "0 auto" }}
          >
            {Array.from({ length: BOARD_SIZE }).map((_, r) =>
              Array.from({ length: BOARD_SIZE }).map((__, c) => {
                const v = state.board[r][c];
                const isIntersection = true;
                const label = stoneUnicode(v);
                const disabled =
                  status.kind !== "InProgress" ||
                  turn !== humanColor ||
                  v !== "empty";
                return (
                  <button
                    key={`${r}-${c}`}
                    className="ui-btn ui-btn--ghost"
                    onClick={() => onCellClick(r, c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onCellClick(r, c);
                      }
                    }}
                    aria-label={`Point ${r + 1},${c + 1}`}
                    disabled={disabled}
                    style={{
                      width: squareSize,
                      height: squareSize,
                      padding: 0,
                      display: "grid",
                      placeItems: "center",
                      background: "#deb887",
                      borderColor: "#b38b5d",
                      position: "relative",
                      fontSize: 28,
                    }}
                  >
                    {isIntersection && (
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          backgroundImage:
                            "linear-gradient(transparent calc(50% - 1px), #7a5536 calc(50% - 1px), #7a5536 calc(50% + 1px), transparent calc(50% + 1px)), linear-gradient(90deg, transparent calc(50% - 1px), #7a5536 calc(50% - 1px), #7a5536 calc(50% + 1px), transparent calc(50% + 1px))",
                          opacity: 0.35,
                        }}
                      />
                    )}
                    <span
                      aria-hidden
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background:
                          v === "b"
                            ? "#000"
                            : v === "w"
                              ? "#fff"
                              : "transparent",
                        boxShadow:
                          v === "b" || v === "w"
                            ? "0 1px 2px rgba(0,0,0,0.4) inset, 0 1px 2px rgba(0,0,0,0.25)"
                            : undefined,
                        border: v === "w" ? "1px solid #bbb" : undefined,
                      }}
                    >
                      {label ? (
                        <span style={{ visibility: "hidden" }}>{label}</span>
                      ) : null}
                    </span>
                  </button>
                );
              }),
            )}
          </Grid>
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginTop: 8,
            }}
          >
            <Button
              variant="secondary"
              onClick={onPass}
              disabled={status.kind !== "InProgress" || turn !== humanColor}
              aria-label="Pass"
            >
              Pass
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default GoPage;
