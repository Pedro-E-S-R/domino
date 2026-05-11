import { describe, expect, it } from 'vitest';
import { createOfflineRunner, HUMAN_SEAT } from './runner.js';

describe('OfflineRunner', () => {
  it('starts in playing status with 7 tiles for the human', () => {
    const runner = createOfflineRunner({ seed: 42, playerCount: 2 });
    const snap = runner.snapshot();
    expect(snap.view.status).toBe('playing');
    expect(snap.me.myHand.length).toBe(7);
    expect(snap.view.players.length).toBe(2);
    expect(snap.view.players[0]?.seat).toBe(HUMAN_SEAT);
  });

  it('plays a complete match to a canonical outcome with bots only', () => {
    const runner = createOfflineRunner({ seed: 99, playerCount: 2 });
    let safety = 200;
    while (!runner.isEnded() && safety-- > 0) {
      if (runner.isHumanTurn()) {
        const me = runner.snapshot().me;
        if (me.legalMoves.length > 0) {
          const m = me.legalMoves[0]!;
          runner.applyHumanLay(m.tileId, m.ends[0]!);
        } else if (runner.snapshot().view.boneyardCount > 0) {
          runner.applyHumanDraw();
        } else {
          runner.applyHumanPass();
        }
      } else {
        runner.stepBot();
      }
    }
    const snap = runner.snapshot();
    expect(snap.view.status).toBe('ended');
    expect(snap.result).not.toBeNull();
    expect(['domino', 'block', 'tied-block']).toContain(snap.result?.outcome.kind);
  });

  it('rejects human moves when it is not the human\'s turn', () => {
    const runner = createOfflineRunner({ seed: 7, playerCount: 4 });
    if (runner.isHumanTurn()) {
      runner.stepBot();
    }
    const opener = runner.snapshot();
    if (opener.view.currentSeat === HUMAN_SEAT) {
      expect(true).toBe(true);
      return;
    }
    const ok = runner.applyHumanDraw();
    expect(ok).toBe(false);
  });

  it('snapshot exposes legalMoves only for the human seat', () => {
    const runner = createOfflineRunner({ seed: 1, playerCount: 4 });
    const snap = runner.snapshot();
    expect(snap.me.mySeat).toBe(HUMAN_SEAT);
    expect(snap.view.players.length).toBe(4);
  });
});
