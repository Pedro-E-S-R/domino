import { getTile, type PipValue, type TileId } from '@domino/engine';

export type TileLayout = 'horizontal' | 'vertical';

export interface TileProps {
  tileId: TileId;
  orientation?: 'normal' | 'flipped';
  layout?: TileLayout;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const DIM: Record<NonNullable<TileProps['size']>, { short: number; long: number }> = {
  sm: { short: 32, long: 64 },
  md: { short: 44, long: 88 },
  lg: { short: 56, long: 112 },
};

function PipFace({ value, w, h }: { value: PipValue; w: number; h: number }): JSX.Element {
  const r = Math.max(2, Math.round(Math.min(w, h) * 0.08));
  const positions: Record<PipValue, [number, number][]> = {
    0: [],
    1: [[0.5, 0.5]],
    2: [
      [0.3, 0.3],
      [0.7, 0.7],
    ],
    3: [
      [0.3, 0.3],
      [0.5, 0.5],
      [0.7, 0.7],
    ],
    4: [
      [0.3, 0.3],
      [0.7, 0.3],
      [0.3, 0.7],
      [0.7, 0.7],
    ],
    5: [
      [0.3, 0.3],
      [0.7, 0.3],
      [0.5, 0.5],
      [0.3, 0.7],
      [0.7, 0.7],
    ],
    6: [
      [0.3, 0.25],
      [0.7, 0.25],
      [0.3, 0.5],
      [0.7, 0.5],
      [0.3, 0.75],
      [0.7, 0.75],
    ],
  };
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden focusable={false}>
      {positions[value].map(([fx, fy], i) => (
        <circle key={i} cx={fx * w} cy={fy * h} r={r} fill="#000080" opacity={0.92} />
      ))}
    </svg>
  );
}

export function Tile({
  tileId,
  orientation = 'normal',
  layout = 'horizontal',
  size = 'md',
  highlighted = false,
  disabled = false,
  onClick,
}: TileProps): JSX.Element {
  const dim = DIM[size];
  const horizontal = layout === 'horizontal';
  const w = horizontal ? dim.long : dim.short;
  const h = horizontal ? dim.short : dim.long;
  const tile = getTile(tileId);
  const firstVal = orientation === 'normal' ? tile.a : tile.b;
  const secondVal = orientation === 'normal' ? tile.b : tile.a;
  const halfLong = dim.long / 2 - 1;
  const halfShort = dim.short;
  const halfW = horizontal ? halfLong : halfShort;
  const halfH = horizontal ? halfShort : halfLong;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-tile-id={tileId}
      data-layout={layout}
      data-orientation={orientation}
      className={[
        'relative rounded-lg border border-amber-gold/40 bg-ivory-tile transition-all items-center justify-between',
        horizontal ? 'flex flex-row' : 'flex flex-col',
        highlighted
          ? 'ring-4 ring-amber-gold scale-110 tile-playable-glow z-10'
          : 'domino-shadow',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width: w, height: h }}
      aria-label={`Peça ${tile.a}-${tile.b}`}
    >
      <div
        className={`flex-1 ${horizontal ? 'h-full' : 'w-full'} flex items-center justify-center`}
      >
        <PipFace value={firstVal} w={halfW} h={halfH} />
      </div>
      <div className={horizontal ? 'h-full w-px bg-amber-gold/40' : 'w-full h-px bg-amber-gold/40'} />
      <div
        className={`flex-1 ${horizontal ? 'h-full' : 'w-full'} flex items-center justify-center`}
      >
        <PipFace value={secondVal} w={halfW} h={halfH} />
      </div>
    </button>
  );
}
