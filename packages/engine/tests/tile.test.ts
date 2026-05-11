import { describe, expect, it } from 'vitest';
import {
  TOTAL_TILES,
  enumerateTiles,
  findTileByPips,
  getTile,
  handPipSum,
  isDouble,
  otherEnd,
  pipSum,
  tileMatchesEnd,
} from '../src/tile.js';

describe('tile set', () => {
  it('contains exactly 28 tiles', () => {
    expect(enumerateTiles().length).toBe(TOTAL_TILES);
    expect(TOTAL_TILES).toBe(28);
  });

  it('contains every (a,b) with 0 <= a <= b <= 6 exactly once', () => {
    const seen = new Set<string>();
    for (const t of enumerateTiles()) {
      expect(t.a).toBeLessThanOrEqual(t.b);
      const key = `${t.a}-${t.b}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(28);
  });

  it('assigns ids 0..27 in canonical order', () => {
    const tiles = enumerateTiles();
    for (let i = 0; i < tiles.length; i++) {
      expect(tiles[i]!.id).toBe(i);
    }
  });

  it('getTile returns the tile for a valid id', () => {
    const t = getTile(0);
    expect(t.a).toBe(0);
    expect(t.b).toBe(0);
  });

  it('getTile rejects invalid ids', () => {
    expect(() => getTile(-1)).toThrow();
    expect(() => getTile(28)).toThrow();
    expect(() => getTile(1.5 as never)).toThrow();
  });
});

describe('tile helpers', () => {
  it('isDouble is true only when a === b', () => {
    expect(isDouble({ id: 0, a: 0, b: 0 })).toBe(true);
    expect(isDouble({ id: 1, a: 0, b: 1 })).toBe(false);
    expect(isDouble({ id: 27, a: 6, b: 6 })).toBe(true);
  });

  it('pipSum sums a + b', () => {
    expect(pipSum({ id: 27, a: 6, b: 6 })).toBe(12);
    expect(pipSum({ id: 0, a: 0, b: 0 })).toBe(0);
  });

  it('tileMatchesEnd matches either side', () => {
    const t = { id: 0, a: 3, b: 5 } as const;
    expect(tileMatchesEnd(t, 3)).toBe(true);
    expect(tileMatchesEnd(t, 5)).toBe(true);
    expect(tileMatchesEnd(t, 4)).toBe(false);
  });

  it('otherEnd returns the opposite side', () => {
    const t = { id: 0, a: 3, b: 5 } as const;
    expect(otherEnd(t, 3)).toBe(5);
    expect(otherEnd(t, 5)).toBe(3);
  });

  it('otherEnd throws if the value is not on the tile', () => {
    const t = { id: 0, a: 3, b: 5 } as const;
    expect(() => otherEnd(t, 4)).toThrow();
  });

  it('handPipSum totals pip values across all tiles', () => {
    const ids = [
      findTileByPips(0, 0).id,
      findTileByPips(3, 5).id,
      findTileByPips(6, 6).id,
    ];
    expect(handPipSum(ids)).toBe(0 + 8 + 12);
  });

  it('handPipSum is 0 for an empty hand', () => {
    expect(handPipSum([])).toBe(0);
  });

  it('findTileByPips finds the canonical entry regardless of argument order', () => {
    const fromLowHigh = findTileByPips(2, 5);
    const fromHighLow = findTileByPips(5, 2);
    expect(fromLowHigh.id).toBe(fromHighLow.id);
    expect(fromLowHigh.a).toBe(2);
    expect(fromLowHigh.b).toBe(5);
  });
});
