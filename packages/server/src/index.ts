import { createServer } from 'node:http';
import { parseConfig } from './config.js';
import { createLogger } from './observability/logger.js';
import { createHttpApp } from './http.js';
import { createSocketServer } from './io.js';
import { SessionStore } from './sessions/token.js';
import { RoomRegistry } from './rooms/registry.js';

async function main(): Promise<void> {
  const config = parseConfig(process.argv.slice(2));
  const logger = createLogger();
  const sessions = new SessionStore();
  const registry = new RoomRegistry();
  setInterval(() => {
    const removed = registry.gcOrphans();
    if (removed > 0) logger.info({ removed }, 'GC: removed orphan matches');
  }, 5 * 60 * 1000).unref();

  const app = createHttpApp({ config, sessions, registry, logger });
  const httpServer = createServer(app);
  createSocketServer({ httpServer, sessions, registry, logger });

  httpServer.listen(config.port, config.host, () => {
    logger.info(
      { mode: config.mode, host: config.host, port: config.port },
      'Dominó Online server listening',
    );
  });

  const shutdown = (): void => {
    logger.info('shutting down');
    httpServer.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
