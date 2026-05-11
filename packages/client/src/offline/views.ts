import { legalMovesFor, type GameState, type Seat } from '@domino/engine';
import type {
  MatchResult,
  PlayerSummary,
  PrivatePlayerView,
  PublicMatchView,
} from '@domino/contracts';
import { OFFLINE_ROOM_CODE, TURN_DURATION_MS } from './runner.js';

const HUMAN_NAME = 'Você';
const BOT_NAMES = ['Compadre', 'Comadre', 'Vizinho'] as const;
const AVATARS = ['verde', 'amarelo', 'marrom', 'azul'] as const;

export function toWireResult(result: GameState['result']): MatchResult | null {
  if (!result) return null;
  if (result.outcome.kind === 'tied-block') {
    return {
      outcome: { kind: 'tied-block', tied: [...result.outcome.tied] },
      pipsBySeat: [...result.pipsBySeat],
    };
  }
  return {
    outcome: { kind: result.outcome.kind, winner: result.outcome.winner },
    pipsBySeat: [...result.pipsBySeat],
  };
}

export function buildOfflinePublicView(state: GameState, startTime: number): PublicMatchView {
  const players: PlayerSummary[] = [];
  for (let i = 0; i < state.playerCount; i++) {
    const handCount = state.hands[i]?.length ?? 0;
    players.push({
      seat: i as Seat,
      displayName: i === 0 ? HUMAN_NAME : (BOT_NAMES[i - 1] ?? `Bot ${i}`),
      avatarId: AVATARS[i] ?? 'verde',
      connected: true,
      handCount,
    });
  }
  const status: PublicMatchView['status'] = state.phase === 'ended' ? 'ended' : 'playing';
  void startTime;
  return {
    roomCode: OFFLINE_ROOM_CODE,
    mode: 'online',
    playerCount: state.playerCount,
    status,
    players,
    board: state.board.map((b) => ({ tileId: b.tileId, orientation: b.orientation })),
    leftEnd: state.leftEnd,
    rightEnd: state.rightEnd,
    boneyardCount: state.boneyard.length,
    currentSeat: state.phase === 'ended' ? null : state.turn,
    turnDeadlineMs: state.phase === 'ended' ? null : Date.now() + TURN_DURATION_MS,
    result: toWireResult(state.result),
  };
}

export function buildOfflinePrivateView(state: GameState, seat: Seat): PrivatePlayerView {
  const moves = legalMovesFor(state, seat);
  return {
    mySeat: seat,
    myHand: [...(state.hands[seat] ?? [])],
    legalMoves: moves.map((m) => ({ tileId: m.tileId, ends: [...m.ends] })),
  };
}
