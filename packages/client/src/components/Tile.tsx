import { getTile, type PipValue, type TileId } from '@domino/engine';

export interface TileProps {
  tileId: TileId;
  orientation?: 'normal' | 'flipped';
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const SIZE: Record<NonNullable<TileProps['size']>, { w: number; h: number }> = {
  sm: { w: 32, h: 64 },
  md: { w: 44, h: 88 },
  lg: { w: 56, h: 112 },
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
  size = 'md',
  highlighted = false,
  disabled = false,
  onClick,
}: TileProps): JSX.Element {
  const { w, h } = SIZE[size];
  const tile = getTile(tileId);
  const topVal = orientation === 'normal' ? tile.a : tile.b;
  const botVal = orientation === 'normal' ? tile.b : tile.a;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'relative rounded-lg domino-shadow border border-amber-gold/40 bg-ivory-tile flex flex-col items-center justify-between transition-all',
        highlighted ? 'ring-2 ring-amber-gold scale-105' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width: w, height: h }}
      aria-label={`Peça ${tile.a}-${tile.b}`}
    >
      <div className="flex-1 w-full flex items-center justify-center">
        <PipFace value={topVal} w={w} h={h / 2 - 2} />
      </div>
      <div className="w-full h-px bg-amber-gold/40" />
      <div className="flex-1 w-full flex items-center justify-center">
        <PipFace value={botVal} w={w} h={h / 2 - 2} />
      </div>
    </button>
  );
}
