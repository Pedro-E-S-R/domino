import { enumerateTiles, type TileId } from './tile.js';
import { mulberry32, shuffle } from './rng.js';
import { selectOpener } from './opener.js';
import type { Seat } from './actions.js';
import type { GameState } from './state.js';

const HAND_SIZE = 7;

export function createInitialState(seed: number, playerCount: 2 | 4): GameState {
  const rng = mulberry32(seed);
  const allTileIds: TileId[] = enumerateTiles().map((t) => t.id);
  const shuffled = shuffle(rng, allTileIds);

  const hands: TileId[][] = [];
  for (let s = 0; s < playerCount; s++) {
    const start = s * HAND_SIZE;
    hands.push(shuffled.slice(start, start + HAND_SIZE));
  }
  const boneyard = shuffled.slice(playerCount * HAND_SIZE);

  const opener = selectOpener(hands);

  const state: GameState = {
    playerCount,
    phase: 'awaiting-opener',
    seed,
    hands: hands.map((h) => Object.freeze(h)),
    boneyard: Object.freeze(boneyard),
    board: [],
    leftEnd: null,
    rightEnd: null,
    turn: opener.seat as Seat,
    passCount: 0,
    opener: opener.seat,
    openerTileId: opener.tileId,
    history: Object.freeze([{ type: 'DEAL', seed }] as const),
    result: null,
  };

  return state;
}
