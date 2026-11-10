// Silhouette drawing for the shared rig. Tapered limbs, per-fighter costume, weapons.
import type { Graphics } from 'pixi.js';
import type { Joints, V } from '../content/rig';
import type { FighterVisual, WeaponKindAlias } from './figure-types';

export const PX = 64;

export interface DrawOpts {
  x: number; y: number; facing: number; color: number; alpha: number;
  coat: number; scarf: V[]; grow?: number; scale: number;
}

const add = (a: V, b: V, s = 1): V => [a[0] + b[0] * s, a[1] + b[1] * s];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const norm = (v: V): V => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const perp = (v: V): V => [-v[1], v[0]];

// Width profiles along a bone: [t, width on the +perp side, width on the -perp side] (units).
// For a bone pointing down, +perp is the front (toward the opponent); for the torso (pointing up), +perp is the back.
type Profile = [number, number, number][];
const P_THIGH: Profile = [[0, 0.15, 0.18], [0.3, 0.17, 0.16], [0.75, 0.12, 0.115], [1, 0.1, 0.1]];
const P_CALF: Profile = [[0, 0.1, 0.105], [0.28, 0.095, 0.14], [0.7, 0.07, 0.08], [1, 0.055, 0.055]];
const P_FOOT: Profile = [[0, 0.07, 0.065], [0.55, 0.05, 0.045], [1, 0.03, 0.025]];
const P_UARM: Profile = [[0, 0.115, 0.11], [0.4, 0.1, 0.12], [1, 0.075, 0.075]];
const P_FARM: Profile = [[0, 0.08, 0.08], [0.32, 0.09, 0.085], [1, 0.05, 0.05]];
const P_TORSO: Profile = [[0, 0.22, 0.2], [0.22, 0.17, 0.16], [0.55, 0.2, 0.24], [0.82, 0.21, 0.23], [1, 0.12, 0.12]];
const P_NECK: Profile = [[0, 0.085, 0.09], [1, 0.07, 0.075]];

function sampleProfile(p: Profile, t: number): [number, number] {
  for (let i = 1; i < p.length; i++) {
    if (t <= p[i][0]) {
      const a = p[i - 1];
      const b = p[i];
      const u = (t - a[0]) / (b[0] - a[0] || 1);
      const e = u * u * (3 - 2 * u);
      return [a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
    }
  }
  const l = p[p.length - 1];
  return [l[1], l[2]];
}

export function drawFigure(g: Graphics, j: Joints, vis: FighterVisual, weapon: WeaponKindAlias, o: DrawOpts): void {
  const S = PX;
  const k = o.scale * vis.bulk;
  const grow = o.grow ?? 0;
  const tx = (v: V): [number, number] => [o.x + v[0] * o.facing * S, o.y - v[1] * S];
  const fill = { color: o.color, alpha: o.alpha };
  const poly = (pts: V[]) => g.poly(pts.flatMap(tx)).fill(fill);
  /** Sculpted body part: smooth outline from a width profile, rounded ends. */
  const bone = (a: V, b: V, prof: Profile, steps = 8) => {
    const d = sub(b, a);
    const L = Math.hypot(d[0], d[1]) || 1e-6;
    const n = perp([d[0] / L, d[1] / L]);
    const left: V[] = [];
    const right: V[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const [wp, wn] = sampleProfile(prof, t);
      const c = add(a, d, t);
      left.push(add(c, n, wp * k + grow));
      right.push(add(c, n, -(wn * k + grow)));
    }
    poly([...left, ...right.reverse()]);
    const [w0p, w0n] = sampleProfile(prof, 0);
    const [w1p, w1n] = sampleProfile(prof, 1);
    g.circle(...tx(a), (((w0p + w0n) / 2) * k + grow) * S).fill(fill);
    g.circle(...tx(b), (((w1p + w1n) / 2) * k + grow) * S).fill(fill);
  };
  const fist = (hand: V, fa: V) => {
    const d = norm(sub(hand, fa));
    g.circle(...tx(add(hand, d, 0.03)), (0.075 * k + grow) * S).fill(fill);
  };
  const leg = (hip: V, knee: V, foot: V, toe: V) => {
    bone(hip, knee, P_THIGH);
    bone(knee, foot, P_CALF);
    bone(foot, toe, P_FOOT, 4);
    const back = norm(sub(foot, toe));
    g.circle(...tx(add(foot, back, 0.04)), (0.055 * k + grow) * S).fill(fill); // heel
  };
  const arm = (sh: V, el: V, hand: V) => { bone(sh, el, P_UARM); bone(el, hand, P_FARM); fist(hand, el); };

  // Rear limbs first (same ink keeps the silhouette continuous)
  leg(j.rHip, j.rKnee, j.rFoot, j.rToe);
  arm(j.rShoulder, j.rElbow, j.rHand);
  // Torso, hips and shoulder mass
  bone(j.pelvis, j.neck, P_TORSO, 10);
  const up = j.up;
  const n: V = [up[1], -up[0]];
  g.circle(...tx(add(j.pelvis, up, 0.04)), (0.21 * k + grow) * S).fill(fill);
  g.circle(...tx(j.fShoulder), (0.12 * k + grow) * S).fill(fill);
  g.circle(...tx(j.rShoulder), (0.11 * k + grow) * S).fill(fill);
  if (vis.coat) {
    const down: V = [-up[0], -up[1]];
    const ca = (o.coat * Math.PI) / 180;
    const cd: V = [down[0] * Math.cos(ca) - down[1] * Math.sin(ca), down[0] * Math.sin(ca) + down[1] * Math.cos(ca)];
    const hem = add(j.pelvis, cd, 1.0 * o.scale);
    const half = add(j.pelvis, cd, 0.5 * o.scale);
    poly([add(j.pelvis, n, 0.23 * k + grow), add(j.pelvis, n, -0.22 * k - grow), add(half, n, -0.3 * k), add(hem, n, -0.38 * k - grow), add(add(hem, cd, 0.06), n, -0.05), add(hem, n, 0.3 * k + grow), add(half, n, 0.3 * k)]);
  }
  // Neck, head, jaw, skull
  const headBase = add(j.neck, sub(j.head, j.neck), 0.45);
  bone(j.neck, headBase, P_NECK, 3);
  const hd = norm(sub(j.head, j.neck));
  const fw: V = [hd[1], -hd[0]];
  const r = j.headR;
  g.circle(...tx(j.head), (r + grow) * S).fill(fill);
  poly([add(add(j.head, fw, r * 0.55), hd, -r * 0.35), add(add(j.head, fw, r * 0.95), hd, -r * 0.55), add(add(j.head, fw, r * 0.6), hd, -r * 1.05), add(add(j.head, fw, -r * 0.2), hd, -r * 0.9)]);
  g.circle(...tx(add(j.head, fw, -r * 0.18)), (r * 1.04 + grow) * S).fill(fill);
  if (vis.topknot) g.circle(...tx(add(add(j.head, hd, 0.17 * o.scale), fw, -0.15 * o.scale)), (0.085 * o.scale + grow) * S).fill(fill);
  if (vis.hood) {
    const top = add(j.head, hd, r * 1.2);
    poly([add(j.head, fw, -r * 1.3), add(add(top, fw, -0.12), hd, 0.1), add(top, fw, 0.06), add(j.head, fw, r * 0.95), add(j.neck, fw, -0.12)]);
    poly([add(top, fw, -0.03), add(add(top, hd, 0.15), fw, -0.07), add(top, fw, 0.06)]);
  }
  if (vis.scarf && o.scarf.length > 1) {
    for (let i = 1; i < o.scarf.length; i++) {
      const w = (0.065 * (1 - i / o.scarf.length) + 0.02) * S;
      const a = o.scarf[i - 1];
      const b = o.scarf[i];
      const nn = perp(norm(sub(b, a)));
      g.poly([...add(a, nn, w), ...add(b, nn, w * 0.8), ...add(b, nn, -w * 0.8), ...add(a, nn, -w)]).fill(fill);
    }
  }
  leg(j.fHip, j.fKnee, j.fFoot, j.fToe);
  if (weapon === 'sabre') {
    const d = norm(sub(j.tip, j.rHand));
    const p = perp(d);
    const L = Math.hypot(j.tip[0] - j.rHand[0], j.tip[1] - j.rHand[1]);
    const back: V[] = [];
    const edge: V[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const c = add(add(j.rHand, d, L * u), p, Math.sin(u * Math.PI * 0.9) * 0.07);
      const w = 0.032 * (1 - u * 0.8) + grow * 0.5;
      back.push(add(c, p, w));
      edge.unshift(add(c, p, -w * 0.55));
    }
    poly([...back, ...edge]);
    bone(add(j.rHand, d, -0.18), j.rHand, [[0, 0.03, 0.03], [1, 0.032, 0.032]], 2);
    bone(add(j.rHand, p, 0.1), add(j.rHand, p, -0.1), [[0, 0.03, 0.03], [1, 0.03, 0.03]], 2);
  } else {
    for (const [hand, tip] of [[j.fHand, j.fTip], [j.rHand, j.tip]] as [V, V][]) {
      const d = norm(sub(tip, hand));
      const p = perp(d);
      const L = Math.hypot(tip[0] - hand[0], tip[1] - hand[1]);
      for (const off of [-0.05, 0, 0.05]) {
        const base = add(hand, p, off);
        const mid = add(add(base, d, L * 0.55), p, off * 0.6 + 0.03);
        const end = add(add(base, d, L * (off === 0 ? 1 : 0.85)), p, off * 0.3 + 0.08);
        poly([add(base, p, 0.022 + grow), mid, end, add(mid, p, -0.012), add(base, p, -0.022 - grow)]);
      }
    }
  }
  arm(j.fShoulder, j.fElbow, j.fHand);
}

/** Eye glint and a small waist sash in the player's accent colour. */
export function drawAccents(g: Graphics, j: Joints, o: DrawOpts, accent: number, gleam: number, weapon: WeaponKindAlias): void {
  const S = PX;
  const tx = (v: V): [number, number] => [o.x + v[0] * o.facing * S, o.y - v[1] * S];
  const hd = norm(sub(j.head, j.neck));
  const fwd: V = [hd[1], -hd[0]];
  g.circle(...tx(add(add(j.head, fwd, 0.13 * o.scale), hd, 0.03)), 0.03 * S).fill({ color: accent, alpha: 0.95 * o.alpha });
  const n: V = [j.up[1], -j.up[0]];
  const w = add(j.pelvis, j.up, 0.14 * o.scale);
  const a = tx(add(w, n, 0.2 * o.scale));
  const b = tx(add(w, n, -0.21 * o.scale));
  g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 3, color: accent, alpha: 0.55 * o.alpha });
  if (weapon === 'sabre') {
    const A = tx(j.rHand);
    const B = tx(j.tip);
    g.moveTo(A[0], A[1]).lineTo(B[0], B[1]).stroke({ width: 1.1, color: gleam, alpha: 0.4 * o.alpha });
  }
}
