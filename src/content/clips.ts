// Keyframe evaluation shared by the renderer and the hitbox baker.
import { lerpPose, type Pose } from './rig';
import type { Ease, Key, MoveDef } from './types';

export function ease(e: Ease | undefined, u: number): number {
  switch (e) {
    case 'linear': return u;
    case 'in': return u * u * u;
    case 'out': return 1 - (1 - u) * (1 - u) * (1 - u);
    default: return u * u * (3 - 2 * u);
  }
}

export function merge(base: Pose, p: Partial<Pose>): Pose {
  return { ...base, ...p };
}

/** Pose at tick t (fractional allowed). Each key's ease shapes the segment arriving at it. */
export function sampleKeys(keys: Key[], base: Pose, t: number): Pose {
  if (!keys.length) return base;
  if (t <= keys[0].t) return merge(base, keys[0].p);
  for (let i = 1; i < keys.length; i++) {
    const k1 = keys[i];
    if (t <= k1.t) {
      const k0 = keys[i - 1];
      const u = k1.t === k0.t ? 1 : (t - k0.t) / (k1.t - k0.t);
      return lerpPose(merge(base, k0.p), merge(base, k1.p), ease(k1.e, u));
    }
  }
  return merge(base, keys[keys.length - 1].p);
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
  keys.push({ t: holdEnd, p: follow, e: 'linear' });
  keys.push({ t: total, p: opts.rest ?? {}, e: 'inout' });
  return keys;
}

export function moveTotal(m: StrikeTiming): number {
  return m.startup + m.active - 1 + m.recovery;
}

export function sampleMove(m: MoveDef, stance: Pose, t: number): Pose {
  return sampleKeys(m.keys, stance, t);
}
