import type { TileId } from './tile.js';

export type Seat = 0 | 1 | 2 | 3;
export type End = 'left' | 'right';

export type GameAction =
  | { readonly type: 'DEAL'; readonly seed: number }
  | { readonly type: 'LAY'; readonly actor: Seat; readonly tileId: TileId; readonly end: End }
  | { readonly type: 'DRAW'; readonly actor: Seat }
  | { readonly type: 'PASS'; readonly actor: Seat };

export type RuleError =
  | 'NOT_YOUR_TURN'
  | 'TILE_NOT_IN_HAND'
  | 'TILE_DOES_NOT_MATCH_END'
  | 'MUST_LAY_OPENER_TILE'
  | 'CANNOT_DRAW_HAS_LEGAL_MOVE'
  | 'CANNOT_DRAW_EMPTY_BONEYARD'
  | 'CANNOT_PASS_HAS_LEGAL_MOVE'
  | 'CANNOT_PASS_BONEYARD_NOT_EMPTY'
  | 'WRONG_PHASE'
  | 'MATCH_ENDED';

export function actionActor(action: GameAction): Seat | null {
  switch (action.type) {
    case 'DEAL':
      return null;
    case 'LAY':
    case 'DRAW':
    case 'PASS':
      return action.actor;
  }
}
