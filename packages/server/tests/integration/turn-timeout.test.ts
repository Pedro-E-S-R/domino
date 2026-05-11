import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  connectPlayer,
  issueSession,
  startTestServer,
  waitFor,
  type TestServer,
} from './helpers.js';

let server: TestServer;
const TURN_MS = 300;

beforeAll(async () => {
  server = await startTestServer({ turnDurationMs: TURN_MS });
});

afterAll(async () => {
  await server.close();
});

describe('turn timeout auto-action (US5)', () => {
  it('fires an auto-action when the active seat does not act in time', async () => {
    const tokenA = await issueSession(server.baseUrl);
    const tokenB = await issueSession(server.baseUrl);
    const a = await connectPlayer(server.baseUrl, tokenA);
    const b = await connectPlayer(server.baseUrl, tokenB);
    try {
      a.socket.emit('room:create', { mode: 'online', playerCount: 2 });
      await waitFor(() => a.view !== null);
      const roomCode = a.view!.roomCode;
      b.socket.emit('room:join', { roomCode });
      await waitFor(() => a.view!.players.length === 2 && b.view !== null);
      a.socket.emit('room:ready', { ready: true });
      b.socket.emit('room:ready', { ready: true });
      await waitFor(() => a.view!.players.every((p) => p.ready === true));
      a.socket.emit('room:start', {});
      await waitFor(() => a.view!.status === 'playing');

      const seatBeforeTimeout = a.view!.currentSeat;
      const boardBefore = a.view!.board.length;
      expect(seatBeforeTimeout).not.toBeNull();

      await waitFor(
        () => a.view!.board.length !== boardBefore || a.view!.currentSeat !== seatBeforeTimeout,
        TURN_MS * 6,
      );

      expect(a.view!.board.length).toBeGreaterThan(0);
      expect(a.errors).toEqual([]);
      expect(b.errors).toEqual([]);
    } finally {
      a.close();
      b.close();
    }
  });
});
