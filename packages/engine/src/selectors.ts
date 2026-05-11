import { getTile, handPipSum, tileMatchesEnd, type PipValue, type TileId } from './tile.js';
import type { End, Seat } from './actions.js';
import type { GameState } from './state.js';

export interface LegalMove {
  readonly tileId: TileId;
  readonly ends: readonly End[];
}

export function legalMovesFor(state: GameState, seat: Seat): readonly LegalMove[] {
  if (state.phase === 'ended' || state.phase === 'pre-deal') {
    return [];
  }
  const hand = state.hands[seat];
  if (!hand) return [];

  if (state.phase === 'awaiting-opener') {
    if (seat !== state.opener) return [];
    if (state.openerTileId === null) return [];
    return [{ tileId: state.openerTileId, ends: ['left'] }];
  }

  const left = state.leftEnd;
  const right = state.rightEnd;
  if (left === null || right === null) return [];

  const result: LegalMove[] = [];
  for (const tileId of hand) {
    const tile = getTile(tileId);
    const ends: End[] = [];
    if (tileMatchesEnd(tile, left)) ends.push('left');
    if (tileMatchesEnd(tile, right)) ends.push('right');
    if (ends.length > 0) {
      result.push({ tileId, ends });
    }
  }
  return result;
}

export function hasLegalMove(state: GameState, seat: Seat): boolean {
  return legalMovesFor(state, seat).length > 0;
}

export function canDraw(state: GameState, seat: Seat): boolean {
  if (state.phase !== 'in-play') return false;
  if (state.turn !== seat) return false;
  if (state.boneyard.length === 0) return false;
  return !hasLegalMove(state, seat);
}

export function mustPass(state: GameState, seat: Seat): boolean {
  if (state.phase !== 'in-play') return false;
  if (state.turn !== seat) return false;
  if (state.boneyard.length > 0) return false;
  return !hasLegalMove(state, seat);
}

export function pipSumOfHand(state: GameState, seat: Seat): number {
  const hand = state.hands[seat];
  if (!hand) return 0;
  return handPipSum(hand);
}

export function exposedEnds(state: GameState): { left: PipValue | null; right: PipValue | null } {
  return { left: state.leftEnd, right: state.rightEnd };
}
