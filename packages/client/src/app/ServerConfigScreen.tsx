import { useState } from 'react';
import { BotecoButton } from '../components/BotecoButton.js';
import {
  clearStoredServerUrl,
  getDefaultServerUrl,
  normalizeServerInput,
  writeStoredServerUrl,
} from '../net/server-url.js';

export interface ServerConfigScreenProps {
  currentUrl: string;
  onSave(url: string): void;
  onReset(): void;
  onBack(): void;
}

export function ServerConfigScreen({
  currentUrl,
  onSave,
  onReset,
  onBack,
}: ServerConfigScreenProps): JSX.Element {
  const [input, setInput] = useState<string>(stripScheme(currentUrl));
  const [error, setError] = useState<string | null>(null);
  const defaultUrl = getDefaultServerUrl();

  const handleSave = (): void => {
    const result = normalizeServerInput(input);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    writeStoredServerUrl(result.url);
    onSave(result.url);
  };

  const handleReset = (): void => {
    setError(null);
    clearStoredServerUrl();
    setInput(stripScheme(defaultUrl));
    onReset();
  };

  return (
    <main className="min-h-screen bg-surface px-margin-mobile py-margin-mobile">
      <header className="flex items-center justify-between mb-gutter">
        <h1 className="font-sans font-black text-headline-lg text-rich-wood">Servidor</h1>
        <button
          onClick={onBack}
          className="material-symbols-outlined text-rich-wood p-2 rounded-full hover:bg-rich-wood/10"
          aria-label="Voltar"
        >
          close
        </button>
      </header>

      <section className="bg-soft-cream rounded-xl border-2 border-rich-wood/30 p-margin-mobile space-y-4">
        <div>
          <label htmlFor="server-input" className="font-label-lg text-rich-wood block mb-1">
            Host : porta
          </label>
          <input
            id="server-input"
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="100.64.5.10:4123"
            className="w-full bg-white border-2 border-rich-wood/30 rounded-lg px-3 py-3 font-mono text-body-md text-rich-wood focus:border-amber-gold focus:outline-none"
          />
          <p className="text-label-sm text-rich-wood/70 mt-2">
            Sem prefixo "http://" — adicionamos automaticamente. Use o IP da Tailscale e a porta
            do servidor (padrão 4123).
          </p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container border border-error rounded-lg px-3 py-2 font-label-lg">
            {error}
          </div>
        )}

        <div className="text-label-sm text-rich-wood/70">
          <div>Atual: <span className="font-mono">{currentUrl}</span></div>
          <div>Padrão: <span className="font-mono">{defaultUrl}</span></div>
        </div>
      </section>

      <div className="mt-margin-mobile flex flex-col gap-3">
        <BotecoButton variant="primary" icon="save" onClick={handleSave}>
          Salvar e usar
        </BotecoButton>
        <BotecoButton variant="wood" icon="restart_alt" onClick={handleReset}>
          Limpar (voltar ao padrão)
        </BotecoButton>
      </div>
    </main>
  );
}

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//i, '');
}
