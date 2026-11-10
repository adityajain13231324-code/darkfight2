// Compiles fighter definitions + baked hitboxes into integer data for the simulation.
import baked from './baked.json';
import { corvin } from './fighters/corvin';
import { lynx } from './fighters/lynx';
import type { FighterDef, Level, MoveDef } from './types';
import { BTN } from '../sim/input';

const U = 1000;
const r = (v: number | undefined) => Math.round((v ?? 0) * U);

export interface ProjC {
  kind: string; speed: number; damage: number; level: Level; y: number; life: number; radius: number;
  knockdown: boolean; hitstun: number; blockstun: number;
}

export interface MoveC {
  id: string; name: string; cmd: string; level: Level;
  startup: number; active: number; recovery: number; total: number;
  damage: number; onBlock: number; onHit: number | 'kd' | 'launch'; onCH: number | 'kd' | 'launch';
  pushback: number; hitstop: number; radius: number; advance: number;
  launch: [number, number] | null; juggle: boolean; wall: boolean; precision: boolean; crouch: boolean;
  hop: [number, number, number] | null; air: boolean; armor: [number, number] | null;
  cost: number; ammo: boolean; cooldown: number; smoke: number; projectile: ProjC | null;
  weight: number; btnMask: number; next: { mask: number; move: string; cancel: number }[];
  root: boolean; shapes: number[][] | null; strike: boolean;
}

export interface FighterData {
  id: string; name: string; maxHp: number; walkF: number; walkB: number; dashV: number;
  heightPm: number; // hurtbox height per mille
  moves: Record<string, MoveC>;
  cmd: Record<string, string>;
  list: MoveC[];
  def: FighterDef;
}

function btnMaskOf(cmd: string): number {
  const last = cmd.split(',').pop()!;
  let mask = 0;
  for (const p of last.split('+')) if (BTN[p]) mask |= BTN[p];
  return mask;
}

function compileMove(m: MoveDef, shapes: number[][] | null, childIds: Set<string>): MoveC {
  const onCH = m.onCH ?? (typeof m.onHit === 'number' ? m.onHit + 6 : m.onHit);
  const p = m.projectile;
  return {
    id: m.id, name: m.name, cmd: m.cmd, level: m.level,
    startup: m.startup, active: m.active, recovery: m.recovery, total: m.startup + m.active - 1 + m.recovery,
    damage: m.damage, onBlock: m.onBlock, onHit: m.onHit, onCH,
    pushback: r(m.pushback), hitstop: m.hitstop, radius: r(m.radius ?? 0.12), advance: r(m.advance),
    launch: m.launch ?? null, juggle: m.juggle ?? true, wall: !!m.wall, precision: !!m.precision, crouch: !!m.crouch,
    hop: m.hop ? [m.hop[0], m.hop[1], r(m.hop[2])] : null, air: !!m.air, armor: m.armor ?? null,
    cost: m.cost ?? 0, ammo: !!m.ammo, cooldown: m.cooldown ?? 0, smoke: m.smoke ?? 0,
    projectile: p ? {
      kind: p.kind, speed: r(p.speed), damage: p.damage, level: p.level, y: r(p.y), life: p.life, radius: r(p.radius),
      knockdown: !!p.knockdown, hitstun: p.hitstun ?? 16, blockstun: p.blockstun ?? 10,
    } : null,
    weight: m.weight ?? 2, btnMask: btnMaskOf(m.cmd),
    next: (m.next ?? []).map((n) => ({ mask: BTN[n.btn], move: n.move, cancel: n.cancel })),
    root: !childIds.has(m.id), shapes, strike: !!shapes,
  };
}

export function compileFighter(def: FighterDef, shapes: Record<string, number[][]>): FighterData {
  const childIds = new Set(def.moves.flatMap((m) => (m.next ?? []).map((n) => n.move)));
  const moves: Record<string, MoveC> = {};
  const cmd: Record<string, string> = {};
  for (const m of def.moves) {
    if (moves[m.id]) throw new Error(`${def.id}: duplicate move ${m.id}`);
    if (m.shape && !shapes[m.id]) throw new Error(`${def.id}: ${m.id} not baked — run npm run bake`);
    const c = compileMove(m, shapes[m.id] ?? null, childIds);
    moves[m.id] = c;
    if (c.root) {
      if (cmd[m.cmd]) throw new Error(`${def.id}: duplicate command ${m.cmd}`);
      cmd[m.cmd] = m.id;
    }
  }
  for (const m of Object.values(moves)) for (const n of m.next) if (!moves[n.move]) throw new Error(`${def.id}: ${m.id} -> missing ${n.move}`);
  return {
    id: def.id, name: def.name, maxHp: def.maxHp, walkF: def.walkF, walkB: def.walkB, dashV: def.dashV,
    heightPm: Math.round(def.rig.scale * 1000), moves, cmd, list: Object.values(moves), def,
  };
}

const B = baked as Record<string, Record<string, number[][]>>;
export const ROSTER: Record<string, FighterData> = {
  corvin: compileFighter(corvin, B.corvin ?? {}),
  lynx: compileFighter(lynx, B.lynx ?? {}),
};
export const FIGHTER_IDS = Object.keys(ROSTER);
