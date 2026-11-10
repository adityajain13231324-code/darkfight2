// Absolute input bits (screen directions + four limb buttons).
export const UP = 1;
export const DOWN = 2;
export const LEFT = 4;
export const RIGHT = 8;
export const B1 = 16;
export const B2 = 32;
export const B3 = 64;
export const B4 = 128;
export const BTNS = B1 | B2 | B3 | B4;
export const BTN_BITS = [0, B1, B2, B3, B4];

export type Dir = '' | 'f' | 'b' | 'd' | 'df' | 'db' | 'u' | 'uf' | 'ub';

/** Direction relative to the way the fighter faces (f = toward opponent). */
export function relDir(bits: number, facing: number): Dir {
  const fwdBit = facing > 0 ? RIGHT : LEFT;
  const backBit = facing > 0 ? LEFT : RIGHT;
  let f = (bits & fwdBit) !== 0;
  let b = (bits & backBit) !== 0;
  if (f && b) { f = false; b = false; }
  let u = (bits & UP) !== 0;
  let d = (bits & DOWN) !== 0;
  if (u && d) { u = false; d = false; }
  return ((u ? 'u' : d ? 'd' : '') + (f ? 'f' : b ? 'b' : '')) as Dir;
}

/** Bits for a relative direction string. */
export function dirBits(dir: string, facing: number): number {
  const fwdBit = facing > 0 ? RIGHT : LEFT;
  const backBit = facing > 0 ? LEFT : RIGHT;
  let bits = 0;
  if (dir.includes('u')) bits |= UP;
  if (dir.includes('d')) bits |= DOWN;
  if (dir.includes('f')) bits |= fwdBit;
  if (dir.includes('b')) bits |= backBit;
  return bits;
}
