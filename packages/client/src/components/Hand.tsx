import type { End, LegalMove, TileId } from '@domino/contracts';
import { Tile } from './Tile.js';

export interface HandProps {
  hand: readonly TileId[];
  legalMoves: readonly LegalMove[];
  onPlay?: (tileId: TileId, end: End) => void;
  disabled?: boolean;
}

export function Hand({ hand, legalMoves, onPlay, disabled = false }: HandProps): JSX.Element {
  const legalById = new Map<TileId, readonly End[]>();
  for (const m of legalMoves) legalById.set(m.tileId, m.ends);

  return (
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
          ? () => {
              const end = ends[0] as End;
              onPlay?.(tileId, end);
            }
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
  );
}
