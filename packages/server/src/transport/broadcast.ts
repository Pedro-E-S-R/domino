import type { Server as SocketIOServer } from 'socket.io';
import type { Match } from '../rooms/registry.js';
import { buildPrivateView, buildPublicView } from './views.js';
import type { LastAction, MatchStateEvent, RoomStateEvent } from '@domino/contracts';

export function broadcastRoomState(io: SocketIOServer, match: Match): void {
  const view = buildPublicView(match);
  for (const seat of match.seats) {
    if (!seat || !seat.socketId) continue;
    const me = match.game
      ? buildPrivateView(match.game, seat.seat)
      : { mySeat: seat.seat, myHand: [], legalMoves: [] };
    const payload: RoomStateEvent = { view, me };
    io.to(seat.socketId).emit('room:state', payload);
  }
}

export function broadcastMatchState(
  io: SocketIOServer,
  match: Match,
  lastAction: LastAction | null,
): void {
  if (!match.game) return;
  const view = buildPublicView(match);
  for (const seat of match.seats) {
    if (!seat || !seat.socketId) continue;
    const me = buildPrivateView(match.game, seat.seat);
    const filteredAction =
      lastAction && lastAction.kind === 'DRAW' && lastAction.actor !== seat.seat
        ? { ...lastAction, tileId: undefined }
        : lastAction;
    const payload: MatchStateEvent = { view, me, lastAction: filteredAction };
    io.to(seat.socketId).emit('match:state', payload);
  }
}

export function broadcastMatchEnded(io: SocketIOServer, match: Match): void {
  if (!match.game?.result) return;
  const view = buildPublicView(match);
  const wireResult = view.result;
  if (!wireResult) return;
  for (const seat of match.seats) {
    if (!seat || !seat.socketId) continue;
    io.to(seat.socketId).emit('match:ended', { result: wireResult, view });
  }
}

export function sendError(
  io: SocketIOServer,
  socketId: string,
  code:
    | 'PROTOCOL_MISMATCH'
    | 'INVALID_PAYLOAD'
    | 'ROOM_NOT_FOUND'
    | 'ROOM_FULL'
    | 'ROOM_IN_PROGRESS'
    | 'NOT_HOST'
    | 'NOT_YOUR_TURN'
    | 'ILLEGAL_MOVE'
    | 'NOT_IN_MATCH'
    | 'MATCH_ENDED'
    | 'HOST_DISCONNECTED'
    | 'RECONNECT_WINDOW_EXPIRED'
    | 'INTERNAL',
  message: string,
  detail?: Record<string, unknown>,
): void {
  io.to(socketId).emit('error', detail ? { code, message, detail } : { code, message });
}
