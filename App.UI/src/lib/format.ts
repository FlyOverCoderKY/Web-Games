// Small text formatting helpers. Keep pure and tree-shakeable.

export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const word =
    count === 1
      ? singular
      : (plural ?? `${singular}${singular.endsWith("s") ? "es" : "s"}`);
  return `${count} ${word}`;
}

export function formatOrdinal(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const s = ["th", "st", "nd", "rd"];
  const v = abs % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export interface NumericRange {
  min: number;
  max: number;
}
export function formatRange(range: NumericRange, separator = "–"): string {
  return `${range.min}${separator}${range.max}`;
}

export function formatScore(score: number, locale?: string): string {
  return score.toLocaleString(locale);
}

export function formatList(
  items: readonly string[],
  conjunction: "and" | "or" = "and",
): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
}

export function capitalize(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export function formatElapsedMs(totalMs: number): string {
  if (totalMs < 1000) return `${Math.round(totalMs)}ms`;
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}
