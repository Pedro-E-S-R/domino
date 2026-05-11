export type PipValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type TileId = number;

export interface Tile {
  readonly id: TileId;
  readonly a: PipValue;
  readonly b: PipValue;
}

export const TOTAL_TILES = 28;
export const PIP_VALUES: readonly PipValue[] = Object.freeze([0, 1, 2, 3, 4, 5, 6]);

const ALL_TILES: readonly Tile[] = Object.freeze(buildAllTiles());

function buildAllTiles(): readonly Tile[] {
  const tiles: Tile[] = [];
  let id = 0;
  for (const a of PIP_VALUES) {
    for (const b of PIP_VALUES) {
      if (b < a) continue;
      tiles.push(Object.freeze({ id: id++, a, b }));
    }
  }
  return tiles;
}

export function enumerateTiles(): readonly Tile[] {
  return ALL_TILES;
}

export function getTile(id: TileId): Tile {
  if (!Number.isInteger(id) || id < 0 || id >= TOTAL_TILES) {
    throw new Error(`Invalid TileId: ${id}`);
  }
  return ALL_TILES[id] as Tile;
}

export function isDouble(tile: Tile): boolean {
  return tile.a === tile.b;
}

export function pipSum(tile: Tile): number {
  return tile.a + tile.b;
}

export function tileMatchesEnd(tile: Tile, end: PipValue): boolean {
  return tile.a === end || tile.b === end;
}

export function otherEnd(tile: Tile, knownEnd: PipValue): PipValue {
  if (tile.a === knownEnd) return tile.b;
  if (tile.b === knownEnd) return tile.a;
  throw new Error(`Tile ${tile.id} (${tile.a}-${tile.b}) does not expose end ${knownEnd}`);
}

export function handPipSum(handIds: readonly TileId[]): number {
  let total = 0;
  for (const id of handIds) {
    const t = getTile(id);
    total += t.a + t.b;
  }
  return total;
}

export function findTileByPips(a: PipValue, b: PipValue): Tile {
  const lo = Math.min(a, b) as PipValue;
  const hi = Math.max(a, b) as PipValue;
  for (const tile of ALL_TILES) {
    if (tile.a === lo && tile.b === hi) return tile;
  }
  throw new Error(`Tile (${a},${b}) not found — unreachable`);
}
