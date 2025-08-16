import React from "react";
import Card from "../../components/UI/Card";
import Grid from "../../components/UI/Grid";
import Button from "../../components/UI/Button";
import { Select } from "../../components/UI/Select";
import {
  GameState,
  createInitialState,
  getStatus,
  applyMoveWithHistory,
  chooseBotMoveWithDifficulty,
  undo as undoGame,
  redo as redoGame,
  canUndo,
  canRedo,
  Player,
  type TicTacToeDifficulty,
} from "./domain";

const TicTacToePage: React.FC = () => {
  const [startingPlayer, setStartingPlayer] = React.useState<Player>("X");
  const [humanPlayer, setHumanPlayer] = React.useState<Player>("X");
  const [state, setState] = React.useState<GameState>(() =>
    createInitialState({ startingPlayer: "X", humanPlayer: "X" }),
  );
  const [difficulty, setDifficulty] =
    React.useState<TicTacToeDifficulty>("Medium");
  const status = getStatus(state.board);
  const [error, setError] = React.useState<string | null>(null);
  const bot: Player = humanPlayer === "X" ? "O" : "X";

  const maybeBotMove = React.useCallback(
    (next: GameState) => {
      const s = getStatus(next.board);
      if (s !== "InProgress") return next;
      if (next.board.currentPlayer !== bot) return next;
      const choice = chooseBotMoveWithDifficulty(next.board, bot, difficulty);
      if (!choice) return next;
      return applyMoveWithHistory(next, { ...choice, player: bot });
    },
    [bot, difficulty],
  );

  const reset = React.useCallback(() => {
    setState(() => {
      const fresh = createInitialState({ startingPlayer, humanPlayer });
      if (fresh.board.currentPlayer === bot) {
        return maybeBotMove(fresh);
      }
      return fresh;
    });
  }, [startingPlayer, humanPlayer, bot, maybeBotMove]);

  // If bot starts, make immediate move once after mount or when settings change
  React.useEffect(() => {
    setState(() => {
      const fresh = createInitialState({ startingPlayer, humanPlayer });
      if (fresh.board.currentPlayer === bot) {
        const withBot = maybeBotMove(fresh);
        return withBot;
      }
      return fresh;
    });
  }, [startingPlayer, humanPlayer, bot, maybeBotMove]);

  function handleCellClick(row: number, col: number) {
    if (status !== "InProgress") return;
    if (state.board.currentPlayer !== humanPlayer) return;
    try {
      setError(null);
      const afterHuman = applyMoveWithHistory(state, {
        row,
        col,
        player: humanPlayer,
      });
      const afterBot = maybeBotMove(afterHuman);
      setState(afterBot);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid move";
      setError(message);
    }
  }

  function swapMarks() {
    setHumanPlayer((p) => (p === "X" ? "O" : "X"));
  }

  function undo() {
    setState((prev) => undoGame(prev));
  }
  function redo() {
    setState((prev) => redoGame(prev));
  }

  const statusText =
    status === "InProgress"
      ? `Turn: ${state.board.currentPlayer}`
      : status === "Draw"
        ? "Draw."
        : status === "XWins"
          ? "X wins!"
          : "O wins!";

  return (
    <section className="gradient-bg" style={{ padding: "2rem 1rem" }}>
      <div
        style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 16 }}
      >
        <h2>Tic-Tac-Toe</h2>

        <Card title="Controls">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 8,
            }}
          >
            <Select
              label="Who starts"
              value={startingPlayer}
              onChange={(v) => setStartingPlayer(v as Player)}
              style={{ width: "100%" }}
              options={[
                { value: "X", label: "X Starts" },
                { value: "O", label: "O Starts" },
              ]}
            />
            <Select
              label="Human mark"
              value={humanPlayer}
              onChange={(v) => setHumanPlayer(v as Player)}
              style={{ width: "100%" }}
              options={[
                { value: "X", label: "Human: X" },
                { value: "O", label: "Human: O" },
              ]}
            />
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(v) => setDifficulty(v as TicTacToeDifficulty)}
              style={{ width: "100%" }}
              options={[
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
              ]}
            />
            <div className="ui-field">
              <div className="ui-label">Swap Marks</div>
              <Button
                variant="secondary"
                onClick={swapMarks}
                aria-label="Swap marks"
                fullWidth
              >
                Swap
              </Button>
            </div>
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
          <Grid columns={3} gap={8} style={{ maxWidth: 360, margin: "0 auto" }}>
            {Array.from({ length: 3 }).map((_, r) =>
              Array.from({ length: 3 }).map((__, c) => {
                const idx = r * 3 + c;
                const v = state.board.cells[idx];
                const label = v === "Empty" ? " " : v;
                const disabled =
                  v !== "Empty" ||
                  status !== "InProgress" ||
                  state.board.currentPlayer !== humanPlayer;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCellClick(r, c);
                      }
                    }}
                    disabled={disabled}
                    aria-label={`Cell ${r},${c}`}
                    className="ui-btn ui-btn--ghost"
                    style={{
                      height: 100,
                      fontSize: "2rem",
                      background: "var(--color-page-background)",
                      borderColor: "var(--color-border-strong)",
                      color:
                        v === "X"
                          ? "var(--color-accent)"
                          : v === "O"
                            ? "var(--color-warning)"
                            : "var(--color-foreground)",
                      fontWeight: 800,
                    }}
                  >
                    {label}
                  </button>
                );
              }),
            )}
          </Grid>
        </Card>

        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button
            variant="secondary"
            onClick={undo}
            disabled={!canUndo(state)}
            aria-label="Undo"
          >
            Undo
          </Button>
          <Button
            variant="secondary"
            onClick={redo}
            disabled={!canRedo(state)}
            aria-label="Redo"
          >
            Redo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TicTacToePage;
