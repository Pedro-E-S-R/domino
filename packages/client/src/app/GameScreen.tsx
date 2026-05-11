import type { End, PrivatePlayerView, PublicMatchView, Seat, TileId } from '@domino/contracts';
import { Avatar } from '../components/Avatar.js';
import { Board } from '../components/Board.js';
import { BotecoButton } from '../components/BotecoButton.js';
import { Hand } from '../components/Hand.js';
import { TurnIndicator } from '../components/TurnIndicator.js';

export type GameIntent =
  | { type: 'LAY'; tileId: TileId; end: End }
  | { type: 'DRAW' }
  | { type: 'PASS' };

export interface GameScreenProps {
  view: PublicMatchView;
  me: PrivatePlayerView;
  onIntent: (intent: GameIntent) => void;
}

export function GameScreen({ view, me, onIntent }: GameScreenProps): JSX.Element {
  const isMyTurn = view.currentSeat !== null && view.currentSeat === me.mySeat;
  const canDraw =
    isMyTurn && me.legalMoves.length === 0 && view.boneyardCount > 0;
  const mustPass =
    isMyTurn && me.legalMoves.length === 0 && view.boneyardCount === 0;

  return (
    <main className="min-h-screen bg-primary text-soft-cream flex flex-col">
      <header className="w-full px-margin-mobile py-unit flex items-center justify-between bg-tertiary border-b-2 border-tertiary-container">
        <div className="flex items-center gap-2">
          <span className="font-label-lg text-secondary-fixed">Sala</span>
          <span className="font-headline-md text-amber-gold tracking-wide">{view.roomCode}</span>
        </div>
        <div className="text-label-sm text-secondary-fixed opacity-80">
          {view.mode === 'lan' ? 'LAN' : 'Online'} · {view.playerCount}j
        </div>
      </header>

      <section className="px-margin-mobile pt-gutter flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {view.players.map((p) => (
            <div
              key={p.seat}
              className={[
                'flex items-center gap-2 px-3 py-1 rounded-xl border-2',
                p.seat === view.currentSeat
                  ? 'border-amber-gold bg-tertiary-container'
                  : 'border-tertiary-container bg-tertiary/60',
              ].join(' ')}
            >
              <Avatar avatarId={p.avatarId} displayName={p.displayName} size="sm" connected={p.connected} />
              <div className="flex flex-col leading-tight">
                <span className="font-label-lg text-secondary-fixed">{p.displayName}</span>
                <span className="text-label-sm text-secondary-fixed-dim">{p.handCount} peças</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="px-margin-mobile pt-gutter">
        <TurnIndicator
          currentSeat={view.currentSeat}
          mySeat={me.mySeat as Seat}
          turnDeadlineMs={view.turnDeadlineMs}
          playerCount={view.playerCount}
        />
      </div>

      <section className="flex-1 mx-margin-mobile my-gutter bg-primary-container rounded-xl table-inner-shadow flex flex-col justify-center">
        <Board board={view.board} leftEnd={view.leftEnd} rightEnd={view.rightEnd} />
        <div className="text-center text-soft-cream/70 font-label-sm">
          Monte: {view.boneyardCount}
        </div>
      </section>

      <section className="bg-tertiary border-t-2 border-tertiary-container pb-gutter pt-2 sticky bottom-0">
        <Hand
          hand={me.myHand}
          legalMoves={me.legalMoves}
          disabled={!isMyTurn}
          onPlay={(tileId, end) => onIntent({ type: 'LAY', tileId, end })}
        />
        <div className="flex gap-gutter px-margin-mobile">
          <BotecoButton
            variant="secondary"
            icon="add"
            disabled={!canDraw}
            onClick={() => onIntent({ type: 'DRAW' })}
          >
            Comprar
          </BotecoButton>
          <BotecoButton
            variant="wood"
            icon="skip_next"
            disabled={!mustPass}
            onClick={() => onIntent({ type: 'PASS' })}
          >
            Passar
          </BotecoButton>
        </div>
      </section>
    </main>
  );
}
