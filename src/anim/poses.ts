// Keyframe poses for the shared 2D rig. Angles in degrees.
// Limbs: 0 = pointing straight down, positive = rotating toward the opponent.
// Children (forearm, shin, weapon) are relative to their parent.
// lean: torso tilt (positive = forward). rot: whole-body rotation (positive = falling backward).
import { ROSTER } from '../data/roster';
import type { Fighter } from '../sim/types';
import * as C from '../sim/constants';

export interface Pose {
  lean: number; head: number;
  fUA: number; fFA: number; rUA: number; rFA: number; wpn: number;
  fTh: number; fSh: number; rTh: number; rSh: number;
  rot: number;
}
const KEYS: (keyof Pose)[] = ['lean', 'head', 'fUA', 'fFA', 'rUA', 'rFA', 'wpn', 'fTh', 'fSh', 'rTh', 'rSh', 'rot'];

export const GUARD: Pose = {
  lean: 8, head: -4, fUA: 35, fFA: 75, rUA: -5, rFA: 85, wpn: 35,
  fTh: 24, fSh: -10, rTh: -18, rSh: -8, rot: 0,
};
const P = (o: Partial<Pose>): Pose => ({ ...GUARD, ...o });
const CROUCH_LEGS: Partial<Pose> = { lean: 22, fTh: 85, fSh: -110, rTh: 15, rSh: -100 };
const Cr = (o: Partial<Pose>): Pose => ({ ...GUARD, ...CROUCH_LEGS, ...o });

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const o = {} as Pose;
  for (const k of KEYS) o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
}
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export type TrailKind = 'weapon' | 'fHand' | 'fFoot' | 'rFoot' | 'none';
interface MoveAnim { windup: Pose; strike: Pose; trail: TrailKind; crouchRecover?: boolean }

const CROUCH = Cr({});
const MOVE_ANIMS: Record<string, MoveAnim> = {
  jab: { windup: P({ fUA: 45, fFA: 95, lean: 10 }), strike: P({ fUA: 92, fFA: 2, lean: 16, head: 0, fTh: 30, rTh: -24 }), trail: 'fHand' },
  jab_cut: { windup: P({ rUA: -55, rFA: 130, wpn: 60, lean: 4 }), strike: P({ rUA: 95, rFA: 0, wpn: -5, lean: 20, fUA: 20, fFA: 60 }), trail: 'weapon' },
  slash: { windup: P({ rUA: 165, rFA: 25, wpn: 50, lean: -2 }), strike: P({ rUA: 75, rFA: 15, wpn: 10, lean: 18 }), trail: 'weapon' },
  slash_rise: { windup: P({ rUA: -35, rFA: 15, wpn: -30, lean: 18 }), strike: P({ rUA: 112, rFA: 5, wpn: 15, lean: 4 }), trail: 'weapon' },
  knee: { windup: P({ fTh: 75, fSh: -120, lean: -4 }), strike: P({ fTh: 88, fSh: -4, lean: -12 }), trail: 'fFoot' },
  highkick: { windup: P({ rTh: 50, rSh: -100, lean: -6 }), strike: P({ rTh: 125, rSh: 0, lean: -28, fTh: 10, fSh: -6 }), trail: 'rFoot' },
  bodyjab: { windup: P({ fUA: 40, fFA: 90, lean: 22, fTh: 45, fSh: -55 }), strike: P({ fUA: 80, fFA: 0, lean: 28, fTh: 50, fSh: -60, rTh: -30, rSh: -10 }), trail: 'fHand' },
  riser: { windup: Cr({ rUA: -25, rFA: 20, wpn: -50 }), strike: P({ rUA: 172, rFA: 0, wpn: 0, lean: -8, fTh: 15, fSh: -10 }), trail: 'weapon' },
  crouchjab: { windup: Cr({ fUA: 50, fFA: 90 }), strike: Cr({ fUA: 88, fFA: 0, lean: 28 }), trail: 'fHand', crouchRecover: true },
  shin: { windup: Cr({ fTh: 60, fSh: -100 }), strike: Cr({ fTh: 78, fSh: 8, lean: 10 }), trail: 'fFoot', crouchRecover: true },
  sweep: { windup: Cr({ rUA: -40, rFA: 30, wpn: 20 }), strike: Cr({ rUA: 62, rFA: 0, wpn: 2, lean: 30 }), trail: 'weapon', crouchRecover: true },
  chop: { windup: P({ rUA: 178, rFA: 30, wpn: 35, lean: -6 }), strike: P({ rUA: 72, rFA: 10, wpn: 4, lean: 28, fTh: 45, fSh: -50, rTh: -35, rSh: -5 }), trail: 'weapon' },
  longkick: { windup: P({ rTh: 60, rSh: -115, lean: -10 }), strike: P({ rTh: 96, rSh: 0, lean: -32, fTh: 5, fSh: -5 }), trail: 'rFoot' },
  lunge: { windup: P({ rUA: 40, rFA: 60, wpn: 20, lean: 20 }), strike: P({ rUA: 96, rFA: 0, wpn: -2, lean: 30, fTh: 60, fSh: -65, rTh: -45, rSh: 0 }), trail: 'weapon' },
  jumpkick: { windup: P({ fTh: 70, fSh: -110, rTh: 40, rSh: -100 }), strike: P({ fTh: 95, fSh: -2, rTh: 20, rSh: -110, lean: -18 }), trail: 'fFoot' },
  throwL: { windup: P({ fUA: 75, fFA: 30, rUA: 70, rFA: 35, wpn: 90, lean: 12 }), strike: P({ fUA: 92, fFA: 5, rUA: 88, rFA: 10, wpn: 90, lean: 22 }), trail: 'none' },
  throwR: { windup: P({ fUA: 75, fFA: 30, rUA: 70, rFA: 35, wpn: 90, lean: 12 }), strike: P({ fUA: 92, fFA: 5, rUA: 88, rFA: 10, wpn: 90, lean: 22 }), trail: 'none' },
};

const BLOCK_STAND = P({ fUA: 55, fFA: 115, rUA: 15, rFA: 100, wpn: 70, lean: 0, head: -8 });
const BLOCK_CROUCH = Cr({ fUA: 55, fFA: 115, rUA: 15, rFA: 100, wpn: 70, lean: 12 });
const HIT_HIGH = P({ lean: -22, head: -28, fUA: -15, fFA: 40, rUA: -25, rFA: 50, wpn: 60 });
const HIT_MID = P({ lean: 34, head: 18, fUA: 10, fFA: 60, rUA: 0, rFA: 40, fTh: 15, rTh: -28 });
const HIT_LOW = P({ lean: 15, fTh: 5, fSh: -40, head: 10 });
const HIT_CROUCH = Cr({ lean: 32, head: 15, fUA: 10, fFA: 50 });
const KD_AIR = P({ rot: 70, lean: -10, fTh: 60, fSh: -40, rTh: 40, rSh: -30, fUA: 140, fFA: 10, rUA: 120, rFA: 10 });
const LYING = P({ rot: 90, lean: 0, head: 5, fTh: 15, fSh: -20, rTh: 30, rSh: -40, fUA: 160, fFA: 0, rUA: 120, rFA: 10, wpn: 30 });
const JUMP = P({ fTh: 75, fSh: -105, rTh: 35, rSh: -95, lean: 5 });
const DASH = P({ lean: 24, fTh: 55, fSh: -50, rTh: -40, rSh: -20 });
const BACKDASH = P({ lean: -12, fTh: 5, fSh: -10, rTh: -40, rSh: -30 });
const CLINCH = P({ fUA: 80, fFA: 40, rUA: 70, rFA: 40, wpn: 90, lean: 18 });
const BREAK = P({ lean: -18, fUA: 20, fFA: 30, rUA: -20, rFA: 60 });
const WIN = P({ rUA: 165, rFA: 5, wpn: 0, lean: -4, fUA: 10, fFA: 20, fTh: 10, fSh: -5, rTh: -10, rSh: -5 });
const THROW_PULL = P({ lean: -15, fUA: 150, fFA: 10, rUA: 140, rFA: 20, wpn: 120 });
const THROW_SLAM = P({ lean: 35, fUA: 60, fFA: 10, rUA: 50, rFA: 20, wpn: 80, fTh: 50, fSh: -60 });

export function moveTrail(moveId: string): TrailKind {
  return MOVE_ANIMS[moveId]?.trail ?? 'none';
}

/** Target pose for a fighter in its current sim state (render only). */
export function poseFor(f: Fighter, time: number): Pose {
  const breathe = Math.sin(time * 2.2) * 1.4;
  switch (f.act) {
    case 'idle': return P({ lean: GUARD.lean + breathe, head: GUARD.head - breathe * 0.5, fUA: GUARD.fUA + breathe });
    case 'walkF':
    case 'walkB': {
      const ph = (f.x / 1000) * f.facing * 3.4;
      const sw = Math.sin(ph);
      return P({ fTh: GUARD.fTh + sw * 14, rTh: GUARD.rTh - sw * 14, fSh: -10 - Math.max(0, -sw) * 30, rSh: -8 - Math.max(0, sw) * 30, lean: f.act === 'walkF' ? 12 : 4 });
    }
    case 'crouch': return lerpPose(GUARD, CROUCH, clamp01((f.t + 1) / 4));
    case 'dash': return lerpPose(DASH, GUARD, clamp01(f.t / C.DASH_T) ** 2);
    case 'backdash': return lerpPose(BACKDASH, GUARD, clamp01(f.t / C.BDASH_T) ** 2);
    case 'jump': return f.t < C.JUMP_PRE ? lerpPose(GUARD, CROUCH, 0.5) : JUMP;
    case 'land': return lerpPose(CROUCH, GUARD, clamp01(f.t / C.LAND_T) * 0.6);
    case 'move': {
      const m = ROSTER[f.fid].moves[f.move];
      const a = MOVE_ANIMS[f.move];
      if (!m || !a) return GUARD;
      const rest = a.crouchRecover ? CROUCH : GUARD;
      const t = f.t;
      if (t < m.startup) {
        const k = t / m.startup;
        return k < 0.65 ? lerpPose(GUARD, a.windup, ease(k / 0.65)) : lerpPose(a.windup, a.strike, easeOut((k - 0.65) / 0.35));
      }
      if (t < m.startup + m.active) return a.strike;
      const r = (t - m.startup - m.active) / Math.max(1, m.recovery);
      return r < 0.3 ? a.strike : lerpPose(a.strike, rest, ease((r - 0.3) / 0.7));
    }
    case 'blockstun': return f.crouchStun ? BLOCK_CROUCH : lerpPose(BLOCK_STAND, P({ ...BLOCK_STAND, lean: -8 }), Math.max(0, 1 - f.t / 6));
    case 'hitstun': {
      const base = f.crouchStun ? HIT_CROUCH : f.hitLevel === 'H' ? HIT_HIGH : f.hitLevel === 'L' ? HIT_LOW : HIT_MID;
      const k = clamp01(f.t / Math.max(1, f.stun));
      return k < 0.6 ? base : lerpPose(base, f.crouchStun ? CROUCH : GUARD, ease((k - 0.6) / 0.4));
    }
    case 'kdAir': return lerpPose(f.hitLevel === 'L' ? HIT_LOW : HIT_HIGH, KD_AIR, clamp01(f.t / 10));
    case 'kdGround': return lerpPose(KD_AIR, LYING, clamp01(f.t / 5));
    case 'getup': {
      const k = f.t / C.GETUP_T;
      return k < 0.5 ? lerpPose(LYING, CROUCH, ease(k / 0.5)) : lerpPose(CROUCH, GUARD, ease((k - 0.5) / 0.5));
    }
    case 'throwClinch': return CLINCH;
    case 'thrownClinch': return lerpPose(HIT_MID, GUARD, 0.3);
    case 'throwExec': {
      const k = f.t / C.THROW_EXEC_T;
      return k < 0.45 ? lerpPose(CLINCH, THROW_PULL, ease(k / 0.45)) : k < 0.6 ? lerpPose(THROW_PULL, THROW_SLAM, ease((k - 0.45) / 0.15)) : lerpPose(THROW_SLAM, GUARD, ease((k - 0.6) / 0.4));
    }
    case 'thrownExec': return lerpPose(HIT_HIGH, P({ ...KD_AIR, rot: 100 }), clamp01(f.t / C.THROW_SLAM));
    case 'throwBreak': return lerpPose(BREAK, GUARD, clamp01(f.t / C.BREAK_T));
    case 'win': return lerpPose(GUARD, WIN, ease(clamp01(f.t / 30)));
    default: return GUARD;
  }
}

/** Key used to detect a change of animation (for short blends). */
export function animKey(f: Fighter): string {
  return f.act === 'move' ? 'm:' + f.move : f.act;
}
