import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import type { Logger } from 'pino';
import { PROTOCOL_VERSION } from '@domino/contracts';
import type { ServerConfig } from './config.js';
import type { SessionStore } from './sessions/token.js';

export interface HttpAppOptions {
  readonly config: ServerConfig;
  readonly sessions: SessionStore;
  readonly logger: Logger;
}

export function createHttpApp(opts: HttpAppOptions): Express {
  const { config, sessions, logger } = opts;
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

  return app;
}
