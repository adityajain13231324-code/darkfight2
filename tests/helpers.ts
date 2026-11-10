import { createState, step } from '../src/sim/sim';
import type { GameState } from '../src/sim/types';
import { B1, B2, B3, B4, BTN_BITS, dirBits } from '../src/sim/input';

export { B1, B2, B3, B4 };

/** Input frames for a command like "df+2", "f,f+2", "1+3" for a fighter facing `facing`. */
export function commandFrames(cmd: string, facing: number): number[] {
  if (cmd === 'f,f+2' || cmd.startsWith('f,f+')) {
    const btn = BTN_BITS[Number(cmd.slice(-1))];
    const f = dirBits('f', facing);
    return [f, 0, f | btn];
  }
  const parts = cmd.split('+');
  let dir = '';
  let bits = 0;
  for (const p of parts) {
    if (/^[udfb]+$/.test(p)) dir = p;
    else bits |= BTN_BITS[Number(p)];
  }
  return [dirBits(dir, facing) | bits];
}

export function trainingState(): GameState {
  const s = createState('training', ['corvin', 'corvin']);
  s.infiniteHp = false;
  return s;
}

export function run(s: GameState, frames: number, p1 = 0, p2 = 0): void {
  for (let i = 0; i < frames; i++) step(s, [p1, p2]);
}

/** Deterministic PRNG (mulberry32). */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
