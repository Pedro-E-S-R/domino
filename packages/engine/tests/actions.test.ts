import { describe, expect, it } from 'vitest';
import { actionActor, type GameAction } from '../src/actions.js';

describe('actionActor', () => {
  it('returns null for DEAL', () => {
    expect(actionActor({ type: 'DEAL', seed: 0 })).toBeNull();
  });

  it('returns the actor for LAY/DRAW/PASS', () => {
    expect(actionActor({ type: 'LAY', actor: 1, tileId: 0, end: 'left' })).toBe(1);
    expect(actionActor({ type: 'DRAW', actor: 2 })).toBe(2);
    expect(actionActor({ type: 'PASS', actor: 0 })).toBe(0);
  });

  it('exhaustively narrows the discriminated union (compile + runtime)', () => {
    function describeAction(a: GameAction): string {
      switch (a.type) {
        case 'DEAL':
          return 'deal';
        case 'LAY':
          return `lay@${a.end}`;
        case 'DRAW':
          return 'draw';
        case 'PASS':
          return 'pass';
      }
    }
    expect(describeAction({ type: 'DEAL', seed: 0 })).toBe('deal');
    expect(describeAction({ type: 'LAY', actor: 0, tileId: 0, end: 'right' })).toBe('lay@right');
    expect(describeAction({ type: 'DRAW', actor: 0 })).toBe('draw');
    expect(describeAction({ type: 'PASS', actor: 0 })).toBe('pass');
  });
});
