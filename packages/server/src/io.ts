import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import type { Logger } from 'pino';
import { PROTOCOL_VERSION, SocketAuthPayloadSchema, type SessionToken } from '@domino/contracts';
import type { SessionStore } from './sessions/token.js';
import type { RoomRegistry } from './rooms/registry.js';
import { attachHandlers } from './transport/handlers.js';

export interface IoOptions {
  readonly httpServer: HttpServer;
  readonly sessions: SessionStore;
  readonly registry: RoomRegistry;
  readonly logger: Logger;
}

export interface SocketData {
  sessionToken: SessionToken;
}

export function createSocketServer(opts: IoOptions): SocketIOServer {
  const { httpServer, sessions, registry, logger } = opts;
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const parsed = SocketAuthPayloadSchema.safeParse(socket.handshake.auth);
    if (!parsed.success) {
      logger.warn({ id: socket.id, issues: parsed.error.issues }, 'rejected: invalid auth payload');
      return next(new Error('INVALID_PAYLOAD'));
    }
    if (parsed.data.protocolVersion !== PROTOCOL_VERSION) {
      logger.warn(
        { id: socket.id, got: parsed.data.protocolVersion },
        'rejected: protocol mismatch',
      );
      return next(new Error('PROTOCOL_MISMATCH'));
    }
    if (!sessions.has(parsed.data.sessionToken)) {
      logger.warn({ id: socket.id }, 'rejected: unknown session token');
      return next(new Error('INVALID_PAYLOAD'));
    }
    (socket.data as SocketData).sessionToken = parsed.data.sessionToken;
    sessions.touch(parsed.data.sessionToken);
    return next();
  });

  io.on('connection', (socket) => {
    const data = socket.data as SocketData;
    logger.info({ id: socket.id, token: data.sessionToken.slice(0, 8) }, 'socket connected');
    attachHandlers(socket, { io, registry, logger });
  });

  return io;
}
