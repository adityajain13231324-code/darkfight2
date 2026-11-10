import { describe, expect, test } from 'vitest';
import { ROSTER } from '../src/data/roster';
import { U } from '../src/sim/constants';

// The frame-data contract from MASTER-PROMPT section 4.4.
for (const fighter of Object.values(ROSTER)) {
  describe(`move lint: ${fighter.name}`, () => {
    const strikes = fighter.list.filter((m) => m.level !== 'T');
    // String follow-ups start from the parent's cancel frame, so speed rules apply to root moves.
    const rootStrikes = strikes.filter((m) => m.root);

    test('has a 10-frame jab on 1', () => {
      const jab = fighter.moves[fighter.cmd['1']];
      expect(jab?.startup).toBe(10);
    });

    test('nothing is faster than 10 frames', () => {
      for (const m of rootStrikes) expect(m.startup, m.id).toBeGreaterThanOrEqual(10);
    });

    test('stun values are positive (frame data is reachable)', () => {
      for (const m of strikes) {
        const rem = m.active - 1 + m.recovery;
        expect(m.onBlock + rem, `${m.id} block stun`).toBeGreaterThanOrEqual(1);
        if (typeof m.onHit === 'number') expect(m.onHit + rem, `${m.id} hit stun`).toBeGreaterThanOrEqual(1);
      }
    });

    test('knockdown/launch moves start in 15 frames or slower', () => {
      for (const m of rootStrikes) if (m.onHit === 'kd') expect(m.startup, m.id).toBeGreaterThanOrEqual(15);
    });

    test('at most 20% of moves are safe launchers', () => {
      const safeLaunchers = strikes.filter((m) => m.onHit === 'kd' && m.onBlock > -10);
      expect(safeLaunchers.length / fighter.list.length).toBeLessThanOrEqual(0.2);
    });

    test('no move is fast, safe and long at once (pick two)', () => {
      for (const m of strikes) {
        const fast = m.startup <= 12;
        const safe = m.onBlock >= -9;
        const long = m.range >= 2.2 * U;
        expect(fast && safe && long, m.id).toBe(false);
      }
    });

    test('string links are valid', () => {
      for (const m of fighter.list) {
        for (const n of m.next) {
          expect(fighter.moves[n.move], `${m.id} -> ${n.move}`).toBeDefined();
          expect(n.cancel).toBeGreaterThan(m.startup);
          expect(n.cancel).toBeLessThanOrEqual(m.total);
        }
      }
    });

    test('throws exist on 1+3 and 2+4', () => {
      expect(fighter.cmd['1+3']).toBeDefined();
      expect(fighter.cmd['2+4']).toBeDefined();
    });
  });
}
