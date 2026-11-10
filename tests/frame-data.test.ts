// Plays every grounded strike against a dummy: the MEASURED advantage must equal the
// published table, and the animation geometry must agree with the declared hit level.
import { describe, expect, test } from 'vitest';
import { ROSTER, type MoveC } from '../src/content/roster';
import { step } from '../src/sim/sim';
import type { GameState } from '../src/sim/types';
import { DOWN, RIGHT, cmdBits, commandFrames, run, training } from './helpers';

type Res = { value: number; kind: string; hitTick: number } | null;
type Mode = 'hit' | 'block' | 'crouch' | 'crouchBlock';

function trial(fid: string, m: MoveC, gap: number, mode: Mode): Res {
  const s = training(fid, 'corvin');
  s.f[0].x = -1500;
  s.f[1].x = -1500 + 900 + gap;
  s.f[1].guard = mode === 'block' || mode === 'crouchBlock';
  const dIn = mode === 'crouch' ? DOWN : mode === 'crouchBlock' ? DOWN | RIGHT : 0;
  run(s, 6, 0, dIn);
  let hitTick = -1;
  const frames = commandFrames(m.cmd, 1, cmdBits);
  for (let i = 0; i < 260; i++) {
    step(s, [i < frames.length ? frames[i] : 0, dIn]);
    if (hitTick === -1 && s.events.some((e) => (e.type === 'hit' || e.type === 'block') && e.p === 0)) {
      hitTick = s.f[0].act === 'move' && s.f[0].move === m.id ? s.f[0].t : -2;
    }
    const la = s.lastAdv as GameState['lastAdv'];
    if (hitTick !== -1 && la && la.move === m.id && la.since >= 0 && (la.kind === 'kd' || !Number.isNaN(la.value))) break;
  }
  const r = s.lastAdv as GameState['lastAdv'];
  if (hitTick === -1 || !r || r.move !== m.id) return null;
  return { value: r.value, kind: r.kind, hitTick };
}

function connectGap(fid: string, m: MoveC, mode: Mode): number | null {
  for (let gap = 0; gap <= 3200; gap += 50) {
    const r = trial(fid, m, gap, mode);
    if (r && r.hitTick === m.startup) return gap;
  }
  return null;
}

for (const fid of Object.keys(ROSTER)) {
  const fd = ROSTER[fid];
  const strikes = fd.list.filter((m) => m.root && m.strike && m.level !== 'T' && !m.air && m.cmd !== 'wake' && !m.cost);
  describe(`${fd.name}: frame data and hit levels`, () => {
    for (const m of strikes) {
      test(`${m.cmd} ${m.name}`, () => {
        const blockMode: Mode = m.level === 'L' ? 'crouchBlock' : 'block';
        const gb = connectGap(fid, m, blockMode);
        expect(gb, 'never connects on its first active tick when blocked').not.toBeNull();
        const b = trial(fid, m, gb!, blockMode)!;
        expect(b.kind).toBe('block');
        expect(b.value, 'on block').toBe(m.onBlock);
        const gh = connectGap(fid, m, 'hit');
        expect(gh, 'never connects on hit').not.toBeNull();
        const h = trial(fid, m, gh!, 'hit')!;
        if (typeof m.onHit === 'number') expect(h.value, 'on hit').toBe(m.onHit);
        else expect(h.kind).toBe('kd');
        const c = trial(fid, m, gh!, 'crouch');
        if (m.level === 'H') expect(c, 'highs must whiff crouchers').toBeNull();
        else expect(c, 'mids/lows must hit crouchers').not.toBeNull();
      });
    }
  });
}
