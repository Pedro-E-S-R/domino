import { useState } from 'react';
import type { End, LegalMove, PipValue, TileId } from '@domino/contracts';
import { getTile } from '@domino/engine';
import { Tile } from './Tile.js';
import { BotecoButton } from './BotecoButton.js';

export interface HandProps {
  hand: readonly TileId[];
  legalMoves: readonly LegalMove[];
  onPlay?: (tileId: TileId, end: End) => void;
  disabled?: boolean;
  leftEnd?: PipValue | null;
  rightEnd?: PipValue | null;
}

interface PendingChoice {
  readonly tileId: TileId;
}

export function Hand({
  hand,
  legalMoves,
  onPlay,
  disabled = false,
  leftEnd = null,
  rightEnd = null,
}: HandProps): JSX.Element {
  const legalById = new Map<TileId, readonly End[]>();
  for (const m of legalMoves) legalById.set(m.tileId, m.ends);

  const [pending, setPending] = useState<PendingChoice | null>(null);

  const playOrAsk = (tileId: TileId, ends: readonly End[]): void => {
    if (ends.length === 1) {
      onPlay?.(tileId, ends[0] as End);
      return;
    }
    setPending({ tileId });
  };

  const choose = (end: End): void => {
    if (pending && onPlay) onPlay(pending.tileId, end);
    setPending(null);
  };

  return (
    <>
      <div
        className="w-full flex items-center justify-center gap-piece-gap py-2 px-gutter overflow-x-auto"
        role="region"
        aria-label="Sua mão"
      >
        {hand.map((tileId) => {
          const ends = legalById.get(tileId);
          const highlighted = !disabled && ends !== undefined;
          const playable = !disabled && ends !== undefined;
          const handler = playable
            ? () => playOrAsk(tileId, ends as readonly End[])
            : () => {};
          return (
            <Tile
              key={tileId}
              tileId={tileId}
              size="md"
              highlighted={highlighted}
              disabled={!playable}
              onClick={handler}
            />
          );
        })}
      </div>
      {pending && (
        <EndChoiceDialog
          tileId={pending.tileId}
          leftEnd={leftEnd}
          rightEnd={rightEnd}
          onChoose={choose}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}

interface EndChoiceDialogProps {
  tileId: TileId;
  leftEnd: PipValue | null;
  rightEnd: PipValue | null;
  onChoose(end: End): void;
  onCancel(): void;
}

function EndChoiceDialog({
  tileId,
  leftEnd,
  rightEnd,
  onChoose,
  onCancel,
}: EndChoiceDialogProps): JSX.Element {
  const tile = getTile(tileId);
  const leftLabel = leftEnd !== null ? `Esquerda (${leftEnd})` : 'Esquerda';
  const rightLabel = rightEnd !== null ? `Direita (${rightEnd})` : 'Direita';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-margin-mobile"
      role="dialog"
      aria-modal="true"
      aria-label="Escolher lado para jogar"
      data-testid="end-choice-dialog"
    >
      <div className="bg-soft-cream rounded-xl border-4 border-rich-wood shadow-2xl p-margin-mobile max-w-sm w-full">
        <h2 className="font-headline-md text-rich-wood mb-1 text-center">
          Onde jogar?
        </h2>
        <p className="text-center font-body-md text-secondary italic mb-4">
          Peça {tile.a}-{tile.b} encaixa nas duas pontas.
        </p>
        <div className="flex flex-col gap-3">
          <BotecoButton variant="secondary" icon="arrow_back" onClick={() => onChoose('left')}>
            {leftLabel}
          </BotecoButton>
          <BotecoButton variant="secondary" icon="arrow_forward" onClick={() => onChoose('right')}>
            {rightLabel}
          </BotecoButton>
          <button
            onClick={onCancel}
            className="mt-1 w-full text-rich-wood/80 hover:text-rich-wood underline font-label-lg py-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
