// Two rollback sessions over a simulated network (delay, jitter, ordered delivery).
// Both peers must end with identical confirmed state and no desync.
import { expect, test } from 'vitest';
import { RollbackSession, type NetMsg } from '../src/net/rollback';
import { createState, hashState, step } from '../src/sim/sim';
import { prng } from './helpers';

function runNet(rttMs: number, jitterMs: number, seconds: number, seed: number) {
  const opts = { mode: 'online' as const, fighters: ['corvin', 'lynx'] as [string, string], roundsToWin: 2 };
  let now = 0;
  const r = prng(seed);
  const queues: { at: number; m: NetMsg }[][] = [[], []];
  const lastAt = [0, 0];
  const mk = (to: number) => (m: NetMsg) => {
    // Ordered transport (like a WebSocket): never deliver before the previous message.
    const at = Math.max(lastAt[to], now + rttMs / 2 + r() * jitterMs);
    lastAt[to] = at;
    queues[to].push({ at, m: JSON.parse(JSON.stringify(m)) });
  };
  const a = new RollbackSession(0, opts, mk(1));
  const b = new RollbackSession(1, opts, mk(0));
  const inA = prng(seed + 1);
  const inB = prng(seed + 2);
  let ia = 0;
  let ib = 0;
  const frames = seconds * 60;
  for (let i = 0; i < frames; i++) {
    now = i * (1000 / 60);
    for (const [k, s] of [[0, a], [1, b]] as const) {
      while (queues[k].length && queues[k][0].at <= now) s.receive(queues[k].shift()!.m);
    }
    if (inA() < 0.15) ia = Math.floor(inA() * 512);
    if (inB() < 0.15) ib = Math.floor(inB() * 512);
    a.tick(ia);
    b.tick(ib);
  }
  // Drain the network and let both catch up with idle input.
  for (let i = 0; i < 120; i++) {
    now += 1000 / 60;
    for (const [k, s] of [[0, a], [1, b]] as const) while (queues[k].length && queues[k][0].at <= now) s.receive(queues[k].shift()!.m);
    a.tick(0); b.tick(0);
  }
  return { a, b, opts };
}

for (const [rtt, jitter] of [[40, 10], [100, 25], [180, 40]]) {
  test(`rollback stays in sync at ${rtt} ms RTT, ${jitter} ms jitter (60 s)`, () => {
    const { a, b, opts } = runNet(rtt, jitter, 60, rtt);
    expect(a.stats.desync).toBe(-1);
    expect(b.stats.desync).toBe(-1);
    // Replaying each side's confirmed input log from scratch gives the same state.
    const la = a.confirmedInputs();
    const lb = b.confirmedInputs();
    const n = Math.min(la.length, lb.length);
    expect(n).toBeGreaterThan(2000);
    expect(la.slice(0, n)).toEqual(lb.slice(0, n));
    const ra = createState(opts);
    for (let i = 0; i < n; i++) step(ra, la[i]);
    const rb = createState(opts);
    for (let i = 0; i < n; i++) step(rb, lb[i]);
    expect(hashState(ra)).toBe(hashState(rb));
    expect(a.stats.maxRollback).toBeLessThanOrEqual(8);
  });
}
