import { describe, it, expect } from "vitest";
import {
  pluralize,
  formatOrdinal,
  formatRange,
  formatScore,
  formatList,
  capitalize,
  formatElapsedMs,
} from "../format";

describe("format helpers", () => {
  it("pluralize", () => {
    expect(pluralize(1, "attempt")).toBe("1 attempt");
    expect(pluralize(2, "attempt")).toBe("2 attempts");
    expect(pluralize(3, "class")).toBe("3 classes");
    expect(pluralize(2, "goose", "geese")).toBe("2 geese");
  });

  it("formatOrdinal", () => {
    expect(formatOrdinal(1)).toBe("1st");
    expect(formatOrdinal(2)).toBe("2nd");
    expect(formatOrdinal(3)).toBe("3rd");
    expect(formatOrdinal(4)).toBe("4th");
    expect(formatOrdinal(11)).toBe("11th");
    expect(formatOrdinal(21)).toBe("21st");
  });

  it("formatRange", () => {
    expect(formatRange({ min: 1, max: 100 })).toBe("1–100");
    expect(formatRange({ min: -5, max: 5 }, " to ")).toBe("-5 to 5");
  });

  it("formatScore", () => {
    expect(formatScore(10000, "en-US")).toBe("10,000");
  });

  it("formatList", () => {
    expect(formatList([])).toBe("");
    expect(formatList(["A"])).toBe("A");
    expect(formatList(["A", "B"])).toBe("A and B");
    expect(formatList(["A", "B", "C"])).toBe("A, B, and C");
  });

  it("capitalize", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("")).toBe("");
  });

  it("formatElapsedMs", () => {
    expect(formatElapsedMs(345)).toBe("345ms");
    expect(formatElapsedMs(4000)).toBe("4s");
    expect(formatElapsedMs(65000)).toBe("1m 5s");
  });
});
