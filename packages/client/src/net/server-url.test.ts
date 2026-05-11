import { describe, expect, it } from 'vitest';
import { normalizeServerInput } from './server-url.js';

describe('normalizeServerInput', () => {
  it('accepts a bare IP and adds http://', () => {
    const r = normalizeServerInput('100.64.5.10:3000');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe('http://100.64.5.10:3000');
  });

  it('accepts a bare IP without port', () => {
    const r = normalizeServerInput('100.64.5.10');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe('http://100.64.5.10');
  });

  it('accepts a hostname with port', () => {
    const r = normalizeServerInput('domino.local:4123');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe('http://domino.local:4123');
  });

  it('preserves an explicit http:// scheme', () => {
    const r = normalizeServerInput('http://1.2.3.4:5000');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe('http://1.2.3.4:5000');
  });

  it('preserves an explicit https:// scheme', () => {
    const r = normalizeServerInput('https://play.example.com');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe('https://play.example.com');
  });

  it('trims surrounding whitespace', () => {
    const r = normalizeServerInput('  100.64.5.10:3000  ');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe('http://100.64.5.10:3000');
  });

  it('rejects empty input', () => {
    const r = normalizeServerInput('');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/endereço/i);
  });

  it('rejects whitespace-only input', () => {
    const r = normalizeServerInput('   ');
    expect(r.ok).toBe(false);
  });

  it('rejects a clearly malformed string', () => {
    const r = normalizeServerInput('not a url with spaces inside');
    expect(r.ok).toBe(false);
  });

  it('strips trailing path components, keeping only origin', () => {
    const r = normalizeServerInput('http://1.2.3.4:5000/some/path?x=1');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toBe('http://1.2.3.4:5000');
  });
});
