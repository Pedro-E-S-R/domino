export type ServerMode = 'online' | 'lan';

export interface ServerConfig {
  readonly mode: ServerMode;
  readonly port: number;
  readonly host: string;
}

export function parseConfig(argv: readonly string[]): ServerConfig {
  let mode: ServerMode = 'online';
  let port = 4123;
  let host = '0.0.0.0';

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
    }
  }
  return { mode, port, host };
}
