import { describe, expect, test } from 'vitest';
import { ROSTER, type MoveC } from '../src/data/roster';
import { step } from '../src/sim/sim';
import { DOWN, RIGHT } from '../src/sim/input';
import { commandFrames, run, trainingState } from './helpers';
import type { GameState } from '../src/sim/types';

/** Play a move against a dummy and measure the real frame advantage. */
function measure(m: MoveC, mode: 'hit' | 'block'): { value: number; kind: string; move: string } | null {
  const s = trainingState();
  const a = s.f[0];
  const d = s.f[1];
  a.x = -1000;
  const gap = Math.max(0, Math.min(m.range - 50, 500) - m.advance);
  d.x = a.x + 900 + gap;
  d.guard = mode === 'block';
  // P2 faces left, so "back" for P2 is RIGHT.
  const dIn = mode === 'block' && m.level === 'L' ? DOWN | RIGHT : 0;
  run(s, 6, 0, dIn);
  for (const bits of commandFrames(m.cmd, a.facing)) step(s, [bits, dIn]);
  s.lastAdv = null;
  for (let i = 0; i < 300 && !s.lastAdv; i++) step(s, [0, dIn]);
  const res = s.lastAdv as GameState["lastAdv"];
  return res ? { value: res.value, kind: res.kind, move: res.move } : null;
}

const fighter = ROSTER.corvin;
const testable = fighter.list.filter((m) => m.root && m.level !== 'T');

describe('frame data matches the table (Corvin)', () => {
  for (const m of testable) {
    test(`${m.cmd} ${m.name}: ${m.onBlock} on block`, () => {
      const r = measure(m, 'block');
      expect(r, 'move never resolved').not.toBeNull();
      expect(r!.move).toBe(m.id);
      expect(r!.kind).toBe('block');
      expect(r!.value).toBe(m.onBlock);
    });
    if (typeof m.onHit === 'number') {
      test(`${m.cmd} ${m.name}: ${m.onHit} on hit`, () => {
        const r = measure(m, 'hit');
        expect(r).not.toBeNull();
        expect(r!.move).toBe(m.id);
        expect(r!.kind).toBe('hit');
        expect(r!.value).toBe(m.onHit);
      });
    } else {
      test(`${m.cmd} ${m.name}: knocks down on hit`, () => {
        const r = measure(m, 'hit');
        expect(r).not.toBeNull();
        expect(r!.move).toBe(m.id);
        expect(Number.isNaN(r!.value)).toBe(true);
      });
    }
  }
});

describe('strings', () => {
  test('1,2 is a natural combo on hit', () => {
    const s = trainingState();
    s.f[0].x = -1000; s.f[1].x = -1000 + 900 + 400; s.f[1].guard = false;
    run(s, 4);
    const B1 = 16, B2 = 32;
    step(s, [B1, 0]);
    run(s, 4);
    step(s, [B2, 0]);
    let hits = 0;
    for (let i = 0; i < 60; i++) { step(s, [0, 0]); hits += s.events.filter((e) => e.type === 'hit').length; }
    expect(hits).toBe(2);
    expect(s.f[1].hp).toBe(200 - 7 - 11);
  });
});
