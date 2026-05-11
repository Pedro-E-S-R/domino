import { describe, expect, it } from 'vitest';
import { assertInvariants } from '../src/state.js';
import { createInitialState } from '../src/deal.js';
import { TOTAL_TILES } from '../src/tile.js';
import { makeInPlayState, tileId } from './helpers.js';

describe('assertInvariants', () => {
  it('passes for a freshly dealt state', () => {
    const s = createInitialState(1234, 2);
    expect(() => assertInvariants(s)).not.toThrow();
  });

  it('passes on the post-opener state of a real deal', () => {
    const s = createInitialState(11, 2);
    expect(() => assertInvariants(s)).not.toThrow();
  });

  it('throws when a tile appears twice', () => {
    const dealt = createInitialState(3, 2);
    const corrupted = {
      ...dealt,
      hands: [
        [...(dealt.hands[0] ?? [])],
        [...(dealt.hands[1] ?? []), (dealt.hands[0] ?? [])[0] as number],
      ],
    } as typeof dealt;
    expect(() => assertInvariants(corrupted)).toThrow(/more than once/);
  });

  it('throws when total tile count is wrong', () => {
    const s = makeInPlayState({
      hands: [[tileId(1, 2)], [tileId(3, 4)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    expect(() => assertInvariants(s)).toThrow(/Tile conservation/);
  });

  it('throws when hands length does not match playerCount', () => {
    const s = makeInPlayState({
      playerCount: 4,
      hands: [[tileId(1, 2)], [tileId(3, 4)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    expect(() => assertInvariants(s)).toThrow(/playerCount/);
  });

  it('tile conservation holds across the 28 tiles', () => {
    const s = createInitialState(99, 4);
    const total =
      s.hands.reduce((acc, h) => acc + h.length, 0) +
      s.boneyard.length +
      s.board.length;
    expect(total).toBe(TOTAL_TILES);
  });
});
