# Socket.IO Events

All events live in a single Socket.IO namespace: `/` (root). The client
authenticates at connect time using the `auth` payload (`SocketAuthPayload`
from `data-types.md`). Connections that fail the protocol-version check
or carry an unknown `sessionToken` are immediately disconnected with a
`PROTOCOL_MISMATCH` or `INVALID_PAYLOAD` error.

Every event payload is defined as a Zod schema in
`packages/contracts/src/events.ts` and validated on both the inbound
(server) and the outbound (client) boundary.

## Direction legend

- `C → S` — client to server (intent / request)
- `S → C` — server to client (authoritative result / push)
- `S → C (filtered)` — sent to *one* recipient with a `PrivatePlayerView` baked in

## Client-to-server events

### `room:create` (C → S)

```ts
{
  mode: 'online' | 'lan',
  playerCount: 2 | 4
}
```

Response: emits `room:state` to the requester only (with the new
`PublicMatchView` for the freshly created lobby) plus a
`PrivatePlayerView` for the requester's seat. The requester becomes the
host. Error: `INTERNAL` on registry failure (extremely rare).

### `room:join` (C → S)

```ts
{
  roomCode: RoomCode
}
```

Response: emits `room:state` to *all* current participants (because
roster changed). Errors: `ROOM_NOT_FOUND`, `ROOM_FULL`,
`ROOM_IN_PROGRESS`.

### `room:ready` (C → S)

```ts
{
  ready: boolean
}
```

Response: `room:state` broadcast to all participants.

### `room:leave` (C → S)

```ts
// empty payload
```

Removes the seat (if in lobby) or marks the seat as disconnected (if
playing). Response: `room:state` broadcast to remaining participants.

### `room:start` (C → S) — host only

```ts
// empty payload
```

Pre-conditions: all `playerCount` seats are filled and ready; emitter
is the host. Response: server runs `createInitialState(seed)`, applies
`DEAL`, then broadcasts `match:started` to all participants and
`match:state` (filtered) to each.

Errors: `NOT_HOST`, `ROOM_IN_PROGRESS` (already started).

### `move:lay` (C → S)

```ts
{
  moveId: MoveId,
  tileId: TileId,
  end: 'left' | 'right'
}
```

Response: server runs the reducer; on success emits `match:state`
(filtered) to each participant. On failure emits `error` to the actor
with code `ILLEGAL_MOVE` and `detail.rule` set to the underlying
`RuleError`. The duplicate `moveId` for the same match is ignored.

### `move:draw` (C → S)

```ts
{ moveId: MoveId }
```

Response: same shape as `move:lay`. The drawn tile is delivered only in
the actor's `PrivatePlayerView`.

### `move:pass` (C → S)

```ts
{ moveId: MoveId }
```

Response: same shape as `move:lay`.

## Server-to-client events

### `room:state` (S → C (filtered))

```ts
{
  view: PublicMatchView,
  me: PrivatePlayerView | null     // null if recipient is a spectator (not in v1)
}
```

Emitted whenever the public match state changes (join/leave/ready/start)
or whenever the recipient explicitly requests resync (handled by the
implicit `connect` re-handshake).

### `match:started` (S → C)

```ts
{
  opener: Seat,
  turnDeadlineMs: number
}
```

Broadcast once when the round begins. Carries no hand contents — those
arrive in the `room:state` (filtered) emitted immediately after.

### `match:state` (S → C (filtered))

```ts
{
  view: PublicMatchView,
  me: PrivatePlayerView,
  lastAction: {
    actor: Seat,
    kind: 'LAY' | 'DRAW' | 'PASS',
    tileId?: TileId,                // present for LAY (any seat); for DRAW only if actor === me
    end?: 'left' | 'right'          // present for LAY
  } | null                          // null only for the initial state immediately after start
}
```

Emitted after every accepted action and after every reconnect. The
`lastAction` field gives the client enough information to animate the
change without diffing the whole board.

### `match:turn` (S → C)

```ts
{
  currentSeat: Seat,
  turnDeadlineMs: number
}
```

Convenience event for the client to drive the turn-timer UI. The same
information is also present in `match:state`; this event is emitted
slightly earlier to minimize visible lag on the indicator.

### `match:ended` (S → C)

```ts
{
  result: MatchResult,
  view: PublicMatchView              // status === 'ended'
}
```

Broadcast when the engine's `GameState.phase` becomes `ended`. The
client transitions to the end-of-match screen.

### `error` (S → C)

```ts
ErrorPayload                         // see data-types.md
```

Emitted to a single recipient when a request cannot be honored.

## Reconnect flow

The client always treats a fresh Socket.IO `connect` as a resync:

1. Connect with `{ protocolVersion, sessionToken }`.
2. The server checks whether the `sessionToken` is bound to any active
   `Match`. If so, it emits `room:state` (filtered) to the new socket,
   reflecting the current authoritative state, and any pending
   `match:turn`. The client renders.
3. If the token is not bound to any match, the server emits
   `room:state` with `view: null` — meaning the client should return
   to the home screen.

The 5-minute reconnect window described in spec FR-022 is enforced at
the registry layer: a seat with `disconnectedAt + 5 min < now` no
longer admits resume — the seat continues to be auto-played until the
round ends, and the returning device is told it's no longer in the
match.

## Idempotency log

For each active `Match`, the server keeps a `Set<MoveId>` of accepted
`moveId`s. Capacity bound: the set is reset at round end (which is
also when the match is GC'd, so unbounded growth is impossible). The
set protects against double-deliveries during reconnect storms.
