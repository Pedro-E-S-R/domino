import { randomBytes } from 'node:crypto';
import type { SessionToken } from '@domino/contracts';

export interface SessionRecord {
  readonly token: SessionToken;
  readonly issuedAt: number;
  lastSeenAt: number;
}

export class SessionStore {
  private readonly sessions = new Map<SessionToken, SessionRecord>();

  issue(): SessionRecord {
    const token = randomBytes(16).toString('hex') as SessionToken;
    const record: SessionRecord = {
      token,
      issuedAt: Date.now(),
      lastSeenAt: Date.now(),
    };
    this.sessions.set(token, record);
    return record;
  }

  get(token: SessionToken): SessionRecord | undefined {
    return this.sessions.get(token);
  }

  has(token: SessionToken): boolean {
    return this.sessions.has(token);
  }

  touch(token: SessionToken): void {
    const r = this.sessions.get(token);
    if (r) r.lastSeenAt = Date.now();
  }

  size(): number {
    return this.sessions.size;
  }
}
