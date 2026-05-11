# Phase 0 Research: Dominó Online — Multiplayer MVP

**Date**: 2026-05-11
**Inputs**: spec.md, .specify/memory/constitution.md, the user's feature
description (technical context paragraph).

## Method

The user-provided feature description named every technology choice for the
v1 release. Phase 0 therefore focuses on the small set of decisions left
open — discovery and reconnect mechanics, engine purity discipline, and
local-development workflow — rather than on broad stack comparison. Each
section follows the **Decision / Rationale / Alternatives considered**
shape required by the plan template.

---

## R-001 — Engine purity discipline (immutability + injected RNG)

**Decision**: The engine is split into two layers.

1. **Pure core** (`reducer`, `selectors`, `outcome`, `opener`, `bots`):
   takes a `GameState` and a `GameAction`, returns a `ReducerResult`. No
   `Math.random()`, no `Date.now()`, no I/O. Structural sharing is achieved
   with plain object/array spread; no Immer dependency.
2. **Initialization boundary** (`deal.ts`): the single function that
   *introduces* randomness, `createInitialState(seed: number): GameState`.
   Uses an internal Mulberry32 PRNG seeded by the caller. Tests pass a
   fixed seed; production seeds from `crypto.randomBytes(4)`.

Subsequent draws from the boneyard are deterministic — they pop in the
order set at deal time — so no RNG is needed once `createInitialState`
returns.

**Rationale**: The user's brief asks for "estado imutável, sem variáveis
globais, ações tipadas como discriminated unions, e Math.random()
injectado como dependência". A pure reducer is the most faithful
realization. Confining randomness to one named function makes the seam
explicit and trivially testable. Avoiding Immer keeps the engine
dependency-free (Principle V).

**Alternatives considered**:
- **RNG injected into every reducer call** (the literal reading of the
  brief). Rejected: the reducer needs randomness only at deal time. Threading
  an RNG through every action complicates the type and offers nothing.
- **Immer for nested updates**. Rejected: the engine state is shallow
  (3–4 levels) and the package would otherwise have zero runtime deps.
- **Class-based state with internal mutability**. Rejected: violates the
  user's stated functional preference and complicates property-based tests.

---

## R-002 — Per-recipient state filtering

**Decision**: The server never broadcasts the engine's `GameState` directly.
Every outgoing message goes through `transport/views.ts`, which projects
the full state into a `PublicMatchView` plus, for the addressed recipient,
a `PrivatePlayerView`. The transport layer enforces this by typing — the
underlying socket emit function refuses any payload not matching the
`ServerToClientEvent` Zod union.

The `PublicMatchView` carries: room metadata, player roster with
connection status and hand *counts*, the chain of laid tiles with both
open ends, the current player's seat, the turn deadline, the boneyard
*count*, and (after the round ends) the result.

The `PrivatePlayerView` carries only: the recipient's hand and the set of
legal moves the engine has computed for them.

**Rationale**: Required by Constitution Principle I and spec FR-030 /
FR-031. Centralizing the projection in one module makes the rule
auditable and makes accidental leaks a type error rather than a runtime
bug.

**Alternatives considered**:
- **Send full state and trust the client to filter for display**. Rejected:
  the data is already on the wire — any modified client sees it.
- **One Socket.IO room per private channel + one for broadcast**.
  Rejected: doubles the topology for negligible benefit; the projection
  step is cheap.

---

## R-003 — Reconnect within 5 minutes

**Decision**: Sessions are bound to an opaque `sessionToken` issued by
`POST /session`. The token is the resume credential.

The server's room registry stores, for each seat:
- the live `socket.id` (or `null` if disconnected),
- the bound `sessionToken`,
- a `disconnectedAt` timestamp (or `null` while connected).

On Socket.IO `connect`, the client sends its `sessionToken` in the
`auth` payload. If the token matches a seat in any active room and either
the seat is currently `null` or the `disconnectedAt` is within the 5-minute
window, the server rebinds the seat to the new socket.id and re-sends
the current authoritative view. If outside the window, the seat continues
to receive automatic actions until round end (FR-023).

The turn timer ignores connection state — it counts down regardless. If
the disconnected seat's clock expires, the auto-action policy fires
exactly as for a connected-but-idle player.

**Rationale**: Tying resumption to a token rather than to a TCP/socket
identity decouples it from transport details and lets a phone that
restarts mid-match come back into the same seat. The 5-minute window is
stated directly by the spec (FR-022) and the constitution permits it.

**Alternatives considered**:
- **Socket.IO's built-in connection state recovery**. Considered. Useful
  for short jitter (seconds) but does not cover phone restarts or app
  background-kill, both common on Android. A token layer is needed
  anyway, so adding socket.io reconnect on top adds little.
- **Pause the round while a player is disconnected**. Rejected: other
  players would have to wait up to 5 minutes for a single dropout, which
  is a worse experience than auto-play.

---

## R-004 — LAN discovery: QR-first, manual IP fallback

**Decision**: In LAN mode the host generates a QR code containing a JSON
payload with `host` (IP address discovered via `os.networkInterfaces()`,
preferring private LAN ranges), `port`, `roomCode`, and `protocolVersion`.
The phone scans the QR with `@capacitor/barcode-scanner`, parses the
payload, validates the schema, and connects. As a fallback (e.g., QR
scanner unavailable), a "manual IP" field accepts a typed address.

mDNS-based zero-config discovery is **out of scope for v1** and tracked
as a post-MVP enhancement.

**Rationale**: Spec FR-005 requires that joiners not type an IP. QR
scanning satisfies that requirement and removes the dependence on a
working mDNS plugin in the Android Capacitor ecosystem, which (as of this
plan's writing) does not have a battle-tested official solution.
Principle V favors the simpler shape that meets the requirement.

**Alternatives considered**:
- **Bonjour / Avahi via a community Capacitor plugin**. Rejected for v1.
  Adds a non-trivial native dependency with limited maintainer activity;
  failure modes are inconsistent across Android OEMs.
- **UDP broadcast / `_domino._tcp` advertisement from the host with a
  matching listener on the phone**. Rejected for v1. Requires a
  Capacitor plugin for raw UDP sockets on Android; complexity exceeds the
  feature value when QR already meets the spec.

---

## R-005 — Room code generation

**Decision**: 6-character codes from the alphabet
`ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (22 letters + 8 digits = 30 symbols,
explicitly excluding `O`, `I`, `0`, `1`). The code space is
30⁶ ≈ 7.29 × 10⁸. Codes are generated by drawing 4 bytes from
`crypto.randomBytes` per character (modulo 30; rejection-sampling above
the largest multiple of 30 ≤ 256 to avoid bias). On the rare event of a
collision with an active room, regenerate.

**Rationale**: Aligns with spec FR-002 / FR-003. Crypto-quality
randomness defends against guess-the-room attacks at v1 scale; rejection
sampling keeps the distribution uniform. Active-room cardinality in v1
is in the dozens, so collision is practically nil.

**Alternatives considered**:
- **Use a hash of the host's session token mod 30⁶**. Rejected: predictable
  if the token leaks.
- **Sequential / human-pickable codes (e.g., "ROOM-42")**. Rejected:
  guessable, and risks collisions across concurrent hosts.

---

## R-006 — Turn timer and auto-action policy

**Decision**: A single server-side `setTimeout` per match, set to fire 30
seconds after the turn began. On fire, the server selects an action via
the deterministic auto-action policy (the same code path used by offline
bots):

1. If there exists at least one legal play, choose the one whose tile has
   the **lowest pip sum**. Tiebreak by the lowest `TileId` for determinism.
2. Otherwise, if the boneyard is non-empty, draw one tile. If the drawn
   tile is legal, attempt to play it under the same rule (a). Otherwise,
   the turn yields without a successful play and the boneyard logic
   re-evaluates on the next turn — but the auto-action sequence stops here
   to keep the turn boundary clean.
3. Otherwise, pass.

The timer is cleared by every successful action and re-armed for the next
seat. On reconnect, the timer is not reset.

**Rationale**: Spec FR-021 and FR-023 require an automatic action; the
policy must be both deterministic (for reproducibility) and rule-compliant.
Sharing the policy with the offline bot avoids two implementations of
"what should an inactive player do?"

**Alternatives considered**:
- **Random legal play instead of lowest-pip**. Rejected: would couple the
  auto-action path to RNG, which is undesirable mid-round.
- **Allow chained auto-actions in one tick** (draw, then play, then draw
  again if still no legal move). Rejected: cleaner turn boundaries
  simplify the broadcast log and animations.

---

## R-007 — Engine test plan and coverage gates

**Decision**: The engine's `tests/` directory covers, at minimum:

| Area | Test focus |
|------|-----------|
| `tile.test.ts` | The 28-tile set is unique and complete; pip helpers are correct for every pair. |
| `deal.test.ts` | `createInitialState(seed)` is deterministic for a given seed; 7 tiles per player; 28 total tiles after deal across hands + boneyard; seeded across many seeds yields no duplicate tiles. |
| `opener.test.ts` | Highest double rule; no-double fallback to highest pip sum; tiebreaker by highest single side. Exhaustive over a small set of hand-crafted deals plus property-based deals. |
| `play.test.ts` | Legal plays match one of the chain's two open ends; doubles expose the same value on both ends. Illegal moves rejected with the right error code. |
| `draw-pass.test.ts` | Must-draw / must-pass logic; cannot draw when no-legal AND boneyard empty. |
| `win.test.ts` | Hand-emptying triggers `match:ended` with the right `Outcome.Domino`. |
| `block.test.ts` | Consecutive passes equal to `playerCount` ends the round; pip-sum winner; tied-block produces `Outcome.TiedBlock`. |
| `bots.test.ts` | Auto-action picks lowest-pip legal play; falls back to draw, then pass; deterministic for identical states. |
| `selectors.test.ts` | `legalMovesFor`, `canDraw`, `isBlocked` return correct values across many states. |
| `property-based.test.ts` | Using `fast-check`: from any reachable state, no action sequence produces a non-canonical outcome; tile conservation invariant (28 tiles total across hands, boneyard, and laid chain at all times). |

**Coverage gate**: 95% lines via `vitest --coverage`, enforced in CI.
**Performance gate**: total suite runtime under 5 s on a developer laptop
(Node 20, single thread). If property-based tests exceed budget, reduce
`fast-check` run counts to keep within budget; do not weaken assertions.

**Rationale**: Direct realization of Constitution Principle IV and the
spec's `Engine passa 95% de cobertura de testes; suite roda em < 5 segundos`
success criterion (SC-implied; restated in plan-level performance goals).

**Alternatives considered**:
- **End-to-end tests only**. Rejected: too slow; can't pin specific rule
  bugs.
- **No property-based tests**. Rejected: tile-conservation and "always
  ends canonically" are exactly the invariants property-based tests
  exist for.

---

## R-008 — Discovered: `do.html` reference mockup is not present

**Finding**: The feature description references a `do.html` mockup as a
prior implementation of rules logic to be "rewritten functionally". A
filesystem search confirms no such file exists in the repository. The
canonical rules source therefore reverts to the spec's FR-010 through
FR-017 plus this plan's R-001 / R-006 / R-007 / R-009 — which are
complete enough to develop the engine without the mockup.

**Action**: No blocker. The plan and tasks proceed as written. If the
user later supplies `do.html`, it can be used as an additional
cross-check but is not on the critical path.

**Note on the related design-context file**: `design/stitch_mesa_de_domin/DESIGN-CONTEXT.md.txt`
points to `design/stitch/`, but the actual mockup directory is
`design/stitch_mesa_de_domin/`. The plan uses the actual path. The
context file should be updated under a separate (non-engine) task, since
it is documentation only.

---

## R-009 — Single-round match semantics

**Decision**: A "match" in v1 consists of exactly one round. The
`MatchResult` carries the round's outcome (`Domino` / `Block` /
`TiedBlock`), each seat's final pip count, and the winner's seat (or
empty for a tied block). The end-of-match screen renders these. "Jogar
Novamente" creates a fresh match with a new room code and a fresh seed.

**Rationale**: This was a documented spec assumption rather than a
clarification, but it has architectural implications: the engine carries
no concept of cumulative score across rounds, the data model contains no
"match-of-rounds" entity, and the server's per-match GC fires the moment
the round ends. Locking the assumption here keeps Phase 1's data model
small.

**Alternatives considered**:
- **First-to-N points style match.** Reasonable for a v2; would require a
  `Match` entity that wraps multiple `Round` instances, plus rules for
  cumulative scoring. Deliberately deferred per spec's
  "FORA DO ESCOPO ... pontuação acumulada".

---

## R-010 — Local development workflow

**Decision**: One root `package.json` declares workspaces
`packages/*`. Top-level scripts:

- `npm run dev:server` — `nodemon` running `packages/server/src/index.ts`
  via `tsx`.
- `npm run dev:client` — `vite` in `packages/client`.
- `npm run dev:lan` — same as dev:server but with `--mode=lan` and a
  printed QR code in the terminal for desktop testing.
- `npm test` — runs every package's `vitest` suite in series.
- `npm run build:android` — builds the client, syncs Capacitor, and
  produces a debug APK via `gradle assembleDebug`.

Engine and contracts are typed-only consumers — they emit `.d.ts` into
`dist/` via `tsc -b` in their workspace.

**Rationale**: Trivial scripts, no extra runner (turbo/nx). Matches
Principle V's preference for the smallest setup that meets the need.

**Alternatives considered**:
- **`pnpm run` with shared `pnpm-workspace.yaml`**. Slightly faster
  installs, but adds a tool dependency. v1 doesn't need it.

---

## Summary of resolved unknowns

| ID | Topic | Outcome |
|----|-------|---------|
| R-001 | Engine purity / RNG injection | Pure reducer + a single `createInitialState(seed)` boundary. |
| R-002 | Per-recipient state filtering | Centralized projection in `transport/views.ts`; types prevent leaks. |
| R-003 | Reconnect within 5 min | Opaque session token; rebind seat on reconnect within window. |
| R-004 | LAN discovery | QR-first; manual IP fallback. mDNS deferred. |
| R-005 | Room code generation | 30-symbol alphabet, 6 chars, rejection-sampled from `crypto.randomBytes`. |
| R-006 | Turn timer / auto-action | 30 s setTimeout; lowest-pip legal play → draw → pass policy. |
| R-007 | Engine test plan | Listed test files; 95% line coverage gate; <5 s budget. |
| R-008 | Missing `do.html` reference | Flagged. No blocker; spec covers the rules canon. |
| R-009 | Single-round match | Confirmed; no cumulative-score model in v1. |
| R-010 | Dev workflow | npm workspaces, plain scripts; no turborepo / pnpm. |

All Phase 0 unknowns are resolved; no remaining `NEEDS CLARIFICATION` items.
