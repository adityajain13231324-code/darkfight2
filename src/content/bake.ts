// Hitbox baker: samples each move's authored animation at every simulation tick and
// stores the attacking segment (an "attack edge", capsule axis) as integer sub-units.
// The sim reads only this baked data, so collision always matches the visible motion.
import { moveTotal, sampleMove } from './clips';
import { shapeSegment, solve } from './rig';
import type { FighterDef } from './types';
import { corvin } from './fighters/corvin';
import { lynx } from './fighters/lynx';
import { butcher, hermit, shogun, titan, wasp, widow } from './fighters/variants';

export const FIGHTER_DEFS: FighterDef[] = [corvin, lynx, hermit, shogun, butcher, titan, widow, wasp];

export type Baked = Record<string, Record<string, number[][]>>;

export function bakeFighter(def: FighterDef): Record<string, number[][]> {
  const out: Record<string, number[][]> = {};
  for (const m of def.moves) {
    if (!m.shape) continue;
    const ticks: number[][] = [];
    for (let t = 0; t <= moveTotal(m); t++) {
      const seg = shapeSegment(solve(sampleMove(m, def.stance, t), def.rig), m.shape);
      ticks.push(seg.map((v) => Math.round(v * 1000)));
    }
    out[m.id] = ticks;
  }
  return out;
}

export function bakeAll(): Baked {
  const b: Baked = {};
  for (const d of FIGHTER_DEFS) b[d.id] = bakeFighter(d);
  return b;
}
