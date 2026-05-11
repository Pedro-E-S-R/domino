# Data Model: Dominó Online — Multiplayer MVP

**Date**: 2026-05-11
**Scope**: In-memory entities only. There is no database in v1; "data
model" here describes the shapes that live in the engine's pure state,
in the server's room registry, and on the wire.

The wire format (what the client sees) is a *projection* of the server's
internal model. Both are described here; see `contracts/` for the Zod
schemas that pin the projections at runtime.

---

## Engine state

### `Tile`

```ts
type PipValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type TileId = number;          // 0..27, stable across the 28-tile set

interface Tile {
  readonly id: TileId;
  readonly a: PipValue;        // canonical ordering: a <= b
  readonly b: PipValue;
}
```

**Invariants**
- The full 28-tile set is `{(a,b) | 0 ≤ a ≤ b ≤ 6}`. Exactly 28 entries.
- `TileId` is the unique index 0..27, assigned by enumeration in canonical
  order; never reused, never reordered between releases.
- `a <= b` for every tile (doubles are `a === b`).

### `LaidTile`

```ts
interface LaidTile {
  readonly tileId: TileId;
  readonly orientation: 'normal' | 'flipped';   // which side faces "left"
}
```

The chain stores the play order. Doubles render transversally in the
client but their two exposed ends carry the same `PipValue`.

### `GameAction` (discriminated union)

```ts
type Seat = 0 | 1 | 2 | 3;     // 0..(playerCount-1)

type GameAction =
  | { readonly type: 'DEAL';   readonly seed: number }
  | { readonly type: 'LAY';    readonly actor: Seat; readonly tileId: TileId; readonly end: 'left' | 'right' }
  | { readonly type: 'DRAW';   readonly actor: Seat }
  | { readonly type: 'PASS';   readonly actor: Seat };
```

`DEAL` is processed only when the engine is in its initial `pre-deal`
phase. The other three are turn-bound actions.

### `GameState`

```ts
type Phase = 'pre-deal' | 'awaiting-opener' | 'in-play' | 'ended';

interface GameState {
  readonly playerCount: 2 | 4;
  readonly phase: Phase;
  readonly seed: number;                              // for reproducibility

  readonly hands: ReadonlyArray<ReadonlyArray<TileId>>;       // hands[seat] -> TileIds
  readonly boneyard: ReadonlyArray<TileId>;                   // tail = next to draw
  readonly board: ReadonlyArray<LaidTile>;                    // play order
  readonly leftEnd:  PipValue | null;                          // null only before first lay
  readonly rightEnd: PipValue | null;

  readonly turn: Seat;                                         // whose action is expected
  readonly passCount: number;                                  // consecutive passes
  readonly opener: Seat | null;                                // set after DEAL
  readonly history: ReadonlyArray<GameAction>;                 // applied actions in order
  readonly result: MatchResult | null;                         // set when phase === 'ended'
}
```

**Invariants** (each is a unit test in `property-based.test.ts`)
- **Tile conservation**: `hands.flat().length + boneyard.length + board.length === 28` at all times.
- **No duplicate tile**: no `TileId` appears in more than one of `hands`,
  `boneyard`, `board`.
- **Hand size at deal**: immediately after `DEAL`, every hand has exactly 7
  tiles (covers both `playerCount === 2` and `playerCount === 4`).
- **Turn moves forward**: after a `LAY` or `PASS`, `turn` advances to
  `(turn + 1) % playerCount`. After `DRAW`, `turn` does not advance unless
  the drawn tile is unplayable AND the boneyard is exhausted, in which
  case the same seat will pass next.
- **Pass count cap**: when `passCount === playerCount`, the round ends with
  a blocked outcome.
- **End is terminal**: once `phase === 'ended'`, no further action is
  accepted; reducer returns `{ ok: false, error: 'MATCH_ENDED' }`.

### `MatchResult`

```ts
type Outcome =
  | { readonly kind: 'domino'; readonly winner: Seat }
  | { readonly kind: 'block';  readonly winner: Seat; readonly tiedWith: ReadonlyArray<Seat> }   // tiedWith empty unless tied-block
  | { readonly kind: 'tied-block'; readonly tied: ReadonlyArray<Seat> };

interface MatchResult {
  readonly outcome: Outcome;
  readonly pipsBySeat: ReadonlyArray<number>;        // pipsBySeat[seat] = sum of pips in hand at end
}
```

### `RuleError`

```ts
type RuleError =
  | 'NOT_YOUR_TURN'
  | 'TILE_NOT_IN_HAND'
  | 'TILE_DOES_NOT_MATCH_END'
  | 'MUST_DRAW_FIRST'
  | 'CANNOT_DRAW_EMPTY_BONEYARD'
  | 'CANNOT_PASS_HAS_LEGAL_MOVE'
  | 'CANNOT_PASS_BONEYARD_NOT_EMPTY'
  | 'WRONG_PHASE'
  | 'MATCH_ENDED';
```

### `ReducerResult`

```ts
type ReducerResult =
  | { readonly ok: true;  readonly state: GameState }
  | { readonly ok: false; readonly error: RuleError };
```

The reducer is the single point of legality. It never throws on rule
errors — it returns a tagged result.

---

## Server room model

### `Match` (in-memory only)

```ts
interface Match {
  readonly id: MatchId;                       // internal handle (not exposed)
  readonly roomCode: RoomCode;                // 6-char user-facing code
  readonly mode: 'online' | 'lan';
  readonly hostSessionToken: SessionToken;
  readonly playerCount: 2 | 4;
  status: 'lobby' | 'playing' | 'ended';
  seats: ReadonlyArray<SeatRecord | null>;    // length === playerCount
  game: GameState;                            // updated by reducer on every action
  turnDeadline: number | null;                // epoch ms; null in lobby/ended
  turnTimer: NodeJS.Timeout | null;
  createdAt: number;
  lastActivityAt: number;
}

interface SeatRecord {
  readonly seat: Seat;
  readonly sessionToken: SessionToken;
  readonly displayName: string;               // assigned at join; not user-set in v1
  readonly avatarId: string;                  // chosen from a fixed set at join
  socketId: string | null;
  disconnectedAt: number | null;              // null when connected
  ready: boolean;                             // pre-start lobby flag
}
```

**Lifecycle transitions** (status field):
- `lobby` — created. Players can join (until `seats` is full) or leave.
  The host may toggle `start` once all seats are filled and `ready`.
- `playing` — created via the host's `room:start` event. The engine has
  been `DEAL`ed. Moves are processed by handlers.
- `ended` — set when the reducer returns a `GameState` with
  `phase === 'ended'`. The match remains addressable for 30 minutes
  (so the result screen can be re-read on reconnect), then is GC'd.

### `Session`

```ts
interface Session {
  readonly token: SessionToken;
  readonly issuedAt: number;
  readonly lastSeenAt: number;
  matchBindings: ReadonlySet<MatchId>;        // currently always 0 or 1
}
```

Sessions outlive matches: a player who finishes one match and creates
another reuses their token. Sessions are GC'd after 24 hours of inactivity.

### `RoomCode` and `Token` formats

```ts
type RoomCode     = string;   // /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/
type SessionToken = string;   // 32 hex chars = 16 random bytes
type MatchId      = string;   // 32 hex chars; never sent to client
```

---

## Wire projections (client-facing)

These are what `transport/views.ts` produces. They have Zod schemas in
`packages/contracts`.

### `PlayerSummary` (visible to every participant)

```ts
interface PlayerSummary {
  readonly seat: Seat;
  readonly displayName: string;
  readonly avatarId: string;
  readonly connected: boolean;
  readonly handCount: number;                 // not the tiles themselves
  readonly ready?: boolean;                   // only meaningful in lobby
}
```

### `PublicMatchView`

```ts
interface PublicMatchView {
  readonly roomCode: RoomCode;
  readonly mode: 'online' | 'lan';
  readonly playerCount: 2 | 4;
  readonly status: 'lobby' | 'playing' | 'ended';
  readonly players: ReadonlyArray<PlayerSummary>;
  readonly board: ReadonlyArray<LaidTile>;
  readonly leftEnd:  PipValue | null;
  readonly rightEnd: PipValue | null;
  readonly boneyardCount: number;
  readonly currentSeat: Seat | null;
  readonly turnDeadlineMs: number | null;     // epoch ms; null in lobby/ended
  readonly result: MatchResult | null;        // set when status === 'ended'
}
```

### `PrivatePlayerView` (only sent to its recipient)

```ts
interface PrivatePlayerView {
  readonly mySeat: Seat;
  readonly myHand: ReadonlyArray<TileId>;
  readonly legalMoves: ReadonlyArray<{ tileId: TileId; ends: ReadonlyArray<'left' | 'right'> }>;
}
```

### Forbidden in any client-bound payload
- Other seats' hand contents.
- The order of `boneyard` (only its size is shared).
- `seed`, `MatchId`, any `SessionToken`, the engine `history` array,
  internal counters like `passCount`.

This list is enforced at compile time by the typing of
`ServerToClientPayload` in `packages/contracts`: the union of permissible
payloads simply doesn't carry these fields.

---

## State transitions reference

```text
                +---------+
                |  lobby  |
                +----+----+
                     | host emits room:start
                     v
                +----+----+
                | playing |<-+
                +----+----+  |  every accepted LAY/DRAW/PASS keeps phase
                     |       |  in-play; reducer drives the GameState.phase
                     | engine sets phase === 'ended'
                     v
                +----+----+
                |  ended  |
                +---------+
```

```text
GameState.phase, internal:

  pre-deal --DEAL--> awaiting-opener --first LAY--> in-play
                                                       |
                                                       | hand empty   ---> ended (domino)
                                                       |
                                                       | passCount === playerCount && boneyard empty
                                                       |    ---> ended (block / tied-block)
```

The redundancy between `Match.status` (`lobby`/`playing`/`ended`) and
`GameState.phase` (`pre-deal`/`awaiting-opener`/`in-play`/`ended`) is
deliberate: `Match.status` is a coarse lifecycle flag the *server* uses
to gate which event handlers accept input, while `GameState.phase` is
the engine's internal phase. They are linked but not identical — for
example, a match in `playing` status may transit through
`awaiting-opener` and `in-play` within the engine without changing
`Match.status`.
