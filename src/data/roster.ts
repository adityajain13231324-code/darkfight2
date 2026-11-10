import corvinJson from './fighters/corvin.json';
import { U } from '../sim/constants';
import { BTN_BITS } from '../sim/input';

export type Level = 'H' | 'M' | 'L' | 'T';

/** Move as written in the fighter JSON (units are body widths). */
export interface MoveDef {
  id: string;
  name: string;
  cmd: string;
  level: Level;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  onBlock: number;
  onHit: number | 'kd';
  onCH?: number | 'kd';
  range: number;
  pushback: number;
  hitstop: number;
  advance?: number;
  hop?: number[];
  crouch?: boolean;
  weight?: number;
  throwSide?: number;
  next?: { btn: number; move: string; cancel: number }[];
}

export interface FighterDef {
  id: string;
  name: string;
  weapon: string;
  walkF: number;
  walkB: number;
  moves: MoveDef[];
}

/** Compiled move: integer sub-units, ready for the simulation. */
export interface MoveC {
  id: string;
  name: string;
  cmd: string;
  level: Level;
  startup: number;
  active: number;
  recovery: number;
  total: number;
  damage: number;
  onBlock: number;
  onHit: number | 'kd';
  onCH: number | 'kd';
  range: number;
  pushback: number;
  hitstop: number;
  advance: number;
  hop: [number, number, number] | null;
  crouch: boolean;
  weight: number;
  throwSide: number;
  btnMask: number;
  next: { mask: number; move: string; cancel: number }[];
  root: boolean;
}

export interface FighterData {
  id: string;
  name: string;
  weapon: string;
  walkF: number;
  walkB: number;
  moves: Record<string, MoveC>;
  /** Command string (e.g. "df+2") -> move id, for root moves only. */
  cmd: Record<string, string>;
  list: MoveC[];
}

function btnMaskOf(cmd: string): number {
  const last = cmd.split(',').pop()!;
  const btnPart = last.includes('+') && /^[a-z]/.test(last) ? last.slice(last.indexOf('+') + 1) : last;
  let mask = 0;
  for (const ch of btnPart.split('+')) {
    const n = Number(ch);
    if (n >= 1 && n <= 4) mask |= BTN_BITS[n];
  }
  return mask;
}

export function compileFighter(def: FighterDef): FighterData {
  const moves: Record<string, MoveC> = {};
  const cmd: Record<string, string> = {};
  const childIds = new Set(def.moves.flatMap((m) => (m.next ?? []).map((n) => n.move)));
  for (const m of def.moves) {
    if (moves[m.id]) throw new Error(`${def.id}: duplicate move id ${m.id}`);
    const onCH = m.onCH ?? (m.onHit === 'kd' ? 'kd' : m.onHit + 6);
    const c: MoveC = {
      id: m.id,
      name: m.name,
      cmd: m.cmd,
      level: m.level,
      startup: m.startup,
      active: m.active,
      recovery: m.recovery,
      total: m.startup + m.active - 1 + m.recovery,
      damage: m.damage,
      onBlock: m.onBlock,
      onHit: m.onHit,
      onCH,
      range: Math.round(m.range * U),
      pushback: Math.round(m.pushback * U),
      hitstop: m.hitstop,
      advance: Math.round((m.advance ?? 0) * U),
      hop: m.hop ? [m.hop[0], m.hop[1], Math.round(m.hop[2] * U)] : null,
      crouch: !!m.crouch,
      weight: m.weight ?? 2,
      throwSide: m.throwSide ?? 0,
      btnMask: btnMaskOf(m.cmd),
      next: (m.next ?? []).map((n) => ({ mask: BTN_BITS[n.btn], move: n.move, cancel: n.cancel })),
      root: !childIds.has(m.id),
    };
    moves[m.id] = c;
    if (c.root) {
      if (cmd[m.cmd]) throw new Error(`${def.id}: duplicate command ${m.cmd}`);
      cmd[m.cmd] = m.id;
    }
  }
  for (const m of Object.values(moves)) {
    for (const n of m.next) if (!moves[n.move]) throw new Error(`${def.id}: ${m.id} links to missing ${n.move}`);
  }
  return { id: def.id, name: def.name, weapon: def.weapon, walkF: def.walkF, walkB: def.walkB, moves, cmd, list: Object.values(moves) };
}

export const ROSTER: Record<string, FighterData> = {
  corvin: compileFighter(corvinJson as FighterDef),
};
