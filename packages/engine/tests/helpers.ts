import type { GameState, LaidTile } from '../src/state.js';
import type { Seat } from '../src/actions.js';
import type { PipValue, TileId } from '../src/tile.js';
import { findTileByPips, getTile, otherEnd, tileMatchesEnd } from '../src/tile.js';

export interface StateOverrides {
  playerCount?: 2 | 4;
  phase?: GameState['phase'];
  seed?: number;
  hands?: readonly (readonly TileId[])[];
  boneyard?: readonly TileId[];
  board?: readonly LaidTile[];
  leftEnd?: PipValue | null;
  rightEnd?: PipValue | null;
  turn?: Seat;
  passCount?: number;
  opener?: Seat | null;
  openerTileId?: TileId | null;
  history?: readonly GameState['history'][number][];
  result?: GameState['result'];
}

export function tileId(a: number, b: number): TileId {
  return findTileByPips(a as PipValue, b as PipValue).id;
}

export function makeBoardFromTileIds(tiles: readonly TileId[]): {
  board: LaidTile[];
  leftEnd: PipValue;
  rightEnd: PipValue;
} {
  if (tiles.length === 0) {
    throw new Error('makeBoardFromTileIds requires at least one tile');
  }
  const first = getTile(tiles[0] as TileId);
  const board: LaidTile[] = [{ tileId: first.id, orientation: 'normal' }];
  let leftEnd: PipValue = first.a;
  let rightEnd: PipValue = first.b;
  for (let i = 1; i < tiles.length; i++) {
    const tile = getTile(tiles[i] as TileId);
    if (tileMatchesEnd(tile, rightEnd)) {
      const newRight = otherEnd(tile, rightEnd);
      const orientation: LaidTile['orientation'] = tile.a === rightEnd ? 'normal' : 'flipped';
      board.push({ tileId: tile.id, orientation });
      rightEnd = newRight;
    } else if (tileMatchesEnd(tile, leftEnd)) {
      const newLeft = otherEnd(tile, leftEnd);
      const orientation: LaidTile['orientation'] = tile.b === leftEnd ? 'normal' : 'flipped';
      board.unshift({ tileId: tile.id, orientation });
      leftEnd = newLeft;
    } else {
      throw new Error(`makeBoardFromTileIds: tile ${tile.a}-${tile.b} cannot attach`);
    }
  }
  return { board, leftEnd, rightEnd };
}

export function makeInPlayState(overrides: StateOverrides & {
  hands: readonly (readonly TileId[])[];
  boardTiles: readonly TileId[];
  turn: Seat;
}): GameState {
  const playerCount = overrides.playerCount ?? (overrides.hands.length as 2 | 4);
  const built = makeBoardFromTileIds(overrides.boardTiles);
  return {
    playerCount,
    phase: overrides.phase ?? 'in-play',
    seed: overrides.seed ?? 0,
    hands: overrides.hands.map((h) => Object.freeze([...h])),
    boneyard: overrides.boneyard ?? [],
    board: overrides.board ?? built.board,
    leftEnd: overrides.leftEnd ?? built.leftEnd,
    rightEnd: overrides.rightEnd ?? built.rightEnd,
    turn: overrides.turn,
    passCount: overrides.passCount ?? 0,
    opener: overrides.opener ?? null,
    openerTileId: overrides.openerTileId ?? null,
    history: overrides.history ?? [],
    result: overrides.result ?? null,
  };
}

export function countAllTiles(state: GameState): number {
  let n = 0;
  for (const hand of state.hands) n += hand.length;
  n += state.boneyard.length;
  n += state.board.length;
  return n;
}
