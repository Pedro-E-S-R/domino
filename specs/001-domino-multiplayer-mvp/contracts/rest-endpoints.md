# REST Endpoints

The REST surface is intentionally tiny: it covers session bootstrap, a
health probe, and the LAN-info endpoint that backs the QR-code join
flow. Everything else is realtime via Socket.IO.

All endpoints return JSON; all 4xx and 5xx responses use the
`ErrorPayload` shape from `data-types.md`. The `Content-Type` is
`application/json; charset=utf-8`.

## `POST /session`

Issues a fresh opaque session token to the caller.

**Request**

```http
POST /session
Content-Type: application/json

{}
```

(Body is empty for v1. Reserved for future fields such as device
attestation; clients MUST send an empty object literal so the server
can ignore unknown keys without breaking compatibility.)

**Response — 200**

```json
{
  "sessionToken": "1f9d2a...32hex",
  "issuedAt": 1747000000000,
  "protocolVersion": "1.0.0"
}
```

**Response — 5xx**

`ErrorPayload` with `code: "INTERNAL"`.

The client persists `sessionToken` via Capacitor Preferences. If a
stored token exists at app launch, the client uses it directly and does
**not** call `POST /session` again. Token rotation is a v2 concern.

## `GET /health`

Liveness probe for the host.

**Response — 200**

```json
{
  "ok": true,
  "protocolVersion": "1.0.0",
  "now": 1747000000000,
  "mode": "online" | "lan"
}
```

No errors are expected on this endpoint in v1.

## `GET /lan/info`

Only enabled when the server is started with `--mode=lan`. Returns the
information the QR-code payload encodes, so a client that scans a QR
can verify what it's connecting to.

**Response — 200**

```json
{
  "mode": "lan",
  "protocolVersion": "1.0.0",
  "host": "192.168.1.42",
  "port": 4123,
  "roomCode": "Q7R4XB",
  "createdAt": 1747000000000
}
```

In online mode this endpoint returns 404.

## QR code payload

The QR code printed by the LAN host encodes a JSON string equivalent to
the `GET /lan/info` response, prefixed with a scheme tag so a scanner
can refuse non-domino QRs:

```text
domino://lan?v=1.0.0&host=192.168.1.42&port=4123&room=Q7R4XB
```

The client parses the URL, validates it against a Zod schema, and uses
it to construct the Socket.IO connection URL.

## Authentication and CORS

- All Socket.IO connections require `SocketAuthPayload`. REST endpoints
  do not require authentication in v1 — `POST /session` is unauthenticated
  by design, and `GET /health` and `GET /lan/info` reveal nothing
  sensitive.
- The server enables CORS for all origins in v1 (the client runs from a
  Capacitor `capacitor://` origin or `http://localhost` in dev). The
  Online deployment may tighten this later via a configurable allowlist.
