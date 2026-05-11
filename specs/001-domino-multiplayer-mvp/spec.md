# Feature Specification: Dominó Online — Multiplayer MVP

**Feature Branch**: `001-domino-multiplayer-mvp`
**Created**: 2026-05-11
**Status**: Draft
**Input**: User description: "Construir um aplicativo móvel multiplayer de
dominó duplo-seis brasileiro ('Dominó Online'), entregue como app Android,
com servidor autoritativo e suporte a modos Online e LAN, 2 ou 4 jogadores."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Play a complete 2-player online match (Priority: P1)

Two friends in different locations open the app, create a 2-player online
match, share the room code, sit through one full round of double-six Brazilian
dominoes, and reach a clear end-of-match screen showing who won and by how
many points (pips left in the loser's hand at win, or pip totals on a block).

**Why this priority**: This is the headline experience and the smallest slice
that exercises the entire system end-to-end — match creation, room joining,
seating, dealing, opening-tile rule, turn flow, draw/pass logic, win and block
detection, and the result screen. If this works, the product is shippable as
a useful, if narrow, MVP.

**Independent Test**: Two physical Android devices on the public internet can
complete a match without external intervention. A round must end via one of
the canonical outcomes (domino, blocked-win, tied block) and both screens
must show consistent final state.

**Acceptance Scenarios**:

1. **Given** two players on the home screen, **When** Player A taps "Criar
   Partida", chooses Online + 2 jogadores, and Player B enters the room code
   from Player A's lobby, **Then** both players see the lobby with each
   other's avatars and a "pronto" indicator.
2. **Given** the lobby with both players ready, **When** the host starts the
   match, **Then** both players see 7 tiles in their own hand and an empty
   board, and exactly one of them is indicated as the player to move first.
3. **Given** a player whose turn it is and who holds a tile that matches an
   open end of the chain, **When** they play that tile to a valid end,
   **Then** both clients show the updated chain and the turn passes to the
   other player.
4. **Given** a player on their turn with no playable tile and a non-empty
   boneyard, **When** they tap "Comprar", **Then** they receive one tile from
   the boneyard; if it is playable they may play it; if not, the turn passes.
5. **Given** a player who lays their last tile, **When** the move is
   accepted, **Then** both players see the end-of-match screen with the
   winner declared and the loser's remaining pip count displayed.
6. **Given** both players pass consecutively with the boneyard empty,
   **When** the round becomes blocked, **Then** the end-of-match screen
   shows each player's remaining pip count and declares the lower count as
   the winner (or a tie if equal).

---

### User Story 2 — Play offline against bots (Priority: P2)

A player on a plane, in the bathroom, or otherwise without network connectivity
taps "Jogar Offline" on the home screen and plays a single-device match against
1 or 3 bot opponents using the same rules as the multiplayer experience.

**Why this priority**: Offline play exercises the rules engine in isolation —
no realtime, no rooms, no reconnects. It is the most reliable smoke test that
the engine itself is correct, and it gives players value even without
connectivity. Independently shippable.

**Independent Test**: With airplane mode on, a player can start an offline
match, finish a complete round against bots, and see a clean end-of-match
screen — all without the app showing any network errors.

**Acceptance Scenarios**:

1. **Given** the home screen with no network connectivity, **When** the
   player taps "Jogar Offline" and chooses 2 or 4 players, **Then** the
   match begins immediately with bot opponents filling the empty seats.
2. **Given** an in-progress offline match, **When** it is a bot's turn,
   **Then** the bot acts within 5 seconds with a legal play, draw, or pass.
3. **Given** an offline match that reaches a win or block, **When** the
   final move is played, **Then** the player sees the same end-of-match
   screen format as in online play.

---

### User Story 3 — Play with 4 players online (Priority: P3)

Four players online want to play together. The host creates a 4-player online
match; the other three join via room code. The match proceeds with the same
rules and turn order as the 2-player case, just with four seats.

**Why this priority**: Extends US1 from 2 to 4 seats. It does not introduce
new rule logic but does stress turn-order plumbing, broadcast fan-out, and
the lobby's seat-filling UI. Shippable independently after US1.

**Independent Test**: Four physical Android devices can complete a 4-player
online match end-to-end. Turn order rotates correctly through all four
players; the end-of-match screen lists all four with their final pip counts.

**Acceptance Scenarios**:

1. **Given** a host with a 4-player room code, **When** three other players
   join in sequence, **Then** each new joiner appears in the lobby with a
   distinct avatar and seat assignment.
2. **Given** an in-progress 4-player match, **When** a player plays a tile,
   **Then** the turn advances to the next seat in clockwise order, skipping
   no seat.
3. **Given** a 4-player blocked-state ending, **When** the round ends,
   **Then** the result screen shows all four players' pip counts and
   identifies the winner (or ties) by minimum pip count.

---

### User Story 4 — Host and join a LAN match (Priority: P4)

A group of friends in the same room wants to play without depending on cloud
infrastructure. One person opens the app on a PC (host), creates a LAN match,
and the others scan a QR code or pick the room from a list of nearby matches
on their phones to join.

**Why this priority**: LAN mode addresses the "we're in the same room with
flaky internet" case explicitly called out in the brief. It is independent
of online infrastructure and validates that the same rules engine and
contract work over a different transport scope. Shippable after at least
one networked-play story (US1) is done.

**Independent Test**: With public internet disabled at the router, a PC
host and 2–4 phones on the same Wi-Fi can complete a match. Joiners can use
either the QR code or local discovery; no manual IP entry is required.

**Acceptance Scenarios**:

1. **Given** the host PC on a home Wi-Fi network, **When** the host creates
   a LAN match, **Then** the lobby displays a 6-character room code and a
   scannable QR code, and the match is discoverable to phones on the same
   network.
2. **Given** a phone on the same Wi-Fi as the host, **When** the user opens
   "Entrar em Partida" and scans the QR code, **Then** the phone connects
   to the host and enters the match lobby within 10 seconds.
3. **Given** an in-progress LAN match, **When** the public internet at the
   router is disabled, **Then** the match continues to function normally
   between the local devices.

---

### User Story 5 — Resilience: turn timeout and reconnect (Priority: P5)

A player loses connection mid-match (subway tunnel, app backgrounded too long,
phone restart) and returns within 5 minutes. They expect to resume with their
hand intact. Separately, a player who walks away from their phone during a
turn should not stall the match forever.

**Why this priority**: This is a quality-of-experience layer on top of the
core gameplay. Matches are playable without it but feel fragile. Independently
shippable once core multiplayer (US1) exists.

**Independent Test**: A scripted test can kill the network on one device
mid-match, restore it within 5 minutes, and verify the player resumes with
the same hand and the same standing in the round. A separate test verifies
that a non-acting player has an automatic action applied within 35 seconds.

**Acceptance Scenarios**:

1. **Given** a player in an active match, **When** their device loses
   network connectivity and regains it within 5 minutes, **Then** they
   reconnect to the same match with the same hand they had at disconnect.
2. **Given** it is a player's turn, **When** 30 seconds pass without input,
   **Then** the system applies an automatic legal action on their behalf
   (play the lowest-pip legal tile if any; otherwise draw; otherwise pass)
   and the turn advances.
3. **Given** a player remains disconnected past the 5-minute reconnect
   window, **When** the window expires, **Then** the system continues the
   match using automatic actions on that seat for the remainder of the
   round.

---

### Edge Cases

- **No double in the initial deal**: The opener is the player holding the
  tile with the highest pip sum; ties are broken by the highest single side.
- **Boneyard exhausted mid-round**: Players who cannot play pass instead of
  draw; if every remaining player passes consecutively, the round ends
  blocked.
- **Tied blocked-state ending**: Multiple players hold the same lowest pip
  sum. All tied players are declared joint winners on the result screen.
- **Player disconnects mid-turn**: The 30-second turn clock continues; if
  it expires while they are still disconnected, the automatic action fires
  and the turn advances. The seat is held for up to 5 minutes for reconnect.
- **Host disconnects in LAN mode**: Because the host PC is also the server,
  the match cannot continue. All clients are returned to the home screen
  with a clear message; no score is recorded.
- **Invalid room code on join**: The user sees an inline error and remains
  on the join screen; the input is not cleared.
- **Cross-network LAN attempt**: A phone not on the host's Wi-Fi cannot
  discover or join the LAN room and is shown an appropriate error.
- **Client claims an illegal move**: The server rejects the move and
  rebroadcasts the authoritative state; the client re-renders accordingly.
- **Screen rotation mid-game**: Not supported in v1 (portrait-only); the
  app stays locked to portrait regardless of device orientation.

## Requirements *(mandatory)*

### Functional Requirements

**Match setup and discovery**

- **FR-001**: Users MUST be able to create a new match selecting mode
  (Online or LAN) and player count (2 or 4).
- **FR-002**: Users MUST be able to join an existing match by entering a
  6-character alphanumeric room code.
- **FR-003**: Room codes MUST exclude visually ambiguous characters: the
  letters O and I, and the digits 0 and 1.
- **FR-004**: In LAN mode, the host MUST display the room code as a
  scannable QR code containing all information needed to join.
- **FR-005**: In LAN mode, phones on the same local network MUST be able
  to discover the host without the user manually entering an IP address.
- **FR-006**: The match lobby MUST display every connected player with a
  distinct avatar and a "pronto" indicator; the host MUST be able to start
  the match once all required seats are filled and ready.
- **FR-007**: Users MUST be able to start an offline single-device match
  against bots from the home screen with no network connection required.

**Canonical rules — double-six Brazilian**

- **FR-010**: A round MUST use the 28 tiles of a standard double-six set,
  ranging 0-0 through 6-6, each appearing exactly once.
- **FR-011**: Each player MUST receive exactly 7 tiles at the start of a
  round; the remaining tiles form the boneyard.
- **FR-012**: The first move of a round MUST be made by the player holding
  the highest available double (6-6 ranking first). If no player holds a
  double, the first move goes to the player with the highest pip-sum tile,
  with ties broken by the highest single side.
- **FR-013**: A laid tile MUST match the value at one of the two open ends
  of the chain; doubles are displayed transversally but expose the same
  value on both sides.
- **FR-014**: A player whose turn it is and who has no legal move MUST
  draw one tile from the boneyard if it is non-empty; if the boneyard is
  empty, they MUST pass.
- **FR-015**: A player wins the round ("bate") by being the first to
  empty their hand.
- **FR-016**: A round ends blocked ("tranca") when every remaining player
  passes consecutively with the boneyard empty; the winner is the player
  with the lowest pip sum in hand.
- **FR-017**: A tie in blocked-state resolution MUST be reported as a
  joint win (no single winner declared).

**Turn flow and resilience**

- **FR-020**: The active player's identity MUST be visible to every
  participant at all times.
- **FR-021**: A player who does not act within 30 seconds of their turn
  starting MUST have an automatic action applied: play a legal tile if any
  is available, otherwise draw, otherwise pass.
- **FR-022**: A disconnected player who reconnects within 5 minutes MUST
  resume the match with the exact hand they held at the moment of
  disconnect and with their original seat.
- **FR-023**: A player who fails to reconnect within the 5-minute window
  MUST continue to have automatic actions applied on their seat for the
  remainder of the current round; the match does not abort.

**State visibility and integrity**

- **FR-030**: A player's hand MUST never be transmitted to or visible by
  any other participant.
- **FR-031**: The contents and order of the boneyard MUST never be visible
  to any participant.
- **FR-032**: The system MUST be the sole authority on move legality; any
  client-submitted move that the system rejects MUST cause the client to
  re-render the authoritative state.

**End of match**

- **FR-040**: After a round ends, every participant MUST see a result
  screen showing each player's final pip count and the round outcome
  (winner by domino, winner by lowest pips on block, or a tied block).
- **FR-041**: From the result screen, the host MUST be able to start a
  rematch with the same participants, and any participant MUST be able to
  return to the home screen.

**Platform and presentation**

- **FR-050**: The product MUST be installable as an Android application
  on devices running Android 9 or later.
- **FR-051**: The UI MUST render correctly in portrait orientation on
  smartphone screens between 5.5" and 6.7" diagonal.
- **FR-052**: All visual elements (color, typography, spacing, hierarchy)
  MUST conform to the canonical design assets in the project's design
  directory; deviations require explicit justification.

### Key Entities

- **Match**: A session bound to a single room. Carries the mode (Online or
  LAN), player count (2 or 4), current state (lobby, playing, ended), and
  the active round.
- **Round**: The active gameplay state — the chain of laid tiles with its
  two open ends, the boneyard, the turn order, the current player, and a
  pass-count tracker for block detection.
- **Player**: A participant — opaque device-session identifier, display
  avatar, seat number, private hand, connection status (connected /
  disconnected / reconnect-window-expired), and ready state.
- **Tile**: A single domino piece with two pip values (each 0–6). The set
  contains 28 unique tiles per round.
- **Move**: A player action — lay (specifying which open end), draw, or
  pass — recorded with the actor, timestamp, and resulting state delta.
- **Room**: A discoverable session — 6-character code (ambiguous chars
  excluded), host identity, mode, and lifecycle (open, in-progress, closed).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% or more of started 2-player online matches end via a
  canonical outcome (win, blocked-win, tied block) without any participant
  reporting a desync.
- **SC-002**: 95% or more of started 4-player online matches end via a
  canonical outcome without any participant reporting a desync.
- **SC-003**: 100% of disconnections followed by reconnect within 5
  minutes resume the affected player with their original hand and seat.
- **SC-004**: In LAN mode on a typical home Wi-Fi network, the time from
  the host tapping "Criar Partida" to all required clients reaching the
  lobby is under 60 seconds.
- **SC-005**: A first-time user can go from app launch to placing their
  first tile in an offline match in under 60 seconds.
- **SC-006**: 100% of turns where a player is inactive have an automatic
  action applied within 35 seconds of the turn starting.
- **SC-007**: In qualitative play-testing on home broadband and 4G+
  connections, at least 80% of testers rate the realtime responsiveness
  as "fluid" or better.
- **SC-008**: The Android build installs and completes one offline match
  without crashes on a representative sample of devices spanning Android
  9 through the current major version.

## Assumptions

- Sessions are per-device and identified by an opaque token. There are no
  usernames, passwords, OAuth flows, or persistent accounts in this
  version.
- A "match" in this version consists of a single round. The result screen
  reflects that round's outcome; "Jogar Novamente" creates a fresh round.
  Cross-round scoring (first-to-N points) is out of scope.
- LAN players are on the same Wi-Fi subnet and can route to each other.
  The host PC has its server port reachable through any local firewall.
- Online players have sufficient connectivity for realtime synchronization
  (home broadband, mobile 4G, or better).
- Avatars are auto-assigned at lobby entry from a small predefined visual
  set. Avatar upload and customization are out of scope.
- Automatic actions for inactive or disconnected players use a simple
  deterministic policy (lowest-pip legal play; otherwise draw; otherwise
  pass) rather than a strong AI strategy.
- The home screen offers exactly three primary entry points: "Criar
  Partida", "Entrar em Partida", and "Jogar Offline". A "Regras" reference
  screen is available as a secondary entry point.
- The Android build targets devices in the 5.5"–6.7" portrait smartphone
  range. Tablets, foldables, and landscape orientation are not in scope
  for the first version.

### Explicitly Out of Scope (v1)

- Login with password, OAuth, or any persistent account system
- Cross-match ranking, player profiles, achievements, match history
- Voice chat; text chat is optional and minimal if included at all
- Regional variants: Cuban, Mexican, partnerships with accumulated scoring
- iOS support (the target is Android via the chosen mobile wrapper)
- Advertisements, monetization, in-app purchases
