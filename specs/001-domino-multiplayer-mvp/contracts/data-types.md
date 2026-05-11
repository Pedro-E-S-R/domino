# Shared Data Types (wire-safe)

All types listed here are defined in `packages/contracts/src/`. They are
validated at every wire boundary using `zod`. The TypeScript shape is
shown here for human readability; the source of truth at runtime is the
Zod schema.

## Primitives

```ts
type PipValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type TileId   = number;          // 0..27, canonical enumeration of the 28-tile set
type Seat     = 0 | 1 | 2 | 3;

type RoomCode     = string;      // /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/
type SessionToken = string;      // /^[0-9a-f]{32}$/  (16 random bytes hex)
type MoveId       = string;      // client-generated UUID v4
```

## Player and match

```ts
interface PlayerSummary {
  seat: Seat;
  displayName: string;
  avatarId: string;
  connected: boolean;
  handCount: number;
  ready?: boolean;                // only present in lobby views
}

interface LaidTile {
  tileId: TileId;
  orientation: 'normal' | 'flipped';
}

interface PublicMatchView {
  roomCode: RoomCode;
  mode: 'online' | 'lan';
  playerCount: 2 | 4;
  status: 'lobby' | 'playing' | 'ended';
  players: PlayerSummary[];

  board: LaidTile[];
  leftEnd:  PipValue | null;
  rightEnd: PipValue | null;
  boneyardCount: number;

  currentSeat: Seat | null;
  turnDeadlineMs: number | null;   // epoch ms

  result: MatchResult | null;
}

interface PrivatePlayerView {
  mySeat: Seat;
  myHand: TileId[];
  legalMoves: Array<{
    tileId: TileId;
    ends: Array<'left' | 'right'>;
  }>;
}
```

## Outcome

```ts
type Outcome =
  | { kind: 'domino';     winner: Seat }
  | { kind: 'block';      winner: Seat; tiedWith?: never }
  | { kind: 'tied-block'; tied: Seat[] };

interface MatchResult {
  outcome: Outcome;
  pipsBySeat: number[];           // pipsBySeat[seat] = sum of pips in hand at end
}
```

## Errors

```ts
type ErrorCode =
  | 'PROTOCOL_MISMATCH'
  | 'INVALID_PAYLOAD'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_IN_PROGRESS'
  | 'NOT_HOST'
  | 'NOT_YOUR_TURN'
  | 'ILLEGAL_MOVE'                // covers all RuleError values from the engine
  | 'NOT_IN_MATCH'
  | 'MATCH_ENDED'
  | 'INTERNAL';

interface ErrorPayload {
  code: ErrorCode;
  message: string;                // human-readable, in Portuguese (pt-BR) for v1
  detail?: Record<string, unknown>;  // structured detail; e.g. { rule: 'TILE_DOES_NOT_MATCH_END' }
}
```

## Auth

```ts
interface SocketAuthPayload {
  protocolVersion: string;        // must equal PROTOCOL_VERSION exactly
  sessionToken: SessionToken;     // received from POST /session
}
```
