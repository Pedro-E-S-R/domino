import type { PublicMatchView, SessionToken } from '@domino/contracts';
import { Avatar } from '../components/Avatar.js';
import { BotecoButton } from '../components/BotecoButton.js';

export interface LobbyScreenProps {
  view: PublicMatchView;
  mySessionToken: SessionToken | null;
  amHost: boolean;
  amReady: boolean;
  onToggleReady(ready: boolean): void;
  onStart(): void;
  onLeave(): void;
}

export function LobbyScreen({
  view,
  amHost,
  amReady,
  onToggleReady,
  onStart,
  onLeave,
}: LobbyScreenProps): JSX.Element {
  const seatsFilled = view.players.length;
  const allReady = seatsFilled === view.playerCount && view.players.every((p) => p.ready === true);

  return (
    <main className="min-h-screen bg-surface px-margin-mobile py-margin-mobile flex flex-col">
      <header className="flex items-center justify-between mb-gutter">
        <h1 className="font-sans font-black text-headline-lg text-rich-wood">Lobby</h1>
        <button
          onClick={onLeave}
          className="material-symbols-outlined text-rich-wood p-2 rounded-full hover:bg-rich-wood/10"
          aria-label="Sair"
        >
          logout
        </button>
      </header>

      <section className="bg-tertiary rounded-xl border-4 border-tertiary-container p-margin-mobile mb-gutter text-center">
        <div className="font-label-sm text-secondary-fixed-dim">Código da sala</div>
        <div className="font-sans font-black text-display-lg tracking-widest text-amber-gold">
          {view.roomCode}
        </div>
        <div className="font-label-sm text-secondary-fixed-dim mt-1">
          {view.mode === 'lan' ? 'LAN' : 'Online'} · {view.playerCount} jogadores
        </div>
      </section>

      <section className="bg-soft-cream rounded-xl border-2 border-rich-wood/30 p-margin-mobile flex-1">
        <h2 className="font-label-lg text-rich-wood mb-3">
          Jogadores ({seatsFilled}/{view.playerCount})
        </h2>
        <ul className="space-y-2">
          {Array.from({ length: view.playerCount }).map((_, idx) => {
            const player = view.players[idx];
            if (!player) {
              return (
                <li
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/30 border border-dashed border-rich-wood/30"
                >
                  <span className="material-symbols-outlined text-rich-wood/40">person_add</span>
                  <span className="font-body-md text-rich-wood/40 italic">
                    Aguardando jogador…
                  </span>
                </li>
              );
            }
            return (
              <li
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  player.ready ? 'bg-primary-fixed/40 border border-primary' : 'bg-white/60'
                }`}
              >
                <Avatar avatarId={player.avatarId} displayName={player.displayName} size="md" />
                <div className="flex-1">
                  <div className="font-label-lg text-rich-wood">{player.displayName}</div>
                  <div className="text-label-sm text-secondary">
                    {player.ready ? 'Pronto' : 'Aguardando…'}
                  </div>
                </div>
                {player.ready && (
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-margin-mobile flex flex-col gap-3">
        <BotecoButton
          variant="wood"
          icon={amReady ? 'check' : 'check_circle'}
          onClick={() => onToggleReady(!amReady)}
        >
          {amReady ? 'Pronto (toque para desfazer)' : 'Estou pronto'}
        </BotecoButton>
        {amHost && (
          <BotecoButton
            variant="primary"
            icon="play_arrow"
            disabled={!allReady}
            onClick={onStart}
          >
            Iniciar partida
          </BotecoButton>
        )}
      </div>
    </main>
  );
}
