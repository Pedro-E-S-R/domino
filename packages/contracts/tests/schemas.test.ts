import { describe, expect, it } from 'vitest';
import {
  ErrorPayloadSchema,
  MatchStateEventSchema,
  MoveLayPayloadSchema,
  PROTOCOL_VERSION,
  PrivatePlayerViewSchema,
  PublicMatchViewSchema,
  RoomCodeSchema,
  RoomCreatePayloadSchema,
  SessionResponseSchema,
  SocketAuthPayloadSchema,
} from '../src/index.js';

describe('PROTOCOL_VERSION', () => {
  it('matches semver', () => {
    expect(PROTOCOL_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('RoomCodeSchema', () => {
  it('accepts canonical 6-char codes', () => {
    expect(() => RoomCodeSchema.parse('Q7R4XB')).not.toThrow();
    expect(() => RoomCodeSchema.parse('ABCDEF')).not.toThrow();
  });

  it('rejects codes with O, I, 0, 1', () => {
    expect(() => RoomCodeSchema.parse('ABCDE0')).toThrow();
    expect(() => RoomCodeSchema.parse('ABCDE1')).toThrow();
    expect(() => RoomCodeSchema.parse('ABCDEO')).toThrow();
    expect(() => RoomCodeSchema.parse('ABCDEI')).toThrow();
  });

  it('rejects wrong length', () => {
    expect(() => RoomCodeSchema.parse('ABCDE')).toThrow();
    expect(() => RoomCodeSchema.parse('ABCDEFG')).toThrow();
  });
});

describe('RoomCreatePayload roundtrip', () => {
  it('parse → serialize → parse equals original', () => {
    const payload = { mode: 'lan' as const, playerCount: 4 as const };
    const parsed = RoomCreatePayloadSchema.parse(payload);
    const serialized = JSON.parse(JSON.stringify(parsed));
    expect(RoomCreatePayloadSchema.parse(serialized)).toEqual(payload);
  });

  it('rejects unknown modes', () => {
    expect(() => RoomCreatePayloadSchema.parse({ mode: 'p2p', playerCount: 2 })).toThrow();
  });

  it('rejects player counts other than 2 or 4', () => {
    expect(() => RoomCreatePayloadSchema.parse({ mode: 'online', playerCount: 3 })).toThrow();
  });
});

describe('SocketAuthPayloadSchema', () => {
  it('accepts the standard handshake payload', () => {
    const ok = {
      protocolVersion: PROTOCOL_VERSION,
      sessionToken: 'a'.repeat(32),
    };
    expect(() => SocketAuthPayloadSchema.parse(ok)).not.toThrow();
  });

  it('rejects malformed session tokens', () => {
    expect(() =>
      SocketAuthPayloadSchema.parse({
        protocolVersion: PROTOCOL_VERSION,
        sessionToken: 'not-hex',
      }),
    ).toThrow();
  });
});

describe('SessionResponseSchema', () => {
  it('roundtrips a typical /session response', () => {
    const payload = {
      sessionToken: '0123456789abcdef0123456789abcdef',
      issuedAt: 1_700_000_000_000,
      protocolVersion: PROTOCOL_VERSION,
    };
    expect(SessionResponseSchema.parse(payload)).toEqual(payload);
  });
});

describe('MoveLayPayloadSchema', () => {
  it('accepts a well-formed lay', () => {
    const ok = {
      moveId: '11111111-2222-3333-4444-555555555555',
      tileId: 7,
      end: 'right' as const,
    };
    expect(() => MoveLayPayloadSchema.parse(ok)).not.toThrow();
  });

  it('rejects an out-of-range tileId', () => {
    expect(() =>
      MoveLayPayloadSchema.parse({
        moveId: '11111111-2222-3333-4444-555555555555',
        tileId: 28,
        end: 'left',
      }),
    ).toThrow();
  });

  it('rejects a non-uuid moveId', () => {
    expect(() =>
      MoveLayPayloadSchema.parse({
        moveId: 'not-a-uuid',
        tileId: 0,
        end: 'left',
      }),
    ).toThrow();
  });
});

describe('PublicMatchView strict mode', () => {
  const baseView = {
    roomCode: 'ABCDEF',
    mode: 'online' as const,
    playerCount: 2 as const,
    status: 'lobby' as const,
    players: [],
    board: [],
    leftEnd: null,
    rightEnd: null,
    boneyardCount: 28,
    currentSeat: null,
    turnDeadlineMs: null,
    result: null,
  };

  it('accepts a canonical lobby view', () => {
    expect(() => PublicMatchViewSchema.parse(baseView)).not.toThrow();
  });

  it('rejects extra fields (no boneyard array on the wire)', () => {
    const withBoneyard = { ...baseView, boneyard: [0, 1, 2] };
    expect(() => PublicMatchViewSchema.parse(withBoneyard)).toThrow();
  });

  it('rejects extra fields (no seed on the wire)', () => {
    expect(() => PublicMatchViewSchema.parse({ ...baseView, seed: 1234 })).toThrow();
  });

  it('rejects an opponent hand contents leak via "hands" key', () => {
    expect(() => PublicMatchViewSchema.parse({ ...baseView, hands: [[0, 1], [2, 3]] })).toThrow();
  });
});

describe('PrivatePlayerView strict mode', () => {
  it('rejects unknown fields', () => {
    const ok = { mySeat: 0 as const, myHand: [0, 1, 2], legalMoves: [] };
    expect(() => PrivatePlayerViewSchema.parse(ok)).not.toThrow();
    expect(() =>
      PrivatePlayerViewSchema.parse({ ...ok, opponentHand: [3, 4] }),
    ).toThrow();
  });
});

describe('MatchState event strict mode', () => {
  it('rejects unknown fields at the event level', () => {
    const view = {
      roomCode: 'ABCDEF',
      mode: 'online' as const,
      playerCount: 2 as const,
      status: 'playing' as const,
      players: [],
      board: [],
      leftEnd: 0 as const,
      rightEnd: 6 as const,
      boneyardCount: 14,
      currentSeat: 0 as const,
      turnDeadlineMs: 1700000000000,
      result: null,
    };
    const me = { mySeat: 0 as const, myHand: [0, 1, 2, 3, 4, 5, 6], legalMoves: [] };
    const evt = { view, me, lastAction: null };
    expect(() => MatchStateEventSchema.parse(evt)).not.toThrow();
    expect(() =>
      MatchStateEventSchema.parse({ ...evt, internalCounter: 1 }),
    ).toThrow();
  });
});

describe('ErrorPayloadSchema', () => {
  it('roundtrips a typical error', () => {
    const payload = {
      code: 'ILLEGAL_MOVE' as const,
      message: 'Tile does not match end',
      detail: { rule: 'TILE_DOES_NOT_MATCH_END' },
    };
    expect(ErrorPayloadSchema.parse(payload)).toEqual(payload);
  });

  it('rejects unknown error codes', () => {
    expect(() =>
      ErrorPayloadSchema.parse({ code: 'INVENTED', message: 'x' }),
    ).toThrow();
  });
});
