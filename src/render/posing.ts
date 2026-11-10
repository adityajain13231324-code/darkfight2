// Render-side posing: maps sim state to a pose, evaluated at fractional ticks for smoothness.
// Nothing here is read by the simulation, so smoothing can never change inputs, hitboxes or rollback.
import { arms, KD_AIR, LYING, R } from '../content/author';
import { sampleMove } from '../content/clips';
import { legsAt, lerpPose, wrapDeg, type GroundMode, type Pose } from '../content/rig';
import { ROSTER } from '../content/roster';
import * as C from '../sim/constants';
import type { Fighter } from '../sim/types';

const ease = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const mix = (a: Pose, b: Partial<Pose>, t: number): Pose => lerpPose(a, { ...a, ...b }, t);

export interface PoseCtx {
  /** Accumulated walk phase in strides (facing-relative, continuous through reversals and facing flips). */
  walkPhase: number;
  /** 0..1 weight of the round-intro "ready" pose. */
  intro: number;
}

/** Vertical placement for this state (see GroundMode in rig.ts). */
export function groundFor(f: Fighter): { mode: GroundMode; blend: number } {
  if (f.act === 'jump' && f.t > C.JUMP_PRE) return { mode: 'free', blend: ease(clamp01((f.t - C.JUMP_PRE) / 6)) };
  if (f.act === 'move' && f.airMove) return { mode: 'free', blend: 1 };
  if (f.act === 'rollF' || f.act === 'rollB' || f.act === 'roll') return { mode: 'body', blend: 1 };
  return { mode: 'auto', blend: 1 };
}

export function poseFor(f: Fighter, alpha: number, time: number, ctx: PoseCtx): Pose {
  const fd = ROSTER[f.fid];
  const def = fd.def;
  const S = def.stance;
  const CR = def.crouch;
  const rig = def.rig;
  const A = def.anim ?? { idleRate: 2.5, idleBob: 0.04 };
  const [ffx, frx, fh] = def.feet;
  const t = f.t + alpha;
  const claws = rig.weapon === 'claws' || rig.weapon === 'fans';
  const guardPose: Partial<Pose> = A.guard ?? (claws ? arms(4, [70, 150], [45, 140], 20) : { ...R(2, 25, 120, 175), fUA: 60, fFA: 80 });
  const lean = S.lean;

  switch (f.act) {
    case 'idle': {
      // Fighting-stance rhythm: knees pump, torso and guard hand breathe on a slower, offset cycle.
      const b = Math.sin(time * A.idleRate);
      const br = Math.sin(time * A.idleRate * 0.5 + 1.1);
      const p: Pose = { ...S, ...legsAt(rig, ffx, frx, fh - A.idleBob * 0.8 - (b * 0.5 + 0.5) * A.idleBob), lean: lean + 1.2 + b * 1.4, head: S.head - b * 1.0, fUA: S.fUA + br * 3, fFA: S.fFA - br * 2, rUA: S.rUA - br * 2, twist: S.twist + br * 0.04 };
      return ctx.intro > 0 ? mix(p, A.intro ?? {}, ctx.intro) : p;
    }
    case 'walkF':
    case 'walkB': {
      // Planted feet: a foot stays fixed in the world while it supports the body, then lifts and swings.
      const stride = 0.95 * rig.scale;
      const ph = ctx.walkPhase;
      const foot = (offset: number) => {
        const q = (((ph + offset) % 1) + 1) % 1;
        if (q < 0.5) return { x: stride * (0.25 - q), y: 0 };
        const u = (q - 0.5) / 0.5;
        return { x: stride * (-0.25 + u * 0.5), y: Math.sin(u * Math.PI) * 0.16 };
      };
      const a = foot(0);
      const b = foot(0.5);
      // Pelvis rides over the supporting leg: lowest at double support, rises at mid-stance.
      const bob = Math.abs(Math.sin(ph * Math.PI * 2)) * 0.045;
      const sway = Math.sin(ph * Math.PI * 2) * 0.03;
      return { ...S, ...legsAt(rig, ffx + a.x, frx + b.x, fh - 0.03 + bob, a.y, b.y), lean: lean + (f.act === 'walkF' ? 4 : -3) + bob * 20, twist: S.twist + (a.x - b.x) * 0.15, px: sway };
    }
    case 'crouch': return lerpPose(S, CR, ease(clamp01(t / 4)));
    case 'dash': {
      const u = clamp01(t / C.DASH_T);
      const lunge = 1 - ease(u);
      return mix(S, { lean: lean + 16 * lunge, ...legsAt(rig, ffx + 0.35 * lunge, frx - 0.3 * lunge, fh - 0.18 * lunge), px: 0.05 * lunge }, 1);
    }
    case 'backdash': {
      const u = clamp01(t / C.BDASH_T);
      const k = 1 - ease(u);
      return mix(S, { lean: lean - 12 * k, ...legsAt(rig, ffx - 0.1, frx - 0.35 * k, fh - 0.1 * k, 0, Math.sin(u * Math.PI) * 0.2) }, 1);
    }
    case 'jump': {
      if (f.t < C.JUMP_PRE) return lerpPose(S, CR, 0.6 * ease(clamp01(t / C.JUMP_PRE)));
      // Airborne: pelvis follows the sim's root path; legs tuck at the apex and open again for landing.
      const air = (2 * C.JUMP_V) / C.GRAVITY;
      const u = clamp01((t - C.JUMP_PRE) / air);
      const tuckAmt = Math.sin(u * Math.PI);
      const tucked = { ...S, fTh: 115, fSh: -145, rTh: 100, rSh: -140, lean: lean + 25, fUA: 60, fFA: 90, rUA: 40, rFA: 100 } as Pose;
      const open = { ...S, ...legsAt(rig, ffx * 0.9, frx * 0.85, fh) } as Pose;
      const p = lerpPose(open, tucked, tuckAmt * (f.jumpDir === 0 ? 0.7 : 1));
      // Forward jump = front flip, back jump = back flip; one continuous full turn (never snaps at the end).
      const turn = f.jumpDir === 0 ? 0 : ease(clamp01((u - 0.06) / 0.8)) * 360 * (f.jumpDir > 0 ? -1 : 1);
      return { ...p, rot: turn };
    }
    case 'land': return lerpPose(lerpPose(S, CR, 0.7), S, ease(clamp01(t / (C.LAND_T + 1))));
    case 'move': {
      const m = def.moves.find((x) => x.id === f.move);
      if (!m) return S;
      const total = m.startup + m.active - 1 + m.recovery;
      const tt = Math.min(t, total);
      let p = sampleMove(m, S, tt);
      if (rig.grip === 'dual') {
        // Second weapon: the front hand follows the rear hand's path a few ticks later, so both hands
        // visibly work (alternating cuts) instead of a blade held still.
        const past = sampleMove(m, S, Math.max(0, tt - (A.lag ?? 3)));
        const w = ease(clamp01(tt / 4)) * clamp01((total - tt) / 6);
        p = { ...p, fUA: p.fUA + (past.rUA - p.fUA) * w, fFA: p.fFA + (past.rFA - p.fFA) * w };
      }
      return p;
    }
    case 'blockstun': {
      const base = f.crouchStun ? ({ ...CR, ...guardPose } as Pose) : ({ ...S, ...guardPose } as Pose);
      const k = Math.max(0, 1 - t / 6);
      return { ...base, lean: base.lean - 8 * k, px: -0.08 * k };
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
      return lerpPose(mix(S, react, into), f.crouchStun ? CR : S, out);
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
      // wake-up back roll
      const k = clamp01(t / C.ROLL_T);
      const tucked = { ...CR, fTh: 110, fSh: -140, rTh: 100, rSh: -140, lean: 40 } as Pose;
      const body = k < 0.85 ? tucked : lerpPose(tucked, CR, ease((k - 0.85) / 0.15));
      return { ...body, rot: wrapDeg(360 * ease(clamp01(k / 0.85))) };
    }
    case 'rollF':
    case 'rollB': {
      const T = f.act === 'rollF' ? C.ROLLF_T : C.ROLLB_T;
      const k = clamp01(t / T);
      const tucked = { ...CR, fTh: 115, fSh: -145, rTh: 105, rSh: -145, lean: 45, fUA: 50, fFA: 80, rUA: 30, rFA: 90 } as Pose;
      const enter = ease(clamp01(k / 0.15));
      const exit = ease(clamp01((k - 0.78) / 0.22));
      const body = exit > 0 ? lerpPose(tucked, CR, exit) : lerpPose(CR, tucked, enter);
      // One continuous somersault that finishes exactly on a full turn; wrapDeg keeps 360 == 0 (no snap).
      const spin = ease(clamp01((k - 0.06) / 0.72)) * 360 * (f.act === 'rollF' ? -1 : 1);
      return { ...body, rot: wrapDeg(spin) };
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
      const win = A.win ?? (claws ? arms(-6, [150, 175], [160, 178], 0) : { ...R(-4, 170, 175, 178), fUA: 20, fFA: 30 });
      return mix(S, { ...win, ...legsAt(rig, ffx - 0.15, frx + 0.1, fh + 0.05) }, k);
    }
    default: return S;
  }
}

export function animKey(f: Fighter): string {
  return f.act === 'move' ? 'm:' + f.move : f.act;
}

/** Blend time (seconds) for a change of state, chosen per action pair. Contact poses stay sharp. */
export function blendTime(from: string, to: string): number {
  const mv = (k: string) => k.startsWith('m:');
  const react = (k: string) => k === 'hitstun' || k === 'blockstun' || k === 'air' || k === 'splat' || k === 'kdGround';
  if (react(to)) return 0.012;                 // being hit snaps instantly
  if (mv(to)) return mv(from) ? 0.03 : from === 'jump' ? 0.03 : 0.022; // strings and attacks start sharply
  if (mv(from)) return 0.07;                   // recovery into neutral
  if (to === 'dash' || to === 'backdash') return 0.04;
  if (from === 'kdGround' && to === 'getup') return 0.05;
  if (to.startsWith('throw') || to === 'thrownClinch' || to === 'thrownExec') return 0.03;
  if ((from === 'idle' && to.startsWith('walk')) || (to === 'idle' && from.startsWith('walk'))) return 0.09;
  if (from === 'land' || from === 'getup') return 0.08;
  return 0.07;
}
