import { randomBytes } from 'node:crypto';
import type { GameState } from '@domino/engine';
import type { Mode, MoveId, RoomCode, SessionToken } from '@domino/contracts';
import type { Seat } from '@domino/engine';
import { generateUniqueRoomCode } from './code-generator.js';

export type MatchId = string;
export type Avatar = 'verde' | 'amarelo' | 'marrom' | 'azul';

export interface SeatRecord {
  readonly seat: Seat;
  readonly sessionToken: SessionToken;
  displayName: string;
  avatarId: Avatar;
  socketId: string | null;
  disconnectedAt: number | null;
  ready: boolean;
}

export interface Match {
  readonly id: MatchId;
  readonly roomCode: RoomCode;
  readonly mode: Mode;
  readonly playerCount: 2 | 4;
  readonly hostSessionToken: SessionToken;
  status: 'lobby' | 'playing' | 'ended';
  seats: (SeatRecord | null)[];
  game: GameState | null;
  turnDeadlineMs: number | null;
  createdAt: number;
  lastActivityAt: number;
  processedMoveIds: Set<MoveId>;
}

const AVATARS: readonly Avatar[] = ['verde', 'amarelo', 'marrom', 'azul'];
const ORPHAN_TIMEOUT_MS = 30 * 60 * 1000;

export class RoomRegistry {
  private readonly byCode = new Map<RoomCode, Match>();
  private readonly byToken = new Map<SessionToken, MatchId>();
  private readonly byId = new Map<MatchId, Match>();

  create(opts: {
    mode: Mode;
    playerCount: 2 | 4;
    hostSessionToken: SessionToken;
    hostDisplayName?: string;
    hostSocketId: string;
  }): Match {
    if (this.byToken.has(opts.hostSessionToken)) {
      this.removeBySessionToken(opts.hostSessionToken);
    }
    const code = generateUniqueRoomCode((c) => this.byCode.has(c));
    const id = randomBytes(16).toString('hex');
    const now = Date.now();
    const seats: (SeatRecord | null)[] = new Array(opts.playerCount).fill(null);
    seats[0] = {
      seat: 0,
      sessionToken: opts.hostSessionToken,
      displayName: opts.hostDisplayName ?? 'Jogador 1',
      avatarId: AVATARS[0] as Avatar,
      socketId: opts.hostSocketId,
      disconnectedAt: null,
      ready: false,
    };
    const match: Match = {
      id,
      roomCode: code,
      mode: opts.mode,
      playerCount: opts.playerCount,
      hostSessionToken: opts.hostSessionToken,
      status: 'lobby',
      seats,
      game: null,
      turnDeadlineMs: null,
      createdAt: now,
      lastActivityAt: now,
      processedMoveIds: new Set(),
    };
    this.byCode.set(code, match);
    this.byId.set(id, match);
    this.byToken.set(opts.hostSessionToken, id);
    return match;
  }

  join(opts: {
    roomCode: RoomCode;
    sessionToken: SessionToken;
    socketId: string;
  }): { match: Match; seat: Seat } | { error: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'ROOM_IN_PROGRESS' } {
    const match = this.byCode.get(opts.roomCode);
    if (!match) return { error: 'ROOM_NOT_FOUND' };
    if (match.status !== 'lobby') return { error: 'ROOM_IN_PROGRESS' };

    for (const seat of match.seats) {
      if (seat?.sessionToken === opts.sessionToken) {
        seat.socketId = opts.socketId;
        seat.disconnectedAt = null;
        this.touch(match);
        return { match, seat: seat.seat };
      }
    }

    const freeIndex = match.seats.findIndex((s) => s === null);
    if (freeIndex === -1) return { error: 'ROOM_FULL' };
    const seatNumber = freeIndex as Seat;
    if (this.byToken.has(opts.sessionToken)) {
      this.removeBySessionToken(opts.sessionToken);
    }
    const record: SeatRecord = {
      seat: seatNumber,
      sessionToken: opts.sessionToken,
      displayName: `Jogador ${freeIndex + 1}`,
      avatarId: AVATARS[freeIndex] as Avatar,
      socketId: opts.socketId,
      disconnectedAt: null,
      ready: false,
    };
    match.seats[freeIndex] = record;
    this.byToken.set(opts.sessionToken, match.id);
    this.touch(match);
    return { match, seat: seatNumber };
  }

  findByToken(token: SessionToken): Match | undefined {
    const id = this.byToken.get(token);
    if (!id) return undefined;
    return this.byId.get(id);
  }

  findByCode(code: RoomCode): Match | undefined {
    return this.byCode.get(code);
  }

  seatOf(match: Match, token: SessionToken): SeatRecord | undefined {
    for (const s of match.seats) {
      if (s?.sessionToken === token) return s;
    }
    return undefined;
  }

  removeBySessionToken(token: SessionToken): void {
    const id = this.byToken.get(token);
    if (!id) return;
    const match = this.byId.get(id);
    if (!match) {
      this.byToken.delete(token);
      return;
    }
    if (match.status === 'lobby') {
      const idx = match.seats.findIndex((s) => s?.sessionToken === token);
      if (idx >= 0) match.seats[idx] = null;
      const hasAny = match.seats.some((s) => s !== null);
      if (!hasAny) {
        this.dispose(match);
      } else {
        this.touch(match);
      }
    }
    this.byToken.delete(token);
  }

  dispose(match: Match): void {
    this.byCode.delete(match.roomCode);
    this.byId.delete(match.id);
    for (const s of match.seats) {
      if (s) this.byToken.delete(s.sessionToken);
    }
  }

  touch(match: Match): void {
    match.lastActivityAt = Date.now();
  }

  gcOrphans(now: number = Date.now()): number {
    let removed = 0;
    for (const match of this.byCode.values()) {
      if (now - match.lastActivityAt > ORPHAN_TIMEOUT_MS) {
        this.dispose(match);
        removed++;
      }
    }
    return removed;
  }

  size(): number {
    return this.byCode.size;
  }
}
