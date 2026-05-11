# Implementation Plan: Dominó Online — Multiplayer MVP

**Branch**: `001-domino-multiplayer-mvp` | **Date**: 2026-05-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-domino-multiplayer-mvp/spec.md`

## Summary

Deliver a mobile-first multiplayer game of double-six Brazilian dominoes,
shipped as an Android application, with a single authoritative server that
runs in two configurations — Online (cloud-hosted) and LAN (a developer-style
single-binary that a player launches on a PC for friends on the same Wi-Fi).
The rules engine is a pure TypeScript library shared by the server (always
used) and the client (used in offline-vs-bots mode and for legal-move display
hints). All gameplay decisions, including hand contents and boneyard order,
are owned by the server, which broadcasts per-recipient filtered state over
WebSocket. The first release covers 2-player and 4-player matches, a
30-second turn timer with automatic action, and a 5-minute reconnect window.
Engine reaches ≥95% line coverage and runs in <5s.

## Technical Context

**Language/Version**: TypeScript 5.x in strict mode across all packages.
Runtime is Node.js 20 LTS on the server and the same on the client build
toolchain; Capacitor packages the compiled web bundle as an Android APK.

**Primary Dependencies**
- *Engine (`packages/engine`)*: zero runtime dependencies. Internal seeded
  PRNG (Mulberry32) and a tiny structural-sharing utility.
- *Contracts (`packages/contracts`)*: `zod` for runtime schema validation,
  shared by both sides of the wire.
- *Server (`packages/server`)*: `express` (HTTP), `socket.io` v4 (realtime),
  `pino` (structured logs), `zod` (payload validation via contracts).
- *Client (`packages/client`)*: `react` 18, `vite` 5, `tailwindcss` 3,
  `socket.io-client` v4, `@capacitor/core` + `@capacitor/android` v6,
  `@capacitor/preferences` (opaque session token storage),
  `@capacitor/barcode-scanner` (QR scan in LAN-join).

**Storage**
- Server: in-memory match registry per process (single-node v1). No
  database, no Redis. Match lifetime ≤ a few hours; orphan matches GC'd
  after 30 min of inactivity.
- Client: only the opaque session token persists, via Capacitor Preferences.

**Testing**
- Engine and contracts: `vitest` (unit + property-based with `fast-check`).
- Server: `vitest` for unit; in-process Socket.IO integration tests pairing
  client and server in the same Node test.
- Client: smoke-only in v1 (manual play-testing covers UI). React Testing
  Library is set up but used sparingly to keep the test suite fast.

**Target Platform**
- Server: Linux x64, Node 20 LTS, no native modules.
- Client: Android 9+ (API 28+) via Capacitor. The same `index.html` runs in
  a desktop browser for development; only the LAN host needs the desktop
  variant for `Jogar Offline` and for hosting LAN matches.

**Project Type**: monorepo with four packages — `engine` (pure library),
`contracts` (shared wire schemas), `server` (Node service), `client`
(React/Capacitor app). Managed with npm workspaces.

**Performance Goals** (carried from Constitution Principle III)
- Move acknowledgment p95: <250 ms intra-region, <500 ms cross-region.
- Broadcast fan-out p95: <400 ms.
- Engine test suite: <5 s (Spec SC-aligned).
- Engine line coverage: ≥95%.

**Constraints**
- Server-authoritative: engine called only from the server in online/LAN
  mode; client-side engine usage is limited to offline mode and read-only
  legality hints derived from server-sent state.
- Hidden information: opponents' hands and boneyard order MUST never appear
  in any client-bound payload. The server filters per recipient.
- Determinism: engine accepts an injected RNG (seed-based) so the entire
  test suite is reproducible. Production randomness seeds from
  `crypto.randomBytes` at deal time.
- Android 9+ install target; no native code beyond Capacitor's defaults.
- LAN host: a single process that listens on `0.0.0.0` and works without
  internet access. Discovery in v1 is QR-code-driven (no mDNS plugin
  dependency); manual IP entry is the fallback.

**Scale/Scope**
- v1 target load: dozens of concurrent matches per server process. Out of
  v1: thousands of concurrent matches, multi-node scale-out.
- 2 or 4 seats per match; one round per match (no cross-round scoring).
- Around 6 screens in the client; one Socket.IO namespace; ~10 event types.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked at end of Phase 1.*

| Principle | How this plan satisfies it | Status |
|-----------|---------------------------|--------|
| **I. Server-Authoritative Game Engine** | The engine lives in `packages/engine` as a pure library. The server imports it; the client imports it only for offline-vs-bots mode and for non-binding display hints. All moves over the network go through the server reducer, which is the single source of legality. | PASS |
| **II. Frontend/Backend Contract Discipline** | All Socket.IO event payloads and the small REST surface have Zod schemas in `packages/contracts`, versioned by a single `PROTOCOL_VERSION` constant. The client and server both import these schemas; the client cannot construct a payload that bypasses validation. Breaking changes bump `PROTOCOL_VERSION` and are documented in `specs/001-domino-multiplayer-mvp/contracts/`. | PASS |
| **III. Realtime Sync with Defined Latency Budgets** | Transport is WebSocket via Socket.IO. The server stamps every accepted move with a monotonic sequence; the client's reconnect handler asks for the latest state and reconciles. Latency budgets from the constitution (250/500/400 ms p95) are made measurable by `pino` log fields the server emits per move. | PASS |
| **IV. Test-First for Game Logic (NON-NEGOTIABLE)** | The engine package is developed test-first. The rules canon in the spec (FR-010 through FR-017) maps directly to the engine's test plan documented in this plan's tasks. Coverage gate is 95% lines, suite budget <5 s, both enforced in CI. | PASS |
| **V. Simplicity & Single Source of Truth** | One canonical state form (the engine's `GameState`) lives server-side per active match. The client renders projections. There is no Redis, no database, no abstract repository layer in v1 — just in-process Maps. The monorepo's four packages are the minimum needed to share the engine and contracts between server and client; collapsing further would require duplicating rules or types. | PASS — see Complexity note |

No violations. The monorepo-with-four-packages structure is the smallest
viable shape given that the engine MUST be importable by both server (for
authoritative play) and client (for offline mode and display hints).
Recorded in Complexity Tracking for transparency.

### Post-Design Re-Check (after Phase 1)

Re-evaluated against the artifacts produced in Phase 1 (`research.md`,
`data-model.md`, `contracts/`, `quickstart.md`). All five principles
still pass, with the following concrete anchors:

- **I**: `contracts/socketio-events.md` shows the client sends only
  *intents* (`move:lay`, `move:draw`, `move:pass`); the server is the
  sole legality authority via the reducer. `data-model.md` documents
  the server-only `Match` and engine `GameState` and the wire-only
  `PublicMatchView` / `PrivatePlayerView`.
- **II**: `contracts/README.md` declares `PROTOCOL_VERSION = 1.0.0`,
  fixed-shape Zod-validated payloads, and the version-mismatch error
  flow. Forbidden wire fields are listed and enforced by the
  `ServerToClient` union typing.
- **III**: Reconnect flow and idempotency log are specified in
  `contracts/socketio-events.md`; latency budgets restated in the plan.
- **IV**: `research.md#R-007` lists the engine test files and
  coverage/time gates that are now part of the Phase 2 task plan.
- **V**: No new abstractions were introduced beyond what was on the
  initial check. The data model uses plain interfaces and arrays;
  no DI containers, no ORM, no message-bus indirection.

No new entries added to Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-domino-multiplayer-mvp/
├── plan.md                       # This file
├── spec.md                       # Feature specification (already done)
├── research.md                   # Phase 0 output
├── data-model.md                 # Phase 1 output
├── quickstart.md                 # Phase 1 output
├── contracts/                    # Phase 1 output
│   ├── README.md
│   ├── socketio-events.md
│   ├── rest-endpoints.md
│   └── data-types.md
├── checklists/
│   └── requirements.md           # Spec quality checklist (already done)
└── tasks.md                      # Phase 2 output (created by /speckit-tasks)
```

### Source Code (repository root)

```text
packages/
├── engine/                       # Pure TypeScript rules engine
│   ├── src/
│   │   ├── tile.ts               # Tile, TileId, PipValue, pip helpers
│   │   ├── state.ts              # GameState type + invariants
│   │   ├── actions.ts            # GameAction discriminated union
│   │   ├── reducer.ts            # (state, action) => ReducerResult
│   │   ├── selectors.ts          # legalMovesFor, canDraw, isBlocked, ...
│   │   ├── deal.ts               # createInitialState(seed) — only impure boundary
│   │   ├── rng.ts                # Mulberry32 seeded PRNG
│   │   ├── opener.ts             # highest-double / highest-pip-sum logic
│   │   ├── outcome.ts            # win, block, tied-block detection + pip sums
│   │   ├── bots.ts               # deterministic auto-play policy
│   │   └── index.ts
│   ├── tests/                    # ≥95% line coverage; <5s total
│   └── package.json
├── contracts/                    # Wire schemas (Zod) + protocol version
│   ├── src/
│   │   ├── version.ts            # PROTOCOL_VERSION = '1.0.0'
│   │   ├── room.ts               # RoomCode, RoomCreatePayload, etc.
│   │   ├── events.ts             # All Socket.IO event payload schemas
│   │   ├── views.ts              # PublicMatchView, PrivatePlayerView
│   │   ├── errors.ts             # Error codes + payload shape
│   │   └── index.ts
│   ├── tests/
│   └── package.json
├── server/                       # Online + LAN authoritative server
│   ├── src/
│   │   ├── index.ts              # Process entry — argv: --mode=online|lan
│   │   ├── http.ts               # Express app (health, session, lan/info)
│   │   ├── io.ts                 # Socket.IO server factory
│   │   ├── rooms/
│   │   │   ├── registry.ts       # In-memory Map<RoomCode, Match>
│   │   │   ├── code-generator.ts # 6-char alphabet without O/I/0/1
│   │   │   └── lifecycle.ts      # GC orphaned matches
│   │   ├── sessions/
│   │   │   ├── token.ts          # Opaque token issuance + lookup
│   │   │   └── reconnect.ts      # 5-min hold window
│   │   ├── transport/
│   │   │   ├── handlers.ts       # Event handlers (validated via contracts)
│   │   │   ├── views.ts          # Per-recipient state projection
│   │   │   └── broadcast.ts      # Filtered broadcast helper
│   │   ├── timers/
│   │   │   ├── turn-timer.ts     # 30 s turn deadline + auto-action
│   │   │   └── reconnect-timer.ts# 5 min reconnect window
│   │   ├── lan/
│   │   │   ├── qr.ts             # QR payload assembly
│   │   │   └── info-endpoint.ts  # GET /lan/info (consumed by QR scanner)
│   │   ├── observability/
│   │   │   ├── logger.ts         # pino base config
│   │   │   └── metrics.ts        # process-level counters
│   │   └── types.ts              # Server-internal types not in contracts
│   ├── tests/
│   │   ├── integration/          # In-process client+server pairs
│   │   └── unit/
│   └── package.json
└── client/                       # React + Vite + Capacitor (Android)
    ├── src/
    │   ├── app/
    │   │   ├── HomeScreen.tsx
    │   │   ├── CreateMatchScreen.tsx
    │   │   ├── JoinMatchScreen.tsx
    │   │   ├── LobbyScreen.tsx
    │   │   ├── GameScreen.tsx
    │   │   ├── EndScreen.tsx
    │   │   └── RulesScreen.tsx
    │   ├── components/
    │   │   ├── Tile.tsx
    │   │   ├── Board.tsx
    │   │   ├── Hand.tsx
    │   │   ├── Avatar.tsx
    │   │   ├── TurnIndicator.tsx
    │   │   └── BotecoButton.tsx
    │   ├── net/
    │   │   ├── socket.ts         # Socket.IO client + reconnect glue
    │   │   ├── session.ts        # Token issue + persistence
    │   │   └── view-store.ts     # Typed store fed by server views
    │   ├── lan/
    │   │   ├── qr-scanner.ts     # Capacitor QR scanner wrapper
    │   │   └── manual-ip.ts      # Fallback for QR-unavailable case
    │   ├── offline/
    │   │   └── runner.ts         # Uses engine + bot policy directly
    │   ├── theme/
    │   │   ├── tokens.ts         # Imports tokens derived from DESIGN.md
    │   │   └── tailwind.config.ts
    │   └── main.tsx
    ├── android/                  # Capacitor Android project (generated)
    ├── public/
    ├── index.html
    ├── vite.config.ts
    ├── capacitor.config.ts
    └── package.json

design/
└── stitch_mesa_de_domin/         # Canonical mockups — primary visual source

specs/
└── 001-domino-multiplayer-mvp/   # This feature's spec, plan, contracts, tasks

package.json                      # npm workspaces root
tsconfig.base.json                # Shared strict-mode config
.npmrc                            # Workspace settings if any
```

**Structure Decision**: Adopt the four-package monorepo above. The shape
is *Option 3 (Mobile + API)* in the template's vocabulary, augmented with
two shared libraries (`engine`, `contracts`) instead of a single `api/`
backend. This is the smallest layout that satisfies Constitution Principle I
(server-authoritative engine, importable by client only for offline use) and
Principle II (contracts as a shared, versioned wire schema). Collapsing the
`engine` into `server` would either duplicate rule code in the client's
offline runner or leak server internals through the client; collapsing
`contracts` into `server` would deny the client compile-time typing of the
wire format.

## Complexity Tracking

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| Four-package monorepo (`engine`, `contracts`, `server`, `client`) instead of a single `backend/` + `frontend/` layout | The engine must be importable by both server (for authoritative play) and client (for offline-vs-bots). The contracts must be importable by both for compile-time wire typing. | A flat `backend/` + `frontend/` would either force the client to duplicate rule code in its offline runner, or force the offline runner to call the server (which defeats "offline"). Inlining contracts into `server/` would leave the client typing the wire by hand. |
| npm workspaces (no pnpm / nx / turborepo) | Workspaces are built into Node 20+; no extra tool dependency. | pnpm/nx/turborepo bring caching and faster installs at the cost of one more tool to install on the host. v1 has four packages; the marginal speed gain is not yet worth the dependency. |

No deviations from Constitution principles. The complexity above is the
minimum needed to satisfy Principles I and II.
