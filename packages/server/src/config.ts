export type ServerMode = 'online' | 'lan';

export interface ServerConfig {
  readonly mode: ServerMode;
  readonly port: number;
  readonly host: string;
  readonly debug: boolean;
}

export function parseConfig(argv: readonly string[]): ServerConfig {
  let mode: ServerMode = 'online';
  let port = readEnvPort() ?? 4123;
  let host = process.env['HOST'] && process.env['HOST']!.length > 0 ? process.env['HOST']! : '0.0.0.0';
  let debug = false;

  for (const arg of argv) {
    if (arg.startsWith('--mode=')) {
      const v = arg.slice('--mode='.length);
      if (v !== 'online' && v !== 'lan') {
        throw new Error(`Invalid --mode value: ${v} (expected 'online' or 'lan')`);
      }
      mode = v;
    } else if (arg.startsWith('--port=')) {
      const v = Number.parseInt(arg.slice('--port='.length), 10);
      if (!Number.isFinite(v) || v <= 0 || v > 65535) {
        throw new Error(`Invalid --port value: ${arg.slice('--port='.length)}`);
      }
      port = v;
    } else if (arg.startsWith('--host=')) {
      host = arg.slice('--host='.length);
    } else if (arg === '--debug') {
      debug = true;
    }
  }
  return { mode, port, host, debug };
}

export function isRoomsEndpointEnabled(config: ServerConfig): boolean {
  return config.mode === 'lan' || config.debug;
}

function readEnvPort(): number | null {
  const raw = process.env['PORT'];
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) return null;
  return parsed;
}
