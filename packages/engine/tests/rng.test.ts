import { describe, expect, it } from 'vitest';
import { mulberry32, randomInt, shuffle } from '../src/rng.js';

describe('mulberry32', () => {
  it('produces identical sequences for identical seeds', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    let differed = false;
    for (let i = 0; i < 20; i++) {
      if (a.next() !== b.next()) {
        differed = true;
        break;
      }
    }
    expect(differed).toBe(true);
  });

  it('emits values in [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('has a roughly uniform mean over many samples', () => {
    const r = mulberry32(99);
    let sum = 0;
    const N = 10_000;
    for (let i = 0; i < N; i++) sum += r.next();
    const mean = sum / N;
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
  });
});

describe('shuffle', () => {
  it('returns a permutation of the input', () => {
    const r = mulberry32(42);
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const out = shuffle(r, arr);
    expect(out.length).toBe(arr.length);
    expect(new Set(out)).toEqual(new Set(arr));
  });

  it('is deterministic for a given seed', () => {
    const arr = [1, 2, 3, 4, 5];
    const out1 = shuffle(mulberry32(7), arr);
    const out2 = shuffle(mulberry32(7), arr);
    expect(out1).toEqual(out2);
  });

  it('does not mutate the input array', () => {
    const arr = [1, 2, 3];
    const snapshot = [...arr];
    shuffle(mulberry32(1), arr);
    expect(arr).toEqual(snapshot);
  });

  it('handles empty and single-element arrays', () => {
    expect(shuffle(mulberry32(1), [])).toEqual([]);
    expect(shuffle(mulberry32(1), [42])).toEqual([42]);
  });
});

describe('randomInt', () => {
  it('returns integers in [0, max)', () => {
    const r = mulberry32(3);
    for (let i = 0; i < 1000; i++) {
      const v = randomInt(r, 10);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  it('throws for non-positive max', () => {
    const r = mulberry32(0);
    expect(() => randomInt(r, 0)).toThrow();
    expect(() => randomInt(r, -1)).toThrow();
  });
});
