// Absolute input bits: screen directions + five actions.
export const UP = 1;
export const DOWN = 2;
export const LEFT = 4;
export const RIGHT = 8;
export const A = 16;  // weapon attack (J)
export const K = 32;  // kick (K)
export const R = 64;  // ranged (L)
export const M = 128; // magic (U)
export const S = 256; // signature (I)
export const BTNS = A | K | R | M | S;
export const BTN: Record<string, number> = { A, K, R, M, S };

export type Dir = '' | 'f' | 'b' | 'd' | 'df' | 'db' | 'u' | 'uf' | 'ub';

/** Direction relative to facing (f = toward opponent). Opposites cancel. */
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

/** Input bits for a command such as "df+A", "b+A+K", "f,f+A" (last step only). */
export function cmdBits(cmd: string, facing: number): number {
  const last = cmd.split(',').pop()!;
  let dir = '';
  let bits = 0;
  for (const p of last.split('+')) {
    if (/^[udfb]+$/.test(p)) dir = p;
    else if (BTN[p]) bits |= BTN[p];
  }
  return bits | dirBits(dir, facing);
}
