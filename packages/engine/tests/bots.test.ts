import { describe, expect, it } from 'vitest';
import { autoPlayOne, chooseAutoAction } from '../src/bots.js';
import { makeInPlayState, tileId } from './helpers.js';

describe('chooseAutoAction', () => {
  it('picks a legal LAY when one is available', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3), tileId(5, 5)], [tileId(4, 4)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    const a = chooseAutoAction(s, 0);
    expect(a).not.toBeNull();
    expect(a?.type).toBe('LAY');
    if (a?.type === 'LAY') {
      expect(a.tileId).toBe(tileId(0, 3));
    }
  });

  it('chooses the lowest-pip legal play when multiple are available', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 1), tileId(0, 6)], [tileId(4, 4)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    const a = chooseAutoAction(s, 0);
    expect(a?.type).toBe('LAY');
    if (a?.type === 'LAY') {
      expect(a.tileId).toBe(tileId(0, 1));
    }
  });

  it('falls back to DRAW when no legal play and boneyard non-empty', () => {
    const s = makeInPlayState({
      hands: [[tileId(5, 5)], [tileId(1, 1)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [tileId(6, 6)],
      turn: 0,
    });
    const a = chooseAutoAction(s, 0);
    expect(a?.type).toBe('DRAW');
  });

  it('falls back to PASS when no legal play and boneyard empty', () => {
    const s = makeInPlayState({
      hands: [[tileId(5, 5)], [tileId(1, 1)]],
      boardTiles: [tileId(0, 0)],
      boneyard: [],
      turn: 0,
    });
    const a = chooseAutoAction(s, 0);
    expect(a?.type).toBe('PASS');
  });

  it('returns null when called for the wrong seat', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    expect(chooseAutoAction(s, 1)).toBeNull();
  });

  it('returns null when the round has ended', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3)], [tileId(5, 5)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
      phase: 'ended',
    });
    expect(chooseAutoAction(s, 0)).toBeNull();
  });

  it('is deterministic for identical states', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 1), tileId(0, 6), tileId(0, 3)], [tileId(4, 4)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    expect(chooseAutoAction(s, 0)).toEqual(chooseAutoAction(s, 0));
  });
});

describe('autoPlayOne', () => {
  it('applies the chosen action to the state', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3)], [tileId(4, 4)]],
      boardTiles: [tileId(0, 0)],
      turn: 0,
    });
    const next = autoPlayOne(s, 0);
    expect(next.turn).toBe(1);
    expect(next.hands[0]).not.toContain(tileId(0, 3));
  });

  it('is a no-op when the seat is not on turn', () => {
    const s = makeInPlayState({
      hands: [[tileId(0, 3)], [tileId(4, 4)]],
      boardTiles: [tileId(0, 0)],
      turn: 1,
    });
    const next = autoPlayOne(s, 0);
    expect(next).toBe(s);
  });
});
