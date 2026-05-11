import {
  chooseAutoAction,
  createInitialState,
  reduce,
  type GameAction,
  type GameState,
  type Seat,
} from '@domino/engine';
import { buildOfflinePublicView, buildOfflinePrivateView, toWireResult } from './views.js';
import type {
  End,
  MatchResult,
  PrivatePlayerView,
  PublicMatchView,
  TileId,
} from '@domino/contracts';

export const HUMAN_SEAT: Seat = 0;
export const OFFLINE_ROOM_CODE = 'OFFLIN';
export const BOT_DELAY_MS = 600;
export const TURN_DURATION_MS = 30_000;

export interface OfflineSnapshot {
  view: PublicMatchView;
  me: PrivatePlayerView;
  result: MatchResult | null;
  isHumanTurn: boolean;
}

export interface OfflineRunner {
  snapshot(): OfflineSnapshot;
  applyHumanLay(tileId: TileId, end: End): boolean;
  applyHumanDraw(): boolean;
  applyHumanPass(): boolean;
  stepBot(): boolean;
  isHumanTurn(): boolean;
  isEnded(): boolean;
}

export function createOfflineRunner(opts: { seed: number; playerCount: 2 | 4 }): OfflineRunner {
  let state: GameState = createInitialState(opts.seed, opts.playerCount);
  const startTime = Date.now();

  const applyAction = (action: GameAction): boolean => {
    const result = reduce(state, action);
    if (!result.ok) return false;
    state = result.state;
    return true;
  };

  return {
    snapshot(): OfflineSnapshot {
      const view = buildOfflinePublicView(state, startTime);
      const me = buildOfflinePrivateView(state, HUMAN_SEAT);
      const isHumanTurn = state.phase !== 'ended' && state.turn === HUMAN_SEAT;
      return { view, me, result: toWireResult(state.result), isHumanTurn };
    },
    applyHumanLay(tileId, end) {
      if (state.turn !== HUMAN_SEAT) return false;
      return applyAction({ type: 'LAY', actor: HUMAN_SEAT, tileId, end });
    },
    applyHumanDraw() {
      if (state.turn !== HUMAN_SEAT) return false;
      return applyAction({ type: 'DRAW', actor: HUMAN_SEAT });
    },
    applyHumanPass() {
      if (state.turn !== HUMAN_SEAT) return false;
      return applyAction({ type: 'PASS', actor: HUMAN_SEAT });
    },
    stepBot() {
      if (state.phase === 'ended') return false;
      if (state.turn === HUMAN_SEAT) return false;
      const action = chooseAutoAction(state, state.turn);
      if (action === null) return false;
      return applyAction(action);
    },
    isHumanTurn() {
      return state.phase !== 'ended' && state.turn === HUMAN_SEAT;
    },
    isEnded() {
      return state.phase === 'ended';
    },
  };
}
