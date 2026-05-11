import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  connectPlayer,
  issueSession,
  startTestServer,
  waitFor,
  type TestServer,
} from './helpers.js';

describe('GET /rooms (debug endpoint)', () => {
  describe('when neither --mode=lan nor --debug is set', () => {
    let server: TestServer;
    beforeAll(async () => {
      server = await startTestServer({ mode: 'online', debug: false });
    });
    afterAll(async () => {
      await server.close();
    });

    it('returns 404 (endpoint not registered)', async () => {
      const res = await fetch(`${server.baseUrl}/rooms`);
      expect(res.status).toBe(404);
    });

    it('GET /health reports roomsEndpoint=false', async () => {
      const res = await fetch(`${server.baseUrl}/health`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body['roomsEndpoint']).toBe(false);
    });
  });

  describe('when --debug is set', () => {
    let server: TestServer;
    beforeAll(async () => {
      server = await startTestServer({ debug: true });
    });
    afterAll(async () => {
      await server.close();
    });

    it('GET /health reports roomsEndpoint=true', async () => {
      const res = await fetch(`${server.baseUrl}/health`);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body['roomsEndpoint']).toBe(true);
    });

    it('returns an empty list when no rooms exist', async () => {
      const res = await fetch(`${server.baseUrl}/rooms`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { count: number; rooms: unknown[]; serverNow: number };
      expect(body.count).toBe(0);
      expect(body.rooms).toEqual([]);
      expect(typeof body.serverNow).toBe('number');
    });

    it('lists a created room with metadata + connected status', async () => {
      const tokenA = await issueSession(server.baseUrl);
      const a = await connectPlayer(server.baseUrl, tokenA);
      try {
        a.socket.emit('room:create', { mode: 'online', playerCount: 2 });
        await waitFor(() => a.view !== null);

        const res = await fetch(`${server.baseUrl}/rooms`);
        const body = (await res.json()) as {
          rooms: Array<{
            roomCode: string;
            status: string;
            playerCount: number;
            seatsFilled: number;
            players: Array<{ seat: number; connected: boolean; ready: boolean; handCount: number }>;
          }>;
        };
        const thisRoom = body.rooms.find((r) => r.roomCode === a.view!.roomCode);
        expect(thisRoom).toBeDefined();
        expect(thisRoom?.status).toBe('lobby');
        expect(thisRoom?.playerCount).toBe(2);
        expect(thisRoom?.seatsFilled).toBe(1);
        expect(thisRoom?.players[0]?.connected).toBe(true);
      } finally {
        a.close();
      }
    });

    it('never leaks hand contents, boneyard, or session tokens', async () => {
      const tokenA = await issueSession(server.baseUrl);
      const tokenB = await issueSession(server.baseUrl);
      const a = await connectPlayer(server.baseUrl, tokenA);
      const b = await connectPlayer(server.baseUrl, tokenB);
      try {
        a.socket.emit('room:create', { mode: 'online', playerCount: 2 });
        await waitFor(() => a.view !== null);
        b.socket.emit('room:join', { roomCode: a.view!.roomCode });
        await waitFor(() => a.view!.players.length === 2);
        a.socket.emit('room:ready', { ready: true });
        b.socket.emit('room:ready', { ready: true });
        await waitFor(() => a.view!.players.every((p) => p.ready));
        a.socket.emit('room:start', {});
        await waitFor(() => a.view!.status === 'playing');

        const res = await fetch(`${server.baseUrl}/rooms`);
        const raw = await res.text();
        expect(raw).not.toMatch(/"hand"\s*:/);
        expect(raw).not.toMatch(/"myHand"\s*:/);
        expect(raw).not.toMatch(/"boneyard"\s*:\s*\[/);
        expect(raw).not.toMatch(/"sessionToken"/);
        expect(raw).not.toMatch(/"hostSessionToken"/);
        expect(raw).not.toMatch(/"seed"\s*:/);

        const body = JSON.parse(raw) as {
          rooms: Array<{
            roomCode: string;
            status: string;
            currentSeat: number | null;
            boardLength: number;
            boneyardCount: number;
            players: Array<{ handCount: number }>;
          }>;
        };
        const thisRoom = body.rooms.find((r) => r.roomCode === a.view!.roomCode);
        expect(thisRoom).toBeDefined();
        expect(thisRoom?.status).toBe('playing');
        expect(typeof thisRoom?.boneyardCount).toBe('number');
        for (const p of thisRoom?.players ?? []) {
          expect(typeof p.handCount).toBe('number');
        }
      } finally {
        a.close();
        b.close();
      }
    });
  });

  describe('when --mode=lan is set', () => {
    let server: TestServer;
    beforeAll(async () => {
      server = await startTestServer({ mode: 'lan' });
    });
    afterAll(async () => {
      await server.close();
    });

    it('GET /rooms is enabled', async () => {
      const res = await fetch(`${server.baseUrl}/rooms`);
      expect(res.status).toBe(200);
    });
  });
});
