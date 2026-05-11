# Contracts — Dominó Online v1

**Protocol version**: `1.0.0`
**Status**: Draft for v1

This directory pins the wire format between the Android client and the
authoritative server. The contracts described here are mirrored at
runtime by Zod schemas in `packages/contracts`, which is imported by both
sides of the connection.

## Files

| File | What lives there |
|------|------------------|
| [`socketio-events.md`](./socketio-events.md) | Every Socket.IO event name + payload schema, in both directions. |
| [`rest-endpoints.md`](./rest-endpoints.md)   | The small REST surface: session issuance, health, LAN info. |
| [`data-types.md`](./data-types.md)           | Shared types referenced by events and REST. Mirrors `data-model.md` but constrained to the wire-safe projections. |

## Versioning

- `PROTOCOL_VERSION` is a single semver string exported from
  `packages/contracts/src/version.ts`.
- The **client and server compare exact match** at handshake. A mismatch
  triggers a typed `protocol_mismatch` error event and the client refuses
  to enter a match.
- A breaking change (renaming an event, changing a required field, etc.)
  bumps MAJOR. A backwards-compatible addition bumps MINOR. A clarifying
  fix bumps PATCH.

## Wire-safety invariants

These hold for **every** server-to-client event without exception:

1. No tile contents of any seat other than the recipient.
2. No `boneyard` array — only `boneyardCount`.
3. No `seed`, no `MatchId`, no `SessionToken` other than the recipient's
   own (on session issuance only).
4. No engine `history` array; no internal counters such as `passCount`.

These are not just review rules — they are reflected in the Zod union
type `ServerToClient`. A field that is forbidden simply does not exist
on the union, so a leak is a compile error.

## Forbidden client claims

The server never trusts a client-claimed outcome of a move. The client
sends *intents* (`move:lay`, `move:draw`, `move:pass`); the server runs
them through the reducer and emits the resulting authoritative state.
A client that disagrees with the server's state must re-render the
server's version.

## Idempotency

Every client-to-server action carries a `moveId` (a UUID generated
client-side). The server records the moveId per match; a duplicate is
ignored and the current state is re-sent. This protects against double-
delivery during reconnect.
