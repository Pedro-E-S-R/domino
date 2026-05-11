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

describe('two-player online match (US1)', () => {
  it('plays end-to-end and both clients see the same outcome', async () => {
    const tokenA = await issueSession(server.baseUrl);
    const tokenB = await issueSession(server.baseUrl);
    const a = await connectPlayer(server.baseUrl, tokenA);
    const b = await connectPlayer(server.baseUrl, tokenB);
    try {
      a.socket.emit('room:create', { mode: 'online', playerCount: 2 });
      await waitFor(() => a.view !== null && a.view.players.length === 1);
      const roomCode = a.view!.roomCode;

      b.socket.emit('room:join', { roomCode });
      await waitFor(() => a.view!.players.length === 2 && b.view !== null);

      a.socket.emit('room:ready', { ready: true });
      b.socket.emit('room:ready', { ready: true });
      await waitFor(() => a.view!.players.every((p) => p.ready === true));

      a.socket.emit('room:start', {});
      await waitFor(() => a.view!.status === 'playing' && b.view!.status === 'playing');
      expect(a.me).not.toBeNull();
      expect(b.me).not.toBeNull();
      expect(a.me!.myHand.length).toBe(7);
      expect(b.me!.myHand.length).toBe(7);

      let safety = 200;
      while (a.ended === null && safety-- > 0) {
        const currentSeat = a.view!.currentSeat;
        if (currentSeat === null) {
          await new Promise((r) => setTimeout(r, 5));
          continue;
        }
        const actorState = currentSeat === 0 ? a : b;
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
      expect(b.ended).not.toBeNull();
      expect(a.ended).toEqual(b.ended);
      const outcome = a.ended!.outcome.kind;
      expect(['domino', 'block', 'tied-block']).toContain(outcome);
      expect(a.view!.status).toBe('ended');
      expect(b.view!.status).toBe('ended');
      expect(a.errors).toEqual([]);
      expect(b.errors).toEqual([]);
    } finally {
      a.close();
      b.close();
    }
  });
});
