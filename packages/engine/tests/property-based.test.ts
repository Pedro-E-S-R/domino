import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createInitialState } from '../src/deal.js';
import { reduce } from '../src/reducer.js';
import { chooseAutoAction } from '../src/bots.js';
import { assertInvariants } from '../src/state.js';
import { TOTAL_TILES } from '../src/tile.js';
import type { GameState } from '../src/state.js';

const seedArb = fc.integer({ min: 0, max: 0x7fffffff });
const playerCountArb = fc.constantFrom(2, 4) as fc.Arbitrary<2 | 4>;

function autoPlayToEnd(state: GameState, maxSteps = 200): GameState {
  let cur = state;
  let step = 0;
  while (cur.phase !== 'ended' && step < maxSteps) {
    const action = chooseAutoAction(cur, cur.turn);
    if (action === null) break;
    const r = reduce(cur, action);
    if (!r.ok) break;
    cur = r.state;
    step++;
  }
  return cur;
}

describe('engine property-based invariants', () => {
  it('tile conservation holds at every step of an auto-played round', () => {
    fc.assert(
      fc.property(seedArb, playerCountArb, (seed, pc) => {
        const initial = createInitialState(seed, pc);
        let cur = initial;
        for (let i = 0; i < 200 && cur.phase !== 'ended'; i++) {
          const action = chooseAutoAction(cur, cur.turn);
          if (action === null) break;
          const r = reduce(cur, action);
          if (!r.ok) break;
          cur = r.state;
          const total =
            cur.hands.reduce((acc, h) => acc + h.length, 0) +
            cur.boneyard.length +
            cur.board.length;
          if (total !== TOTAL_TILES) return false;
        }
        return true;
      }),
      { numRuns: 60 },
    );
  });

  it('a fully auto-played round always reaches a canonical end state', () => {
    fc.assert(
      fc.property(seedArb, playerCountArb, (seed, pc) => {
        const final = autoPlayToEnd(createInitialState(seed, pc));
        if (final.phase !== 'ended') return false;
        const kind = final.result?.outcome.kind;
        return kind === 'domino' || kind === 'block' || kind === 'tied-block';
      }),
      { numRuns: 60 },
    );
  });

  it('the same seed + actions yield the same state (determinism)', () => {
    fc.assert(
      fc.property(seedArb, playerCountArb, (seed, pc) => {
        const a = autoPlayToEnd(createInitialState(seed, pc));
        const b = autoPlayToEnd(createInitialState(seed, pc));
        return JSON.stringify(a) === JSON.stringify(b);
      }),
      { numRuns: 40 },
    );
  });

  it('invariants hold on every freshly dealt state', () => {
    fc.assert(
      fc.property(seedArb, playerCountArb, (seed, pc) => {
        const s = createInitialState(seed, pc);
        expect(() => assertInvariants(s)).not.toThrow();
        return true;
      }),
      { numRuns: 60 },
    );
  });
});
