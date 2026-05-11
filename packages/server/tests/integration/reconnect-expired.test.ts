import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  connectPlayer,
  issueSession,
  startTestServer,
  waitFor,
  type TestServer,
} from './helpers.js';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer({
    turnDurationMs: 60_000,
    reconnectWindowMs: 200,
  });
});

afterAll(async () => {
  await server.close();
});

describe('reconnect after the window has expired (US5)', () => {
  it('rejects the returning client with RECONNECT_WINDOW_EXPIRED', async () => {
    const tokenA = await issueSession(server.baseUrl);
    const tokenB = await issueSession(server.baseUrl);
    const a1 = await connectPlayer(server.baseUrl, tokenA);
    const b = await connectPlayer(server.baseUrl, tokenB);

    a1.socket.emit('room:create', { mode: 'online', playerCount: 2 });
    await waitFor(() => a1.view !== null);
    const roomCode = a1.view!.roomCode;
    b.socket.emit('room:join', { roomCode });
    await waitFor(() => a1.view!.players.length === 2 && b.view !== null);
    a1.socket.emit('room:ready', { ready: true });
    b.socket.emit('room:ready', { ready: true });
    await waitFor(() => a1.view!.players.every((p) => p.ready === true));
    a1.socket.emit('room:start', {});
    await waitFor(() => a1.view!.status === 'playing');

    const seat = a1.me!.mySeat;
    a1.close();
    await waitFor(() => b.view!.players[seat]?.connected === false);

    await new Promise((r) => setTimeout(r, 500));

    const a2 = await connectPlayer(server.baseUrl, tokenA);
    try {
      await waitFor(() => a2.errors.length > 0, 3000);
      expect(a2.errors[0]?.code).toBe('RECONNECT_WINDOW_EXPIRED');
    } finally {
      a2.close();
      b.close();
    }
  });
});
