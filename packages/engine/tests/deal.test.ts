import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/deal.js';
import { TOTAL_TILES } from '../src/tile.js';
import { assertInvariants } from '../src/state.js';

describe('createInitialState', () => {
  it('is deterministic for the same seed and playerCount', () => {
    const a = createInitialState(42, 2);
    const b = createInitialState(42, 2);
    expect(a).toEqual(b);
  });

  it('gives 7 tiles to each player in 2-player mode', () => {
    const s = createInitialState(1, 2);
    expect(s.hands.length).toBe(2);
    for (const hand of s.hands) {
      expect(hand.length).toBe(7);
    }
  });

  it('gives 7 tiles to each player in 4-player mode', () => {
    const s = createInitialState(1, 4);
    expect(s.hands.length).toBe(4);
    for (const hand of s.hands) {
      expect(hand.length).toBe(7);
    }
  });

  it('boneyard contains the remaining tiles', () => {
    const s2 = createInitialState(1, 2);
    expect(s2.boneyard.length).toBe(TOTAL_TILES - 2 * 7);
    const s4 = createInitialState(1, 4);
    expect(s4.boneyard.length).toBe(TOTAL_TILES - 4 * 7);
  });

  it('uses all 28 tiles exactly once', () => {
    for (const seed of [0, 1, 42, 9999, 123456]) {
      for (const pc of [2, 4] as const) {
        const s = createInitialState(seed, pc);
        const seen = new Set<number>();
        for (const hand of s.hands) for (const id of hand) seen.add(id);
        for (const id of s.boneyard) seen.add(id);
        expect(seen.size).toBe(TOTAL_TILES);
      }
    }
  });

  it('starts in awaiting-opener with opener + openerTileId set', () => {
    const s = createInitialState(7, 4);
    expect(s.phase).toBe('awaiting-opener');
    expect(s.opener).not.toBeNull();
    expect(s.openerTileId).not.toBeNull();
    expect(s.turn).toBe(s.opener);
  });

  it('opener holds the openerTileId in their hand', () => {
    for (const seed of [0, 1, 50, 9999]) {
      const s = createInitialState(seed, 4);
      const opener = s.opener as number;
      const tile = s.openerTileId as number;
      expect(s.hands[opener]).toContain(tile);
    }
  });

  it('records the DEAL action in history with the seed', () => {
    const s = createInitialState(99, 2);
    expect(s.history.length).toBe(1);
    expect(s.history[0]).toEqual({ type: 'DEAL', seed: 99 });
  });

  it('passes invariants', () => {
    for (const seed of [0, 1, 100, 2024]) {
      for (const pc of [2, 4] as const) {
        const s = createInitialState(seed, pc);
        expect(() => assertInvariants(s)).not.toThrow();
      }
    }
  });

  it('different seeds usually produce different deals', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const s = createInitialState(seed, 2);
      seen.add(JSON.stringify(s.hands));
    }
    expect(seen.size).toBeGreaterThan(40);
  });
});
