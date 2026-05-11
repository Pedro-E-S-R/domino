import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import type { Logger } from 'pino';
import { PROTOCOL_VERSION } from '@domino/contracts';
import { isRoomsEndpointEnabled, type ServerConfig } from './config.js';
import type { SessionStore } from './sessions/token.js';
import type { RoomRegistry } from './rooms/registry.js';

export interface HttpAppOptions {
  readonly config: ServerConfig;
  readonly sessions: SessionStore;
  readonly registry: RoomRegistry;
  readonly logger: Logger;
}

export function createHttpApp(opts: HttpAppOptions): Express {
  const { config, sessions, registry, logger } = opts;
  const app = express();

  app.use(express.json({ limit: '64kb' }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      protocolVersion: PROTOCOL_VERSION,
      now: Date.now(),
      mode: config.mode,
      roomsEndpoint: isRoomsEndpointEnabled(config),
    });
  });

  app.post('/session', (_req, res) => {
    const record = sessions.issue();
    logger.info({ token: record.token.slice(0, 8) }, 'session issued');
    res.json({
      sessionToken: record.token,
      issuedAt: record.issuedAt,
      protocolVersion: PROTOCOL_VERSION,
    });
  });

  if (isRoomsEndpointEnabled(config)) {
    app.get('/rooms', (_req, res) => {
      const now = Date.now();
      const rooms = registry.list().map((match) => ({
        roomCode: match.roomCode,
        mode: match.mode,
        playerCount: match.playerCount,
        status: match.status,
        seatsFilled: match.seats.filter((s) => s !== null).length,
        ageMs: now - match.createdAt,
        lastActivityMs: now - match.lastActivityAt,
        currentSeat: match.game?.phase === 'in-play' || match.game?.phase === 'awaiting-opener'
          ? match.game.turn
          : null,
        boardLength: match.game?.board.length ?? 0,
        boneyardCount: match.game?.boneyard.length ?? null,
        players: match.seats
          .filter((s): s is NonNullable<typeof s> => s !== null)
          .map((s) => ({
            seat: s.seat,
            displayName: s.displayName,
            avatarId: s.avatarId,
            connected: s.socketId !== null,
            ready: s.ready,
            handCount: match.game?.hands[s.seat]?.length ?? 0,
          })),
      }));
      res.json({
        serverNow: now,
        mode: config.mode,
        count: rooms.length,
        rooms,
      });
    });
  }

  return app;
}
