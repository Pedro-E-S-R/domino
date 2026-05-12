import { useState } from 'react';
import { BotecoButton } from '../components/BotecoButton.js';
import { PLAYER_NAME_MAX_LENGTH, writeStoredPlayerName } from '../net/player-name.js';

export interface NameScreenProps {
  currentName: string | null;
  onSave(name: string | null): void;
  onBack(): void;
}

export function NameScreen({ currentName, onSave, onBack }: NameScreenProps): JSX.Element {
  const [input, setInput] = useState<string>(currentName ?? '');

  const handleSave = (): void => {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      writeStoredPlayerName('');
      onSave(null);
      return;
    }
    const final = trimmed.slice(0, PLAYER_NAME_MAX_LENGTH);
    writeStoredPlayerName(final);
    onSave(final);
  };

  const handleClear = (): void => {
    writeStoredPlayerName('');
    setInput('');
    onSave(null);
  };

  return (
    <main className="min-h-screen bg-surface px-margin-mobile py-margin-mobile">
      <header className="flex items-center justify-between mb-gutter">
        <h1 className="font-sans font-black text-headline-lg text-rich-wood">Seu nome</h1>
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
          <label htmlFor="name-input" className="font-label-lg text-rich-wood block mb-2">
            Como quer aparecer na mesa?
          </label>
          <input
            id="name-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={PLAYER_NAME_MAX_LENGTH}
            placeholder="Pedrão"
            className="w-full bg-white border-2 border-rich-wood/30 rounded-lg px-3 py-3 text-body-lg text-rich-wood focus:border-amber-gold focus:outline-none"
          />
          <p className="text-label-sm text-rich-wood/70 mt-2">
            Até {PLAYER_NAME_MAX_LENGTH} caracteres. Deixa em branco para usar "Jogador N".
          </p>
        </div>
      </section>

      <div className="mt-margin-mobile flex flex-col gap-3">
        <BotecoButton variant="primary" icon="save" onClick={handleSave}>
          Salvar
        </BotecoButton>
        <BotecoButton variant="wood" icon="restart_alt" onClick={handleClear}>
          Limpar (usar padrão)
        </BotecoButton>
      </div>
    </main>
  );
}
