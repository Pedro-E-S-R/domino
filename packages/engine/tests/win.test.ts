import { describe, expect, it } from 'vitest';
import { reduce } from '../src/reducer.js';
import { detectWin } from '../src/outcome.js';
import { makeInPlayState, tileId } from './helpers.js';

describe('win detection ("bate")', () => {
  it('detects a winner when a hand reaches zero tiles', () => {
    expect(detectWin([[], [tileId(5, 5)]])).toBe(0);
    expect(detectWin([[tileId(5, 5)], []])).toBe(1);
    expect(detectWin([[tileId(5, 5)], [tileId(0, 0)]])).toBeNull();
  });

  it('LAY ending the round produces a domino result', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 4)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
    });
    const r = reduce(s, { type: 'LAY', actor: 0, tileId: tileId(0, 4), end: 'left' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe('ended');
    expect(r.state.result).not.toBeNull();
    expect(r.state.result?.outcome.kind).toBe('domino');
    if (r.state.result?.outcome.kind === 'domino') {
      expect(r.state.result.outcome.winner).toBe(0);
    }
    expect(r.state.result?.pipsBySeat).toEqual([0, 10]);
  });

  it('rejects further actions after a domino win', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 4)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
    });
    const r = reduce(s, { type: 'LAY', actor: 0, tileId: tileId(0, 4), end: 'left' });
    if (!r.ok) return;
    const r2 = reduce(r.state, { type: 'PASS', actor: 1 });
    expect(r2.ok).toBe(false);
    if (r2.ok) return;
    expect(r2.error).toBe('MATCH_ENDED');
  });
});
