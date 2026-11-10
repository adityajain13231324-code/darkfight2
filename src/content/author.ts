// Authoring helpers: write arm angles as ABSOLUTE directions (0 down, 90 forward, 180 up),
// converted to the rig's relative angles. Legs are already absolute from the pelvis.
import type { Pose } from './rig';

/** Rear (weapon) arm with absolute angles. */
export function R(lean: number, ua: number, fa: number, w = fa): Partial<Pose> {
  return { lean, rUA: ua - lean, rFA: fa - ua, wpn: w - fa };
}
/** Front arm with absolute angles (needs the same lean as the pose). */
export function F(lean: number, ua: number, fa: number): Partial<Pose> {
  return { fUA: ua - lean, fFA: fa - ua };
}
/** Both arms + claw angle (claws use `wpn` on both hands). */
export function arms(lean: number, f: [number, number], r: [number, number], w = 0): Partial<Pose> {
  return { lean, fUA: f[0] - lean, fFA: f[1] - f[0], rUA: r[0] - lean, rFA: r[1] - r[0], wpn: w };
}
/** Leg angles directly: front thigh/shin, rear thigh/shin (shin given absolute). */
export function legs(fTh: number, fShAbs: number, rTh: number, rShAbs: number): Partial<Pose> {
  return { fTh, fSh: fShAbs - fTh, rTh, rSh: rShAbs - rTh };
}

export const LYING: Partial<Pose> = { rot: 90, lean: 0, head: 5, fTh: 15, fSh: -20, rTh: 30, rSh: -40, fUA: 160, fFA: 0, rUA: 120, rFA: 10, wpn: 30, twist: 0 };
export const KD_AIR: Partial<Pose> = { rot: 65, lean: -10, fTh: 60, fSh: -40, rTh: 40, rSh: -30, fUA: 140, fFA: 10, rUA: 120, rFA: 10, twist: 0 };
