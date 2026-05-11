import { describe, expect, it } from 'vitest';
import { reduce } from '../src/reducer.js';
import { assertInvariants } from '../src/state.js';
import { makeInPlayState, tileId } from './helpers.js';

describe('reducer: PASS', () => {
  it('rejects when the actor has a legal move', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 4)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
    });
    const r = reduce(s, { type: 'PASS', actor: 0 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('CANNOT_PASS_HAS_LEGAL_MOVE');
  });

  it('rejects when the boneyard is non-empty', () => {
    const s = makeInPlayState({
      hands: [[tileId(2, 2)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [tileId(6, 6)],
      turn: 0,
    });
    const r = reduce(s, { type: 'PASS', actor: 0 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('CANNOT_PASS_BONEYARD_NOT_EMPTY');
  });

  it('passes successfully and increments passCount', () => {
    const s = makeInPlayState({
      hands: [[tileId(2, 2)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
    });
    const r = reduce(s, { type: 'PASS', actor: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.passCount).toBe(1);
    expect(r.state.turn).toBe(1);
  });

  it('rejects PASS from the wrong player', () => {
    const s = makeInPlayState({
      hands: [[tileId(2, 2)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
    });
    const r = reduce(s, { type: 'PASS', actor: 1 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('NOT_YOUR_TURN');
  });
});
