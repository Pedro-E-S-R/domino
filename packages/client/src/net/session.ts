import { Preferences } from '@capacitor/preferences';
import {
  PROTOCOL_VERSION,
  SessionResponseSchema,
  type SessionToken,
} from '@domino/contracts';

const TOKEN_KEY = 'domino.sessionToken';

export interface SessionInfo {
  readonly token: SessionToken;
  readonly protocolVersion: string;
}

export async function getOrCreateSession(serverUrl: string): Promise<SessionInfo> {
  const existing = await Preferences.get({ key: TOKEN_KEY });
  if (existing.value) {
    return { token: existing.value as SessionToken, protocolVersion: PROTOCOL_VERSION };
  }
  const res = await fetch(`${serverUrl}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) {
    throw new Error(`Failed to issue session: HTTP ${res.status}`);
  }
  const json = (await res.json()) as unknown;
  const parsed = SessionResponseSchema.parse(json);
  await Preferences.set({ key: TOKEN_KEY, value: parsed.sessionToken });
  return { token: parsed.sessionToken, protocolVersion: parsed.protocolVersion };
}

export async function clearStoredSession(): Promise<void> {
  await Preferences.remove({ key: TOKEN_KEY });
}
