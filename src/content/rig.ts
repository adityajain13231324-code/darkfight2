// Pure rig math shared by the renderer and the hitbox baker. No DOM, no Pixi.
// Angles in degrees. Limbs: 0 = straight down, positive = toward the opponent.
// Children (forearm, shin, weapon) are relative to their parent.

export interface Pose {
  lean: number;  // torso tilt, + forward
  head: number;  // head tilt relative to torso
  twist: number; // shoulder/hip rotation 0..1 (front shoulder reaches forward)
  fUA: number; fFA: number; rUA: number; rFA: number; wpn: number;
  fTh: number; fSh: number; rTh: number; rSh: number;
  rot: number;   // whole-body rotation, + = falling backward
  px: number;    // visual pelvis shift forward (units)
}
export const POSE_KEYS: (keyof Pose)[] = ['lean', 'head', 'twist', 'fUA', 'fFA', 'rUA', 'rFA', 'wpn', 'fTh', 'fSh', 'rTh', 'rSh', 'rot', 'px'];

export type WeaponKind = 'sabre' | 'claws' | 'fans' | 'cleaver' | 'greatsword' | 'katana';
export interface Rig {
  scale: number;
  thigh: number; shin: number; torso: number; ua: number; fa: number;
  weapon: WeaponKind;
  weaponLen: number;
}

export type V = [number, number];
export interface Joints {
  pelvis: V; neck: V; head: V; fShoulder: V; rShoulder: V;
  fElbow: V; fHand: V; rElbow: V; rHand: V;
  fHip: V; rHip: V; fKnee: V; fFoot: V; rKnee: V; rFoot: V; fToe: V; rToe: V;
  tip: V; fTip: V; up: V; rot: number; headR: number;
}
const JOINT_POINTS: (keyof Joints)[] = ['pelvis', 'neck', 'head', 'fShoulder', 'rShoulder', 'fElbow', 'fHand', 'rElbow', 'rHand', 'fHip', 'rHip', 'fKnee', 'fFoot', 'rKnee', 'rFoot', 'fToe', 'rToe', 'tip', 'fTip'];

const DEG = Math.PI / 180;
const dir = (a: number): V => [Math.sin(a * DEG), -Math.cos(a * DEG)];
const add = (a: V, b: V, s = 1): V => [a[0] + b[0] * s, a[1] + b[1] * s];

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const o = {} as Pose;
  for (const k of POSE_KEYS) o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
}

/** Two-bone leg IK: hip at (hx, 0), foot target relative to the pelvis. Knee bends forward. */
export function legIK(hx: number, foot: V, thigh: number, shin: number): [number, number] {
  let dx = foot[0] - hx;
  let dy = foot[1];
  let d = Math.hypot(dx, dy);
  const max = (thigh + shin) * 0.999;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  const base = Math.atan2(dx, -dy) / DEG;
  const cosA = Math.max(-1, Math.min(1, (thigh * thigh + d * d - shin * shin) / (2 * thigh * d)));
  const th = base + Math.acos(cosA) / DEG;
  const kx = hx + Math.sin(th * DEG) * thigh;
  const ky = -Math.cos(th * DEG) * thigh;
  const shAbs = Math.atan2(hx + dx - kx, -(dy - ky)) / DEG;
  return [th, shAbs - th];
}

/** Leg angles for feet planted at given local x, with the pelvis at height h. */
export function legsAt(rig: Rig, fx: number, rx: number, h: number, fy = 0, ry = 0): Partial<Pose> {
  const T = rig.thigh * rig.scale;
  const S = rig.shin * rig.scale;
  const [fTh, fSh] = legIK(0.05, [fx, -h + fy], T, S);
  const [rTh, rSh] = legIK(-0.05, [rx, -h + ry], T, S);
  return { fTh, fSh, rTh, rSh };
}

/** Joint positions in local units: x toward the opponent, y up, lowest point on y=0. */
export function solve(p: Pose, rig: Rig): Joints {
  const k = rig.scale;
  const pelvis: V = [p.px, 0];
  const up: V = [Math.sin(p.lean * DEG), Math.cos(p.lean * DEG)];
  const fwd: V = [up[1], -up[0]];
  const neck = add(pelvis, up, rig.torso * k);
  const hd: V = [Math.sin((p.lean + p.head) * DEG), Math.cos((p.lean + p.head) * DEG)];
  const headR = 0.22 * k;
  const head = add(neck, hd, 0.16 * k + headR);
  const sh = add(neck, up, -0.1 * k);
  const fShoulder = add(sh, fwd, p.twist * 0.16 * k);
  const rShoulder = add(sh, fwd, -p.twist * 0.16 * k);
  const fUA = p.fUA + p.lean;
  const fFA = fUA + p.fFA;
  const fElbow = add(fShoulder, dir(fUA), rig.ua * k);
  const fHand = add(fElbow, dir(fFA), rig.fa * k);
  const rUA = p.rUA + p.lean;
  const rFA = rUA + p.rFA;
  const rElbow = add(rShoulder, dir(rUA), rig.ua * k);
  const rHand = add(rElbow, dir(rFA), rig.fa * k);
  const tip = add(rHand, dir(rFA + p.wpn), rig.weaponLen * k);
  const fTip = add(fHand, dir(fFA + p.wpn), (rig.weapon === 'claws' || rig.weapon === 'fans' ? rig.weaponLen : 0.05) * k);
  const hipOff = 0.05 + p.twist * 0.04;
  const fHip = add(pelvis, fwd, hipOff * k);
  const rHip = add(pelvis, fwd, -hipOff * k);
  const fKnee = add(fHip, dir(p.fTh), rig.thigh * k);
  const fFoot = add(fKnee, dir(p.fTh + p.fSh), rig.shin * k);
  const rKnee = add(rHip, dir(p.rTh), rig.thigh * k);
  const rFoot = add(rKnee, dir(p.rTh + p.rSh), rig.shin * k);
  // Toes point forward, or along the shin when the leg is extended in a kick.
  const toeDir = (th: number, shAbs: number): V => {
    const ext = Math.max(0, Math.min(1, (Math.abs(th) - 45) / 40));
    const flat: V = [1, 0];
    const along = dir(shAbs);
    const v: V = [flat[0] * (1 - ext) + along[0] * ext, flat[1] * (1 - ext) + along[1] * ext];
    const l = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / l, v[1] / l];
  };
  const fToe = add(fFoot, toeDir(p.fTh, p.fTh + p.fSh), 0.24 * k);
  const rToe = add(rFoot, toeDir(p.rTh, p.rTh + p.rSh), 0.22 * k);
  const j: Joints = { pelvis, neck, head, fShoulder, rShoulder, fElbow, fHand, rElbow, rHand, fHip, rHip, fKnee, fFoot, rKnee, rFoot, fToe, rToe, tip, fTip, up, rot: p.rot, headR };
  if (p.rot) {
    const c = Math.cos(p.rot * DEG);
    const s = Math.sin(p.rot * DEG);
    for (const key of JOINT_POINTS) {
      const v = j[key] as V;
      j[key] = [v[0] * c - v[1] * s, v[0] * s + v[1] * c] as never;
    }
    j.up = [up[0] * c - up[1] * s, up[0] * s + up[1] * c];
  }
  const legMin = Math.min(j.fKnee[1], j.fFoot[1], j.rKnee[1], j.rFoot[1], j.fToe[1], j.rToe[1]);
  const bodyMin = Math.min(legMin, j.head[1] - headR, j.neck[1], j.fHand[1], j.rHand[1], j.fElbow[1], j.rElbow[1], j.pelvis[1] - 0.2);
  const w = Math.min(1, Math.abs(p.rot) / 60);
  const shift = -(legMin * (1 - w) + bodyMin * w) + 0.04;
  for (const key of JOINT_POINTS) (j[key] as V)[1] += shift;
  return j;
}

export type ShapeKind = 'weapon' | 'fClaw' | 'rClaw' | 'fHand' | 'fFoot' | 'rFoot';
/** The attacking segment for a move, in local units: [ax, ay, bx, by]. */
export function shapeSegment(j: Joints, kind: ShapeKind): [number, number, number, number] {
  switch (kind) {
    case 'weapon': return [j.rHand[0], j.rHand[1], j.tip[0], j.tip[1]];
    case 'rClaw': return [(j.rElbow[0] + j.rHand[0]) / 2, (j.rElbow[1] + j.rHand[1]) / 2, j.tip[0], j.tip[1]];
    case 'fClaw': return [(j.fElbow[0] + j.fHand[0]) / 2, (j.fElbow[1] + j.fHand[1]) / 2, j.fTip[0], j.fTip[1]];
    case 'fHand': return [j.fElbow[0], j.fElbow[1], j.fHand[0], j.fHand[1]];
    case 'fFoot': return [(j.fKnee[0] + j.fFoot[0]) / 2, (j.fKnee[1] + j.fFoot[1]) / 2, j.fToe[0], j.fToe[1]];
    case 'rFoot': return [(j.rKnee[0] + j.rFoot[0]) / 2, (j.rKnee[1] + j.rFoot[1]) / 2, j.rToe[0], j.rToe[1]];
  }
}
