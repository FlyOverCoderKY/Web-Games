import { describe, it, expect, beforeEach } from "vitest";
import {
  Difficulty,
  DEFAULT_DIFFICULTY,
  getRangeForDifficulty,
  createNewGameState,
  applyGuess,
  startNewRound,
} from "../domain";

describe("number-guess domain", () => {
  beforeEach(() => {
    // Clear sessionStorage between tests
    if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  });

  it("range mapping per difficulty", () => {
    expect(getRangeForDifficulty(Difficulty.Easy)).toEqual({ min: 1, max: 50 });
    expect(getRangeForDifficulty(Difficulty.Normal)).toEqual({
      min: 1,
      max: 100,
    });
    expect(getRangeForDifficulty(Difficulty.Hard)).toEqual({
      min: 1,
      max: 500,
    });
  });

  it("new game state defaults", () => {
    const s = createNewGameState();
    expect(s.difficulty).toBe(DEFAULT_DIFFICULTY);
    expect(s.attemptCount).toBe(0);
    expect(s.previousDistance).toBeNull();
    expect(s.bestScore).toBeNull();
    expect(s.isRunning).toBe(true);
  });

  it("applyGuess tracks attempts and trend", () => {
    // Deterministic secret for test: monkey-patch state
    let s = createNewGameState(Difficulty.Normal);
    s = { ...s, secret: 50 };
    let r = applyGuess(s, 10);
    expect(r.outcome).toBe("too_low");
    expect(r.trend).toBeNull();
    s = r.updated;
    r = applyGuess(s, 80);
    expect(r.outcome).toBe("too_high");
    expect(r.trend).toBe("warmer");
    s = r.updated;
    // Move farther away to trigger 'colder'
    r = applyGuess(s, 90);
    expect(r.outcome).toBe("too_high");
    expect(r.trend).toBe("colder");
  });

  it("success computes score and best, and stops the round", () => {
    let s = createNewGameState(Difficulty.Easy);
    s = { ...s, secret: 5, range: { min: 1, max: 10 } };
    let r = applyGuess(s, 3); // wrong
    s = r.updated;
    r = applyGuess(s, 5); // correct on attempt 2
    expect(r.outcome).toBe("correct");
    expect(r.score).toBeDefined();
    expect(r.isNewBest).toBe(true);
    expect(r.updated.isRunning).toBe(false);
  });

  it("startNewRound resets counters and picks new secret", () => {
    const s = createNewGameState(Difficulty.Normal);
    const oldSecret = s.secret;
    const next = startNewRound(s);
    expect(next.attemptCount).toBe(0);
    expect(next.previousDistance).toBeNull();
    expect(next.isRunning).toBe(true);
    expect(next.secret).not.toBe(oldSecret);
  });
});
