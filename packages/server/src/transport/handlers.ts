import { randomBytes } from 'node:crypto';
import type { Logger } from 'pino';
import type { Server as SocketIOServer, Socket } from 'socket.io';
import {
  MoveDrawPayloadSchema,
  MoveLayPayloadSchema,
  MovePassPayloadSchema,
  RoomCreatePayloadSchema,
  RoomJoinPayloadSchema,
  RoomLeavePayloadSchema,
  RoomReadyPayloadSchema,
  RoomRematchPayloadSchema,
  RoomStartPayloadSchema,
  type LastAction,
  type SessionToken,
} from '@domino/contracts';
import {
  chooseAutoAction,
  createInitialState,
  reduce,
  type GameAction,
  type Seat,
} from '@domino/engine';
import type { Match, RoomRegistry, SeatRecord } from '../rooms/registry.js';
import {
  broadcastMatchEnded,
  broadcastMatchState,
  broadcastRoomState,
  sendError,
} from './broadcast.js';
import type { SocketData } from '../io.js';

export const DEFAULT_TURN_DURATION_MS = 30_000;
export const DEFAULT_RECONNECT_WINDOW_MS = 5 * 60 * 1000;

export interface HandlerContext {
  readonly io: SocketIOServer;
  readonly registry: RoomRegistry;
  readonly logger: Logger;
  readonly turnDurationMs?: number;
  readonly reconnectWindowMs?: number;
}

export function attachHandlers(socket: Socket, ctx: HandlerContext): void {
  const { io, registry, logger } = ctx;
  const reconnectWindowMs = ctx.reconnectWindowMs ?? DEFAULT_RECONNECT_WINDOW_MS;
  const data = socket.data as SocketData;
  const token: SessionToken = data.sessionToken;

  const existingMatch = registry.findByToken(token);
  if (existingMatch && existingMatch.status === 'playing') {
    const seat = registry.seatOf(existingMatch, token);
    if (seat) {
      if (
        seat.disconnectedAt !== null &&
        Date.now() - seat.disconnectedAt > reconnectWindowMs
      ) {
        socket.emit('error', {
          code: 'RECONNECT_WINDOW_EXPIRED',
          message: 'Você ficou ausente por muito tempo e a partida continuou sem você.',
        });
        setTimeout(() => socket.disconnect(true), 100);
        return;
      }
      seat.socketId = socket.id;
      seat.disconnectedAt = null;
      registry.touch(existingMatch);
      broadcastRoomState(io, existingMatch);
      if (existingMatch.game) {
        broadcastMatchState(io, existingMatch, null);
      }
    }
  } else if (existingMatch && existingMatch.status === 'lobby') {
    registry.removeBySessionToken(token);
    broadcastRoomState(io, existingMatch);
  }

  socket.on('room:create', (raw: unknown) => {
    const parsed = RoomCreatePayloadSchema.safeParse(raw);
    if (!parsed.success) {
      sendError(io, socket.id, 'INVALID_PAYLOAD', 'Pedido de criação inválido.');
      return;
    }
    const match = registry.create({
      mode: parsed.data.mode,
      playerCount: parsed.data.playerCount,
      hostSessionToken: token,
      hostSocketId: socket.id,
      ...(parsed.data.displayName ? { hostDisplayName: parsed.data.displayName } : {}),
    });
    logger.info({ roomCode: match.roomCode, mode: match.mode, pc: match.playerCount }, 'room created');
    broadcastRoomState(io, match);
  });

  socket.on('room:join', (raw: unknown) => {
    const parsed = RoomJoinPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      sendError(io, socket.id, 'INVALID_PAYLOAD', 'Código de sala inválido.');
      return;
    }
    const result = registry.join({
      roomCode: parsed.data.roomCode,
      sessionToken: token,
      socketId: socket.id,
      ...(parsed.data.displayName ? { displayName: parsed.data.displayName } : {}),
    });
    if ('error' in result) {
      const msg =
        result.error === 'ROOM_NOT_FOUND'
          ? 'Sala não encontrada.'
          : result.error === 'ROOM_FULL'
            ? 'A sala está cheia.'
            : 'A partida já começou.';
      sendError(io, socket.id, result.error, msg);
      return;
    }
    logger.info({ roomCode: result.match.roomCode, seat: result.seat }, 'player joined');
    broadcastRoomState(io, result.match);
  });

  socket.on('room:ready', (raw: unknown) => {
    const parsed = RoomReadyPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      sendError(io, socket.id, 'INVALID_PAYLOAD', 'Pronto inválido.');
      return;
    }
    const match = registry.findByToken(token);
    if (!match) {
      sendError(io, socket.id, 'NOT_IN_MATCH', 'Você não está em uma sala.');
      return;
    }
    if (match.status !== 'lobby') {
      sendError(io, socket.id, 'ROOM_IN_PROGRESS', 'A partida já começou.');
      return;
    }
    const seat = registry.seatOf(match, token);
    if (!seat) return;
    seat.ready = parsed.data.ready;
    registry.touch(match);
    broadcastRoomState(io, match);
  });

  socket.on('room:leave', (raw: unknown) => {
    const parsed = RoomLeavePayloadSchema.safeParse(raw);
    if (!parsed.success) return;
    const match = registry.findByToken(token);
    if (!match) return;
    registry.removeBySessionToken(token);
    if (registry.findByCode(match.roomCode)) {
      broadcastRoomState(io, match);
    }
  });

  socket.on('room:start', (raw: unknown) => {
    const parsed = RoomStartPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      sendError(io, socket.id, 'INVALID_PAYLOAD', 'Iniciar inválido.');
      return;
    }
    const match = registry.findByToken(token);
    if (!match) {
      sendError(io, socket.id, 'NOT_IN_MATCH', 'Você não está em uma sala.');
      return;
    }
    if (match.hostSessionToken !== token) {
      sendError(io, socket.id, 'NOT_HOST', 'Apenas o host pode iniciar.');
      return;
    }
    if (match.status !== 'lobby') {
      sendError(io, socket.id, 'ROOM_IN_PROGRESS', 'A partida já começou.');
      return;
    }
    const allFilled = match.seats.every((s) => s !== null);
    const allReady = match.seats.every((s) => s !== null && s.ready);
    if (!allFilled || !allReady) {
      sendError(io, socket.id, 'INVALID_PAYLOAD', 'Todos os jogadores precisam estar prontos.');
      return;
    }

    const seed = randomBytes(4).readUInt32LE(0);
    const game = createInitialState(seed, match.playerCount);
    match.game = game;
    match.status = 'playing';
    match.turnDeadlineMs = Date.now() + turnDurationMs(ctx);
    registry.touch(match);

    logger.info({ roomCode: match.roomCode, seed, opener: game.opener }, 'match started');

    for (const seat of match.seats) {
      if (!seat || !seat.socketId) continue;
      io.to(seat.socketId).emit('match:started', {
        opener: game.opener as Seat,
        turnDeadlineMs: match.turnDeadlineMs,
      });
    }
    broadcastMatchState(io, match, null);
    armTurnTimer(ctx, match);
  });

  socket.on('room:rematch', (raw: unknown) => {
    const parsed = RoomRematchPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      sendError(io, socket.id, 'INVALID_PAYLOAD', 'Pedido de rematch inválido.');
      return;
    }
    const match = registry.findByToken(token);
    if (!match) {
      sendError(io, socket.id, 'NOT_IN_MATCH', 'Você não está em uma partida.');
      return;
    }
    if (match.hostSessionToken !== token) {
      sendError(io, socket.id, 'NOT_HOST', 'Apenas o host pode jogar novamente.');
      return;
    }
    if (match.status !== 'ended') {
      sendError(io, socket.id, 'INVALID_PAYLOAD', 'Só é possível rematch após o fim de jogo.');
      return;
    }
    const stillSeated = match.seats.filter((s) => s !== null).length;
    if (stillSeated < match.playerCount) {
      sendError(io, socket.id, 'INVALID_PAYLOAD', 'Aguardando jogadores reconectarem.');
      return;
    }

    const seed = randomBytes(4).readUInt32LE(0);
    const game = createInitialState(seed, match.playerCount);
    match.game = game;
    match.status = 'playing';
    match.turnDeadlineMs = Date.now() + turnDurationMs(ctx);
    match.processedMoveIds.clear();
    registry.touch(match);

    logger.info({ roomCode: match.roomCode, seed, opener: game.opener }, 'match rematch');

    for (const seat of match.seats) {
      if (!seat || !seat.socketId) continue;
      io.to(seat.socketId).emit('match:started', {
        opener: game.opener as Seat,
        turnDeadlineMs: match.turnDeadlineMs,
      });
    }
    broadcastMatchState(io, match, null);
    armTurnTimer(ctx, match);
  });

  socket.on('move:lay', (raw: unknown) => handleMove(ctx, token, raw, 'LAY', socket.id));
  socket.on('move:draw', (raw: unknown) => handleMove(ctx, token, raw, 'DRAW', socket.id));
  socket.on('move:pass', (raw: unknown) => handleMove(ctx, token, raw, 'PASS', socket.id));

  socket.on('disconnect', (reason) => {
    logger.info({ id: socket.id, reason }, 'socket disconnected');
    const match = registry.findByToken(token);
    if (!match) return;
    const seat = registry.seatOf(match, token);
    if (!seat) return;
    if (seat.socketId === socket.id) {
      seat.socketId = null;
      seat.disconnectedAt = Date.now();
      registry.touch(match);
      broadcastRoomState(io, match);
    }
  });
}

function turnDurationMs(ctx: HandlerContext): number {
  return ctx.turnDurationMs ?? DEFAULT_TURN_DURATION_MS;
}

function clearTurnTimer(match: Match): void {
  if (match.turnTimer) {
    clearTimeout(match.turnTimer);
    match.turnTimer = null;
  }
}

function armTurnTimer(ctx: HandlerContext, match: Match): void {
  clearTurnTimer(match);
  if (match.status !== 'playing' || !match.game || match.game.phase === 'ended') {
    return;
  }
  const duration = turnDurationMs(ctx);
  match.turnDeadlineMs = Date.now() + duration;
  match.turnTimer = setTimeout(() => {
    fireAutoAction(ctx, match);
  }, duration);
}

function fireAutoAction(ctx: HandlerContext, match: Match): void {
  if (match.status !== 'playing' || !match.game) return;
  const seat = match.game.turn;
  const action = chooseAutoAction(match.game, seat);
  if (action === null) return;
  applyEngineAction(ctx, match, action);
}

function applyEngineAction(ctx: HandlerContext, match: Match, action: GameAction): void {
  const { io, registry, logger } = ctx;
  if (!match.game) return;
  const result = reduce(match.game, action);
  if (!result.ok) {
    logger.warn({ roomCode: match.roomCode, error: result.error }, 'auto-action rejected');
    return;
  }
  match.game = result.state;
  registry.touch(match);

  const lastAction: LastAction =
    action.type === 'LAY'
      ? { actor: action.actor, kind: 'LAY', tileId: action.tileId, end: action.end }
      : action.type === 'DRAW'
        ? { actor: action.actor, kind: 'DRAW' }
        : action.type === 'PASS'
          ? { actor: action.actor, kind: 'PASS' }
          : { actor: 0 as Seat, kind: 'PASS' };

  broadcastMatchState(io, match, lastAction);

  if (result.state.phase === 'ended') {
    clearTurnTimer(match);
    match.status = 'ended';
    match.turnDeadlineMs = null;
    logger.info({ roomCode: match.roomCode, outcome: result.state.result?.outcome.kind }, 'match ended');
    broadcastMatchEnded(io, match);
  } else {
    armTurnTimer(ctx, match);
  }
}

function handleMove(
  ctx: HandlerContext,
  token: SessionToken,
  raw: unknown,
  kind: 'LAY' | 'DRAW' | 'PASS',
  socketId: string,
): void {
  const { io, registry, logger } = ctx;
  void logger;

  let parsedMoveId: string;
  let action: GameAction;
  if (kind === 'LAY') {
    const r = MoveLayPayloadSchema.safeParse(raw);
    if (!r.success) {
      sendError(io, socketId, 'INVALID_PAYLOAD', 'Jogada inválida.');
      return;
    }
    parsedMoveId = r.data.moveId;
    const match = registry.findByToken(token);
    if (!match) {
      sendError(io, socketId, 'NOT_IN_MATCH', 'Você não está em uma partida.');
      return;
    }
    const seat = registry.seatOf(match, token);
    if (!seat) {
      sendError(io, socketId, 'NOT_IN_MATCH', 'Você não tem assento na partida.');
      return;
    }
    action = { type: 'LAY', actor: seat.seat, tileId: r.data.tileId, end: r.data.end };
    applyMove(ctx, match, seat, action, parsedMoveId);
    return;
  }
  if (kind === 'DRAW') {
    const r = MoveDrawPayloadSchema.safeParse(raw);
    if (!r.success) {
      sendError(io, socketId, 'INVALID_PAYLOAD', 'Compra inválida.');
      return;
    }
    parsedMoveId = r.data.moveId;
    const match = registry.findByToken(token);
    if (!match) {
      sendError(io, socketId, 'NOT_IN_MATCH', 'Você não está em uma partida.');
      return;
    }
    const seat = registry.seatOf(match, token);
    if (!seat) {
      sendError(io, socketId, 'NOT_IN_MATCH', 'Você não tem assento na partida.');
      return;
    }
    action = { type: 'DRAW', actor: seat.seat };
    applyMove(ctx, match, seat, action, parsedMoveId);
    return;
  }
  const r = MovePassPayloadSchema.safeParse(raw);
  if (!r.success) {
    sendError(io, socketId, 'INVALID_PAYLOAD', 'Passe inválido.');
    return;
  }
  parsedMoveId = r.data.moveId;
  const match = registry.findByToken(token);
  if (!match) {
    sendError(io, socketId, 'NOT_IN_MATCH', 'Você não está em uma partida.');
    return;
  }
  const seat = registry.seatOf(match, token);
  if (!seat) {
    sendError(io, socketId, 'NOT_IN_MATCH', 'Você não tem assento na partida.');
    return;
  }
  action = { type: 'PASS', actor: seat.seat };
  applyMove(ctx, match, seat, action, parsedMoveId);
}

function applyMove(
  ctx: HandlerContext,
  match: Match,
  seat: SeatRecord,
  action: GameAction,
  moveId: string,
): void {
  const { io, registry, logger } = ctx;
  if (match.status !== 'playing' || !match.game) {
    sendError(io, seat.socketId ?? '', 'MATCH_ENDED', 'A partida não está em andamento.');
    return;
  }
  if (match.processedMoveIds.has(moveId)) {
    broadcastMatchState(io, match, null);
    return;
  }
  const result = reduce(match.game, action);
  if (!result.ok) {
    const code = result.error === 'NOT_YOUR_TURN' ? 'NOT_YOUR_TURN' : 'ILLEGAL_MOVE';
    sendError(io, seat.socketId ?? '', code, errorMessageFor(result.error), { rule: result.error });
    return;
  }
  match.game = result.state;
  match.processedMoveIds.add(moveId);
  registry.touch(match);

  let lastAction: LastAction;
  if (action.type === 'LAY') {
    lastAction = { actor: action.actor, kind: 'LAY', tileId: action.tileId, end: action.end };
  } else if (action.type === 'DRAW') {
    lastAction = { actor: action.actor, kind: 'DRAW' };
  } else if (action.type === 'PASS') {
    lastAction = { actor: action.actor, kind: 'PASS' };
  } else {
    return;
  }

  broadcastMatchState(io, match, lastAction);

  if (result.state.phase === 'ended') {
    clearTurnTimer(match);
    match.status = 'ended';
    match.turnDeadlineMs = null;
    logger.info({ roomCode: match.roomCode, outcome: result.state.result?.outcome.kind }, 'match ended');
    broadcastMatchEnded(io, match);
  } else {
    armTurnTimer(ctx, match);
  }
}

function errorMessageFor(rule: string): string {
  switch (rule) {
    case 'TILE_NOT_IN_HAND':
      return 'Você não tem essa peça.';
    case 'TILE_DOES_NOT_MATCH_END':
      return 'Essa peça não encaixa nessa ponta.';
    case 'MUST_LAY_OPENER_TILE':
      return 'Você precisa jogar a peça de abertura.';
    case 'CANNOT_DRAW_HAS_LEGAL_MOVE':
      return 'Você ainda pode jogar uma peça.';
    case 'CANNOT_DRAW_EMPTY_BONEYARD':
      return 'O monte está vazio.';
    case 'CANNOT_PASS_HAS_LEGAL_MOVE':
      return 'Você ainda pode jogar uma peça.';
    case 'CANNOT_PASS_BONEYARD_NOT_EMPTY':
      return 'Compre uma peça antes de passar.';
    case 'NOT_YOUR_TURN':
      return 'Não é sua vez.';
    case 'WRONG_PHASE':
      return 'Ação fora de fase.';
    case 'MATCH_ENDED':
      return 'A partida já terminou.';
    default:
      return 'Jogada ilegal.';
  }
}
