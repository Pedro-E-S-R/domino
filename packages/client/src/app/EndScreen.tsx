import type { LaidTile, MatchResult, PipValue, PlayerSummary } from '@domino/contracts';
import { Avatar } from '../components/Avatar.js';
import { Board } from '../components/Board.js';
import { BotecoButton } from '../components/BotecoButton.js';

export interface EndScreenProps {
  result: MatchResult;
  players: readonly PlayerSummary[];
  board?: readonly LaidTile[];
  leftEnd?: PipValue | null;
  rightEnd?: PipValue | null;
  canRematch: boolean;
  rematchHint?: string;
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
  board,
  leftEnd = null,
  rightEnd = null,
  canRematch,
  rematchHint,
  onRematch,
  onHome,
}: EndScreenProps): JSX.Element {
  const showBoard = Array.isArray(board) && board.length > 0;
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center px-margin-mobile py-margin-mobile">
      {showBoard && (
        <section className="w-full max-w-md mb-gutter">
          <div className="bg-primary rounded-xl border-4 border-tertiary-container table-inner-shadow py-2">
            <Board board={board as readonly LaidTile[]} leftEnd={leftEnd} rightEnd={rightEnd} />
          </div>
          <div className="text-center text-rich-wood/70 text-label-sm mt-1">Tabuleiro final</div>
        </section>
      )}

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
                {isWinner && (
                  <span className="material-symbols-outlined text-amber-gold">emoji_events</span>
                )}
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
          {!canRematch && rematchHint && (
            <p className="text-center text-label-sm text-rich-wood/70 -mt-1">{rematchHint}</p>
          )}
          <BotecoButton variant="wood" icon="home" onClick={onHome}>
            Voltar
          </BotecoButton>
        </div>
      </div>
    </main>
  );
}
