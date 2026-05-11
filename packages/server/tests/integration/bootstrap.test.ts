import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server as HttpServer } from 'node:http';
import { type AddressInfo } from 'node:net';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { PROTOCOL_VERSION } from '@domino/contracts';
import { createHttpApp } from '../../src/http.js';
import { createSocketServer } from '../../src/io.js';
import { createLogger } from '../../src/observability/logger.js';
import { SessionStore } from '../../src/sessions/token.js';
import { RoomRegistry } from '../../src/rooms/registry.js';
import type { ServerConfig } from '../../src/config.js';

let httpServer: HttpServer;
let baseUrl: string;
let sessions: SessionStore;

beforeAll(async () => {
  const config: ServerConfig = { mode: 'online', port: 0, host: '127.0.0.1' };
  sessions = new SessionStore();
  const registry = new RoomRegistry();
  const logger = createLogger({ level: 'silent' });
  const app = createHttpApp({ config, sessions, logger });
  httpServer = createServer(app);
  createSocketServer({ httpServer, sessions, registry, logger });
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const addr = httpServer.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

describe('GET /health', () => {
  it('returns ok + protocolVersion + mode', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['ok']).toBe(true);
    expect(body['protocolVersion']).toBe(PROTOCOL_VERSION);
    expect(body['mode']).toBe('online');
    expect(typeof body['now']).toBe('number');
  });
});

describe('POST /session', () => {
  it('issues a fresh session token', async () => {
    const res = await fetch(`${baseUrl}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    const token = body['sessionToken'] as string;
    expect(token).toMatch(/^[0-9a-f]{32}$/);
    expect(typeof body['issuedAt']).toBe('number');
    expect(body['protocolVersion']).toBe(PROTOCOL_VERSION);
    expect(sessions.has(token as never)).toBe(true);
  });
});

function connectSocket(auth: Record<string, unknown>): ClientSocket {
  return ioc(baseUrl, {
    auth,
    autoConnect: true,
    reconnection: false,
    transports: ['websocket'],
    forceNew: true,
  });
}

describe('Socket.IO auth handshake', () => {
  it('accepts a connection with a valid sessionToken + protocolVersion', async () => {
    const res = await fetch(`${baseUrl}/session`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    const { sessionToken } = (await res.json()) as { sessionToken: string };

    await new Promise<void>((resolve, reject) => {
      const sock = connectSocket({ protocolVersion: PROTOCOL_VERSION, sessionToken });
      sock.once('connect', () => {
        sock.disconnect();
        resolve();
      });
      sock.once('connect_error', (err) => reject(err));
    });
  });

  it('rejects a connection with mismatched protocolVersion', async () => {
    const res = await fetch(`${baseUrl}/session`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    const { sessionToken } = (await res.json()) as { sessionToken: string };

    await new Promise<void>((resolve, reject) => {
      const sock = connectSocket({ protocolVersion: '0.0.0', sessionToken });
      sock.once('connect_error', (err) => {
        expect(err.message).toBe('PROTOCOL_MISMATCH');
        sock.disconnect();
        resolve();
      });
      sock.once('connect', () => {
        sock.disconnect();
        reject(new Error('expected connect_error, got connect'));
      });
    });
  });

  it('rejects a connection with an unknown sessionToken', async () => {
    await new Promise<void>((resolve, reject) => {
      const sock = connectSocket({ protocolVersion: PROTOCOL_VERSION, sessionToken: 'f'.repeat(32) });
      sock.once('connect_error', (err) => {
        expect(err.message).toBe('INVALID_PAYLOAD');
        sock.disconnect();
        resolve();
      });
      sock.once('connect', () => {
        sock.disconnect();
        reject(new Error('expected connect_error, got connect'));
      });
    });
  });

  it('rejects a connection with malformed auth payload', async () => {
    await new Promise<void>((resolve, reject) => {
      const sock = connectSocket({ wrong: 'shape' });
      sock.once('connect_error', (err) => {
        expect(err.message).toBe('INVALID_PAYLOAD');
        sock.disconnect();
        resolve();
      });
      sock.once('connect', () => {
        sock.disconnect();
        reject(new Error('expected connect_error, got connect'));
      });
    });
  });
});
