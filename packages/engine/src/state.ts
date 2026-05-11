import type { GameAction, RuleError, Seat } from './actions.js';
import type { PipValue, TileId } from './tile.js';
import { TOTAL_TILES } from './tile.js';

export type Phase = 'pre-deal' | 'awaiting-opener' | 'in-play' | 'ended';

export interface LaidTile {
  readonly tileId: TileId;
  readonly orientation: 'normal' | 'flipped';
}

export type Outcome =
  | { readonly kind: 'domino'; readonly winner: Seat }
  | { readonly kind: 'block'; readonly winner: Seat }
  | { readonly kind: 'tied-block'; readonly tied: readonly Seat[] };

export interface MatchResult {
  readonly outcome: Outcome;
  readonly pipsBySeat: readonly number[];
}

export interface GameState {
  readonly playerCount: 2 | 4;
  readonly phase: Phase;
  readonly seed: number;
  readonly hands: readonly (readonly TileId[])[];
  readonly boneyard: readonly TileId[];
  readonly board: readonly LaidTile[];
  readonly leftEnd: PipValue | null;
  readonly rightEnd: PipValue | null;
  readonly turn: Seat;
  readonly passCount: number;
  readonly opener: Seat | null;
  readonly openerTileId: TileId | null;
  readonly history: readonly GameAction[];
  readonly result: MatchResult | null;
}

export type ReducerResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly error: RuleError };

export function assertInvariants(state: GameState): void {
  if (state.hands.length !== state.playerCount) {
    throw new Error(`hands.length=${state.hands.length} !== playerCount=${state.playerCount}`);
  }
  const seen = new Set<TileId>();
  let count = 0;
  for (const hand of state.hands) {
    for (const id of hand) {
      if (seen.has(id)) {
        throw new Error(`Tile ${id} appears more than once`);
      }
      seen.add(id);
      count++;
    }
  }
  for (const id of state.boneyard) {
    if (seen.has(id)) {
      throw new Error(`Tile ${id} appears more than once`);
    }
    seen.add(id);
    count++;
  }
  for (const laid of state.board) {
    if (seen.has(laid.tileId)) {
      throw new Error(`Tile ${laid.tileId} appears more than once`);
    }
    seen.add(laid.tileId);
    count++;
  }
  if (count !== TOTAL_TILES) {
    throw new Error(`Tile conservation broken: ${count} tiles in state, expected ${TOTAL_TILES}`);
  }
}
