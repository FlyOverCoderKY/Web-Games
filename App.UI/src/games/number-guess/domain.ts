export enum Difficulty {
  Easy = "Easy",
  Normal = "Normal",
  Hard = "Hard",
}
import { getDefaultRng } from "../../lib/random";

export const DEFAULT_DIFFICULTY: Difficulty = Difficulty.Normal;

export interface Range {
  min: number;
  max: number;
}

export function getRangeForDifficulty(difficulty: Difficulty): Range {
  switch (difficulty) {
    case Difficulty.Easy:
      return { min: 1, max: 50 };
    case Difficulty.Hard:
      return { min: 1, max: 500 };
    case Difficulty.Normal:
    default:
      return { min: 1, max: 100 };
  }
}

export function pickSecret(difficulty: Difficulty): number {
  const { min, max } = getRangeForDifficulty(difficulty);
  // Use shared RNG with URL seed support for determinism when desired
  const rng = getDefaultRng();
  return rng.int(min, max);
}

export function computeDistance(secret: number, guess: number): number {
  return Math.abs(secret - guess);
}

export function computeDifficultyBonus(range: Range): number {
  const total = range.max - range.min + 1;
  return Math.floor(Math.log2(total));
}

export function computeScore(attempts: number, range: Range): number {
  const bonus = computeDifficultyBonus(range);
  return Math.max(1, attempts * 100 - bonus);
}

export interface GameState {
  difficulty: Difficulty;
  range: Range;
  secret: number;
  attemptCount: number;
  previousDistance: number | null;
  bestScore: number | null;
  isRunning: boolean;
}

export function createNewGameState(
  difficulty: Difficulty = DEFAULT_DIFFICULTY,
): GameState {
  const range = getRangeForDifficulty(difficulty);
  return {
    difficulty,
    range,
    secret: pickSecret(difficulty),
    attemptCount: 0,
    previousDistance: null,
    bestScore: null,
    isRunning: true,
  };
}

// --- Persistent best score (sessionStorage) ---
const BEST_SCORE_KEY = "number-guess:best-score";

export function loadBestScore(): number | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(BEST_SCORE_KEY);
  if (!raw) return null;
  const val = Number(raw);
  return Number.isFinite(val) ? val : null;
}

export function saveBestScore(score: number): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(BEST_SCORE_KEY, String(score));
}

export type GuessOutcome = "too_low" | "too_high" | "correct";
export type Trend = "warmer" | "colder" | "same" | null;

export interface GuessResult {
  outcome: GuessOutcome;
  trend: Trend;
  updated: GameState;
  score?: number;
  isNewBest?: boolean;
}

export function startNewRound(state: GameState): GameState {
  const nextSecret = pickSecret(state.difficulty);
  return {
    ...state,
    secret: nextSecret,
    attemptCount: 0,
    previousDistance: null,
    isRunning: true,
  };
}

export function applyGuess(state: GameState, guess: number): GuessResult {
  if (!state.isRunning) {
    return { outcome: "correct", trend: null, updated: state };
  }

  const distance = computeDistance(state.secret, guess);
  const outcome: GuessOutcome =
    guess === state.secret
      ? "correct"
      : guess < state.secret
        ? "too_low"
        : "too_high";

  const attemptCount = state.attemptCount + 1;
  let trend: Trend = null;
  if (state.previousDistance !== null && outcome !== "correct") {
    if (distance < state.previousDistance) trend = "warmer";
    else if (distance > state.previousDistance) trend = "colder";
    else trend = "same";
  }

  const updatedBase: GameState = {
    ...state,
    attemptCount,
    previousDistance: outcome === "correct" ? state.previousDistance : distance,
  };

  if (outcome !== "correct") {
    return { outcome, trend, updated: updatedBase };
  }

  // Success path: compute score and best
  const score = computeScore(attemptCount, state.range);
  const currentBest = loadBestScore();
  let isNewBest = false;
  let bestScore = currentBest;
  if (currentBest === null || score < currentBest) {
    isNewBest = true;
    bestScore = score;
    saveBestScore(score);
  }

  const updated: GameState = {
    ...updatedBase,
    bestScore,
    isRunning: false,
  };
  return { outcome, trend: null, updated, score, isNewBest };
}
