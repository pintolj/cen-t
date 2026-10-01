export interface Rng {
  next: () => number;
  range: (min: number, max: number) => number;
  int: (min: number, max: number) => number;
  chance: (probability: number) => boolean;
  pick: <T>(items: readonly T[]) => T;
  weightedPick: <T>(items: readonly { value: T; weight: number }[]) => T;
  normal: (mean: number, stdDev: number) => number;
}

/** PRNG determinista (mulberry32) → datasets reproducibles en cada render/entorno. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  let spare: number | null = null;

  const normal = (mean: number, stdDev: number): number => {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return mean + value * stdDev;
    }
    let u = 0;
    let v = 0;
    let s = 0;
    do {
      u = next() * 2 - 1;
      v = next() * 2 - 1;
      s = u * u + v * v;
    } while (s === 0 || s >= 1);
    const multiplier = Math.sqrt((-2 * Math.log(s)) / s);
    spare = v * multiplier;
    return mean + u * multiplier * stdDev;
  };

  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    chance: (probability) => next() < probability,
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
    weightedPick: <T,>(items: readonly { value: T; weight: number }[]): T => {
      const total = items.reduce((acc, item) => acc + item.weight, 0);
      let roll = next() * total;
      for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) return item.value;
      }
      return items[items.length - 1]!.value;
    },
    normal,
  };
}

/** Búsqueda binaria sobre series ordenadas por timestamp: O(log n). */
export function lowerBound(items: readonly { timestamp: number }[], target: number): number {
  let low = 0;
  let high = items.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (items[mid]!.timestamp < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}
