import { getTile, otherEnd, tileMatchesEnd, type PipValue, type TileId } from './tile.js';
import type { GameAction, RuleError, Seat } from './actions.js';
import type { GameState, LaidTile, ReducerResult } from './state.js';
import { hasLegalMove } from './selectors.js';
import { detectBlock, detectWin, makeBlockResult, makeWinResult } from './outcome.js';

export function reduce(state: GameState, action: GameAction): ReducerResult {
  if (action.type === 'DEAL') {
    return err('WRONG_PHASE');
  }
  if (state.phase === 'pre-deal') {
    return err('WRONG_PHASE');
  }
  if (state.phase === 'ended') {
    return err('MATCH_ENDED');
  }
  if (action.actor !== state.turn) {
    return err('NOT_YOUR_TURN');
  }

  switch (action.type) {
    case 'LAY':
      return reduceLay(state, action.actor, action.tileId, action.end);
    case 'DRAW':
      return reduceDraw(state, action.actor);
    case 'PASS':
      return reducePass(state, action.actor);
  }
}

function reduceLay(state: GameState, actor: Seat, tileId: TileId, end: 'left' | 'right'): ReducerResult {
  const hand = state.hands[actor];
  if (!hand || !hand.includes(tileId)) {
    return err('TILE_NOT_IN_HAND');
  }

  if (state.phase === 'awaiting-opener') {
    if (state.openerTileId === null || tileId !== state.openerTileId) {
      return err('MUST_LAY_OPENER_TILE');
    }
    return applyOpenerLay(state, actor, tileId);
  }

  const exposed = end === 'left' ? state.leftEnd : state.rightEnd;
  if (exposed === null) {
    return err('TILE_DOES_NOT_MATCH_END');
  }
  const tile = getTile(tileId);
  if (!tileMatchesEnd(tile, exposed)) {
    return err('TILE_DOES_NOT_MATCH_END');
  }
  return applyLay(state, actor, tileId, end, exposed);
}

function applyOpenerLay(state: GameState, actor: Seat, tileId: TileId): ReducerResult {
  const tile = getTile(tileId);
  const newHand = removeTileFromHand(state.hands[actor] as readonly TileId[], tileId);
  const newHands = replaceHand(state.hands, actor, newHand);

  const laid: LaidTile = { tileId, orientation: 'normal' };
  const board = [laid];
  const left: PipValue = tile.a;
  const right: PipValue = tile.b;

  return tryEnd({
    ...state,
    phase: 'in-play',
    hands: newHands,
    board,
    leftEnd: left,
    rightEnd: right,
    turn: nextSeat(actor, state.playerCount),
    passCount: 0,
    history: appendHistory(state, { type: 'LAY', actor, tileId, end: 'left' }),
  });
}

function applyLay(
  state: GameState,
  actor: Seat,
  tileId: TileId,
  end: 'left' | 'right',
  exposed: PipValue,
): ReducerResult {
  const tile = getTile(tileId);
  const newExposed = otherEnd(tile, exposed);
  const orientation: LaidTile['orientation'] =
    end === 'left'
      ? tile.b === exposed
        ? 'normal'
        : 'flipped'
      : tile.a === exposed
        ? 'normal'
        : 'flipped';

  const laid: LaidTile = { tileId, orientation };
  const board =
    end === 'left' ? [laid, ...state.board] : [...state.board, laid];

  const leftEnd = end === 'left' ? newExposed : state.leftEnd;
  const rightEnd = end === 'right' ? newExposed : state.rightEnd;

  const newHand = removeTileFromHand(state.hands[actor] as readonly TileId[], tileId);
  const newHands = replaceHand(state.hands, actor, newHand);

  return tryEnd({
    ...state,
    hands: newHands,
    board,
    leftEnd,
    rightEnd,
    turn: nextSeat(actor, state.playerCount),
    passCount: 0,
    history: appendHistory(state, { type: 'LAY', actor, tileId, end }),
  });
}

function reduceDraw(state: GameState, actor: Seat): ReducerResult {
  if (state.phase !== 'in-play') {
    return err('WRONG_PHASE');
  }
  if (hasLegalMove(state, actor)) {
    return err('CANNOT_DRAW_HAS_LEGAL_MOVE');
  }
  if (state.boneyard.length === 0) {
    return err('CANNOT_DRAW_EMPTY_BONEYARD');
  }

  const drawn = state.boneyard[state.boneyard.length - 1] as TileId;
  const newBoneyard = state.boneyard.slice(0, -1);
  const newHand = [...(state.hands[actor] as readonly TileId[]), drawn];
  const newHands = replaceHand(state.hands, actor, newHand);

  const drawnTile = getTile(drawn);
  const left = state.leftEnd as PipValue;
  const right = state.rightEnd as PipValue;
  const drawnIsLegal = tileMatchesEnd(drawnTile, left) || tileMatchesEnd(drawnTile, right);

  const baseHistory = appendHistory(state, { type: 'DRAW', actor });

  if (drawnIsLegal) {
    return ok({
      ...state,
      hands: newHands,
      boneyard: newBoneyard,
      history: baseHistory,
    });
  }
  return ok({
    ...state,
    hands: newHands,
    boneyard: newBoneyard,
    turn: nextSeat(actor, state.playerCount),
    history: baseHistory,
  });
}

function reducePass(state: GameState, actor: Seat): ReducerResult {
  if (state.phase !== 'in-play') {
    return err('WRONG_PHASE');
  }
  if (state.boneyard.length > 0) {
    return err('CANNOT_PASS_BONEYARD_NOT_EMPTY');
  }
  if (hasLegalMove(state, actor)) {
    return err('CANNOT_PASS_HAS_LEGAL_MOVE');
  }

  const newPassCount = state.passCount + 1;
  const next: GameState = {
    ...state,
    passCount: newPassCount,
    turn: nextSeat(actor, state.playerCount),
    history: appendHistory(state, { type: 'PASS', actor }),
  };

  if (newPassCount >= state.playerCount) {
    const blockOutcome = detectBlock(next);
    if (blockOutcome !== null) {
      return ok({
        ...next,
        phase: 'ended',
        result: makeBlockResult(blockOutcome, next.hands),
      });
    }
  }
  return ok(next);
}

function tryEnd(next: GameState): ReducerResult {
  const winner = detectWin(next.hands);
  if (winner !== null) {
    return ok({
      ...next,
      phase: 'ended',
      result: makeWinResult(winner, next.hands),
    });
  }
  return ok(next);
}

function removeTileFromHand(hand: readonly TileId[], tileId: TileId): TileId[] {
  const out: TileId[] = [];
  let removed = false;
  for (const id of hand) {
    if (!removed && id === tileId) {
      removed = true;
      continue;
    }
    out.push(id);
  }
  return out;
}

function replaceHand(
  hands: readonly (readonly TileId[])[],
  seat: Seat,
  newHand: readonly TileId[],
): readonly (readonly TileId[])[] {
  return hands.map((h, i) => (i === seat ? newHand : h));
}

function nextSeat(seat: Seat, playerCount: 2 | 4): Seat {
  return ((seat + 1) % playerCount) as Seat;
}

function appendHistory(state: GameState, action: GameAction): readonly GameAction[] {
  return [...state.history, action];
}

function ok(state: GameState): ReducerResult {
  return { ok: true, state };
}

function err(error: RuleError): ReducerResult {
  return { ok: false, error };
}

export function applyActions(state: GameState, actions: readonly GameAction[]): ReducerResult {
  let cur = state;
  for (const action of actions) {
    const result = reduce(cur, action);
    if (!result.ok) return result;
    cur = result.state;
  }
  return ok(cur);
}

