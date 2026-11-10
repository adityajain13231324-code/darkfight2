import type { Pose, Rig, ShapeKind } from './rig';

export type Level = 'H' | 'M' | 'L' | 'T';
export type Ease = 'linear' | 'in' | 'out' | 'inout';

/** A keyframe at a (possibly fractional) tick; partial poses merge over the fighter's stance. */
export interface Key { t: number; p: Partial<Pose>; e?: Ease }

export interface ProjectileDef {
  kind: string;      // render style
  speed: number;     // units per tick
  damage: number;
  level: Level;
  y: number;         // height in units
  life: number;      // ticks
  radius: number;    // units
  knockdown?: boolean;
  hitstun?: number;
  blockstun?: number;
}

export interface MoveDef {
  id: string;
  name: string;
  /** Command: 'A', 'f+A', 'd+K', 'A+K', 'b+A+K', 'f,f+A', 'j+K', 'R', 'M', 'S', 'wake'. */
  cmd: string;
  level: Level;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  /** Frame advantage (on first active tick contact). 'kd' knocks down, 'launch' launches. */
  onBlock: number;
  onHit: number | 'kd' | 'launch';
  onCH?: number | 'kd' | 'launch';
  pushback: number;      // units
  hitstop: number;
  shape?: ShapeKind;     // attacking segment (strikes)
  radius?: number;       // hit thickness, units
  advance?: number;      // root motion during startup, units
  launch?: [number, number]; // [vy, vx] sub-units per tick
  juggle?: boolean;      // can hit an airborne opponent (default true)
  wall?: boolean;        // can wall splat
  precision?: boolean;   // earned critical when it lands in a punish window
  crouch?: boolean;      // crouched hurtbox during the move
  hop?: [number, number, number]; // airborne window [from, to, height units]
  air?: boolean;         // jump attack: ballistic, ends on landing
  armor?: [number, number]; // absorbs one hit in this tick window
  cost?: number;         // meter
  ammo?: boolean;        // uses a ranged charge
  cooldown?: number;     // ticks (signatures)
  smoke?: number;        // sets concealment ticks at first active tick
  projectile?: ProjectileDef;
  weight?: number;       // 1 light, 2 medium, 3 heavy (audio/vfx)
  next?: { btn: 'A' | 'K'; move: string; cancel: number }[];
  /** Animation: authored keys in ticks. */
  keys: Key[];
  crouchRest?: boolean;  // recovers into crouch
}

export interface FighterVisual {
  coat: boolean;
  topknot: boolean;
  hood: boolean;
  scarf: boolean;
  bulk: number; // limb thickness multiplier
}

export interface FighterDef {
  id: string;
  name: string;
  title: string;
  weaponName: string;
  family: string;
  style: string;
  difficulty: number;
  maxHp: number;
  walkF: number;   // sub-units per tick
  walkB: number;
  dashV: number;
  rig: Rig;
  visual: FighterVisual;
  stance: Pose;
  crouch: Pose;
  /** Stance foot placement for procedural walking: front x, rear x, hip height. */
  feet: [number, number, number];
  moves: MoveDef[];
}
