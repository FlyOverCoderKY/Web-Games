import React from "react";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { Select } from "../../components/UI/Select";
import {
  generatePuzzle,
  type SudokuDifficulty,
  type Board,
  type CellValue,
  isValidPlacement,
  solve,
} from "./domain";

type Mode = "Play" | "Check";

const difficultyOptions = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
] as const;

function clone(board: Board): Board {
  return board.map((r) => r.slice()) as Board;
}

const cellSize = 44;

const SudokuPage: React.FC = () => {
  const [difficulty, setDifficulty] =
    React.useState<SudokuDifficulty>("Medium");
  const [seed, setSeed] = React.useState<string>("");
  const [puzzle, setPuzzle] = React.useState<Board>(
    () => generatePuzzle({ difficulty }).puzzle,
  );
  const [solution, setSolution] = React.useState<Board>(() => solve(puzzle)!);
  const [work, setWork] = React.useState<Board>(() => clone(puzzle));
  const [mode, setMode] = React.useState<Mode>("Play");
  const modeOptions = [
    { value: "Play", label: "Play" },
    { value: "Check", label: "Check Mistakes" },
  ] as const;

  const regenerate = React.useCallback(() => {
    const parsedSeed = seed.trim() === "" ? undefined : seed;
    const { puzzle: p, solution: s } = generatePuzzle({
      difficulty,
      seed: parsedSeed,
    });
    setPuzzle(p);
    setSolution(s);
    setWork(clone(p));
  }, [difficulty, seed]);

  React.useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  function setCell(r: number, c: number, value: number) {
    if (puzzle[r][c] !== 0) return; // cannot change given clues
    if (value < 0 || value > 9) return;
    setWork((prev) => {
      const next = clone(prev);
      next[r][c] = value as CellValue;
      return next;
    });
  }

  function handleKey(
    r: number,
    c: number,
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    if (e.key >= "1" && e.key <= "9") {
      setCell(r, c, Number(e.key));
    } else if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "0" ||
      e.key === " "
    ) {
      setCell(r, c, 0);
    } else if (e.key === "ArrowUp") {
      const el = document.getElementById(`cell-${Math.max(0, r - 1)}-${c}`);
      el?.focus();
    } else if (e.key === "ArrowDown") {
      const el = document.getElementById(`cell-${Math.min(8, r + 1)}-${c}`);
      el?.focus();
    } else if (e.key === "ArrowLeft") {
      const el = document.getElementById(`cell-${r}-${Math.max(0, c - 1)}`);
      el?.focus();
    } else if (e.key === "ArrowRight") {
      const el = document.getElementById(`cell-${r}-${Math.min(8, c + 1)}`);
      el?.focus();
    }
  }

  function checkMistakes(): Array<{ r: number; c: number }> {
    const mistakes: Array<{ r: number; c: number }> = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = work[r][c];
        if (v === 0) continue;
        if (!isValidPlacement(work, r, c, v)) mistakes.push({ r, c });
      }
    }
    return mistakes;
  }

  const mistakes = mode === "Check" ? checkMistakes() : [];
  const mistakeSet = new Set(mistakes.map((m) => `${m.r}-${m.c}`));

  const solved = React.useMemo(() => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (work[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  }, [solution, work]);

  const digitCounts = React.useMemo(() => {
    const counts = Array<number>(10).fill(0);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = work[r][c];
        if (v >= 1 && v <= 9) counts[v]! += 1;
      }
    }
    return counts as ReadonlyArray<number>;
  }, [work]);

  return (
    <section className="gradient-bg" style={{ padding: "2rem 1rem" }}>
      <div
        style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 16 }}
      >
        <h2>Sudoku</h2>

        <Card title="Controls">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 8,
            }}
          >
            <Select<SudokuDifficulty>
              label="Difficulty"
              value={difficulty}
              onChange={(v) => setDifficulty(v)}
              options={difficultyOptions}
            />
            <div className="ui-field" style={{ gridColumn: "span 2" }}>
              <div className="ui-label">Seed (optional)</div>
              <input
                className="ui-input"
                placeholder="seed for reproducible puzzles"
                value={seed}
                onChange={(e) => setSeed(e.currentTarget.value)}
              />
              <div className="ui-help">
                Leave blank for random; same seed + difficulty yields same
                puzzle
              </div>
            </div>
            <div className="ui-field">
              <div className="ui-label">Mode</div>
              <Select<Mode>
                value={mode}
                onChange={(v) => setMode(v)}
                options={modeOptions}
              />
            </div>
            <div className="ui-field">
              <div className="ui-label">Actions</div>
              <Button onClick={regenerate} fullWidth>
                New Puzzle
              </Button>
            </div>
          </div>
        </Card>

        <Card
          title="Board"
          subtitle={solved ? "Solved!" : "Fill the grid with digits 1–9"}
        >
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(9, ${cellSize}px)`,
                gap: 0,
                width: cellSize * 9,
              }}
            >
              {Array.from({ length: 9 }).map((_, r) =>
                Array.from({ length: 9 }).map((__, c) => {
                  const given = puzzle[r][c] !== 0;
                  const v = work[r][c];
                  const id = `cell-${r}-${c}`;
                  const isMistake = mistakeSet.has(`${r}-${c}`);
                  const borderStyle: React.CSSProperties = {
                    borderTop:
                      r % 3 === 0
                        ? "3px solid var(--color-border-strong)"
                        : "1px solid var(--color-border-strong)",
                    borderBottom:
                      (r + 1) % 3 === 0
                        ? "3px solid var(--color-border-strong)"
                        : "1px solid var(--color-border-strong)",
                    borderLeft:
                      c % 3 === 0
                        ? "3px solid var(--color-border-strong)"
                        : "1px solid var(--color-border-strong)",
                    borderRight:
                      (c + 1) % 3 === 0
                        ? "3px solid var(--color-border-strong)"
                        : "1px solid var(--color-border-strong)",
                  };
                  return (
                    <button
                      key={`${r}-${c}`}
                      id={id}
                      onKeyDown={(e) => handleKey(r, c, e)}
                      onClick={() => {
                        /* focus only */
                      }}
                      className="ui-btn ui-btn--ghost"
                      aria-label={`Row ${r + 1} Column ${c + 1}`}
                      disabled={false}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        lineHeight: `${cellSize}px`,
                        textAlign: "center",
                        fontSize: 18,
                        fontWeight: given ? 700 : 600,
                        background: given
                          ? "var(--color-page-background)"
                          : "var(--color-overlay-background)",
                        color: isMistake
                          ? "var(--color-error)"
                          : "var(--color-foreground)",
                        ...borderStyle,
                      }}
                    >
                      {v === 0 ? "" : String(v)}
                    </button>
                  );
                }),
              )}
            </div>
            <div aria-label="Digit tally" style={{ minWidth: 140 }}>
              <div className="ui-label" style={{ marginBottom: 8 }}>
                Digit tally
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {Array.from({ length: 9 }).map((_, i) => {
                  const d = i + 1;
                  const count = digitCounts[d] ?? 0;
                  const pct = Math.max(0, Math.min(100, (count / 9) * 100));
                  return (
                    <div
                      key={d}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "28px 1fr auto",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ textAlign: "right", fontWeight: 700 }}>
                        {d}
                      </div>
                      <div
                        aria-hidden="true"
                        style={{
                          height: 8,
                          background: "var(--color-border)",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: 8,
                            background: "var(--color-accent)",
                          }}
                        />
                      </div>
                      <div
                        className="ui-help"
                        style={{ minWidth: 36, textAlign: "right" }}
                      >
                        {count}/9
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <Button variant="secondary" onClick={() => setWork(clone(puzzle))}>
              Clear
            </Button>
            <Button
              variant="secondary"
              style={{ marginLeft: 8 }}
              onClick={() => setWork(clone(solution))}
            >
              Solve
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default SudokuPage;
