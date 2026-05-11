import { legalMovesFor, type GameState, type MatchResult as EngineMatchResult } from '@domino/engine';
import type {
  MatchResult as WireMatchResult,
  PlayerSummary,
  PrivatePlayerView,
  PublicMatchView,
  Seat,
} from '@domino/contracts';
import type { Match } from '../rooms/registry.js';

function toWireResult(result: EngineMatchResult | null): WireMatchResult | null {
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

export function buildPublicView(match: Match): PublicMatchView {
  const game = match.game;
  const players: PlayerSummary[] = [];
  for (let i = 0; i < match.playerCount; i++) {
    const seat = match.seats[i];
    if (seat) {
      const handCount = game ? (game.hands[i]?.length ?? 0) : 0;
      players.push({
        seat: seat.seat,
        displayName: seat.displayName,
        avatarId: seat.avatarId,
        connected: seat.socketId !== null,
        handCount,
        ...(match.status === 'lobby' ? { ready: seat.ready } : {}),
      });
    }
  }
  return {
    roomCode: match.roomCode,
    mode: match.mode,
    playerCount: match.playerCount,
    status: match.status,
    players,
    board: game ? game.board.map((b) => ({ tileId: b.tileId, orientation: b.orientation })) : [],
    leftEnd: game ? game.leftEnd : null,
    rightEnd: game ? game.rightEnd : null,
    boneyardCount: game ? game.boneyard.length : 0,
    currentSeat: game && match.status === 'playing' ? game.turn : null,
    turnDeadlineMs: match.status === 'playing' ? match.turnDeadlineMs : null,
    result: game ? toWireResult(game.result) : null,
  };
}

export function buildPrivateView(game: GameState, seat: Seat): PrivatePlayerView {
  const moves = legalMovesFor(game, seat);
  return {
    mySeat: seat,
    myHand: [...(game.hands[seat] ?? [])],
    legalMoves: moves.map((m) => ({ tileId: m.tileId, ends: [...m.ends] })),
  };
}
