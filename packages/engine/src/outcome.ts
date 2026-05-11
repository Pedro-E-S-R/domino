import { handPipSum, type TileId } from './tile.js';
import type { Seat } from './actions.js';
import type { GameState, MatchResult, Outcome } from './state.js';

export function pipsBySeat(hands: readonly (readonly TileId[])[]): readonly number[] {
  return hands.map((hand) => handPipSum(hand));
}

export function detectWin(hands: readonly (readonly TileId[])[]): Seat | null {
  for (let s = 0; s < hands.length; s++) {
    const hand = hands[s];
    if (hand && hand.length === 0) {
      return s as Seat;
    }
  }
  return null;
}

export function detectBlock(state: GameState): Outcome | null {
  if (state.passCount < state.playerCount) {
    return null;
  }
  const pips = pipsBySeat(state.hands);
  let min = Infinity;
  for (const p of pips) {
    if (p < min) min = p;
  }
  const tied: Seat[] = [];
  for (let s = 0; s < pips.length; s++) {
    if (pips[s] === min) {
      tied.push(s as Seat);
    }
  }
  if (tied.length === 1) {
    return { kind: 'block', winner: tied[0] as Seat };
  }
  return { kind: 'tied-block', tied: Object.freeze(tied) };
}

export function makeWinResult(winner: Seat, hands: readonly (readonly TileId[])[]): MatchResult {
  return {
    outcome: { kind: 'domino', winner },
    pipsBySeat: pipsBySeat(hands),
  };
}

export function makeBlockResult(
  outcome: Outcome,
  hands: readonly (readonly TileId[])[],
): MatchResult {
  return {
    outcome,
    pipsBySeat: pipsBySeat(hands),
  };
}
