// Render-side posing: maps sim state to a pose, evaluated at fractional ticks for smoothness.
import { arms, KD_AIR, LYING, R } from '../content/author';
import { sampleMove } from '../content/clips';
import { legsAt, lerpPose, type Pose } from '../content/rig';
import { ROSTER } from '../content/roster';
import * as C from '../sim/constants';
import type { Fighter } from '../sim/types';

const ease = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const mix = (a: Pose, b: Partial<Pose>, t: number): Pose => lerpPose(a, { ...a, ...b }, t);

export function poseFor(f: Fighter, alpha: number, time: number): Pose {
  const fd = ROSTER[f.fid];
  const def = fd.def;
  const S = def.stance;
  const CR = def.crouch;
  const rig = def.rig;
  const [ffx, frx, fh] = def.feet;
  const t = f.t + alpha;
  const claws = rig.weapon === 'claws';
  const guardArms = claws ? arms(4, [70, 150], [45, 140], 20) : { ...R(2, 25, 120, 175), fUA: 60, fFA: 80 };

  switch (f.act) {
    case 'idle': {
      // Weighted fighting-stance bounce: knees pump, torso and guard breathe on a slower cycle.
      const b = Math.sin(time * 2.8);
      const br = Math.sin(time * 1.4);
      return { ...S, ...legsAt(rig, ffx, frx, fh - 0.06 - (b * 0.5 + 0.5) * 0.06), lean: S.lean + 1.5 + b * 1.6, head: S.head - b * 1.2, fUA: S.fUA + br * 3, fFA: S.fFA - br * 2, rUA: S.rUA - br * 2, twist: S.twist + br * 0.04 };
    }
    case 'walkF':
    case 'walkB': {
      // Planted feet: each foot stays fixed in world space while it supports the body.
      const stride = 0.95 * rig.scale;
      const dist = (f.x / 1000) * f.facing;
      const foot = (offset: number) => {
        const ph = (((dist / stride + offset) % 1) + 1) % 1;
        if (ph < 0.5) return { x: stride * (0.25 - ph), y: 0 };
        const u = (ph - 0.5) / 0.5;
        return { x: stride * (-0.25 + u * 0.5), y: Math.sin(u * Math.PI) * 0.16 };
      };
      const a = foot(0);
      const b = foot(0.5);
      const bob = Math.abs(Math.sin(((dist / stride) % 1) * Math.PI * 2)) * 0.04;
      return { ...S, ...legsAt(rig, ffx + a.x, frx + b.x, fh - 0.02 - bob, a.y, b.y), lean: S.lean + (f.act === 'walkF' ? 4 : -2), twist: S.twist + (a.x - b.x) * 0.15 };
    }
    case 'crouch': return lerpPose(S, CR, ease(clamp01(t / 4)));
    case 'dash': {
      const u = clamp01(t / C.DASH_T);
      return mix(S, { lean: S.lean + 16 * (1 - u), ...legsAt(rig, ffx + 0.35 * (1 - u), frx - 0.3 * (1 - u), fh - 0.18 * (1 - u)) }, 1);
    }
    case 'backdash': {
      const u = clamp01(t / C.BDASH_T);
      return mix(S, { lean: S.lean - 12 * (1 - u), ...legsAt(rig, ffx - 0.1, frx - 0.35 * (1 - u), fh - 0.1 * (1 - u), 0, Math.sin(u * Math.PI) * 0.2) }, 1);
    }
    case 'jump': {
      if (f.t < C.JUMP_PRE) return lerpPose(S, CR, 0.6 * ease(clamp01(t / C.JUMP_PRE)));
      const air = (2 * C.JUMP_V) / C.GRAVITY;
      const u = clamp01((t - C.JUMP_PRE) / air);
      const tuckAmt = Math.sin(u * Math.PI); // tight tuck at the top, open for landing
      const tucked = { ...S, fTh: 115, fSh: -145, rTh: 100, rSh: -140, lean: S.lean + 25, fUA: 60, fFA: 90, rUA: 40, rFA: 100 } as Pose;
      const open = { ...S, fTh: 40, fSh: -60, rTh: 5, rSh: -50 } as Pose;
      const p = lerpPose(open, tucked, tuckAmt * (f.jumpDir === 0 ? 0.7 : 1));
      // Forward jump = front flip, back jump = back flip (one full turn), neutral = tuck.
      const flip = f.jumpDir === 0 ? 0 : ease(clamp01((u - 0.08) / 0.84)) * 360 * (f.jumpDir > 0 ? -1 : 1);
      return { ...p, rot: flip };
    }
    case 'land': return lerpPose(lerpPose(S, CR, 0.6), S, ease(clamp01(t / (C.LAND_T + 1))));
    case 'move': {
      const m = def.moves.find((x) => x.id === f.move);
      if (!m) return S;
      const total = m.startup + m.active - 1 + m.recovery;
      return sampleMove(m, S, Math.min(t, total));
    }
    case 'blockstun': {
      const base = f.crouchStun ? { ...CR, ...guardArms, lean: CR.lean } : { ...S, ...guardArms };
      const k = Math.max(0, 1 - t / 6);
      return { ...base, lean: base.lean - 8 * k, px: -0.08 * k } as Pose;
    }
    case 'hitstun': {
      const heavy = f.heavy ? 1.5 : 1;
      let react: Partial<Pose>;
      if (f.crouchStun) react = { ...CR, lean: CR.lean + 18 * heavy, head: 20 };
      else if (f.hitLoc === 0) react = { lean: -18 * heavy, head: -30 * heavy, fUA: S.fUA - 30, rUA: S.rUA - 25, px: -0.1 };
      else if (f.hitLoc === 2) react = { lean: 14 * heavy, head: 12, ...legsAt(rig, ffx - 0.25, frx, fh - 0.25), px: -0.05 };
      else react = { lean: 30 * heavy, head: 22, fUA: 10, fFA: 50, ...legsAt(rig, ffx - 0.1, frx - 0.1, fh - 0.12), px: -0.12 };
      const total = Math.max(1, f.stun);
      const into = ease(clamp01(t / 2.5));
      const out = t > total * 0.55 ? ease(clamp01((t - total * 0.55) / (total * 0.45))) : 0;
      const p = mix(S, react, into);
      return lerpPose(p, f.crouchStun ? CR : S, out);
    }
    case 'air': {
      const spin = Math.min(100, 25 + t * 3.2);
      return { ...S, ...KD_AIR, rot: spin, lean: -10 + Math.sin(t * 0.3) * 6 } as Pose;
    }
    case 'splat': return { ...S, rot: -8, lean: -14, head: -20, fUA: -40, fFA: 20, rUA: -60, rFA: 30, ...legsAt(rig, 0.2, -0.3, fh - 0.1) } as Pose;
    case 'kdGround': {
      const bounce = t < 6 ? Math.sin((t / 6) * Math.PI) * 6 : 0;
      return { ...S, ...LYING, rot: 90 - bounce } as Pose;
    }
    case 'getup': {
      const k = t / C.GETUP_T;
      const lying = { ...S, ...LYING } as Pose;
      return k < 0.5 ? lerpPose(lying, CR, ease(k / 0.5)) : lerpPose(CR, S, ease((k - 0.5) / 0.5));
    }
    case 'roll': {
      const k = clamp01(t / C.ROLL_T);
      const tucked = { ...CR, fTh: 110, fSh: -140, rTh: 100, rSh: -140, lean: 40 } as Pose;
      const p = k < 0.8 ? tucked : lerpPose(tucked, CR, ease((k - 0.8) / 0.2));
      return { ...p, rot: k < 0.8 ? 360 * ease(k / 0.8) : 0 }; // wake-up back roll
    }
    case 'rollF':
    case 'rollB': {
      const T = f.act === 'rollF' ? C.ROLLF_T : C.ROLLB_T;
      const k = clamp01(t / T);
      const tucked = { ...CR, fTh: 115, fSh: -145, rTh: 105, rSh: -145, lean: 45, fUA: 50, fFA: 80, rUA: 30, rFA: 90 } as Pose;
      const enter = ease(clamp01(k / 0.15));
      const exit = ease(clamp01((k - 0.78) / 0.22));
      const body = exit > 0 ? lerpPose(tucked, CR, exit) : lerpPose(CR, tucked, enter);
      const spin = ease(clamp01((k - 0.08) / 0.72)) * 360 * (f.act === 'rollF' ? -1 : 1);
      return { ...body, rot: k >= 0.8 ? 0 : spin };
    }
    case 'throwClinch': return mix(S, claws ? arms(16, [88, 100], [84, 96], 20) : { ...R(16, 85, 95, 175), fUA: 76, fFA: 10 }, 1);
    case 'thrownClinch': return mix(S, { lean: 20, head: 18, px: -0.05 }, 1);
    case 'throwExec': {
      const k = t / C.THROW_EXEC_T;
      const pull = { lean: -12, fUA: 150, fFA: 10, rUA: 140, rFA: 10, twist: 0.8 };
      const slam = { lean: 34, fUA: 40, fFA: 10, rUA: 50, rFA: 10, ...legsAt(rig, ffx + 0.3, frx - 0.2, fh - 0.2) };
      if (k < 0.45) return mix(S, pull, ease(k / 0.45));
      if (k < 0.6) return lerpPose(mix(S, pull, 1), mix(S, slam, 1), ease((k - 0.45) / 0.15));
      return lerpPose(mix(S, slam, 1), S, ease((k - 0.6) / 0.4));
    }
    case 'thrownExec': return { ...S, ...KD_AIR, rot: 140 * clamp01(t / C.THROW_SLAM) } as Pose;
    case 'throwBreak': return lerpPose(mix(S, { lean: -16, px: -0.1, fUA: 10 }, 1), S, ease(clamp01(t / C.BREAK_T)));
    case 'win': {
      const k = ease(clamp01(t / 30));
      const winPose = claws ? arms(-6, [150, 175], [20, 60], 0) : { ...R(-4, 170, 175, 178), fUA: 20, fFA: 30 };
      return mix(S, { ...winPose, ...legsAt(rig, ffx - 0.15, frx + 0.1, fh + 0.05) }, k);
    }
    default: return S;
  }
}

export function animKey(f: Fighter): string {
  return f.act === 'move' ? 'm:' + f.move : f.act;
}
