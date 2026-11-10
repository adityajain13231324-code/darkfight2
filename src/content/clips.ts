// Keyframe evaluation shared by the renderer and the hitbox baker.
//
// Key semantics (documented contract):
//  * The FIRST key starts from the fighter's stance: omitted channels are the stance values.
//  * A MIDDLE key lists only the channels it changes. Omitted channels HOLD the value of the
//    previous key (they never drift back to the stance between keys).
//  * The LAST key RESETS: omitted channels return to the stance, so a move always ends in a known pose.
//  * `e` on a key shapes the segment that ARRIVES at that key (easing).
import { lerpPose, type Pose } from './rig';
import type { Ease, Key, MoveDef } from './types';

export function ease(e: Ease | undefined, u: number): number {
  switch (e) {
    case 'linear': return u;
    case 'in': return u * u; // quadratic: accelerates into contact without a cubic "teleport" in the last frame
    case 'out': return 1 - (1 - u) * (1 - u) * (1 - u);
    default: return u * u * (3 - 2 * u);
  }
}

export function merge(base: Pose, p: Partial<Pose>): Pose {
  return { ...base, ...p };
}

export interface ResolvedKey { t: number; pose: Pose; e?: Ease }

const cache = new WeakMap<Key[], Map<Pose, ResolvedKey[]>>();

/** Turn partial keys into full poses using the carry-forward / last-key-reset rules above. */
export function resolveKeys(keys: Key[], base: Pose): ResolvedKey[] {
  let byBase = cache.get(keys);
  if (!byBase) { byBase = new Map(); cache.set(keys, byBase); }
  const hit = byBase.get(base);
  if (hit) return hit;
  const out: ResolvedKey[] = [];
  let prev = base;
  keys.forEach((k, i) => {
    const from = i === keys.length - 1 ? base : prev; // last key resets omitted channels to the stance
    const pose = merge(from, k.p);
    out.push({ t: k.t, pose, e: k.e });
    prev = pose;
  });
  byBase.set(base, out);
  return out;
}

/** Pose at tick t (fractional allowed). */
export function sampleKeys(keys: Key[], base: Pose, t: number): Pose {
  if (!keys.length) return base;
  const rk = resolveKeys(keys, base);
  if (t <= rk[0].t) return rk[0].pose;
  for (let i = 1; i < rk.length; i++) {
    const k1 = rk[i];
    if (t <= k1.t) {
      const k0 = rk[i - 1];
      const u = k1.t === k0.t ? 1 : (t - k0.t) / (k1.t - k0.t);
      return lerpPose(k0.pose, k1.pose, ease(k1.e, u));
    }
  }
  return rk[rk.length - 1].pose;
}

export interface StrikeTiming { startup: number; active: number; recovery: number }

/**
 * Standard strike timeline: stance -> anticipation -> contact (first active tick)
 * -> follow-through (end of active) -> held follow-through -> recovery to rest.
 */
export function strike(
  m: StrikeTiming,
  antic: Partial<Pose>,
  contact: Partial<Pose>,
  follow: Partial<Pose>,
  opts: { rest?: Partial<Pose>; anticAt?: number; hold?: number; pre?: Partial<Pose> } = {},
): Key[] {
  const total = m.startup + m.active - 1 + m.recovery;
  const anticAt = opts.anticAt ?? Math.max(2, Math.round(m.startup * 0.6));
  const holdEnd = m.startup + m.active - 1 + Math.max(1, Math.round(m.recovery * (opts.hold ?? 0.3)));
  const keys: Key[] = [{ t: 0, p: opts.pre ?? {} }];
  keys.push({ t: anticAt, p: antic, e: 'inout' });
  keys.push({ t: m.startup, p: contact, e: 'in' });
  keys.push({ t: m.startup + m.active - 1 + 0.999, p: follow, e: 'out' });
  keys.push({ t: holdEnd, p: {}, e: 'linear' }); // holds the follow-through (carry-forward)
  keys.push({ t: total, p: opts.rest ?? {}, e: 'inout' });
  return keys;
}

export function moveTotal(m: StrikeTiming): number {
  return m.startup + m.active - 1 + m.recovery;
}

export function sampleMove(m: MoveDef, stance: Pose, t: number): Pose {
  return sampleKeys(m.keys, stance, t);
}
