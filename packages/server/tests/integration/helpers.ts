import { createServer, type Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import {
  PROTOCOL_VERSION,
  type MatchResult,
  type MatchStateEvent,
  type MatchEndedEvent,
  type PrivatePlayerView,
  type PublicMatchView,
  type RoomStateEvent,
} from '@domino/contracts';
import { createHttpApp } from '../../src/http.js';
import { createSocketServer } from '../../src/io.js';
import { createLogger } from '../../src/observability/logger.js';
import { SessionStore } from '../../src/sessions/token.js';
import { RoomRegistry } from '../../src/rooms/registry.js';
import type { ServerConfig } from '../../src/config.js';

export interface TestServer {
  httpServer: HttpServer;
  baseUrl: string;
  close(): Promise<void>;
}

export interface StartTestServerOptions {
  turnDurationMs?: number;
  reconnectWindowMs?: number;
}

export async function startTestServer(opts: StartTestServerOptions = {}): Promise<TestServer> {
  const config: ServerConfig = { mode: 'online', port: 0, host: '127.0.0.1' };
  const sessions = new SessionStore();
  const registry = new RoomRegistry();
  const logger = createLogger({ level: 'silent' });
  const app = createHttpApp({ config, sessions, logger });
  const httpServer = createServer(app);
  createSocketServer({
    httpServer,
    sessions,
    registry,
    logger,
    ...(opts.turnDurationMs !== undefined ? { turnDurationMs: opts.turnDurationMs } : {}),
    ...(opts.reconnectWindowMs !== undefined ? { reconnectWindowMs: opts.reconnectWindowMs } : {}),
  });
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const addr = httpServer.address() as AddressInfo;
  return {
    httpServer,
    baseUrl: `http://127.0.0.1:${addr.port}`,
    close: () => new Promise<void>((resolve) => httpServer.close(() => resolve())),
  };
}

export async function issueSession(baseUrl: string): Promise<string> {
  const res = await fetch(`${baseUrl}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const body = (await res.json()) as { sessionToken: string };
  return body.sessionToken;
}

export interface PlayerSocket {
  socket: ClientSocket;
  view: PublicMatchView | null;
  me: PrivatePlayerView | null;
  ended: MatchResult | null;
  errors: { code: string; message: string }[];
  close(): void;
}

export function connectPlayer(baseUrl: string, sessionToken: string): Promise<PlayerSocket> {
  const socket = ioc(baseUrl, {
    auth: { protocolVersion: PROTOCOL_VERSION, sessionToken },
    autoConnect: true,
    reconnection: false,
    transports: ['websocket'],
    forceNew: true,
  });
  const state: PlayerSocket = {
    socket,
    view: null,
    me: null,
    ended: null,
    errors: [],
    close: () => socket.disconnect(),
  };
  socket.on('room:state', (evt: RoomStateEvent) => {
    state.view = evt.view;
    state.me = evt.me;
  });
  socket.on('match:state', (evt: MatchStateEvent) => {
    state.view = evt.view;
    state.me = evt.me;
  });
  socket.on('match:ended', (evt: MatchEndedEvent) => {
    state.view = evt.view;
    state.ended = evt.result;
  });
  socket.on('error', (e: { code: string; message: string }) => {
    state.errors.push(e);
  });
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(state));
    socket.once('connect_error', (err) => reject(err));
  });
}

export async function waitFor(
  predicate: () => boolean,
  timeoutMs = 5000,
  intervalMs = 10,
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`waitFor timed out after ${timeoutMs} ms`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export function makeMoveId(): string {
  return randomUUID();
}
