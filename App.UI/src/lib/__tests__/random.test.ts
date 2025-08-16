import { describe, it, expect } from "vitest";
import {
  createRng,
  seedFromString,
  getSeedFromQuery,
  rngFromUrlOrCrypto,
  __test__,
} from "../random";

describe("seedFromString", () => {
  it("produces stable 32-bit hash for the same string", () => {
    const a = seedFromString("hello");
    const b = seedFromString("hello");
    expect(a).toBe(b);
  });
});

describe("createRng with numeric seed", () => {
  it("is deterministic for the same seed", () => {
    const rng1 = createRng(123);
    const rng2 = createRng(123);
    const seq1 = Array.from({ length: 5 }, () => rng1.next());
    const seq2 = Array.from({ length: 5 }, () => rng2.next());
    expect(seq1).toEqual(seq2);
  });

  it("produces values in [0, 1)", () => {
    const rng = createRng(42);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("API helpers", () => {
  it("nextInt bounds", () => {
    const rng = createRng(7);
    for (let i = 0; i < 100; i++) {
      const v = rng.nextInt(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  it("int inclusive range", () => {
    const rng = createRng(9);
    for (let i = 0; i < 100; i++) {
      const v = rng.int(-3, 3);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThanOrEqual(3);
    }
  });

  it("shuffle and pick", () => {
    const rng = createRng(123);
    const arr = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(arr);
    expect(shuffled).toHaveLength(arr.length);
    expect(new Set(shuffled)).toEqual(new Set(arr));
    expect(rng.pick(arr)).toBeTypeOf("number");
  });
});

describe("URL seed parsing", () => {
  it("extracts seed from query string", () => {
    expect(getSeedFromQuery("?seed=abc")).toBe("abc");
    expect(getSeedFromQuery("seed=123")).toBe("123");
    expect(getSeedFromQuery("?other=x")).toBeUndefined();
  });

  it("rngFromUrlOrCrypto uses numeric seed when possible", () => {
    const rngA = rngFromUrlOrCrypto("?seed=100");
    const rngB = rngFromUrlOrCrypto("?seed=100");
    expect(Array.from({ length: 3 }, () => rngA.next())).toEqual(
      Array.from({ length: 3 }, () => rngB.next()),
    );
  });
});

describe("internal mulberry32", () => {
  it("is deterministic for the same seed", () => {
    const genA = __test__.mulberry32(1);
    const genB = __test__.mulberry32(1);
    const seqA = [genA(), genA(), genA()];
    const seqB = [genB(), genB(), genB()];
    expect(seqA).toEqual(seqB);
  });

  it("differs for different seeds", () => {
    const genA = __test__.mulberry32(1);
    const genB = __test__.mulberry32(2);
    const a = [genA(), genA(), genA()];
    const b = [genB(), genB(), genB()];
    expect(a).not.toEqual(b);
  });
});
