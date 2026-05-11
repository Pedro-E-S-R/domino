import { describe, expect, it } from 'vitest';
import {
  canDraw,
  exposedEnds,
  hasLegalMove,
  legalMovesFor,
  mustPass,
  pipSumOfHand,
} from '../src/selectors.js';
import { createInitialState } from '../src/deal.js';
import { makeInPlayState, tileId } from './helpers.js';
import type { Seat } from '../src/actions.js';

describe('legalMovesFor', () => {
  it('returns only the opener tile while in awaiting-opener', () => {
    const s = createInitialState(2024, 2);
    const opener = s.opener as Seat;
    const moves = legalMovesFor(s, opener);
    expect(moves.length).toBe(1);
    expect(moves[0]!.tileId).toBe(s.openerTileId);
  });

  it('returns nothing for the non-opener in awaiting-opener', () => {
    const s = createInitialState(2024, 2);
    const nonOpener = ((s.opener as Seat) === 0 ? 1 : 0) as Seat;
    expect(legalMovesFor(s, nonOpener)).toEqual([]);
  });

  it('returns matches at the correct ends in-play', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3), tileId(2, 4)], [tileId(0, 5)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    const moves = legalMovesFor(s, 0);
    expect(moves.length).toBe(1);
    expect(moves[0]!.tileId).toBe(tileId(0, 3));
    expect(moves[0]!.ends).toEqual(['left', 'right']);
  });

  it('returns [] when phase is ended', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 0)], [tileId(1, 1)]],
      boardTiles: [tileId(2, 2)],
      turn: 0,
      phase: 'ended',
    });
    expect(legalMovesFor(s, 0)).toEqual([]);
  });

  it('distinguishes left vs right matches when ends differ', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 2), tileId(4, 5)], [tileId(6, 6)]],
      boardTiles: [tileId(0, 3), tileId(3, 5)],
      turn: 0,
    });
    expect(s.leftEnd).toBe(0);
    expect(s.rightEnd).toBe(5);
    const moves = legalMovesFor(s, 0);
    expect(moves).toContainEqual({ tileId: tileId(0, 2), ends: ['left'] });
    expect(moves).toContainEqual({ tileId: tileId(4, 5), ends: ['right'] });
    expect(moves.length).toBe(2);
  });
});

describe('hasLegalMove', () => {
  it('is true when there is at least one playable tile', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    expect(hasLegalMove(s, 0)).toBe(true);
    expect(hasLegalMove(s, 1)).toBe(false);
  });
});

describe('canDraw', () => {
  it('true only when actor has no legal move, boneyard non-empty, and it is their turn', () => {
    const s = makeInPlayState({
      hands: [[tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [tileId(6, 6)],
      turn: 0,
      playerCount: 2,
    });
    const filled = { ...s, hands: [s.hands[0]!, [tileId(1, 1)]] as const };
    expect(canDraw(filled, 0)).toBe(true);
    expect(canDraw(filled, 1)).toBe(false);
  });

  it('false when boneyard is empty', () => {
    const s = makeInPlayState({
      hands: [[tileId(5, 5)], [tileId(1, 1)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
    });
    expect(canDraw(s, 0)).toBe(false);
  });
});

describe('mustPass', () => {
  it('true only when no legal move and boneyard empty', () => {
    const s = makeInPlayState({
      hands: [[tileId(5, 5)], [tileId(1, 1)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
    });
    expect(mustPass(s, 0)).toBe(true);
    expect(mustPass(s, 1)).toBe(false);
  });
});

describe('exposedEnds and pipSumOfHand', () => {
  it('exposedEnds reads back leftEnd/rightEnd', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    expect(exposedEnds(s)).toEqual({ left: 0, right: 0 });
  });

  it('pipSumOfHand returns the hand pip total', () => {
    const s = makeInPlayState({
      hands: [[tileId(1, 1), tileId(2, 3)], [tileId(0, 0)]],
      boardTiles: [tileId(4, 4)],
      turn: 0,
    });
    expect(pipSumOfHand(s, 0)).toBe(7);
    expect(pipSumOfHand(s, 1)).toBe(0);
  });
});
