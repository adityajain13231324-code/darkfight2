// Additional roster fighters. Each has its own rig proportions, weapon grip, stance, guard,
// intro, victory and portrait poses, plus health/speed/damage — built on one of the two
// authored move kits (sword kit / claw kit). Move *keyframes* are shared with the base kit
// except for the per-fighter transforms below (anticipation, weight shift). See PROGRESS.md
// for exactly which attack animations are still shared.
import { arms, F, R } from '../author';
import { legsAt, type Pose, type Rig } from '../rig';
import type { AnimStyle, FighterDef, MoveDef } from '../types';
import { corvin } from './corvin';
import { lynx } from './lynx';

interface Opts {
  id: string; name: string; title: string; weaponName: string; family: string; style: string; difficulty: number;
  maxHp: number; speed: number; dmg: number; rig: Partial<Rig>; visual: Partial<FighterDef['visual']>;
  rename?: Record<string, string>;
  /** Degrees to angle mid attacks downward so they still reach crouching opponents at this body size. */
  midTilt?: number;
  /** Stance feet [front x, rear x, hip height as a fraction of the base fighter's], and upper-body channels. */
  stance: { feet: [number, number, number]; upper: Partial<Pose>; head?: number; twist?: number };
  anim: AnimStyle;
  /** Weight transfer: visual pelvis shift (units) added to anticipation / contact of heavy attacks. */
  weight?: { antic: number; contact: number; raise: number };
}

function variant(base: FighterDef, o: Opts): FighterDef {
  const rig: Rig = { ...base.rig, ...o.rig };
  const k = rig.scale / base.rig.scale;
  const feet: [number, number, number] = [o.stance.feet[0] * rig.scale, o.stance.feet[1] * rig.scale, base.feet[2] * k * o.stance.feet[2]];
  const legs = legsAt(rig, feet[0], feet[1], feet[2]);
  const stance = { ...base.stance, ...legs, ...o.stance.upper, head: o.stance.head ?? base.stance.head, twist: o.stance.twist ?? base.stance.twist } as Pose;
  const crouchLegs = legsAt(rig, feet[0] * 0.8, feet[1] * 0.8, feet[2] * 0.58);
  const crouch = { ...stance, ...crouchLegs, lean: stance.lean + 12, rUA: stance.rUA - 8, fUA: stance.fUA - 8 } as Pose;
  const moves: MoveDef[] = base.moves.map((m) => {
    const keys = m.keys.map((key, i) => {
      let p = key.p;
      if (m.level === 'M' && o.midTilt && i >= 2 && i <= 4) {
        p = { ...p, ...(p.rUA !== undefined ? { rUA: p.rUA - o.midTilt } : {}), ...(p.fUA !== undefined ? { fUA: p.fUA - o.midTilt } : {}) };
      }
      if (o.weight && m.shape === 'weapon' && (m.weight ?? 2) >= 2) {
        // Heavier wind-up (arm raised higher, body loaded back) and a body-weight lunge into contact.
        if (i === 1 && p.rUA !== undefined) p = { ...p, rUA: p.rUA + o.weight.raise, px: -o.weight.antic };
        if (i === 2) p = { ...p, px: o.weight.contact };
        if (i === 3) p = { ...p, px: o.weight.contact * 1.15 };
      }
      return p === key.p ? key : { ...key, p };
    });
    return {
      ...m,
      name: o.rename?.[m.id] ?? m.name,
      damage: Math.round(m.damage * o.dmg),
      projectile: m.projectile ? { ...m.projectile, damage: Math.round(m.projectile.damage * o.dmg) } : undefined,
      keys,
    };
  });
  return {
    ...base, id: o.id, name: o.name, title: o.title, weaponName: o.weaponName, family: o.family, style: o.style, difficulty: o.difficulty,
    kit: base.id, maxHp: o.maxHp, walkF: Math.round(base.walkF * o.speed), walkB: Math.round(base.walkB * o.speed), dashV: Math.round(base.dashV * o.speed),
    rig, visual: { ...base.visual, ...o.visual }, stance, crouch, feet, moves, anim: o.anim,
  };
}

export const hermit = variant(corvin, {
  id: 'hermit', name: 'Hermit', title: 'The Storm Sage', weaponName: 'Twin Reed Blades', family: 'Paired katana', style: 'Disciplined swordsman: both blades move, long reach, punishes rushing.', difficulty: 2,
  maxHp: 1000, speed: 1.05, dmg: 0.95, midTilt: 8,
  rig: { scale: 0.97, weapon: 'katana', weaponLen: 1.6, grip: 'dual', offLen: 0.85 }, visual: { coat: true, topknot: false, hat: true, bulk: 0.95 },
  rename: { moonfall: 'Thunder Descent', wave: 'Lightning Crawl' },
  stance: { feet: [0.5, -0.56, 1.0], upper: { lean: 4, ...F(4, 22, 85), ...R(4, 12, 100, 138) }, head: -2, twist: 0.2 },
  anim: {
    idleRate: 1.9, idleBob: 0.025, lag: 3,
    guard: { ...F(0, 55, 125), ...R(0, 35, 115, 165) },
    win: { ...F(-4, 120, 150), ...R(-4, 165, 175, 178) },
    intro: { ...F(2, 70, 140), ...R(2, 60, 130, 170) },
    showcase: { lean: 8, ...F(8, 70, 150), ...R(8, 100, 150, 170) },
  },
  weight: { antic: 0.04, contact: 0.08, raise: 12 },
});

export const shogun = variant(corvin, {
  id: 'shogun', name: 'Shogun', title: 'The Iron Warlord', weaponName: 'Daisho (long and short)', family: 'Paired katana', style: 'Armored pressure: heavier hits, slower feet, short blade follows the long.', difficulty: 2,
  maxHp: 1025, speed: 0.92, dmg: 1.08, midTilt: 10,
  rig: { scale: 1.04, weapon: 'katana', weaponLen: 1.75, grip: 'dual', offLen: 0.55 }, visual: { coat: true, topknot: false, helmet: true, armor: true, bulk: 1.1 },
  rename: { moonfall: 'Warlord Cleave', wave: 'Spectral Slash' },
  stance: { feet: [0.78, -0.85, 0.9], upper: { lean: 9, ...F(9, 48, 120), ...R(9, 15, 95, 130) }, head: -4, twist: 0.3 },
  anim: {
    idleRate: 1.5, idleBob: 0.018, lag: 4,
    guard: { ...F(2, 60, 130), ...R(2, 40, 110, 160) },
    win: { ...F(-2, 100, 130), ...R(-2, 170, 178, 180) },
    intro: { ...F(6, 80, 100), ...R(6, 50, 120, 165) },
    showcase: { lean: 12, ...F(12, 85, 140), ...R(12, 120, 150, 160) },
  },
  weight: { antic: 0.08, contact: 0.14, raise: 18 },
});

export const butcher = variant(corvin, {
  id: 'butcher', name: 'Butcher', title: 'The Quarry Brute', weaponName: 'Twin Cleavers', family: 'Paired cleavers', style: 'Close-range bully: huge damage, short reach, slow.', difficulty: 1,
  maxHp: 1075, speed: 0.85, dmg: 1.15, midTilt: 18,
  rig: { scale: 1.08, weapon: 'cleaver', weaponLen: 1.05, grip: 'dual', offLen: 0.95 }, visual: { coat: false, topknot: false, bulk: 1.35 },
  rename: { moonfall: 'Quake Stomp', wave: 'Ground Shock' },
  stance: { feet: [0.78, -0.82, 0.88], upper: { lean: 20, ...F(20, 22, 95), ...R(20, -2, 78, 105) }, head: -14, twist: 0.35 },
  anim: {
    idleRate: 1.3, idleBob: 0.03, lag: 5,
    guard: { ...F(14, 70, 130), ...R(14, 30, 120, 150) },
    win: { ...F(0, 150, 170), ...R(0, 150, 170, 175) },
    intro: { ...F(16, 40, 120), ...R(16, 20, 100, 130) },
    showcase: { lean: 22, ...F(22, 60, 120), ...R(22, 130, 150, 165) },
  },
  weight: { antic: 0.12, contact: 0.2, raise: 26 },
});

export const titan = variant(corvin, {
  id: 'titan', name: 'Titan', title: 'The Colossus', weaponName: 'Colossus Blade (two-handed)', family: 'Two-handed heavy', style: 'Towering heavyweight: both hands on a giant blade, enormous reach, slow everything.', difficulty: 3,
  maxHp: 1100, speed: 0.8, dmg: 1.2, midTilt: 28,
  rig: { scale: 1.22, weapon: 'greatsword', weaponLen: 2.0, grip: 'two' }, visual: { coat: true, topknot: false, helmet: true, armor: true, bulk: 1.25 },
  rename: { moonfall: 'Titan Fall', wave: 'Mind Wave' },
  stance: { feet: [0.8, -0.9, 0.92], upper: { lean: 6, ...R(6, 28, 112, 150) }, head: -3, twist: 0.3 },
  anim: {
    idleRate: 1.1, idleBob: 0.015,
    guard: { ...R(0, 40, 125, 168) },
    win: { ...R(-6, 150, 160, 178) },
    intro: { ...R(4, 55, 120, 160) },
    showcase: { lean: 6, ...R(6, 70, 140, 165) },
  },
  weight: { antic: 0.14, contact: 0.24, raise: 30 },
});

export const widow = variant(lynx, {
  id: 'widow', name: 'Widow', title: 'The Silk Blade', weaponName: 'Razor Fans', family: 'Fans', style: 'Evasive duelist: a fan in each hand, light feet, slippery smoke, low health.', difficulty: 3,
  maxHp: 950, speed: 1.05, dmg: 0.95, midTilt: 10,
  rig: { scale: 0.95, weapon: 'fans', weaponLen: 0.5 }, visual: { hood: false, scarf: true, ponytail: true, bulk: 0.88 },
  rename: { smoke: 'Vanishing Silk', ashclaw: 'Fan Storm' },
  stance: { feet: [0.55, -0.62, 1.04], upper: { ...arms(10, [50, 105], [18, 100], 18) }, head: -3, twist: 0.4 },
  anim: {
    idleRate: 3.6, idleBob: 0.05,
    guard: { ...arms(6, [75, 150], [55, 140], 15) },
    win: { ...arms(-6, [140, 170], [160, 178], 10) },
    intro: { ...arms(8, [95, 130], [30, 110], 25) },
    showcase: { ...arms(10, [100, 120], [20, 100], 30) },
  },
});

export const wasp = variant(lynx, {
  id: 'wasp', name: 'Wasp', title: 'The Sky Striker', weaponName: 'Stinger Claws', family: 'Claws', style: 'Aerial hunter: low predator stance, long pounces and dives, fragile.', difficulty: 2,
  maxHp: 950, speed: 1.1, dmg: 0.92, midTilt: 10,
  rig: { scale: 0.96, weapon: 'claws', weaponLen: 0.5 }, visual: { hood: false, scarf: true, ponytail: true, bulk: 0.9 },
  rename: { smoke: 'Swarm Veil', ashclaw: 'Sting Dive' },
  stance: { feet: [0.8, -0.88, 0.86], upper: { ...arms(26, [62, 120], [30, 110], 14) }, head: -10, twist: 0.35 },
  anim: {
    idleRate: 4.0, idleBob: 0.04,
    guard: { ...arms(18, [80, 150], [55, 140], 10) },
    win: { ...arms(-8, [150, 175], [20, 70], 0) },
    intro: { ...arms(30, [20, 80], [10, 70], 10) },
    showcase: { ...arms(28, [75, 70], [85, 75], -5) },
  },
});
