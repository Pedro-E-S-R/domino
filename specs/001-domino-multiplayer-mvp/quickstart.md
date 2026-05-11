# Quickstart — Dominó Online v1

Developer-facing quickstart. Walks from a fresh clone to a running
server and a usable Android build.

## Prerequisites

- **Node.js 20+ LTS**. `node --version` should print `v20.x` or later.
- **npm 10+** (ships with Node 20). `pnpm` and `yarn` are not used.
- For Android builds only: **Android Studio Hedgehog (2023.1)** or later
  with Android SDK Platform 34 and Build-Tools 34.x, plus an installed
  JDK 17. `JAVA_HOME` and `ANDROID_HOME` must be exported.
- Git, of course.

You can run server + client + tests with only the first two bullets.
The Android prerequisites are needed only for `npm run build:android`.

## First-time install

```sh
git clone <repo-url> domino
cd domino
npm install              # installs all workspaces
npm run -ws build        # compile engine + contracts so server can resolve them
npm test                 # runs every workspace's vitest suite
```

The expected first-run baseline:
- Engine tests pass with ≥95% line coverage and finish under 5 s.
- Contracts tests pass.
- Server tests pass.
- Client has no tests configured for v1; the command exits 0 immediately.

## Run the cloud-style Online server

```sh
npm run dev:server
```

This starts the server on `0.0.0.0:4123` with `--mode=online`. The
process logs via `pino` (pretty-printed in dev). It hot-reloads via
`tsx watch`.

To smoke-test, in another terminal:

```sh
curl http://localhost:4123/health
# -> {"ok":true,"protocolVersion":"1.0.0","now":<ms>,"mode":"online"}
```

## Run the LAN-style host

```sh
npm run dev:lan
```

Same as `dev:server` but with `--mode=lan` and a QR code printed to the
terminal at startup. The QR encodes the URL described in
`contracts/rest-endpoints.md`. Use any phone QR scanner to confirm the
contents.

## Run the client in dev

```sh
npm run dev:client
```

Vite opens `http://localhost:5173`. The dev environment defaults to
`VITE_SERVER_URL=http://localhost:4123`; override via `.env.local`.

To play offline-vs-bots you don't need the server running — pick
"Jogar Offline" from the home screen.

## Build the Android APK (debug)

```sh
npm run build:client          # vite build into packages/client/dist
npx cap sync android          # copy dist into packages/client/android
npm run build:android         # gradle assembleDebug
```

The APK lands at
`packages/client/android/app/build/outputs/apk/debug/app-debug.apk`.
Install via `adb install` or USB.

For a release build (signed), refer to Android Studio's "Generate
Signed Bundle / APK" wizard; v1 does not script release signing.

## Two-player smoke test (manual)

1. Run `npm run dev:server` in one terminal.
2. Run `npm run dev:client` in another. Open two browser tabs at
   `http://localhost:5173`.
3. Tab 1: "Criar Partida" → Online → 2 jogadores. Note the room code.
4. Tab 2: "Entrar em Partida" → enter the room code.
5. Both tabs ready up; host starts. Play through to completion. Both
   tabs must show the same end-of-match outcome.

If you don't see consistent state on both tabs, the server logs (pino)
will identify which event the divergence occurred on.

## Engine TDD loop

```sh
npm run -w packages/engine test:watch
```

Watches `packages/engine/src` and `packages/engine/tests`. Add a failing
test first; the suite should run in well under a second per file in
watch mode.

## Resetting state

The server is in-memory; restarting it (`Ctrl-C` then `npm run dev:server`)
clears all matches and sessions. The client also keeps no persistent
state beyond its session token — to clear that, uninstall the APK or,
in dev, run `localStorage.clear()` from devtools.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `PROTOCOL_MISMATCH` on connect | Client and server were built from different commits | Stop both, `git pull`, `npm install`, restart. |
| QR scan in LAN mode does nothing | Host and phone are on different Wi-Fi (e.g., guest network) | Reconnect the phone to the same SSID the host is on. |
| Engine test suite >5 s | A property-based test exploded its run count | Edit `fast-check` `numRuns` lower in the offending file. |
| `gradle assembleDebug` fails with "license not accepted" | Android SDK licenses unaccepted | Run `sdkmanager --licenses` and accept. |
