import { useState } from 'react';
import type { PlayerCount } from '@domino/contracts';
import { BotecoButton } from '../components/BotecoButton.js';

export interface OfflineSetupScreenProps {
  onStart(playerCount: PlayerCount): void;
  onBack(): void;
}

export function OfflineSetupScreen({ onStart, onBack }: OfflineSetupScreenProps): JSX.Element {
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);

  return (
    <main className="min-h-screen bg-surface px-margin-mobile py-margin-mobile">
      <header className="flex items-center justify-between mb-gutter">
        <h1 className="font-sans font-black text-headline-lg text-rich-wood">Jogar offline</h1>
        <button
          onClick={onBack}
          className="material-symbols-outlined text-rich-wood p-2 rounded-full hover:bg-rich-wood/10"
          aria-label="Voltar"
        >
          close
        </button>
      </header>

      <section className="bg-soft-cream rounded-xl border-2 border-rich-wood/30 p-margin-mobile space-y-6">
        <p className="text-rich-wood font-body-md">
          Você joga contra bots no próprio celular. Sem rede, sem login.
        </p>
        <fieldset>
          <legend className="font-label-lg text-rich-wood mb-3">Mesa</legend>
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
                {n} jogadores ({n - 1} bot{n - 1 === 1 ? '' : 's'})
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="mt-margin-mobile">
        <BotecoButton variant="primary" icon="sports_esports" onClick={() => onStart(playerCount)}>
          Começar
        </BotecoButton>
      </div>
    </main>
  );
}
