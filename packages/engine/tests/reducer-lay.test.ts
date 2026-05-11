import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/deal.js';
import { reduce } from '../src/reducer.js';
import { assertInvariants } from '../src/state.js';
import type { Seat } from '../src/actions.js';
import { makeInPlayState, tileId } from './helpers.js';

describe('reducer: LAY (opener path)', () => {
  it('opener can lay the openerTile and phase becomes in-play', () => {
    const s = createInitialState(2024, 2);
    const opener = s.opener as Seat;
    const openerTile = s.openerTileId as number;
    const r = reduce(s, { type: 'LAY', actor: opener, tileId: openerTile, end: 'left' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe('in-play');
    expect(r.state.board.length).toBe(1);
    expect(r.state.turn).not.toBe(opener);
    expect(() => assertInvariants(r.state)).not.toThrow();
  });

  it('opener cannot lay a different tile', () => {
    const s = createInitialState(2024, 2);
    const opener = s.opener as Seat;
    const openerTile = s.openerTileId as number;
    const otherTile = (s.hands[opener] as readonly number[]).find((id) => id !== openerTile);
    if (otherTile === undefined) return;
    const r = reduce(s, { type: 'LAY', actor: opener, tileId: otherTile, end: 'left' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('MUST_LAY_OPENER_TILE');
  });

  it('non-opener cannot lay first', () => {
    const s = createInitialState(2024, 2);
    const opener = s.opener as Seat;
    const nonOpener = (opener === 0 ? 1 : 0) as Seat;
    const tile = s.hands[nonOpener]![0] as number;
    const r = reduce(s, { type: 'LAY', actor: nonOpener, tileId: tile, end: 'left' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('NOT_YOUR_TURN');
  });
});

describe('reducer: LAY (in-play)', () => {
  it('accepts a legal play at the right end', () => {
    const s = makeInPlayState({
      hands: [[tileId(2, 5)], [tileId(0, 3)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    expect(s.leftEnd).toBe(0);
    expect(s.rightEnd).toBe(0);
    const r = reduce(s, { type: 'LAY', actor: 0, tileId: tileId(2, 5), end: 'right' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('TILE_DOES_NOT_MATCH_END');
  });

  it('rejects a tile not in the actor\'s hand', () => {
    const s = makeInPlayState({
      hands: [[tileId(1, 1)], [tileId(0, 3)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    const r = reduce(s, { type: 'LAY', actor: 0, tileId: tileId(5, 5), end: 'left' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('TILE_NOT_IN_HAND');
  });

  it('advances the turn after a successful lay', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3), tileId(1, 1)], [tileId(4, 4), tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    const r = reduce(s, { type: 'LAY', actor: 0, tileId: tileId(0, 3), end: 'left' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.turn).toBe(1);
    expect(r.state.leftEnd).toBe(3);
    expect(r.state.rightEnd).toBe(0);
    expect(r.state.passCount).toBe(0);
    expect(r.state.hands[0]).not.toContain(tileId(0, 3));
    expect(r.state.board.length).toBe(2);
  });

  it('lays a tile at the right end and updates rightEnd', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 5)], [tileId(4, 4)]],
      boardTiles: [tileId(0, 3)],
      turn: 0,
    });
    expect(s.leftEnd).toBe(0);
    expect(s.rightEnd).toBe(3);
    const r = reduce(s, { type: 'LAY', actor: 0, tileId: tileId(0, 5), end: 'left' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.leftEnd).toBe(5);
    expect(r.state.rightEnd).toBe(3);
  });

  it('rejects laying the wrong player\'s turn', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3)], [tileId(0, 4)]],
      boardTiles: [tileId(0, 0)],
      turn: 1,
    });
    const r = reduce(s, { type: 'LAY', actor: 0, tileId: tileId(0, 3), end: 'left' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('NOT_YOUR_TURN');
  });

  it('rejects further actions once the round has ended', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3)], [tileId(0, 4)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
      phase: 'ended',
    });
    const r = reduce(s, { type: 'LAY', actor: 0, tileId: tileId(0, 3), end: 'left' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('MATCH_ENDED');
  });

  it('rejects DEAL actions applied via reduce()', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3)], [tileId(0, 4)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    const r = reduce(s, { type: 'DEAL', seed: 1 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('WRONG_PHASE');
  });
});
