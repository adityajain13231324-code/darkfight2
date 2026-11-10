import { expect, test } from 'vitest';
import { cloneState, createState, hashState, step } from '../src/sim/sim';
import { prng } from './helpers';

function randomInputs(seed: number, frames: number): [number, number][] {
  const r = prng(seed);
  const out: [number, number][] = [];
  let a = 0;
  let b = 0;
  for (let i = 0; i < frames; i++) {
    // Hold inputs for a few frames, like a human would.
    if (r() < 0.2) a = Math.floor(r() * 256);
    if (r() < 0.2) b = Math.floor(r() * 256);
    out.push([a, b]);
  }
  return out;
}

function play(seed: number, frames: number): number {
  const s = createState('versus', ['corvin', 'corvin']);
  for (const inp of randomInputs(seed, frames)) step(s, inp);
  return hashState(s);
}

test('same input log gives the same final state (3 runs)', () => {
  const h1 = play(42, 6000);
  const h2 = play(42, 6000);
  const h3 = play(42, 6000);
  expect(h2).toBe(h1);
  expect(h3).toBe(h1);
  expect(play(43, 6000)).not.toBe(h1);
});

test('a cloned state continues identically (rollback-ready)', () => {
  const inputs = randomInputs(7, 4000);
  const s = createState('versus', ['corvin', 'corvin']);
  for (let i = 0; i < 2000; i++) step(s, inputs[i]);
  const c = cloneState(s);
  for (let i = 2000; i < 4000; i++) { step(s, inputs[i]); step(c, inputs[i]); }
  expect(hashState(c)).toBe(hashState(s));
});

test('round counter and wins stay consistent', () => {
  const s = createState('versus', ['corvin', 'corvin']);
  let completed = 0;
  for (const inp of randomInputs(5, 60 * 60 * 10)) {
    const before = s.wins[0] + s.wins[1];
    step(s, inp);
    const after = s.wins[0] + s.wins[1];
    if (after > before) completed++;
    if (s.phase !== 'end') expect(s.round).toBe(completed + 1);
    if (s.phase === 'end') break;
  }
  expect(completed).toBeGreaterThan(0);
});

test('random play finishes rounds and matches', () => {
  const s = createState('versus', ['corvin', 'corvin']);
  for (const inp of randomInputs(99, 60 * 60 * 8)) step(s, inp);
  expect(s.round).toBeGreaterThan(1);
  for (const f of s.f) {
    expect(Number.isInteger(f.x)).toBe(true);
    expect(Math.abs(f.x)).toBeLessThanOrEqual(11000);
    expect(f.hp).toBeGreaterThanOrEqual(0);
  }
});
