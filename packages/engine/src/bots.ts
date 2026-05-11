import { getTile, pipSum, type TileId } from './tile.js';
import { reduce } from './reducer.js';
import { canDraw, legalMovesFor, mustPass } from './selectors.js';
import type { GameAction, Seat } from './actions.js';
import type { GameState } from './state.js';

export function chooseAutoAction(state: GameState, seat: Seat): GameAction | null {
  if (state.phase === 'ended' || state.phase === 'pre-deal') return null;
  if (state.turn !== seat) return null;

  const moves = legalMovesFor(state, seat);
  if (moves.length > 0) {
    let bestTileId: TileId | null = null;
    let bestEnd: 'left' | 'right' = 'left';
    let bestSum = Infinity;
    for (const move of moves) {
      const tile = getTile(move.tileId);
      const sum = pipSum(tile);
      if (sum < bestSum || (sum === bestSum && (bestTileId === null || move.tileId < bestTileId))) {
        bestSum = sum;
        bestTileId = move.tileId;
        bestEnd = move.ends[0] as 'left' | 'right';
      }
    }
    if (bestTileId === null) return null;
    return { type: 'LAY', actor: seat, tileId: bestTileId, end: bestEnd };
  }

  if (canDraw(state, seat)) {
    return { type: 'DRAW', actor: seat };
  }
  if (mustPass(state, seat)) {
    return { type: 'PASS', actor: seat };
  }
  return null;
}

export function autoPlayOne(state: GameState, seat: Seat): GameState {
  const action = chooseAutoAction(state, seat);
  if (action === null) return state;
  const result = reduce(state, action);
  return result.ok ? result.state : state;
}

