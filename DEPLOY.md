# Deploy

## Server on Render (Blueprint, free tier)

The repo ships a `render.yaml` at the root. Render reads it and provisions
the web service end-to-end. The build avoids `-w` / `--workspace=<name>`
flags entirely (uses `--prefix <path>` instead) so it works regardless of
how Render auto-detects the project shape.

### One-time setup

1. Push the branch you want to deploy to GitHub (this repo is hosted at
   `https://github.com/Pedro-E-S-R/domino`). The Blueprint reads from the
   `main` branch by default.

2. Open <https://dashboard.render.com/blueprints> → **New Blueprint Instance**.

3. Connect the GitHub account and pick the `Pedro-E-S-R/domino` repository.
   If the repo doesn't appear, click *Configure GitHub App* and grant Render
   access to it.

4. Render reads `render.yaml` and shows: **1 service — `domino-server`
   (Node web service, Free plan)**. Click **Apply** / **Create**.

5. The first build takes 3–5 minutes (npm install + three TypeScript builds).
   Watch the live logs in the dashboard. When status flips to **Live**, copy
   the public URL — something like `https://domino-server-xxxx.onrender.com`.

6. Smoke-test:
   ```sh
   curl https://<your-host>/healthz
   ```
   Expected: `{"ok":true,"protocolVersion":"1.0.0","now":...,"mode":"online",
   "roomsEndpoint":false}`.

### Connecting the client to the deployed server

On any client (web or APK), tap the URL footer on the home screen, enter
the Render hostname **without** scheme or port (HTTPS uses 443
automatically):

```
domino-server-xxxx.onrender.com
```

Tap *Salvar e usar*. Subsequent **Criar Partida** / **Entrar em Partida**
go through the cloud instance. The setting persists in `localStorage` under
the key `domino.serverUrl` — friends configure it once and forget it.

### `render.yaml` reference

```yaml
services:
  - type: web
    name: domino-server
    runtime: node
    plan: free
    buildCommand: |
      npm install --include=dev
      npm run build --prefix packages/engine
      npm run build --prefix packages/contracts
      npm run build --prefix packages/server
    startCommand: node packages/server/dist/index.js
    healthCheckPath: /healthz
    envVars:
      - key: NODE_ENV
        value: production
      - key: CORS_ORIGIN
        value: "*"
```

- **`npm install --include=dev`** — Render sets `NODE_ENV=production` from
  the envVars block, which would otherwise skip devDependencies. The flag
  forces TypeScript, vitest, etc. to install so the build steps succeed.
- **`--prefix packages/<pkg>`** runs `npm run build` in each package's
  directory. It does not depend on the workspace package name (`@domino/...`),
  which is what was tripping Render's auto-detection earlier.
- **Build order** is engine → contracts → server. Server imports both via
  workspace symlinks created by `npm install`; `tsc -b` resolves them to
  the compiled `dist/` of each.
- **`startCommand`** has no `--port` / `--host` flags. The server reads
  `process.env.PORT` (which Render injects automatically) and falls back
  to `process.env.HOST` or `0.0.0.0`.
- **`healthCheckPath: /healthz`** — Render hits this regularly to verify
  the service is up. Both `/health` and `/healthz` return the same
  payload; `/healthz` exists because it's the Kubernetes-ish convention
  the user requested.

### Environment variables

| Variable      | Required | Default     | Notes                                                                 |
| ------------- | -------- | ----------- | --------------------------------------------------------------------- |
| `PORT`        | injected | `4123`      | Render injects this automatically; binary reads it.                   |
| `HOST`        | no       | `0.0.0.0`   | Override if you ever want to bind to a specific interface.            |
| `NODE_ENV`    | no       | (unset)     | Set to `production` to disable `pino-pretty` (JSON logs).             |
| `CORS_ORIGIN` | no       | `*`         | Set to a specific origin if you want to restrict the client domain.   |
| `LOG_LEVEL`   | no       | `info`      | Standard pino levels: `trace`, `debug`, `info`, `warn`, `error`, `silent`. |

To set an env var: in the Render dashboard for the service →
**Environment** → **Add Environment Variable**.

### Free-tier limitations to expect

1. **Cold start after 15 minutes idle**: the dyno sleeps. The next request
   waits ~30 seconds for the process to spin up. The client will show a
   *Falha de conexão* toast if the browser gives up before the wake-up
   completes — refresh and try again.
2. **In-memory state is lost on every restart**: match `Map`, session
   tokens, processed move IDs. Any push to `main` triggers a redeploy,
   which evaporates active games. Avoid pushing while a match is live.
3. **Free instance type has no persistent disk**: not needed in v1
   (everything in memory) but worth knowing.

### Local builds remain the workspace way

For local development, all the existing workspace scripts still work:

```sh
npm install
npm run dev:server    # tsx watch via -w @domino/server
npm run dev:client
npm test              # all workspaces
```

The new convenience scripts at the root:

```sh
npm run build:server   # build engine, contracts, server in order — same as Render
npm run start:server   # node packages/server/dist/index.js
```

### Troubleshooting

**`No workspaces found: --workspace=server`** — this means Render is using
its own auto-detected build command, not the one in `render.yaml`. Either
the service was created as *New Web Service* instead of *New Blueprint
Instance*, or the manual overrides in the dashboard are non-empty. In the
service settings, clear the **Build Command** and **Start Command** so
Render falls back to `render.yaml`.

**`Cannot find module '@domino/contracts'`** — the install step skipped
workspace symlinks. Verify the build log shows `npm install --include=dev`
and not `npm ci` or `npm install --production`. If you've overridden the
build command in the dashboard, restore it to the one in `render.yaml`.

**`tsc: command not found`** — devDependencies didn't install. Add
`--include=dev` to the install step (it should already be there).

**Build succeeds but `/healthz` times out** — the process probably
crashed at startup. Check the Render logs for the stack trace; common
cause is a missing env var or a port-binding error if `PORT` wasn't
injected (shouldn't happen, but if you migrate to a different platform
that doesn't inject `PORT`, set `--port=<n>` in the start command).

### Where the client lives

The client is a static Vite build. It can be hosted anywhere that serves
static files:

- **Vercel / Netlify / Cloudflare Pages**: connect the same repo, set
  build command `npm run build:client` and publish directory
  `packages/client/dist/`.
- **Android APK via Capacitor**: `npm run build:android` from the root
  (requires Android SDK + JDK 17 locally).

The client's runtime server URL is configurable at runtime — see
`packages/client/src/net/server-url.ts`. Setting `VITE_SERVER_URL` at
build time only changes the *default*; users can override it through the
in-app Server config screen, which persists in `localStorage`.
