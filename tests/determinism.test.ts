import { expect, test } from 'vitest';
import { cloneState, hashState, step } from '../src/sim/sim';
import { prng, versus } from './helpers';

function inputs(seed: number, n: number): [number, number][] {
  const r = prng(seed);
  const out: [number, number][] = [];
  let a = 0;
  let b = 0;
  for (let i = 0; i < n; i++) {
    if (r() < 0.2) a = Math.floor(r() * 512);
    if (r() < 0.2) b = Math.floor(r() * 512);
    out.push([a, b]);
  }
  return out;
}
const play = (seed: number, f0: string, f1: string) => {
  const s = versus(f0, f1);
  for (const i of inputs(seed, 8000)) step(s, i);
  return hashState(s);
};

test('same inputs give the same state (3 runs, both fighters)', () => {
  const h = play(42, 'corvin', 'lynx');
  expect(play(42, 'corvin', 'lynx')).toBe(h);
  expect(play(42, 'corvin', 'lynx')).toBe(h);
  expect(play(43, 'corvin', 'lynx')).not.toBe(h);
});

test('cloned state continues identically (rollback-ready)', () => {
  const inp = inputs(7, 5000);
  const s = versus('lynx', 'corvin');
  for (let i = 0; i < 2500; i++) step(s, inp[i]);
  const c = cloneState(s);
  for (let i = 2500; i < 5000; i++) { step(s, inp[i]); step(c, inp[i]); }
  expect(hashState(c)).toBe(hashState(s));
});

test('random play: rounds progress, values stay sane', () => {
  const s = versus('corvin', 'lynx');
  let completed = 0;
  for (const i of inputs(99, 60 * 60 * 12)) {
    const before = s.wins[0] + s.wins[1];
    step(s, i);
    if (s.wins[0] + s.wins[1] > before) completed++;
    for (const f of s.f) {
      expect(Number.isInteger(f.x) && Number.isInteger(f.y)).toBe(true);
      expect(Math.abs(f.x)).toBeLessThanOrEqual(11000);
      expect(f.hp).toBeGreaterThanOrEqual(0);
      expect(f.meter).toBeLessThanOrEqual(1000);
    }
    if (s.phase === 'end') break;
  }
  expect(completed).toBeGreaterThan(0);
});
