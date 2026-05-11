import { getTile, isDouble, type TileId } from '@domino/engine';
import type { TileLayout } from './Tile.js';

export function boardLayoutFor(tileId: TileId): TileLayout {
  return isDouble(getTile(tileId)) ? 'vertical' : 'horizontal';
}
