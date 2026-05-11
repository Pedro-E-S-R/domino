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
    turnDurationMs: 10_000,
    reconnectWindowMs: 5_000,
  });
});

afterAll(async () => {
  await server.close();
});

describe('reconnect within window (US5)', () => {
  it('restores the seat and hand when a player reconnects within the 5-minute window', async () => {
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

    const originalHand = [...a1.me!.myHand];
    const seat = a1.me!.mySeat;
    a1.close();
    await waitFor(() => b.view!.players[seat]?.connected === false);

    await new Promise((r) => setTimeout(r, 200));
    const a2 = await connectPlayer(server.baseUrl, tokenA);
    try {
      await waitFor(() => a2.me !== null && a2.view !== null);
      expect(a2.me!.mySeat).toBe(seat);
      expect([...a2.me!.myHand].sort()).toEqual([...originalHand].sort());
      expect(a2.view!.status).toBe('playing');
      expect(a2.errors).toEqual([]);
    } finally {
      a2.close();
      b.close();
    }
  });
});
