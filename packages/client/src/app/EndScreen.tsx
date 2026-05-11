import type { MatchResult, PlayerSummary } from '@domino/contracts';
import { Avatar } from '../components/Avatar.js';
import { BotecoButton } from '../components/BotecoButton.js';

export interface EndScreenProps {
  result: MatchResult;
  players: readonly PlayerSummary[];
  canRematch: boolean;
  onRematch: () => void;
  onHome: () => void;
}

function outcomeTitle(result: MatchResult, players: readonly PlayerSummary[]): string {
  const o = result.outcome;
  if (o.kind === 'domino') {
    const winner = players.find((p) => p.seat === o.winner);
    return `${winner?.displayName ?? 'Jogador ' + (o.winner + 1)} bateu!`;
  }
  if (o.kind === 'block') {
    const winner = players.find((p) => p.seat === o.winner);
    return `Tranca — ${winner?.displayName ?? 'Jogador ' + (o.winner + 1)} venceu por menos pontos`;
  }
  return 'Tranca empatada';
}

export function EndScreen({
  result,
  players,
  canRematch,
  onRematch,
  onHome,
}: EndScreenProps): JSX.Element {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-margin-mobile py-margin-mobile">
      <div className="bg-soft-cream rounded-xl border-4 border-rich-wood shadow-xl p-margin-mobile max-w-md w-full">
        <h1 className="font-sans font-black text-headline-lg text-rich-wood text-center mb-2">
          Fim de Jogo
        </h1>
        <p className="text-center font-body-lg text-secondary italic mb-6">
          {outcomeTitle(result, players)}
        </p>

        <ul className="space-y-3 mb-6">
          {players.map((p) => {
            const pips = result.pipsBySeat[p.seat] ?? 0;
            const isWinner =
              (result.outcome.kind === 'domino' && result.outcome.winner === p.seat) ||
              (result.outcome.kind === 'block' && result.outcome.winner === p.seat) ||
              (result.outcome.kind === 'tied-block' && result.outcome.tied.includes(p.seat));
            return (
              <li
                key={p.seat}
                className={[
                  'flex items-center gap-3 p-3 rounded-lg',
                  isWinner ? 'bg-amber-gold/30 ring-2 ring-amber-gold' : 'bg-white/50',
                ].join(' ')}
              >
                <Avatar avatarId={p.avatarId} displayName={p.displayName} size="md" />
                <div className="flex-1">
                  <div className="font-label-lg text-rich-wood">{p.displayName}</div>
                  <div className="text-label-sm text-secondary">{pips} pts restantes</div>
                </div>
                {isWinner && <span className="material-symbols-outlined text-amber-gold">emoji_events</span>}
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-3">
          <BotecoButton
            variant="secondary"
            icon="replay"
            disabled={!canRematch}
            onClick={onRematch}
          >
            Jogar Novamente
          </BotecoButton>
          <BotecoButton variant="wood" icon="home" onClick={onHome}>
            Voltar
          </BotecoButton>
        </div>
      </div>
    </main>
  );
}
