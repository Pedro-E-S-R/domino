import { useState } from 'react';
import type { Mode, PlayerCount } from '@domino/contracts';
import { BotecoButton } from '../components/BotecoButton.js';

export interface CreateMatchScreenProps {
  onCreate(opts: { mode: Mode; playerCount: PlayerCount }): void;
  onBack(): void;
}

export function CreateMatchScreen({ onCreate, onBack }: CreateMatchScreenProps): JSX.Element {
  const [mode, setMode] = useState<Mode>('online');
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);

  return (
    <main className="min-h-screen bg-surface px-margin-mobile py-margin-mobile">
      <header className="flex items-center justify-between mb-gutter">
        <h1 className="font-sans font-black text-headline-lg text-rich-wood">Criar partida</h1>
        <button
          onClick={onBack}
          className="material-symbols-outlined text-rich-wood p-2 rounded-full hover:bg-rich-wood/10"
          aria-label="Voltar"
        >
          close
        </button>
      </header>

      <section className="bg-soft-cream rounded-xl border-2 border-rich-wood/30 p-margin-mobile space-y-6">
        <fieldset>
          <legend className="font-label-lg text-rich-wood mb-3">Modo</legend>
          <div className="flex gap-2">
            {(['online', 'lan'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-3 rounded-lg font-label-lg transition-all ${
                  mode === m
                    ? 'bg-primary-container text-white shadow-inner'
                    : 'bg-surface-container border border-rich-wood/20 text-rich-wood'
                }`}
              >
                {m === 'online' ? 'Online' : 'LAN'}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-label-lg text-rich-wood mb-3">Jogadores</legend>
          <div className="flex gap-2">
            {([2, 4] as const).map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`flex-1 py-3 rounded-lg font-label-lg transition-all ${
                  playerCount === n
                    ? 'bg-primary-container text-white shadow-inner'
                    : 'bg-surface-container border border-rich-wood/20 text-rich-wood'
                }`}
              >
                {n} jogadores
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="mt-margin-mobile">
        <BotecoButton
          variant="secondary"
          icon="add_circle"
          onClick={() => onCreate({ mode, playerCount })}
        >
          Criar
        </BotecoButton>
      </div>
    </main>
  );
}
