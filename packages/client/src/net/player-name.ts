const STORAGE_KEY = 'domino.playerName';

const MAX_LENGTH = 30;

export function readStoredPlayerName(): string | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && v.trim().length > 0) return v.trim().slice(0, MAX_LENGTH);
    return null;
  } catch {
    return null;
  }
}

export function writeStoredPlayerName(name: string): void {
  const trimmed = name.trim();
  try {
    if (trimmed.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, trimmed.slice(0, MAX_LENGTH));
    }
  } catch {
    // ignore
  }
}

export function resolvePlayerName(): string | null {
  return readStoredPlayerName();
}

export const PLAYER_NAME_MAX_LENGTH = MAX_LENGTH;
