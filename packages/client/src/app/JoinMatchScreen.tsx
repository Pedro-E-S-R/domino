import { useState } from 'react';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@domino/contracts';
import { BotecoButton } from '../components/BotecoButton.js';

export interface JoinMatchScreenProps {
  onJoin(roomCode: string): void;
  onBack(): void;
}

const ALPHABET_SET = new Set(ROOM_CODE_ALPHABET.split(''));

export function JoinMatchScreen({ onJoin, onBack }: JoinMatchScreenProps): JSX.Element {
  const [code, setCode] = useState('');
  const sanitized = code
    .toUpperCase()
    .split('')
    .filter((c) => ALPHABET_SET.has(c))
    .slice(0, ROOM_CODE_LENGTH)
    .join('');
  const isComplete = sanitized.length === ROOM_CODE_LENGTH;

  return (
    <main className="min-h-screen bg-surface px-margin-mobile py-margin-mobile">
      <header className="flex items-center justify-between mb-gutter">
        <h1 className="font-sans font-black text-headline-lg text-rich-wood">Entrar em partida</h1>
        <button
          onClick={onBack}
          className="material-symbols-outlined text-rich-wood p-2 rounded-full hover:bg-rich-wood/10"
          aria-label="Voltar"
        >
          close
        </button>
      </header>

      <section className="bg-soft-cream rounded-xl border-2 border-rich-wood/30 p-margin-mobile">
        <label className="font-label-lg text-rich-wood block mb-2">Código da sala</label>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={sanitized}
          onChange={(e) => setCode(e.target.value)}
          maxLength={ROOM_CODE_LENGTH}
          placeholder="ABCDEF"
          className="w-full text-center text-display-lg tracking-[0.5em] font-bold uppercase bg-white border-2 border-rich-wood/30 rounded-lg py-4 text-rich-wood focus:border-amber-gold focus:outline-none"
        />
        <p className="text-label-sm text-rich-wood/70 mt-2">
          Caracteres válidos: A–Z (sem O/I) e 2–9.
        </p>
      </section>

      <div className="mt-margin-mobile">
        <BotecoButton
          variant="secondary"
          icon="login"
          disabled={!isComplete}
          onClick={() => onJoin(sanitized)}
        >
          Entrar
        </BotecoButton>
      </div>
    </main>
  );
}
