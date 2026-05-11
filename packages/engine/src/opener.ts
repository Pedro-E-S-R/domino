import { getTile, isDouble, pipSum, type TileId } from './tile.js';
import type { Seat } from './actions.js';

export interface OpenerSelection {
  readonly seat: Seat;
  readonly tileId: TileId;
}

export function selectOpener(hands: readonly (readonly TileId[])[]): OpenerSelection {
  let bestDouble: { seat: Seat; tileId: TileId; doubleValue: number } | null = null;

  for (let s = 0; s < hands.length; s++) {
    const seat = s as Seat;
    const hand = hands[s] as readonly TileId[];
    for (const id of hand) {
      const tile = getTile(id);
      if (isDouble(tile)) {
        if (bestDouble === null || tile.a > bestDouble.doubleValue) {
          bestDouble = { seat, tileId: id, doubleValue: tile.a };
        }
      }
    }
  }

  if (bestDouble !== null) {
    return { seat: bestDouble.seat, tileId: bestDouble.tileId };
  }

  let best: { seat: Seat; tileId: TileId; sum: number; high: number } | null = null;
  for (let s = 0; s < hands.length; s++) {
    const seat = s as Seat;
    const hand = hands[s] as readonly TileId[];
    for (const id of hand) {
      const tile = getTile(id);
      const sum = pipSum(tile);
      const high = Math.max(tile.a, tile.b);
      if (
        best === null ||
        sum > best.sum ||
        (sum === best.sum && high > best.high)
      ) {
        best = { seat, tileId: id, sum, high };
      }
    }
  }

  if (best === null) {
    throw new Error('Cannot select opener — all hands are empty');
  }
  return { seat: best.seat, tileId: best.tileId };
}
