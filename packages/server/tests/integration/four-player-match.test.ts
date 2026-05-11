import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getTile, pipSum } from '@domino/engine';
import {
  connectPlayer,
  issueSession,
  makeMoveId,
  startTestServer,
  waitFor,
  type PlayerSocket,
  type TestServer,
} from './helpers.js';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.close();
});

function lowestPipMove(p: PlayerSocket): { tileId: number; end: 'left' | 'right' } | null {
  const me = p.me;
  if (!me || me.legalMoves.length === 0) return null;
  let best: { tileId: number; end: 'left' | 'right'; sum: number } | null = null;
  for (const m of me.legalMoves) {
    const sum = pipSum(getTile(m.tileId));
    if (best === null || sum < best.sum || (sum === best.sum && m.tileId < best.tileId)) {
      best = { tileId: m.tileId, end: m.ends[0] as 'left' | 'right', sum };
    }
  }
  return best ? { tileId: best.tileId, end: best.end } : null;
}

describe('four-player online match (US3)', () => {
  it('plays end-to-end, all four clients converge on the same outcome', async () => {
    const tokens = await Promise.all([0, 1, 2, 3].map(() => issueSession(server.baseUrl)));
    const sockets = await Promise.all(tokens.map((t) => connectPlayer(server.baseUrl, t)));
    try {
      const [a, b, c, d] = sockets as [PlayerSocket, PlayerSocket, PlayerSocket, PlayerSocket];

      a.socket.emit('room:create', { mode: 'online', playerCount: 4 });
      await waitFor(() => a.view !== null);
      const roomCode = a.view!.roomCode;

      b.socket.emit('room:join', { roomCode });
      c.socket.emit('room:join', { roomCode });
      d.socket.emit('room:join', { roomCode });
      await waitFor(
        () =>
          a.view!.players.length === 4 &&
          b.view !== null &&
          c.view !== null &&
          d.view !== null,
      );

      for (const sock of sockets) sock.socket.emit('room:ready', { ready: true });
      await waitFor(() => a.view!.players.every((p) => p.ready === true));

      a.socket.emit('room:start', {});
      await waitFor(() => sockets.every((s) => s.view !== null && s.view.status === 'playing'));
      expect(a.me!.myHand.length).toBe(7);
      expect(b.me!.myHand.length).toBe(7);
      expect(c.me!.myHand.length).toBe(7);
      expect(d.me!.myHand.length).toBe(7);

      const turnOrder: number[] = [];

      let safety = 400;
      while (a.ended === null && safety-- > 0) {
        const currentSeat = a.view!.currentSeat;
        if (currentSeat === null) {
          await new Promise((r) => setTimeout(r, 5));
          continue;
        }
        turnOrder.push(currentSeat);
        const actorState = sockets[currentSeat] as PlayerSocket;
        const move = lowestPipMove(actorState);
        if (move) {
          actorState.socket.emit('move:lay', {
            moveId: makeMoveId(),
            tileId: move.tileId,
            end: move.end,
          });
        } else if (actorState.view!.boneyardCount > 0) {
          actorState.socket.emit('move:draw', { moveId: makeMoveId() });
        } else {
          actorState.socket.emit('move:pass', { moveId: makeMoveId() });
        }
        await new Promise((r) => setTimeout(r, 8));
      }

      expect(a.ended).not.toBeNull();
      for (const sock of sockets) {
        expect(sock.ended).toEqual(a.ended);
        expect(sock.view!.status).toBe('ended');
        expect(sock.errors).toEqual([]);
      }
      expect(a.ended!.pipsBySeat.length).toBe(4);

      for (let i = 1; i < turnOrder.length; i++) {
        const prev = turnOrder[i - 1] as number;
        const cur = turnOrder[i] as number;
        if (prev === cur) continue;
        expect(cur).toBe((prev + 1) % 4);
      }
    } finally {
      for (const sock of sockets) sock.close();
    }
  });

  it('the per-recipient view never leaks any other player\'s hand', async () => {
    const tokens = await Promise.all([0, 1, 2, 3].map(() => issueSession(server.baseUrl)));
    const sockets = await Promise.all(tokens.map((t) => connectPlayer(server.baseUrl, t)));
    try {
      const [a, b, c, d] = sockets as [PlayerSocket, PlayerSocket, PlayerSocket, PlayerSocket];

      a.socket.emit('room:create', { mode: 'online', playerCount: 4 });
      await waitFor(() => a.view !== null);
      const roomCode = a.view!.roomCode;
      b.socket.emit('room:join', { roomCode });
      c.socket.emit('room:join', { roomCode });
      d.socket.emit('room:join', { roomCode });
      await waitFor(() => a.view!.players.length === 4);

      for (const sock of sockets) sock.socket.emit('room:ready', { ready: true });
      await waitFor(() => a.view!.players.every((p) => p.ready === true));

      a.socket.emit('room:start', {});
      await waitFor(() => sockets.every((s) => s.view !== null && s.view.status === 'playing'));

      const hands = new Map<number, Set<number>>();
      for (const sock of sockets) {
        hands.set(sock.me!.mySeat, new Set(sock.me!.myHand));
      }
      for (const sock of sockets) {
        for (const [seat, tiles] of hands.entries()) {
          if (seat === sock.me!.mySeat) continue;
          for (const tile of tiles) {
            expect(sock.me!.myHand).not.toContain(tile);
          }
        }
      }

      for (const sock of sockets) {
        const view = sock.view!;
        expect(view).not.toHaveProperty('boneyard');
        expect(view).not.toHaveProperty('seed');
        for (const p of view.players) {
          expect(p).not.toHaveProperty('hand');
          expect(p).not.toHaveProperty('tiles');
        }
      }
    } finally {
      for (const sock of sockets) sock.close();
    }
  });
});
