import { describe, expect, it } from 'vitest';
import { reduce } from '../src/reducer.js';
import { assertInvariants } from '../src/state.js';
import { makeInPlayState, tileId } from './helpers.js';

describe('reducer: DRAW', () => {
  it('rejects when the actor has a legal move', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 4)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [tileId(6, 6)],
      turn: 0,
    });
    const r = reduce(s, { type: 'DRAW', actor: 0 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('CANNOT_DRAW_HAS_LEGAL_MOVE');
  });

  it('rejects when the boneyard is empty', () => {
    const s = makeInPlayState({
      hands: [[tileId(2, 2)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
    });
    const r = reduce(s, { type: 'DRAW', actor: 0 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('CANNOT_DRAW_EMPTY_BONEYARD');
  });

  it('keeps the turn when the drawn tile is legal', () => {
    const s = makeInPlayState({
      hands: [[tileId(3, 3)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [tileId(0, 6)],
      turn: 0,
    });
    const r = reduce(s, { type: 'DRAW', actor: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.turn).toBe(0);
    expect(r.state.hands[0]).toContain(tileId(0, 6));
    expect(r.state.boneyard.length).toBe(0);
    expect(r.state.passCount).toBe(0);
  });

  it('advances the turn when the drawn tile is not legal', () => {
    const s = makeInPlayState({
      hands: [[tileId(2, 2)], [tileId(0, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [tileId(3, 4)],
      turn: 0,
    });
    const r = reduce(s, { type: 'DRAW', actor: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.turn).toBe(1);
    expect(r.state.hands[0]).toContain(tileId(3, 4));
    expect(r.state.passCount).toBe(0);
  });

  it('rejects DRAW from the wrong player', () => {
    const s = makeInPlayState({
      hands: [[tileId(2, 2)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [tileId(6, 6)],
      turn: 0,
    });
    const r = reduce(s, { type: 'DRAW', actor: 1 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('NOT_YOUR_TURN');
  });
});
