// Shared 2D skeletal rig: forward kinematics + silhouette drawing.
import type { Graphics } from 'pixi.js';
import type { Pose } from '../anim/poses';

export const PX = 64; // pixels per unit at zoom 1
const DEG = Math.PI / 180;
const LEN = { thigh: 0.95, shin: 0.95, torso: 1.2, neck: 0.16, headR: 0.22, ua: 0.62, fa: 0.58, sabre: 1.55 };

export type V = [number, number];
export interface Joints {
  pelvis: V; neck: V; head: V; shoulder: V;
  fElbow: V; fHand: V; rElbow: V; rHand: V;
  fHip: V; rHip: V; fKnee: V; fFoot: V; rKnee: V; rFoot: V;
  tip: V; pommel: V; bladeMid: V; topknot: V;
  up: V; rot: number;
}

const dir = (a: number): V => [Math.sin(a * DEG), -Math.cos(a * DEG)];
const add = (a: V, b: V, s = 1): V => [a[0] + b[0] * s, a[1] + b[1] * s];

/** Joint positions in local units: x toward the opponent, y up, feet on y=0. */
export function solve(p: Pose): Joints {
  const pelvis: V = [0, 0];
  const up: V = [Math.sin(p.lean * DEG), Math.cos(p.lean * DEG)];
  const neck = add(pelvis, up, LEN.torso);
  const hd: V = [Math.sin((p.lean + p.head) * DEG), Math.cos((p.lean + p.head) * DEG)];
  const head = add(neck, hd, LEN.neck + LEN.headR);
  const topknot = add(add(head, hd, 0.16), [-hd[1], hd[0]], 0.14);
  const shoulder = add(neck, up, -0.1);
  const fUA = p.fUA + p.lean;
  const fFA = fUA + p.fFA;
  const fElbow = add(shoulder, dir(fUA), LEN.ua);
  const fHand = add(fElbow, dir(fFA), LEN.fa);
  const rUA = p.rUA + p.lean;
  const rFA = rUA + p.rFA;
  const rElbow = add(shoulder, dir(rUA), LEN.ua);
  const rHand = add(rElbow, dir(rFA), LEN.fa);
  const wA = rFA + p.wpn;
  const tip = add(rHand, dir(wA), LEN.sabre);
  const bladeMid = add(rHand, dir(wA), LEN.sabre * 0.5);
  const pommel = add(rHand, dir(wA), -0.14);
  const fHip = add(pelvis, [0.05, 0]);
  const rHip = add(pelvis, [-0.05, 0]);
  const fKnee = add(fHip, dir(p.fTh), LEN.thigh);
  const fFoot = add(fKnee, dir(p.fTh + p.fSh), LEN.shin);
  const rKnee = add(rHip, dir(p.rTh), LEN.thigh);
  const rFoot = add(rKnee, dir(p.rTh + p.rSh), LEN.shin);
  const j: Joints = { pelvis, neck, head, shoulder, fElbow, fHand, rElbow, rHand, fHip, rHip, fKnee, fFoot, rKnee, rFoot, tip, pommel, bladeMid, topknot, up, rot: p.rot };
  const pts: (keyof Joints)[] = ['pelvis', 'neck', 'head', 'shoulder', 'fElbow', 'fHand', 'rElbow', 'rHand', 'fHip', 'rHip', 'fKnee', 'fFoot', 'rKnee', 'rFoot', 'tip', 'pommel', 'bladeMid', 'topknot'];
  if (p.rot) {
    const c = Math.cos(p.rot * DEG);
    const s = Math.sin(p.rot * DEG);
    for (const k of pts) {
      const v = j[k] as V;
      j[k] = [v[0] * c - v[1] * s, v[0] * s + v[1] * c] as never;
    }
    j.up = [up[0] * c - up[1] * s, up[0] * s + up[1] * c];
  }
  const legMin = Math.min(j.fKnee[1], j.fFoot[1], j.rKnee[1], j.rFoot[1]);
  const bodyMin = Math.min(legMin, j.head[1] - LEN.headR, j.neck[1], j.fHand[1], j.rHand[1], j.fElbow[1], j.rElbow[1], j.pelvis[1] - 0.2);
  const k = Math.min(1, Math.abs(p.rot) / 60);
  const shift = -(legMin * (1 - k) + bodyMin * k) + 0.05;
  for (const key of pts) {
    const v = j[key] as V;
    v[1] += shift;
  }
  return j;
}

export interface DrawOpts {
  x: number; // screen px of fighter origin (feet)
  y: number;
  facing: number;
  color: number;
  alpha: number;
  coat: number; // coat sway angle (deg)
  widthBoost?: number;
}

/** Draw the silhouette. Same call is used for the rim pass and the black body. */
export function drawFigure(g: Graphics, j: Joints, o: DrawOpts): void {
  const S = PX;
  const wb = o.widthBoost ?? 0;
  const tx = (v: V): V => [o.x + v[0] * o.facing * S, o.y - v[1] * S];
  const style = (w: number) => ({ width: (w + wb) * S, color: o.color, alpha: o.alpha, cap: 'round' as const, join: 'round' as const });
  const seg = (a: V, b: V, w: number) => {
    const A = tx(a);
    const B = tx(b);
    g.moveTo(A[0], A[1]).lineTo(B[0], B[1]).stroke(style(w));
  };
  const fill = { color: o.color, alpha: o.alpha };
  // Rear leg and arm
  seg(j.rHip, j.rKnee, 0.26); seg(j.rKnee, j.rFoot, 0.19);
  seg(j.rFoot, [j.rFoot[0] + 0.2 * Math.cos(j.rot * DEG), j.rFoot[1] + 0.2 * Math.sin(j.rot * DEG)], 0.1);
  seg(j.shoulder, j.rElbow, 0.17); seg(j.rElbow, j.rHand, 0.14);
  // Torso (tapered)
  const n: V = [j.up[1], -j.up[0]];
  const tw = 0.26 + wb / 2;
  const ww = 0.19 + wb / 2;
  const torso = [add(j.neck, n, tw), add(j.neck, n, -tw), add(j.pelvis, n, -ww), add(j.pelvis, n, ww)].map(tx).flat();
  g.poly(torso).fill(fill);
  g.circle(...tx(j.pelvis), (0.21 + wb / 2) * S).fill(fill);
  // Long coat
  const down: V = [-j.up[0], -j.up[1]];
  const ca = o.coat * DEG;
  const coatDir: V = [down[0] * Math.cos(ca) - down[1] * Math.sin(ca), down[0] * Math.sin(ca) + down[1] * Math.cos(ca)];
  const hem = add(j.pelvis, coatDir, 1.0);
  const coat = [add(j.pelvis, n, 0.2 + wb / 2), add(j.pelvis, n, -0.2 - wb / 2), add(hem, n, -0.36 - wb / 2), add(hem, n, 0.26 + wb / 2)].map(tx).flat();
  g.poly(coat).fill(fill);
  // Head, neck, topknot
  seg(j.neck, j.head, 0.14);
  g.circle(...tx(j.head), (0.22 + wb / 2) * S).fill(fill);
  g.circle(...tx(j.topknot), (0.085 + wb / 2) * S).fill(fill);
  // Front leg
  seg(j.fHip, j.fKnee, 0.27); seg(j.fKnee, j.fFoot, 0.2);
  seg(j.fFoot, [j.fFoot[0] + 0.22 * Math.cos(j.rot * DEG), j.fFoot[1] + 0.22 * Math.sin(j.rot * DEG)], 0.11);
  // Sabre
  seg(j.pommel, j.tip, 0.05);
  const bd: V = [j.tip[0] - j.rHand[0], j.tip[1] - j.rHand[1]];
  const bl = Math.hypot(bd[0], bd[1]) || 1;
  const gp: V = [-bd[1] / bl, bd[0] / bl];
  seg(add(j.rHand, gp, 0.09), add(j.rHand, gp, -0.09), 0.06);
  // Front arm
  seg(j.shoulder, j.fElbow, 0.18); seg(j.fElbow, j.fHand, 0.15);
  g.circle(...tx(j.fHand), (0.085 + wb / 2) * S).fill(fill);
  g.circle(...tx(j.rHand), (0.08 + wb / 2) * S).fill(fill);
}

/** Faint edge gleam on the blade and the eye glint. */
export function drawAccents(g: Graphics, j: Joints, o: DrawOpts, eyeColor: number, gleam: number): void {
  const S = PX;
  const tx = (v: V): V => [o.x + v[0] * o.facing * S, o.y - v[1] * S];
  const A = tx(add(j.rHand, [0, 0.015]));
  const B = tx(add(j.tip, [0, 0.015]));
  g.moveTo(A[0], A[1]).lineTo(B[0], B[1]).stroke({ width: 1.2, color: gleam, alpha: 0.45 });
  const hd: V = [j.head[0] - j.neck[0], j.head[1] - j.neck[1]];
  const len = Math.hypot(hd[0], hd[1]) || 1;
  const fwd: V = [hd[1] / len, -hd[0] / len];
  const eye = add(add(j.head, fwd, 0.13), [hd[0] / len, hd[1] / len], 0.03);
  g.circle(...tx(eye), 0.032 * S).fill({ color: eyeColor, alpha: 0.95 });
}

export function toScreen(j: Joints, key: 'tip' | 'bladeMid' | 'fHand' | 'fElbow' | 'fFoot' | 'fKnee' | 'rFoot' | 'rKnee' | 'rHand', x: number, y: number, facing: number): V {
  const v = j[key];
  return [x + v[0] * facing * PX, y - v[1] * PX];
}
