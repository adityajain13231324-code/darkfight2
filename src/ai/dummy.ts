// Practice partners. Bots only produce inputs a human could, from the visible state.
import { ROSTER } from '../data/roster';
import { ACTIONABLE } from '../sim/sim';
import { B1, B2, B3, B4, DOWN, LEFT, RIGHT, dirBits } from '../sim/input';
import type { GameState } from '../sim/types';

export type DummyMode = 'stand' | 'crouch' | 'guard' | 'crouchGuard' | 'autoGuard' | 'jab' | 'spar';

export const DUMMY_LABELS: Record<DummyMode, string> = {
  stand: 'Stand (no guard)',
  crouch: 'Crouch (no guard)',
  guard: 'Stand guard',
  crouchGuard: 'Crouch guard',
  autoGuard: 'Auto guard',
  jab: 'Jab every second',
  spar: 'Sparring bot',
};

export function dummyGuards(mode: DummyMode): boolean {
  return mode !== 'stand' && mode !== 'crouch' && mode !== 'jab';
}

function hash(n: number): number {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

const SPAR_MOVES: { cmd: string; w: number }[] = [
  { cmd: '1', w: 5 }, { cmd: '2', w: 3 }, { cmd: '3', w: 2 }, { cmd: '4', w: 2 }, { cmd: 'df+1', w: 3 },
  { cmd: 'd+3', w: 2 }, { cmd: 'df+2', w: 1 }, { cmd: 'f+2', w: 1 }, { cmd: 'b+4', w: 2 }, { cmd: 'db+2', w: 1 },
  { cmd: '1+3', w: 1 }, { cmd: '2+4', w: 1 }, { cmd: 'd+1', w: 2 },
];
const SPAR_TOTAL = SPAR_MOVES.reduce((a, m) => a + m.w, 0);

function cmdBits(cmd: string, facing: number): number {
  let bits = 0;
  let dir = '';
  for (const p of cmd.split('+')) {
    if (/^[udfb]+$/.test(p)) dir = p;
    else bits |= [0, B1, B2, B3, B4][Number(p)];
  }
  return bits | dirBits(dir, facing);
}

export function dummyInput(s: GameState, i: number, mode: DummyMode, breakThrows: boolean): number {
  const f = s.f[i];
  const o = s.f[1 - i];
  const back = f.facing > 0 ? LEFT : RIGHT;
  if (breakThrows && f.act === 'thrownClinch' && f.t === 5) return s.throwSide === 1 ? B1 : B2;
  switch (mode) {
    case 'stand': return 0;
    case 'crouch': return DOWN | (f.facing > 0 ? RIGHT : LEFT);
    case 'guard': return back;
    case 'crouchGuard': return DOWN | back;
    case 'autoGuard': {
      if (o.act === 'move') {
        const m = ROSTER[o.fid].moves[o.move];
        if (m?.level === 'L') return DOWN | back;
      }
      return back;
    }
    case 'jab': return ACTIONABLE.has(f.act) && s.frame % 60 === 0 ? B1 : 0;
    case 'spar': return spar(s, i);
  }
}

/** A simple sparring partner: spaces, pokes, guards on reaction (12 frames). */
function spar(s: GameState, i: number): number {
  const f = s.f[i];
  const o = s.f[1 - i];
  const back = f.facing > 0 ? LEFT : RIGHT;
  const fwd = f.facing > 0 ? RIGHT : LEFT;
  const gap = (Math.abs(f.x - o.x) - 900) / 1000;
  const r = hash(s.frame * 31 + i * 7919);
  if (o.act === 'move') {
    const m = ROSTER[o.fid].moves[o.move];
    // decide once per opponent move whether this bot "reads" it
    const reads = hash(s.frame - o.t + 17) < 0.65;
    if (m && o.t >= 12 && o.t <= m.startup + m.active && reads) return m.level === 'L' ? DOWN | back : back;
  }
  if (f.act === 'blockstun') return back;
  if (!ACTIONABLE.has(f.act)) return 0;
  if (f.prevIn & (B1 | B2 | B3 | B4)) return 0; // release between presses
  // Movement decisions are held for ~18 frames so the bot doesn't jitter into dashes.
  const plan = hash(Math.floor(s.frame / 18) * 97 + i * 13);
  if (gap > 2.0) return plan < 0.15 ? 0 : fwd;
  if (r < 0.06) {
    let pick = hash(s.frame * 13 + 5) * SPAR_TOTAL;
    for (const m of SPAR_MOVES) {
      pick -= m.w;
      if (pick <= 0) return cmdBits(m.cmd, f.facing);
    }
  }
  if (gap < 0.6) return plan < 0.4 ? back : 0;
  return plan < 0.25 ? back : plan > 0.85 ? fwd : 0;
}
