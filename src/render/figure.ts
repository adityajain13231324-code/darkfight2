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

export function drawFigure(g: Graphics, j: Joints, vis: FighterVisual, weapon: WeaponKindAlias, o: DrawOpts): void {
  const S = PX;
  const k = o.scale * vis.bulk;
  const grow = o.grow ?? 0;
  const tx = (v: V): [number, number] => [o.x + v[0] * o.facing * S, o.y - v[1] * S];
  const fill = { color: o.color, alpha: o.alpha };
  const poly = (pts: V[]) => g.poly(pts.flatMap(tx)).fill(fill);
  // Tapered limb: quad between two circles.
  const limb = (a: V, b: V, ra: number, rb: number) => {
    ra = ra * k + grow; rb = rb * k + grow;
    const n = perp(norm(sub(b, a)));
    poly([add(a, n, ra), add(b, n, rb), add(b, n, -rb), add(a, n, -ra)]);
    g.circle(...tx(a), ra * S).fill(fill);
    g.circle(...tx(b), rb * S).fill(fill);
  };
  // Rear leg + arm first (same colour, but keeps the outline continuous)
  limb(j.rHip, j.rKnee, 0.15, 0.11); limb(j.rKnee, j.rFoot, 0.11, 0.07); limb(j.rFoot, j.rToe, 0.07, 0.045);
  limb(j.rShoulder, j.rElbow, 0.1, 0.08); limb(j.rElbow, j.rHand, 0.08, 0.06);
  // Torso: chest wider than waist, slightly rounded back
  const up = j.up;
  const n: V = [up[1], -up[0]];
  const chest = add(j.neck, up, -0.12 * k);
  const waist = add(j.pelvis, up, 0.1 * k);
  poly([add(chest, n, 0.27 * k + grow), add(j.neck, n, 0.12 * k + grow), add(j.neck, n, -0.14 * k - grow), add(chest, n, -0.24 * k - grow), add(waist, n, -0.19 * k - grow), add(j.pelvis, n, -0.2 * k - grow), add(j.pelvis, n, 0.2 * k + grow), add(waist, n, 0.19 * k + grow)]);
  g.circle(...tx(j.pelvis), (0.2 * k + grow) * S).fill(fill);
  // Coat tails (long coat) with sway
  if (vis.coat) {
    const down: V = [-up[0], -up[1]];
    const ca = (o.coat * Math.PI) / 180;
    const cd: V = [down[0] * Math.cos(ca) - down[1] * Math.sin(ca), down[0] * Math.sin(ca) + down[1] * Math.cos(ca)];
    const hem = add(j.pelvis, cd, 1.0 * o.scale);
    poly([add(j.pelvis, n, 0.22 * k + grow), add(j.pelvis, n, -0.22 * k - grow), add(hem, n, -0.4 * k - grow), add(add(hem, cd, 0.06), n, 0.05), add(hem, n, 0.3 * k + grow)]);
  }
  // Neck + head
  limb(j.neck, add(j.neck, sub(j.head, j.neck), 0.5), 0.08, 0.07);
  g.circle(...tx(j.head), (j.headR + grow) * S).fill(fill);
  const hd = norm(sub(j.head, j.neck));
  const fw = perp(hd).map((v) => -v) as V; // forward relative to head
  if (vis.topknot) g.circle(...tx(add(add(j.head, hd, 0.17 * o.scale), fw, -0.14 * o.scale)), (0.085 * o.scale + grow) * S).fill(fill);
  if (vis.hood) {
    const top = add(j.head, hd, j.headR * 1.2);
    poly([add(j.head, fw, -j.headR * 1.25), add(add(top, fw, -0.12), hd, 0.12), add(top, fw, 0.06), add(j.head, fw, j.headR * 0.9), add(j.neck, fw, -0.1)]);
    poly([add(top, fw, -0.02), add(add(top, hd, 0.16), fw, -0.06), add(top, fw, 0.07)]); // ear tuft
  }
  if (vis.scarf && o.scarf.length > 1) {
    // Scarf points are already in screen space (a simulated rope from the renderer).
    for (let i = 1; i < o.scarf.length; i++) {
      const w = (0.065 * (1 - i / o.scarf.length) + 0.02) * S;
      const a = o.scarf[i - 1];
      const b = o.scarf[i];
      const nn = perp(norm(sub(b, a)));
      g.poly([...add(a, nn, w), ...add(b, nn, w * 0.8), ...add(b, nn, -w * 0.8), ...add(a, nn, -w)]).fill(fill);
    }
  }
  // Front leg
  limb(j.fHip, j.fKnee, 0.16, 0.115); limb(j.fKnee, j.fFoot, 0.115, 0.075); limb(j.fFoot, j.fToe, 0.075, 0.045);
  // Weapons
  if (weapon === 'sabre') {
    const d = norm(sub(j.tip, j.rHand));
    const p = perp(d);
    const L = Math.hypot(j.tip[0] - j.rHand[0], j.tip[1] - j.rHand[1]);
    const curve = (u: number) => add(add(j.rHand, d, L * u), p, Math.sin(u * Math.PI) * 0.06 * (u > 0.5 ? 1 : 1));
    const back: V[] = [];
    const edge: V[] = [];
    for (let i = 0; i <= 6; i++) {
      const u = i / 6;
      const c = curve(u);
      const w = 0.03 * (1 - u * 0.75) + grow * 0.5;
      back.push(add(c, p, w));
      edge.unshift(add(c, p, -w * 0.6));
    }
    poly([...back, ...edge]);
    limb(add(j.rHand, d, -0.17), j.rHand, 0.028, 0.03); // grip
    limb(add(j.rHand, p, 0.1), add(j.rHand, p, -0.1), 0.03, 0.03); // guard
  } else {
    for (const [hand, tip, elbow] of [[j.fHand, j.fTip, j.fElbow], [j.rHand, j.tip, j.rElbow]] as [V, V, V][]) {
      const d = norm(sub(tip, hand));
      const p = perp(d);
      const L = Math.hypot(tip[0] - hand[0], tip[1] - hand[1]);
      for (const off of [-0.05, 0, 0.05]) {
        const base = add(hand, p, off);
        const mid = add(add(base, d, L * 0.55), p, off * 0.6 + 0.03);
        const end = add(add(base, d, L * (off === 0 ? 1 : 0.85)), p, off * 0.3 + 0.07);
        poly([add(base, p, 0.022 + grow), mid, end, add(mid, p, -0.012), add(base, p, -0.022 - grow)]);
      }
      void elbow;
    }
  }
  // Front arm on top
  limb(j.fShoulder, j.fElbow, 0.105, 0.085); limb(j.fElbow, j.fHand, 0.085, 0.065);
  g.circle(...tx(j.fHand), (0.07 * k + grow) * S).fill(fill);
  g.circle(...tx(j.rHand), (0.065 * k + grow) * S).fill(fill);
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
