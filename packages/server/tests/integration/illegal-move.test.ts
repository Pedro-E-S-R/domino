import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  connectPlayer,
  issueSession,
  makeMoveId,
  startTestServer,
  waitFor,
  type TestServer,
} from './helpers.js';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.close();
});

describe('illegal move handling (US1)', () => {
  it('rejects a lay claiming a tile the actor does not hold', async () => {
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

      const currentSeat = a.view!.currentSeat;
      const actorState = currentSeat === 0 ? a : b;

      const ownHand = new Set(actorState.me!.myHand);
      let notHeld = -1;
      for (let id = 0; id < 28; id++) {
        if (!ownHand.has(id)) {
          notHeld = id;
          break;
        }
      }
      expect(notHeld).toBeGreaterThanOrEqual(0);

      const boardLenBefore = actorState.view!.board.length;
      actorState.socket.emit('move:lay', {
        moveId: makeMoveId(),
        tileId: notHeld,
        end: 'left',
      });
      await waitFor(() => actorState.errors.length > 0);

      expect(actorState.errors[0]?.code).toBe('ILLEGAL_MOVE');
      expect(actorState.view!.board.length).toBe(boardLenBefore);
    } finally {
      a.close();
      b.close();
    }
  });

  it('rejects a move when it is not the caller\'s turn', async () => {
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

      const currentSeat = a.view!.currentSeat;
      const nonActor = currentSeat === 0 ? b : a;
      nonActor.socket.emit('move:pass', { moveId: makeMoveId() });
      await waitFor(() => nonActor.errors.length > 0);
      expect(nonActor.errors[0]?.code).toBe('NOT_YOUR_TURN');
    } finally {
      a.close();
      b.close();
    }
  });
});
