import React, { useMemo, useState } from "react";
import { Button } from "../../components/UI/Button";
import { TextInput } from "../../components/UI/TextInput";
import { Select } from "../../components/UI/Select";
import { Card } from "../../components/UI/Card";
import { formatRange, pluralize } from "../../lib/format";
import {
  Difficulty,
  createNewGameState,
  getRangeForDifficulty,
  applyGuess,
  startNewRound,
  loadBestScore,
  type GameState,
} from "./domain";

const difficultyOptions = [
  { value: Difficulty.Easy, label: "Easy (1–50)" },
  { value: Difficulty.Normal, label: "Normal (1–100)" },
  { value: Difficulty.Hard, label: "Hard (1–500)" },
];

const NumberGuessPage: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Normal);
  const [state, setState] = useState<GameState>(() => {
    const s = createNewGameState(difficulty);
    const best = loadBestScore();
    return { ...s, bestScore: best };
  });
  const [guessInput, setGuessInput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const range = useMemo(() => getRangeForDifficulty(difficulty), [difficulty]);

  const handleDifficultyChange = (value: Difficulty) => {
    setDifficulty(value);
    const s = createNewGameState(value);
    setState({ ...s, bestScore: loadBestScore() });
    setGuessInput("");
    setError("");
    setStatus("");
  };

  const handleStartReset = () => {
    const next = startNewRound(state);
    setState(next);
    setGuessInput("");
    setError("");
    setStatus("");
  };

  const validateGuess = (value: string): string | null => {
    const raw = value.trim();
    if (raw.length === 0) return "Please enter a number.";
    const parsed = Number(raw);
    if (!Number.isInteger(parsed))
      return "Invalid input. Please enter a valid integer.";
    if (parsed < range.min || parsed > range.max)
      return `Out of range. Enter a number between ${range.min} and ${range.max}.`;
    return null;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateGuess(guessInput);
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    const guess = Number(guessInput.trim());
    const result = applyGuess(state, guess);
    setState(result.updated);

    if (result.outcome === "correct") {
      const attemptsText = pluralize(result.updated.attemptCount, "attempt");
      const scoreText = result.isNewBest
        ? `New best score: ${result.score} (lower is better)`
        : `Score: ${result?.score}. Best: ${result.updated.bestScore ?? "—"} (lower is better)`;
      setStatus(`Correct! You got it in ${attemptsText}. ${scoreText}`);
    } else {
      const direction =
        result.outcome === "too_low"
          ? "Too low. Try higher."
          : "Too high. Try lower.";
      const prefix =
        result.trend === "warmer"
          ? "Warmer! "
          : result.trend === "colder"
            ? "Colder! "
            : "";
      setStatus(`${prefix}${direction}`);
    }
  };

  return (
    <section className="gradient-bg" style={{ padding: "2rem 1rem" }}>
      <div
        style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 16 }}
      >
        <h2>Number Guess</h2>

        <Card title="Settings" subtitle="Choose difficulty and start/reset">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(v) => handleDifficultyChange(v as Difficulty)}
              options={difficultyOptions}
            />
            <Button onClick={handleStartReset} aria-label="Start or reset game">
              Start / Reset
            </Button>
          </div>
          <div style={{ marginTop: 8, color: "var(--color-foreground-muted)" }}>
            Range: {formatRange(range)}
            {state.bestScore !== null && (
              <span aria-label="Best score"> • Best: {state.bestScore}</span>
            )}
          </div>
        </Card>

        <Card title="Your Guess" subtitle="Enter an integer within the range">
          <form onSubmit={onSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                alignItems: "end",
              }}
            >
              <TextInput
                label={`Enter your guess (${range.min}-${range.max})`}
                inputMode="numeric"
                value={guessInput}
                onChange={(e) => setGuessInput(e.currentTarget.value)}
                aria-describedby="guess-help"
              />
              <Button type="submit">Submit</Button>
            </div>
            <div
              id="guess-help"
              style={{ marginTop: 6, color: "var(--color-foreground-muted)" }}
            >
              Attempts: {state.attemptCount}
            </div>
          </form>

          <div
            aria-live="polite"
            role="status"
            style={{ marginTop: 12, minHeight: 24 }}
          >
            {status}
          </div>
          {error && (
            <div
              aria-live="polite"
              role="alert"
              style={{ marginTop: 8, color: "var(--color-error)" }}
            >
              {error}
            </div>
          )}

          {!state.isRunning && (
            <div style={{ marginTop: 12 }}>
              <Button onClick={handleStartReset}>Play again</Button>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default NumberGuessPage;
