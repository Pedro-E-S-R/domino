import { useEffect, useState } from 'react';
import type { Seat } from '@domino/contracts';

export interface TurnIndicatorProps {
  currentSeat: Seat | null;
  mySeat: Seat | null;
  turnDeadlineMs: number | null;
  playerCount: 2 | 4;
}

function secondsLeft(deadlineMs: number | null): number | null {
  if (deadlineMs === null) return null;
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

export function TurnIndicator({
  currentSeat,
  mySeat,
  turnDeadlineMs,
  playerCount,
}: TurnIndicatorProps): JSX.Element {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (turnDeadlineMs === null) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [turnDeadlineMs]);

  const seconds = secondsLeft(turnDeadlineMs);
  const isMine = currentSeat !== null && mySeat !== null && currentSeat === mySeat;
  const warn = seconds !== null && seconds <= 5;

  void now;

  return (
    <div
      className={[
        'flex items-center justify-between rounded-xl bg-soft-cream/90 border-2 px-gutter py-2 font-label-lg',
        warn ? 'border-error animate-pulse' : 'border-rich-wood/30',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <span className="text-rich-wood">
        {currentSeat === null
          ? 'Aguardando…'
          : isMine
            ? 'Sua vez'
            : `Vez de jogador ${currentSeat + 1} / ${playerCount}`}
      </span>
      {seconds !== null && (
        <span className={`font-headline-md ${warn ? 'text-error' : 'text-rich-wood'}`}>{seconds}s</span>
      )}
    </div>
  );
}
