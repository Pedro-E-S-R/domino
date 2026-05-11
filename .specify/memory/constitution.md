<!--
Sync Impact Report
==================
Version change: (uninitialized template) → 1.0.0
Bump rationale: Initial ratification of the project constitution.

Modified principles: N/A (initial adoption — all five principles are new)
Added sections:
  - Core Principles (I–V)
  - Technology & Quality Standards
  - Development Workflow & Quality Gates
  - Governance
Removed sections: None

Templates requiring updates:
  - .specify/templates/plan-template.md     ✅ no edit required
      ("Constitution Check" gate is filled at /speckit-plan time against this file)
  - .specify/templates/spec-template.md     ✅ no edit required
      (no constitution-driven mandatory sections affected)
  - .specify/templates/tasks-template.md    ✅ no edit required
      (task categorization already accommodates engine tests, contract tests, observability)
  - .claude/skills/speckit-*/                ✅ no edit required
      (skills reference templates generically; no hardcoded principle names)
  - CLAUDE.md                                ✅ no edit required
      (no principle references present)

Follow-up TODOs: None
-->

# Domino Online Constitution

## Core Principles

### I. Server-Authoritative Game Engine

The `domino-engine` is the **single source of truth** for game rules, move legality,
turn order, blocked-game detection, and scoring. Clients MUST treat the engine's
verdict as final.

- Rule logic MUST NOT be duplicated in the frontend. Clients may compute *display
  hints* (e.g., highlighting playable tiles), but those hints are advisory and
  the server's validation result governs.
- Every move flows: client proposes → server validates via the engine → server
  broadcasts authoritative state → clients render.
- Hidden information (opponents' hands, boneyard order) MUST never be sent to a
  client that should not see it. The server filters state per recipient.

**Rationale**: A single rule implementation eliminates client/server drift,
prevents cheating via modified clients, and makes rule changes a one-place edit
covered by engine tests.

### II. Frontend/Backend Contract Discipline

All cross-tier communication MUST go through **documented, versioned contracts**
(REST endpoints and WebSocket message schemas). The contract is the boundary;
neither side may reach past it.

- Every WebSocket message type and REST endpoint MUST have a schema definition
  checked into the repository before it is used in client or server code.
- Breaking changes to a contract require a version bump on the affected
  channel/endpoint and a written migration note in the feature plan.
- The frontend MUST NOT depend on database shapes, internal service names, or
  any field not declared in a contract.

**Rationale**: A clean contract lets frontend and backend evolve in parallel,
makes breakage detectable in CI, and keeps server internals refactorable
without coordinated client releases.

### III. Realtime Sync with Defined Latency Budgets

Multiplayer gameplay runs over a persistent realtime channel (WebSocket or
equivalent). The system MUST define and measure per-feature latency budgets.

- Default budgets unless overridden in a feature plan:
  - Move acknowledgment (client submits → server confirms): **p95 < 250 ms**
    intra-region; **p95 < 500 ms** cross-region.
  - State broadcast fan-out (server confirms → all peers rendered): **p95 < 400 ms**.
- Clients MUST handle disconnect/reconnect by requesting an authoritative
  resync; reconnection MUST NOT cause duplicated moves or score changes.
- Optimistic UI is permitted only for the local player's own move and MUST
  reconcile against the server's authoritative response.

**Rationale**: A turn-based realtime game feels broken at >500 ms; explicit
budgets make perceived snappiness a measurable engineering target rather than
a vague goal, and reconnection semantics protect game integrity over flaky
networks.

### IV. Test-First for Game Logic (NON-NEGOTIABLE)

The domino engine MUST be developed test-first. Every rule, edge case, and
scoring variant lives behind a failing unit test before its implementation.

- Red-Green-Refactor cycle is enforced for any change to engine code: write
  the failing test, get it reviewed/approved as a description of the rule,
  then implement.
- Required coverage areas (non-exhaustive): legal-move enumeration, turn
  advancement, locked/blocked-game detection, pip counting, doubles handling,
  round-end and match-end scoring, and the chosen variant's specific rules.
- A PR that modifies engine behavior without adding or updating engine tests
  MUST be rejected at review.

**Rationale**: Rule bugs in a competitive multiplayer game destroy player
trust and are hard to retro-diagnose from logs alone. TDD on the engine is
the cheapest insurance, and the engine is small and pure enough that the
discipline imposes no meaningful cost.

### V. Simplicity & Single Source of Truth

Prefer the simplest design that satisfies the current user story. One
canonical representation of state per concern; no parallel models.

- Game state has exactly one canonical form, owned by the server. Client-side
  caches are derived views, never sources of truth.
- New abstractions (repository layers, message buses, plugin systems, etc.)
  MUST be justified in the plan's Complexity Tracking section before being
  introduced. "We might need it later" is not a justification.
- Three similar lines are better than a premature abstraction. Backwards-
  compatibility shims, feature flags, and indirection layers are introduced
  only when a concrete current need demands them.

**Rationale**: Speculative complexity is the most expensive kind of code in a
small team. Keeping state singular and abstractions earned makes the system
debuggable, refactorable, and faster to evolve.

## Technology & Quality Standards

- **Backend (`backend-engineer`)**: Owns the engine, session state, persistence,
  authentication, and the realtime channel server. Stateless components are
  preferred where possible; stateful game sessions are explicitly demarcated.
- **Frontend (`frontend-engineer`)**: Owns presentation and input. Renders
  authoritative state received over the contract. No rule logic, no direct
  database or internal-service access.
- **Engine (`domino-engine`)**: Pure, deterministic given inputs. No I/O, no
  framework dependencies. Must be unit-testable in isolation.
- **Realtime (`realtime-multiplayer`)**: Owns transport-level concerns
  (connection lifecycle, message routing, room/match membership, broadcast
  filtering). Does not interpret rules.
- **Observability**: Every accepted and rejected move MUST be logged with at
  least: match id, round id, actor player id, move payload, engine verdict,
  server-side timestamp. Metrics MUST cover: active matches, move-ack p95,
  broadcast p95, reconnect rate, rejected-move rate.
- **Security & fairness**: Authenticated sessions only. The server MUST NOT
  send a player any state that reveals hidden information they should not
  have. Anti-replay: every move MUST carry an identifier sufficient for the
  server to detect duplicates after reconnection.

## Development Workflow & Quality Gates

- Feature work flows through the speckit phases: `/speckit-specify` →
  `/speckit-clarify` (when needed) → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-implement`.
- Every `plan.md` MUST include a **Constitution Check** section enumerating how
  the design honors each of Principles I–V, or, where it deviates, MUST record
  the deviation under Complexity Tracking with a concrete justification.
- PRs that modify engine rules MUST include updated or new engine unit tests
  in the same change.
- PRs that change a contract (WebSocket message, REST endpoint, schema) MUST
  update the schema definition in the same change and include a migration
  note in the feature plan.
- Code review MUST verify, at minimum: (a) no client-side rule decisions, (b)
  no duplicated engine logic outside the engine module, (c) contracts not
  bypassed, (d) hidden information not leaked in broadcasts.

## Governance

This constitution supersedes ad-hoc practices and prior conventions. When a
recommendation in this document conflicts with another guide, this document
wins until amended.

**Amendment procedure**: Amendments are proposed via a pull request that
updates `.specify/memory/constitution.md`, bumps the version per the policy
below, updates the Sync Impact Report at the top of the file, and re-runs
consistency checks against `.specify/templates/*.md`. Merge requires review.

**Versioning policy** (semantic):
- **MAJOR**: A principle is removed, renamed in a non-backwards-compatible
  way, or redefined such that previously compliant code becomes non-compliant.
- **MINOR**: A new principle or section is added, or existing guidance is
  materially expanded.
- **PATCH**: Clarifications, wording fixes, typo corrections, or other
  non-semantic refinements.

**Compliance review**: Reviewers are responsible for enforcing the
Constitution Check gate in `plan.md` and the workflow gates above. Repeated
deviations without justification are treated as a signal to amend the
constitution rather than as acceptable practice.

**Version**: 1.0.0 | **Ratified**: 2026-05-11 | **Last Amended**: 2026-05-11
