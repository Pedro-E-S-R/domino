import pino, { type Logger } from 'pino';

export interface CreateLoggerOptions {
  level?: pino.LevelWithSilent;
  pretty?: boolean;
}

export function createLogger(opts: CreateLoggerOptions = {}): Logger {
  const level = opts.level ?? (process.env['LOG_LEVEL'] as pino.LevelWithSilent | undefined) ?? 'info';
  const pretty = opts.pretty ?? process.env['NODE_ENV'] !== 'production';
  if (pretty) {
    return pino({
      level,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss.l' },
      },
    });
  }
  return pino({ level });
}
