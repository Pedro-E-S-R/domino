import { describe, expect, it } from 'vitest';
import { reduce } from '../src/reducer.js';
import { detectBlock, pipsBySeat } from '../src/outcome.js';
import { makeInPlayState, tileId } from './helpers.js';

describe('block detection ("tranca")', () => {
  it('returns null when passCount is below playerCount', () => {
    const s = makeInPlayState({
      hands: [[tileId(2, 2)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
      passCount: 1,
    });
    expect(detectBlock(s)).toBeNull();
  });

  it('returns a block outcome with the lowest-pips winner', () => {
    const s = makeInPlayState({
      playerCount: 2,
      hands: [[tileId(1, 1)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
      passCount: 2,
    });
    const o = detectBlock(s);
    expect(o).not.toBeNull();
    expect(o?.kind).toBe('block');
    if (o?.kind === 'block') {
      expect(o.winner).toBe(0);
    }
  });

  it('returns a tied-block outcome when minimum is shared', () => {
    const s = makeInPlayState({
      playerCount: 2,
      hands: [[tileId(2, 3)], [tileId(1, 4)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
      passCount: 2,
    });
    const o = detectBlock(s);
    expect(o).not.toBeNull();
    expect(o?.kind).toBe('tied-block');
    if (o?.kind === 'tied-block') {
      expect(o.tied).toEqual([0, 1]);
    }
  });

  it('PASS after playerCount-1 prior passes ends the round with a block result', () => {
    const s = makeInPlayState({
      playerCount: 2,
      hands: [[tileId(1, 1)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 1,
      passCount: 1,
    });
    const r = reduce(s, { type: 'PASS', actor: 1 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe('ended');
    expect(r.state.result?.outcome.kind).toBe('block');
    expect(r.state.result?.pipsBySeat).toEqual([2, 10]);
  });

  it('pipsBySeat sums pip values per seat', () => {
    expect(pipsBySeat([[tileId(1, 1), tileId(2, 2)], [tileId(0, 0)]])).toEqual([6, 0]);
  });
});
