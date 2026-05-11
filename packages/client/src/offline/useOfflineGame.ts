import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayerCount } from '@domino/contracts';
import { BOT_DELAY_MS, createOfflineRunner, type OfflineRunner, type OfflineSnapshot } from './runner.js';
import type { End, TileId } from '@domino/contracts';

export interface UseOfflineGame {
  snapshot: OfflineSnapshot;
  layTile(tileId: TileId, end: End): void;
  drawTile(): void;
  passTurn(): void;
  restart(): void;
}

function freshSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

export function useOfflineGame(playerCount: PlayerCount): UseOfflineGame {
  const runnerRef = useRef<OfflineRunner | null>(null);
  if (runnerRef.current === null) {
    runnerRef.current = createOfflineRunner({ seed: freshSeed(), playerCount });
  }
  const [snapshot, setSnapshot] = useState<OfflineSnapshot>(() =>
    (runnerRef.current as OfflineRunner).snapshot(),
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    if (!runnerRef.current) return;
    setSnapshot(runnerRef.current.snapshot());
  }, []);

  const scheduleBotIfNeeded = useCallback(() => {
    if (!runnerRef.current) return;
    if (runnerRef.current.isHumanTurn() || runnerRef.current.isEnded()) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (runnerRef.current?.stepBot()) {
        refresh();
      }
    }, BOT_DELAY_MS);
  }, [refresh]);

  useEffect(() => {
    scheduleBotIfNeeded();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [snapshot, scheduleBotIfNeeded]);

  const layTile = useCallback(
    (tileId: TileId, end: End) => {
      if (!runnerRef.current) return;
      if (runnerRef.current.applyHumanLay(tileId, end)) refresh();
    },
    [refresh],
  );
  const drawTile = useCallback(() => {
    if (!runnerRef.current) return;
    if (runnerRef.current.applyHumanDraw()) refresh();
  }, [refresh]);
  const passTurn = useCallback(() => {
    if (!runnerRef.current) return;
    if (runnerRef.current.applyHumanPass()) refresh();
  }, [refresh]);
  const restart = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    runnerRef.current = createOfflineRunner({ seed: freshSeed(), playerCount });
    refresh();
  }, [playerCount, refresh]);

  return { snapshot, layTile, drawTile, passTurn, restart };
}
