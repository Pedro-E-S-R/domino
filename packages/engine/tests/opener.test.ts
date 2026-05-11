import { describe, expect, it } from 'vitest';
import { selectOpener } from '../src/opener.js';
import { getTile } from '../src/tile.js';
import { tileId } from './helpers.js';

describe('selectOpener', () => {
  it('picks the highest double when any double exists', () => {
    const hands = [
      [tileId(0, 0), tileId(1, 3)],
      [tileId(2, 2), tileId(0, 5)],
      [tileId(6, 6), tileId(4, 5)],
      [tileId(1, 2), tileId(3, 6)],
    ];
    const opener = selectOpener(hands);
    expect(opener.seat).toBe(2);
    expect(opener.tileId).toBe(tileId(6, 6));
  });

  it('picks a 4-4 double when the highest available double is 4-4', () => {
    const hands = [
      [tileId(4, 4), tileId(1, 3)],
      [tileId(2, 2), tileId(0, 5)],
    ];
    const opener = selectOpener(hands);
    expect(opener.seat).toBe(0);
    expect(opener.tileId).toBe(tileId(4, 4));
  });

  it('falls back to highest pip-sum tile when no doubles exist', () => {
    const hands = [
      [tileId(1, 2), tileId(0, 5)],
      [tileId(3, 4), tileId(2, 6)],
    ];
    const opener = selectOpener(hands);
    expect(opener.seat).toBe(1);
    expect(opener.tileId).toBe(tileId(2, 6));
  });

  it('breaks pip-sum ties by highest single side', () => {
    const hands = [
      [tileId(3, 4)],
      [tileId(2, 5)],
    ];
    const opener = selectOpener(hands);
    const chosen = getTile(opener.tileId);
    expect(Math.max(chosen.a, chosen.b)).toBe(5);
    expect(opener.seat).toBe(1);
  });

  it('throws when all hands are empty', () => {
    expect(() => selectOpener([[], []])).toThrow();
  });

  it('opener seat always holds the opener tile', () => {
    const hands = [[tileId(0, 0)], [tileId(6, 6)]];
    const opener = selectOpener(hands);
    expect(hands[opener.seat]).toContain(opener.tileId);
  });
});
