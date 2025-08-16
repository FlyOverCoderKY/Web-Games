// Deterministic, seedable RNG utilities with safe crypto fallback

export type RandomNumberGenerator = () => number;

export interface Rng {
  // Float in [0, 1)
  next(): number;
  // Integer in [0, maxExclusive)
  nextInt(maxExclusive: number): number;
  // Float in [min, max)
  float(min: number, max: number): number;
  // Integer in [min, max] inclusive
  int(min: number, max: number): number;
  // Returns a new shuffled array (does not mutate input)
  shuffle<T>(items: readonly T[]): T[];
  // Picks a single element or undefined when empty
  pick<T>(items: readonly T[]): T | undefined;
}

// --- Core implementations ---

// mulberry32 PRNG: tiny, fast, decent statistical quality for games
function mulberry32(seed: number): RandomNumberGenerator {
  let state = seed >>> 0;
  return () => {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return result;
  };
}

// FNV-1a 32-bit hash to turn arbitrary strings into 32-bit seeds
export function seedFromString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function cryptoRandom(): number {
  const g = globalThis as unknown as {
    crypto?: { getRandomValues?: (arr: Uint32Array) => void };
  };
  const webCrypto = g.crypto?.getRandomValues;
  if (typeof webCrypto === "function") {
    const arr = new Uint32Array(1);
    g.crypto!.getRandomValues!(arr);
    return arr[0] / 4294967296;
  }
  // Last resort; not cryptographically secure
  return Math.random();
}

export function createRng(seed?: string | number): Rng {
  const seededRandom: RandomNumberGenerator | null =
    seed === undefined
      ? null
      : typeof seed === "number"
        ? mulberry32(seed >>> 0)
        : mulberry32(seedFromString(String(seed)));

  const next = () => (seededRandom ? seededRandom() : cryptoRandom());

  const api: Rng = {
    next,
    nextInt: (maxExclusive: number) => {
      if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) {
        throw new Error(
          "nextInt(maxExclusive): maxExclusive must be a positive finite number",
        );
      }
      return Math.floor(next() * maxExclusive);
    },
    float: (min: number, max: number) => {
      if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
        throw new Error(
          "float(min, max): require finite numbers with max > min",
        );
      }
      return min + (max - min) * next();
    },
    int: (min: number, max: number) => {
      if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
        throw new Error(
          "int(min, max): require finite numbers with max >= min",
        );
      }
      const range = Math.floor(max) - Math.ceil(min) + 1;
      return Math.ceil(min) + (range <= 0 ? 0 : Math.floor(next() * range));
    },
    shuffle: <T>(items: readonly T[]) => {
      const arr = items.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    pick: <T>(items: readonly T[]) => {
      if (items.length === 0) return undefined;
      const index = Math.floor(next() * items.length);
      return items[index];
    },
  };

  return api;
}

export function getSeedFromQuery(search?: string): string | undefined {
  const query =
    search ?? (typeof window !== "undefined" ? window.location.search : "");
  if (!query) return undefined;
  const params = new URLSearchParams(
    query.startsWith("?") ? query : `?${query}`,
  );
  const seedParam = params.get("seed") ?? undefined;
  return seedParam ?? undefined;
}

export function rngFromUrlOrCrypto(search?: string): Rng {
  const seedParam = getSeedFromQuery(search);
  if (seedParam === undefined) return createRng();
  // Accept numeric strings directly, otherwise hash the string
  const asNumber = Number(seedParam);
  return Number.isFinite(asNumber) && seedParam.trim() !== ""
    ? createRng(asNumber)
    : createRng(seedParam);
}

// Convenience default RNG instance bound to current URL parameters at call time
export function getDefaultRng(): Rng {
  return rngFromUrlOrCrypto();
}

export const __test__ = { mulberry32 };
