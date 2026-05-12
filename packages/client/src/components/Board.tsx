import type { LaidTile, PipValue, TileId } from '@domino/contracts';
import { Tile } from './Tile.js';
import { boardLayoutFor } from './boardLayout.js';

export interface BoardProps {
  board: readonly LaidTile[];
  leftEnd: PipValue | null;
  rightEnd: PipValue | null;
  recentTileId?: TileId | null;
}

export function Board({
  board,
  leftEnd,
  rightEnd,
  recentTileId = null,
}: BoardProps): JSX.Element {
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
        {board.map((laid, i) => {
          const isEnd = i === 0 || i === board.length - 1;
          return (
            <Tile
              key={`${laid.tileId}-${i}`}
              tileId={laid.tileId}
              orientation={laid.orientation}
              layout={boardLayoutFor(laid.tileId)}
              size="sm"
              disabled
              recent={laid.tileId === recentTileId}
              endPosition={isEnd}
            />
          );
        })}
        {rightEnd !== null && (
          <div className="text-soft-cream/80 font-label-sm" aria-hidden>
            {rightEnd}→
          </div>
        )}
      </div>
    </div>
  );
}
