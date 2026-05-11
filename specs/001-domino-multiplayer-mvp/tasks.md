---
description: "Task list for Dominó Online — Multiplayer MVP (feature 001)"
---

# Tasks: Dominó Online — Multiplayer MVP

**Input**: Design documents from `specs/001-domino-multiplayer-mvp/`
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Test tasks ARE included in this plan. The engine package is
test-first per Constitution Principle IV (NON-NEGOTIABLE); the server
package has integration tests covering each Socket.IO flow. The client
package has only smoke tests in v1 (manual play-testing covers UI).

**Organization**: Tasks are grouped first by phase, then by user story
within Phases 3–7, so each story can be implemented and tested
independently.

## Format

`- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]** — Task is parallelizable: it touches files no other unfinished task touches.
- **[USx]** — Maps the task to user story Px from `spec.md`. Required for tasks in Phases 3–7; omitted in Setup, Foundational, and Polish.
- File paths are repository-relative.

## Path Conventions

Multi-package monorepo layout (see `plan.md` → Project Structure):

- Engine: `packages/engine/src/...`, `packages/engine/tests/...`
- Contracts: `packages/contracts/src/...`, `packages/contracts/tests/...`
- Server: `packages/server/src/...`, `packages/server/tests/...`
- Client: `packages/client/src/...`, `packages/client/android/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo bootstrap. No application logic — just project skeleton.

- [X] T001 Create monorepo root `package.json` with `"workspaces": ["packages/*"]` and top-level scripts (`build`, `test`, `dev:server`, `dev:client`, `dev:lan`, `build:client`, `build:android`) per `quickstart.md`
- [X] T002 [P] Create `tsconfig.base.json` at repo root with `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, ES2022 target
- [X] T003 [P] Create `.editorconfig` and `.gitignore` at repo root (Node, Vite, Capacitor/Android, coverage, OS artifacts)
- [X] T004 [P] Create shared ESLint + Prettier config at repo root (ESLint flat config, Prettier defaults) and per-package `.eslintrc` extends as needed
- [X] T005 [P] Create `packages/engine/package.json` with name `@domino/engine`, scripts (`build`, `test`, `test:watch`, `test:coverage`), and a `tsconfig.json` extending the root base
- [X] T006 [P] Create `packages/contracts/package.json` with name `@domino/contracts`, depends on `zod`, scripts, and `tsconfig.json` extending base
- [X] T007 [P] Create `packages/server/package.json` with name `@domino/server`, dependencies (`express`, `socket.io`, `pino`, `pino-pretty` in dev, `zod`, `@domino/engine`, `@domino/contracts`), scripts (`dev`, `dev:lan`, `build`, `start`, `test`), and `tsconfig.json`
- [X] T008 [P] Create `packages/client/package.json` with name `@domino/client`, dependencies (`react`, `react-dom`, `socket.io-client`, `@domino/engine`, `@domino/contracts`, `@capacitor/core`, `@capacitor/android`, `@capacitor/preferences`, `@capacitor/barcode-scanner`), devDeps (`vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`), scripts (`dev`, `build`, `preview`), and `tsconfig.json`
- [X] T009 Run `npm install` at repo root and verify the workspaces resolve (each package importable by name)

**Checkpoint**: Repo cloneable; `npm install` succeeds; empty packages compile via `npm run -ws build`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The engine, the contracts, and the minimal server/client bootstrap. All user stories depend on these.

**CRITICAL**: No user story work in Phases 3–7 may begin until this phase is complete.

### Engine — pure rules library (`@domino/engine`)

**Discipline**: Strict TDD. Every implementation task is preceded by a test task that MUST be written first and MUST fail before the implementation task is started. Coverage gate ≥95% lines; suite budget <5 s.

- [X] T010 [P] Write tile tests (28-tile set complete + unique, pip-sum helpers, doubles helper, canonical `id` ordering) in `packages/engine/tests/tile.test.ts`
- [X] T011 [P] Implement `Tile`, `TileId`, `PipValue`, `enumerateTiles()`, pip helpers in `packages/engine/src/tile.ts`
- [X] T012 [P] Write Mulberry32 PRNG tests (determinism for fixed seed; uniform distribution sanity at large N) in `packages/engine/tests/rng.test.ts`
- [X] T013 [P] Implement Mulberry32 PRNG in `packages/engine/src/rng.ts`
- [X] T014 [P] Write `GameAction` discriminated-union exhaustiveness tests (compile-time + runtime narrowing) in `packages/engine/tests/actions.test.ts`
- [X] T015 [P] Implement `GameAction` union in `packages/engine/src/actions.ts` with `RuleError`, `ReducerResult` types
- [X] T016 [P] Write `GameState` invariant tests (tile conservation; no duplicates; phase enum coverage) in `packages/engine/tests/state.test.ts`
- [X] T017 [P] Implement `GameState` types + `assertInvariants(state)` helper in `packages/engine/src/state.ts`
- [X] T018 [P] Write `createInitialState(seed, playerCount)` tests (deterministic per seed; 7 tiles per hand for both 2 and 4 players; boneyard size correct; tile conservation) in `packages/engine/tests/deal.test.ts`
- [X] T019 [P] Implement `createInitialState` in `packages/engine/src/deal.ts` (impure boundary — only place the seeded RNG is used)
- [X] T020 [P] Write opener tests (highest double wins; fallback to highest pip sum; tiebreaker by highest single side) in `packages/engine/tests/opener.test.ts`
- [X] T021 [P] Implement opener selection in `packages/engine/src/opener.ts`
- [X] T022 Write reducer tests for `LAY` action (matches open end; doubles expose same value on both ends; rejects wrong-end tile; rejects not-your-turn; rejects tile-not-in-hand) in `packages/engine/tests/reducer-lay.test.ts` — depends on T011, T015, T017
- [X] T023 Implement `LAY` handling in `packages/engine/src/reducer.ts` — depends on T022
- [X] T024 [P] Write reducer tests for `DRAW` action (boneyard pop; transition rules; rejects when player has a legal move) in `packages/engine/tests/reducer-draw.test.ts`
- [X] T025 Implement `DRAW` handling in `packages/engine/src/reducer.ts` — depends on T023, T024
- [X] T026 [P] Write reducer tests for `PASS` action (rejects when legal move exists or boneyard non-empty; turn advances; pass count increments) in `packages/engine/tests/reducer-pass.test.ts`
- [X] T027 Implement `PASS` handling in `packages/engine/src/reducer.ts` — depends on T025, T026
- [X] T028 [P] Write win-detection tests (`bate`: emptying hand sets `phase === 'ended'` with `Outcome.domino`; `pipsBySeat` correct for the loser) in `packages/engine/tests/win.test.ts`
- [X] T029 [P] Write block-detection tests (`tranca`: `passCount === playerCount` ends round; lowest-pip winner; tied-block when min is shared) in `packages/engine/tests/block.test.ts`
- [X] T030 Implement outcome detection (win + block + tied-block, pip-sum computation) in `packages/engine/src/outcome.ts` — depends on T028, T029
- [X] T031 [P] Write selector tests (`legalMovesFor`, `canDraw`, `mustPass`, `isBlocked`, `pipSum`) in `packages/engine/tests/selectors.test.ts`
- [X] T032 [P] Implement selectors in `packages/engine/src/selectors.ts`
- [X] T033 [P] Write bot/auto-action policy tests (chooses lowest-pip legal play; falls back to draw; falls back to pass; deterministic for identical states) in `packages/engine/tests/bots.test.ts`
- [X] T034 [P] Implement `chooseAutoAction(state, seat)` in `packages/engine/src/bots.ts`
- [X] T035 Write property-based tests using `fast-check` (tile conservation invariant under arbitrary action sequences; every reachable terminal state is one of the canonical outcomes) in `packages/engine/tests/property-based.test.ts` — depends on T023, T025, T027, T030
- [X] T036 Add `packages/engine/src/index.ts` re-exporting the public engine API and verify no internals leak
- [X] T037 Configure `vitest.config.ts` in `packages/engine/` with coverage thresholds (`lines: 95, branches: 90, functions: 95, statements: 95`) and run `npm test -w @domino/engine` — gate fails build if thresholds not met

### Contracts — Zod schemas + protocol version (`@domino/contracts`)

- [X] T038 [P] Implement `PROTOCOL_VERSION` constant (`'1.0.0'`) in `packages/contracts/src/version.ts`
- [X] T039 [P] Implement `RoomCode`, `SessionToken`, `MoveId` Zod schemas (regex-validated alphabets) in `packages/contracts/src/room.ts`
- [X] T040 [P] Implement view schemas (`PublicMatchView`, `PrivatePlayerView`, `PlayerSummary`, `LaidTile`, `MatchResult`, `Outcome`) in `packages/contracts/src/views.ts`
- [X] T041 [P] Implement error schemas (`ErrorCode` enum, `ErrorPayload`) in `packages/contracts/src/errors.ts`
- [X] T042 [P] Implement Socket.IO event schemas (every C→S and S→C payload from `contracts/socketio-events.md`) in `packages/contracts/src/events.ts`
- [X] T043 [P] Implement `SocketAuthPayload` schema in `packages/contracts/src/auth.ts`
- [X] T044 [P] Add `packages/contracts/src/index.ts` re-exporting all schemas + inferred TS types
- [X] T045 Write schema roundtrip tests (parse → serialize → parse equals original) plus forbidden-field rejection tests (server-to-client schemas must NOT accept payloads carrying other-seat hands or boneyard order) in `packages/contracts/tests/schemas.test.ts`

### Server bootstrap (`@domino/server`)

- [X] T046 [P] Implement `pino` logger factory in `packages/server/src/observability/logger.ts` (pretty in dev, JSON in prod)
- [X] T047 [P] Implement argv parsing for `--mode=online|lan` and `--port=N` in `packages/server/src/config.ts`
- [X] T048 [P] Implement Express app factory with CORS (allow all in v1) and JSON middleware in `packages/server/src/http.ts`
- [X] T049 [P] Implement `GET /health` returning `{ ok, protocolVersion, now, mode }` in `packages/server/src/http.ts`
- [X] T050 [P] Implement `POST /session` issuing 16-byte hex tokens in `packages/server/src/sessions/token.ts`
- [X] T051 Implement Socket.IO server attachment + auth handshake (validates `SocketAuthPayload`, disconnects on `PROTOCOL_MISMATCH`) in `packages/server/src/io.ts` — depends on T046, T048
- [X] T052 Implement process entry that wires all of the above and listens on `0.0.0.0:4123` in `packages/server/src/index.ts` — depends on T047, T051
- [X] T053 [P] Write server-bootstrap integration test (start app, hit `/health`, hit `/session`, open Socket.IO with valid + invalid `SocketAuthPayload`) in `packages/server/tests/integration/bootstrap.test.ts`

### Client bootstrap (`@domino/client`)

- [X] T054 [P] Configure Vite + React 18 + TS strict in `packages/client/vite.config.ts` + `packages/client/index.html` + `packages/client/src/main.tsx`
- [X] T055 [P] Configure Tailwind + design tokens in `packages/client/src/theme/tokens.ts` and `packages/client/tailwind.config.ts`, derived from `design/stitch_mesa_de_domin/brazilian_domino_aesthetic/DESIGN.md`
- [X] T056 [P] Implement Capacitor config in `packages/client/capacitor.config.ts` targeting `appId: br.com.domino.online`, `appName: Dominó Online`, server allowNavigation for LAN
- [X] T057 [P] Implement session-token persistence using `@capacitor/preferences` in `packages/client/src/net/session.ts` (read or create-and-store on first launch via `POST /session`)
- [X] T058 [P] Implement `BotecoButton` and `Avatar` primitive components in `packages/client/src/components/`
- [X] T059 [P] Implement `Tile` component (8px corner radius, ivory surface, navy pips) in `packages/client/src/components/Tile.tsx`
- [X] T060 [P] Implement `Board` component rendering laid chain with the two open ends visually distinguished, in `packages/client/src/components/Board.tsx`
- [X] T061 [P] Implement `Hand` component rendering current player's hand with legality highlighting (advisory, server is authoritative) in `packages/client/src/components/Hand.tsx`
- [X] T062 [P] Implement `TurnIndicator` component (shows current seat + countdown using `turnDeadlineMs`) in `packages/client/src/components/TurnIndicator.tsx`
- [X] T063 Implement `HomeScreen` rendering three primary actions ("Criar Partida", "Entrar em Partida", "Jogar Offline") plus a "Regras" link, per `design/stitch_mesa_de_domin/home_screen/code.html`, in `packages/client/src/app/HomeScreen.tsx` — depends on T058
- [X] T064 Implement `GameScreen` taking `gameView: PublicMatchView`, `mySeat: Seat`, `myHand: PrivatePlayerView`, `onIntent(intent)` props (data-source agnostic), in `packages/client/src/app/GameScreen.tsx` — depends on T060, T061, T062
- [X] T065 Implement `EndScreen` taking `result: MatchResult` + `onRematch` + `onHome` props, per `design/stitch_mesa_de_domin/fim_de_jogo/code.html`, in `packages/client/src/app/EndScreen.tsx` — depends on T058
- [X] T066 Implement `RulesScreen` (static content per `design/stitch_mesa_de_domin/regras/code.html`) in `packages/client/src/app/RulesScreen.tsx`
- [X] T067 Implement simple route/state switcher in `packages/client/src/main.tsx` that renders HomeScreen by default and exposes a `navigate(screen, props)` function — depends on T063, T064, T065, T066
- [X] T068 Initialize Capacitor Android project: `npx cap add android` from `packages/client/`, commit generated `packages/client/android/` skeleton

**Checkpoint**: Foundation complete. `npm test` is green with engine coverage ≥95% and total time <5 s. `npm run dev:server` answers `/health`. `npm run dev:client` shows the home screen rendered from the design tokens.

---

## Phase 3: User Story 1 — Online 2-player match (Priority: P1) 🎯 MVP

**Goal**: Two players on the public internet can create, join, and complete a full 2-player match end-to-end, reaching the result screen.

**Independent Test**: From `quickstart.md` two-player smoke test — two browser tabs (or two physical Android devices) play through one round; both reach a consistent end-of-match screen.

### Server (online flow)

- [X] T069 [P] [US1] Implement room-code generator with 30-symbol alphabet and rejection sampling against `crypto.randomBytes` in `packages/server/src/rooms/code-generator.ts`
- [X] T070 [P] [US1] Implement match registry (`Map<RoomCode, Match>`) with create/get/delete and orphan-GC after 30 min inactivity in `packages/server/src/rooms/registry.ts`
- [X] T071 [P] [US1] Implement per-recipient view projection (filters out other seats' hands + boneyard order; computes `legalMoves` for the recipient using `legalMovesFor`) in `packages/server/src/transport/views.ts`
- [X] T072 [P] [US1] Implement filtered broadcast helper (`broadcastMatchState(match)` emits per-recipient `match:state`) in `packages/server/src/transport/broadcast.ts`
- [X] T073 [US1] Implement `room:create` handler (validates payload via contracts, creates Match in registry, assigns host seat 0, emits `room:state` to creator) in `packages/server/src/transport/handlers.ts` — depends on T070, T071
- [X] T074 [US1] Implement `room:join` handler (validates code, rejects `ROOM_FULL`/`ROOM_IN_PROGRESS`, assigns next free seat, broadcasts `room:state`) in `packages/server/src/transport/handlers.ts` — depends on T073
- [X] T075 [US1] Implement `room:ready` and `room:leave` handlers in `packages/server/src/transport/handlers.ts` — depends on T074
- [X] T076 [US1] Implement `room:start` handler (host-only, requires all seats ready, calls `createInitialState`, emits `match:started` + initial filtered `match:state` to each seat) in `packages/server/src/transport/handlers.ts` — depends on T075
- [X] T077 [US1] Implement `move:lay`, `move:draw`, `move:pass` handlers (validate via contracts, dedup via `moveId`, run reducer, broadcast filtered state; emit `match:ended` when `phase === 'ended'`) in `packages/server/src/transport/handlers.ts` — depends on T076
- [X] T078 [US1] Write Socket.IO integration test that plays a deterministic 2-player match to completion (fixed seed; scripted moves; asserts identical final view on both sockets) in `packages/server/tests/integration/two-player-match.test.ts`
- [X] T079 [US1] Write integration test for illegal-move rejection (client claims a tile it doesn't hold; server emits `error` with `ILLEGAL_MOVE` and `detail.rule`; authoritative state unchanged) in `packages/server/tests/integration/illegal-move.test.ts`

### Client (online flow)

- [X] T080 [P] [US1] Implement Socket.IO client wrapper with auth payload (`PROTOCOL_VERSION` + `sessionToken`) and typed event emitters in `packages/client/src/net/socket.ts`
- [X] T081 [P] [US1] Implement view-store (small typed store fed by `room:state` / `match:state` / `match:ended` / `error` events) in `packages/client/src/net/view-store.ts`
- [X] T082 [US1] Implement `CreateMatchScreen` (mode picker — online; player-count picker — 2; calls `socket.emit('room:create', ...)`; navigates to Lobby on `room:state`) per `design/stitch_mesa_de_domin/criar_partida/code.html` in `packages/client/src/app/CreateMatchScreen.tsx` — depends on T080
- [X] T083 [US1] Implement `JoinMatchScreen` (code entry with format mask excluding O/I/0/1; emit `room:join`) per `design/stitch_mesa_de_domin/entrar_em_partida/code.html` in `packages/client/src/app/JoinMatchScreen.tsx` — depends on T080
- [X] T084 [US1] Implement `LobbyScreen` (renders roster with ready toggles; host sees "Iniciar" button enabled when all ready) in `packages/client/src/app/LobbyScreen.tsx` — depends on T080, T081
- [X] T085 [US1] Wire `HomeScreen` "Criar Partida" and "Entrar em Partida" buttons to navigate to their respective screens in `packages/client/src/app/HomeScreen.tsx` — depends on T063, T082, T083
- [X] T086 [US1] Wire online-mode glue (subscribe `GameScreen` to `view-store`; map `GameScreen.onIntent` to `socket.emit('move:lay'|'move:draw'|'move:pass', { moveId: uuid(), ... })`) in `packages/client/src/net/online-runner.ts` — depends on T064, T080, T081
- [X] T087 [US1] Wire end-of-match navigation (on `match:ended`, transition to `EndScreen`; on `EndScreen.onHome`, return to `HomeScreen` and clear view-store) — depends on T085, T086

**Checkpoint**: Two browser tabs (or two devices) can play a complete online 2-player match end-to-end. The two-player smoke test in `quickstart.md` passes.

---

## Phase 4: User Story 2 — Play offline against bots (Priority: P2)

**Goal**: With airplane mode on, a player can play a complete round against 1 or 3 bots using the same rules engine and the same `GameScreen` / `EndScreen` as online.

**Independent Test**: Disable the network on a device, tap "Jogar Offline", complete a round; the same end-of-match screen appears as in online play; no network errors are shown anywhere.

- [X] T088 [US2] Implement `OfflineSetupScreen` (pick 2 or 4 players; the human is always seat 0; the rest are bots) in `packages/client/src/app/OfflineSetupScreen.tsx` — depends on T058
- [X] T089 [US2] Implement `OfflineRunner` driving the local engine: maintains `GameState`, exposes a `view` (built by the same projector as the server's, just locally), routes the human's intent to the reducer, and on bot turns calls `chooseAutoAction` and applies it after a brief delay (~600 ms for UX) in `packages/client/src/offline/runner.ts` — depends on T036, T064
- [X] T090 [US2] Wire `HomeScreen` "Jogar Offline" button to navigate to `OfflineSetupScreen` and from there into `GameScreen` driven by `OfflineRunner` in `packages/client/src/app/HomeScreen.tsx` — depends on T088, T089
- [X] T091 [US2] Implement offline end-of-match flow: on `phase === 'ended'`, navigate to `EndScreen`; "Jogar Novamente" creates a new `OfflineRunner` with a new seed; "Voltar" returns to home — depends on T089, T065
- [X] T092 [US2] Write offline smoke test that runs `OfflineRunner` headless for a deterministic seed against 1 bot and asserts the final outcome matches the expected fixture in `packages/client/src/offline/runner.test.ts`
- [X] T093 [US2] Manual smoke (recorded in `quickstart.md`): airplane mode → offline match → reach result screen without any network error toast

**Checkpoint**: Offline play works without a network. The engine is exercised entirely client-side via the same code path as the server's reducer.

---

## Phase 5: User Story 3 — Online 4-player match (Priority: P3)

**Goal**: Four online players can create and complete a 4-player match. Turn order rotates correctly; the end screen lists all four pip counts.

**Independent Test**: Four browser tabs (or four devices) play through one 4-player round; turn order goes 0 → 1 → 2 → 3 → 0; the result screen lists all four seats.

- [X] T094 [P] [US3] Extend `CreateMatchScreen` player-count picker to allow 4 in `packages/client/src/app/CreateMatchScreen.tsx`
- [X] T095 [P] [US3] Extend `LobbyScreen` to render 4 seats with the host always at seat 0 in `packages/client/src/app/LobbyScreen.tsx`
- [X] T096 [US3] Update `GameScreen` board layout to position three opponents (top, left, right) in addition to the local hand at the bottom in `packages/client/src/app/GameScreen.tsx` — depends on T064
- [X] T097 [US3] Write server integration test that plays a deterministic 4-player match (fixed seed; scripted moves; asserts identical final view on all four sockets and correct turn rotation 0→1→2→3→0) in `packages/server/tests/integration/four-player-match.test.ts`
- [X] T098 [US3] Write view-projection test that the boneyard count is never replaced by its array contents in any 4-player snapshot, and that hand contents for seat N never appear in messages addressed to other seats, in `packages/server/tests/integration/view-filter-4p.test.ts`

**Checkpoint**: 4-player online matches complete cleanly. View-filter tests prove hidden info doesn't leak with three opponents.

---

## Phase 6: User Story 4 — Host and join a LAN match (Priority: P4)

**Goal**: With public internet disabled, a PC host and 2–4 phones on the same Wi-Fi can complete a match. Joining is via QR scan or manual IP fallback; no IP typing is required for the happy path.

**Independent Test**: Disable the WAN at the router; host a 2-player LAN match on a PC; have one phone scan the QR code; play through to completion.

### Server (LAN host)

- [ ] T099 [P] [US4] Implement private-IP detection in `packages/server/src/lan/network.ts` (filter `os.networkInterfaces()` to IPv4 private ranges 10/8, 172.16/12, 192.168/16; return first non-loopback)
- [ ] T100 [P] [US4] Implement QR payload assembly (`domino://lan?v=...&host=...&port=...&room=...`) in `packages/server/src/lan/qr.ts`
- [ ] T101 [US4] Implement `GET /lan/info` (only when `--mode=lan`; returns `{ mode, protocolVersion, host, port, roomCode, createdAt }` for the current single LAN room) in `packages/server/src/http.ts` — depends on T048, T099
- [ ] T102 [US4] Render the QR to the terminal at startup in LAN mode (use `qrcode-terminal`) in `packages/server/src/index.ts` — depends on T100
- [ ] T103 [US4] Implement LAN-host disconnect handling: when the host's `socket` disconnects, broadcast a typed `error: { code: 'HOST_DISCONNECTED' }` to all participants and close the match in `packages/server/src/transport/handlers.ts`

### Client (LAN join)

- [ ] T104 [P] [US4] Implement QR scanner wrapper around `@capacitor/barcode-scanner` (request camera permission; return parsed string; cancel-safe) in `packages/client/src/lan/qr-scanner.ts`
- [ ] T105 [P] [US4] Implement QR payload parser (validates `domino://lan?...` URL; uses the same Zod schema as the server's `/lan/info` response) in `packages/client/src/lan/payload.ts`
- [ ] T106 [P] [US4] Implement manual IP fallback screen (`packages/client/src/app/LanManualScreen.tsx`) for QR-unavailable cases
- [ ] T107 [US4] Extend `JoinMatchScreen` with a "Escanear QR" option that opens the scanner, parses the payload, and dials the LAN server — depends on T083, T104, T105
- [ ] T108 [US4] Handle `HOST_DISCONNECTED` error on the client: navigate to `HomeScreen` and show a clear toast in pt-BR — depends on T086

### LAN integration

- [ ] T109 [US4] Write LAN integration test (in-process: start server with `--mode=lan`, fetch `/lan/info`, encode/decode the QR payload, connect a client via the parsed URL, run a 2-player match to completion) in `packages/server/tests/integration/lan-match.test.ts`

**Checkpoint**: LAN host workflow works end-to-end. Both QR-scan and manual-IP paths can join. Host disconnect is handled gracefully.

---

## Phase 7: User Story 5 — Resilience: turn timeout + reconnect (Priority: P5)

**Goal**: A player who walks away from their turn does not stall the match; a player who briefly drops their connection resumes seamlessly within 5 minutes; a player who stays offline beyond 5 minutes has the seat auto-played for the rest of the round.

**Independent Test**: Scripted integration test kills a client mid-turn, restores it within the window, and verifies the same hand and seat. A second test lets the 30 s timer fire and verifies the auto-action is the lowest-pip legal play.

### Server (timers + reconnect)

- [X] T110 [P] [US5] Implement turn timer (per-match `setTimeout` armed on every turn change; expiry calls auto-action policy) in `packages/server/src/timers/turn-timer.ts`
- [X] T111 [US5] Implement auto-action policy in the server using `chooseAutoAction` from the engine; wire it to the turn timer's expiry handler in `packages/server/src/transport/handlers.ts` — depends on T034, T110
- [X] T112 [P] [US5] Implement disconnect tracking in `SeatRecord`: on Socket.IO `disconnect`, set `disconnectedAt = Date.now()` and `socketId = null`; broadcast `room:state` so peers see the gray-out, in `packages/server/src/transport/handlers.ts`
- [X] T113 [US5] Implement reconnect rebinding: on `connect` with a `sessionToken` bound to a seat whose `disconnectedAt` is within 5 minutes, rebind `socketId`, clear `disconnectedAt`, and emit a filtered `room:state` snapshot to the returning client; depends on T112
- [X] T114 [US5] Implement out-of-window handling: if `now - disconnectedAt > 5 min`, treat the seat as "abandoned" — keep auto-playing on the seat until the round ends; reject the returning client with `error: { code: 'RECONNECT_WINDOW_EXPIRED' }` — depends on T113
- [X] T115 [US5] Ensure `match:turn` and `match:state` carry the correct `turnDeadlineMs` after auto-actions, reconnects, and disconnects in `packages/server/src/transport/broadcast.ts`
- [X] T116 [US5] Write integration test for turn timeout: scripted match, ignore turn on seat 1; assert auto-action fires within 35 s with the lowest-pip legal play in `packages/server/tests/integration/turn-timeout.test.ts`
- [X] T117 [US5] Write integration test for reconnect-within-window: disconnect a socket mid-round; reconnect with same `sessionToken` 30 s later; assert hand identical, seat identical, view consistent in `packages/server/tests/integration/reconnect-within.test.ts`
- [X] T118 [US5] Write integration test for reconnect-beyond-window: disconnect; fast-forward server clock 6 min; reconnect; assert `RECONNECT_WINDOW_EXPIRED`; assert match continued auto-playing the seat in `packages/server/tests/integration/reconnect-expired.test.ts`

### Client (UI + reconnect)

- [X] T119 [P] [US5] Implement turn-clock countdown UI in `TurnIndicator` using `turnDeadlineMs` (1 Hz tick; warns when <5 s) in `packages/client/src/components/TurnIndicator.tsx`
- [X] T120 [P] [US5] Implement automatic reconnect attempt on `disconnect` event: re-`connect()` with the same `sessionToken`; on success the server's `room:state` re-syncs the view-store, in `packages/client/src/net/socket.ts`
- [X] T121 [US5] Implement disconnected-peer indicator in `LobbyScreen` and `GameScreen` (avatar grayed out when `PlayerSummary.connected === false`) — depends on T084, T064
- [X] T122 [US5] Handle `RECONNECT_WINDOW_EXPIRED` on the client by navigating to `HomeScreen` with a "Você ficou ausente por muito tempo" toast in pt-BR — depends on T086

**Checkpoint**: Resilience tests pass. Turn timer fires deterministically; reconnect within window restores state; out-of-window is handled cleanly.

---

## Phase 8: Polish & Cross-Cutting

**Purpose**: CI, observability, docs, and final integration validation.

- [ ] T123 [P] Add GitHub Actions (or equivalent) CI workflow in `.github/workflows/ci.yml`: `npm ci`, `npm run -ws build`, `npm test` (fails build if engine coverage <95% or suite >5 s)
- [ ] T124 [P] Add coverage badge config to engine package and document the gate in `packages/engine/README.md`
- [ ] T125 [P] Emit structured `pino` log fields per move (`matchId`, `roomCode`, `seat`, `action`, `tileId?`, `engineMs`, `broadcastMs`) so latency budgets from `plan.md` are measurable in `packages/server/src/transport/handlers.ts`
- [ ] T126 [P] Add root `README.md` covering purpose, prerequisites, quickstart pointer, and link to `specs/001-domino-multiplayer-mvp/`
- [ ] T127 [P] Fix the stale design path in `design/stitch_mesa_de_domin/DESIGN-CONTEXT.md.txt` (replace references to `design/stitch/` with `design/stitch_mesa_de_domin/`)
- [ ] T128 Document Android release-signing setup in `packages/client/android/RELEASE-SIGNING.md` (no key committed; references developer's keystore env vars)
- [ ] T129 Run the full quickstart end-to-end on a fresh clone (`git clean -fdx`, then follow `quickstart.md` step by step) and patch any drift between docs and reality
- [ ] T130 Final 4-player LAN match smoke with one mid-match reconnect: confirm the three resilience cases (in-window, out-of-window, timer-fired) all behave per spec on real devices

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)** — no dependencies. Start immediately.
- **Phase 2 (Foundational)** — depends on Phase 1. BLOCKS Phases 3–7.
- **Phase 3 (US1)** — depends on Phase 2. Headline MVP.
- **Phase 4 (US2)** — depends on Phase 2 (uses `GameScreen` and `EndScreen` from Foundational, plus the engine + bot policy). Independent of Phase 3 once Foundational is done.
- **Phase 5 (US3)** — depends on Phase 3 (extends `CreateMatchScreen`, `LobbyScreen`, and `GameScreen` from US1).
- **Phase 6 (US4)** — depends on Phase 3 (LAN reuses the same Socket.IO handlers and screens; only the transport surface changes).
- **Phase 7 (US5)** — depends on Phase 3 (timer and reconnect attach to the running match flow built in US1; the auto-action policy itself was built in Foundational).
- **Phase 8 (Polish)** — depends on all prior phases.

### User story dependencies (summary)

- **US1 (P1)**: depends on Foundational only.
- **US2 (P2)**: depends on Foundational only (`GameScreen`/`EndScreen` are in Foundational, engine and bots are in Foundational). **Independent of US1**.
- **US3 (P3)**: depends on US1 (extends US1 screens to 4 seats).
- **US4 (P4)**: depends on US1 (same Socket.IO contract; LAN is a transport scope, not a new flow).
- **US5 (P5)**: depends on US1 (resilience attaches to the running match).

### Within each user story

- Test tasks marked in the foundational engine block MUST be authored before their paired implementation tasks.
- Server tasks build registry → handlers → integration tests.
- Client tasks build screens → wiring → smoke.

### Parallel opportunities

Within **Phase 2 (Foundational)**:

- All engine *test* tasks (T010, T012, T014, T016, T018, T020, T024, T026, T028, T029, T031, T033) can be authored in parallel by different developers — they touch separate test files.
- Engine implementation tasks paired with already-written tests (T011, T013, T015, T017, T019, T021, T032, T034) can run in parallel with each other once their respective tests exist.
- All contracts tasks (T038–T044) are independent file-by-file.
- Server bootstrap files (T046, T047, T048, T050) are independent.
- Client bootstrap components (T058–T062) are independent files.

Within **Phase 3 (US1)**:

- Server pieces (T069, T070, T071, T072) are independent files and can be parallelized.
- Client pieces (T080, T081) are independent of server pieces if a developer pair is split server/client.

Within **Phase 6 (US4)**:

- T099, T100, T104, T105, T106 are independent files and parallelizable.

Within **Phase 7 (US5)**:

- T110, T112, T119, T120 are independent files and parallelizable.

### Parallel execution example: Foundational engine (Phase 2)

```bash
# After T001..T009 (Setup) are done, three developers can split engine TDD:
Task: T010 Write tile tests in packages/engine/tests/tile.test.ts
Task: T012 Write RNG tests in packages/engine/tests/rng.test.ts
Task: T014 Write GameAction tests in packages/engine/tests/actions.test.ts

# After each test task lands and its impl pairs (T011, T013, T015) follow:
Task: T011 Implement tiles in packages/engine/src/tile.ts
Task: T013 Implement RNG in packages/engine/src/rng.ts
Task: T015 Implement GameAction in packages/engine/src/actions.ts
```

---

## Implementation Strategy

### MVP-first (recommended)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational) — engine first (test-first, this is the most cautious part), then contracts, then bootstrap.
3. Complete Phase 3 (US1) — online 2-player match.
4. **STOP and VALIDATE**: Run the two-player smoke from `quickstart.md`. Demo to stakeholders. This is the shippable MVP.
5. Choose the next user story based on user feedback: US2 (offline) adds resilience without network risk; US3 (4-player) widens the audience; US4 (LAN) opens the offline-with-friends use case; US5 (resilience) hardens what already works.

### Incremental delivery

After the MVP (US1), each subsequent story is a deployable increment:

- US2 ships a new home-screen entry point and the offline flow. Zero server change.
- US3 ships a player-count widening. Mostly client-side; one server integration test.
- US4 ships LAN-mode startup and the QR join. The same Socket.IO contract.
- US5 ships timer + reconnect. Adds robustness; doesn't change user-visible flows.

### Parallel team strategy

With two developers after Foundational:

- Dev A: US1 server side (T069–T079).
- Dev B: US1 client side (T080–T087).
- Both meet at the two-player smoke.

With three developers, Dev C can take US2 (T088–T093) in parallel — it has no server dependency.

---

## Notes

- `[P]` tasks touch independent files. Sequential tasks within a TDD pair always go test → impl; the impl task may itself be `[P]` if its impl file is independent of other impl files in flight.
- `[USx]` labels map tasks to the user stories from `spec.md` for traceability. Phases 1, 2, and 8 carry no `[USx]` label.
- Tests in the engine package are mandatory and gate the build via coverage thresholds (≥95% lines).
- Tests in the server package are integration-level and exercise the Socket.IO contract end-to-end.
- The client has no automated UI tests in v1 by design — manual smoke from `quickstart.md` covers it.
- Stop at any checkpoint to validate the increment independently. Each phase's checkpoint is a real, demonstrable artifact.
