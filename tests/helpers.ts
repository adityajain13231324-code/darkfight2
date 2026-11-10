import { createState, step } from '../src/sim/sim';
import type { GameState } from '../src/sim/types';
export { A, K, R, M, S, DOWN, UP, LEFT, RIGHT, cmdBits, dirBits } from '../src/sim/input';

export function training(f0 = 'corvin', f1 = 'corvin'): GameState {
  const s = createState({ mode: 'training', fighters: [f0, f1], roundsToWin: 2 });
  s.infiniteHp = false;
  return s;
}
export function versus(f0 = 'corvin', f1 = 'corvin'): GameState {
  return createState({ mode: 'versus', fighters: [f0, f1], roundsToWin: 2 });
}
export function run(s: GameState, frames: number, p1 = 0, p2 = 0): void {
  for (let i = 0; i < frames; i++) step(s, [p1, p2]);
}
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
/** Input frames for a command, held long enough for the chord window. */
export function commandFrames(cmd: string, facing: number, bits: (c: string, f: number) => number): number[] {
  if (cmd.startsWith('f,f+')) {
    const f = bits('f', facing);
    return [f, 0, bits(cmd, facing), bits(cmd, facing)];
  }
  const b = bits(cmd, facing);
  return [b, b, b];
}
