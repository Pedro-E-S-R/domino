const STORAGE_KEY = 'domino.serverUrl';

export function getDefaultServerUrl(): string {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return env?.['VITE_SERVER_URL'] ?? 'http://localhost:4123';
}

export function readStoredServerUrl(): string | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function writeStoredServerUrl(url: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, url);
  } catch {
    // localStorage may be unavailable (private mode, Capacitor quirks) — ignore
  }
}

export function clearStoredServerUrl(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function resolveServerUrl(): string {
  return readStoredServerUrl() ?? getDefaultServerUrl();
}

export interface NormalizeResult {
  ok: true;
  url: string;
}

export interface NormalizeError {
  ok: false;
  error: string;
}

export function normalizeServerInput(raw: string): NormalizeResult | NormalizeError {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Informe um endereço.' };
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: 'Endereço inválido. Use "host" ou "host:porta".' };
  }
  if (parsed.hostname === '') {
    return { ok: false, error: 'Endereço inválido — hostname vazio.' };
  }
  const port = parsed.port !== '' ? `:${parsed.port}` : '';
  return { ok: true, url: `${parsed.protocol}//${parsed.hostname}${port}` };
}
