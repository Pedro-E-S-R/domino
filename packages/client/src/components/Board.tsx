import type { LaidTile, PipValue } from '@domino/contracts';
import { Tile } from './Tile.js';

export interface BoardProps {
  board: readonly LaidTile[];
  leftEnd: PipValue | null;
  rightEnd: PipValue | null;
}

export function Board({ board, leftEnd, rightEnd }: BoardProps): JSX.Element {
  if (board.length === 0) {
    return (
      <div className="w-full min-h-[140px] flex items-center justify-center text-soft-cream/70 font-body-md italic">
        Mesa vazia
      </div>
    );
  }
  return (
    <div
      className="w-full overflow-x-auto py-2"
      role="region"
      aria-label="Mesa de jogo"
    >
      <div className="flex items-center gap-piece-gap min-w-max px-gutter">
        {leftEnd !== null && (
          <div className="text-soft-cream/80 font-label-sm" aria-hidden>
            ←{leftEnd}
          </div>
        )}
        {board.map((laid, i) => (
          <Tile
            key={`${laid.tileId}-${i}`}
            tileId={laid.tileId}
            orientation={laid.orientation}
            size="sm"
            disabled
          />
        ))}
        {rightEnd !== null && (
          <div className="text-soft-cream/80 font-label-sm" aria-hidden>
            {rightEnd}→
          </div>
        )}
      </div>
    </div>
  );
}
