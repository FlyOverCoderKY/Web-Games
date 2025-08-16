import { describe, it, expect } from "vitest";
import { AsyncStatus, type Result } from "../common";

describe("types/common", () => {
  it("AsyncStatus enum values", () => {
    expect(Object.values(AsyncStatus)).toEqual([
      "Idle",
      "Pending",
      "Success",
      "Error",
    ]);
  });

  it("Result type narrows", () => {
    const ok: Result<number> = { ok: true, value: 1 };
    const err: Result<number> = { ok: false, error: new Error("x") };
    expect(ok.ok).toBe(true);
    expect(err.ok).toBe(false);
  });
});
