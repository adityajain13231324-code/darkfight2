// Additional roster fighters. Each has its own rig proportions, weapon, health, speed and
// damage profile, built on one of the two authored move kits (sword kit / claw kit).
// They are honest "kit variants" until each gets a fully unique moveset.
import { legsAt, type Rig } from '../rig';
import type { FighterDef, MoveDef } from '../types';
import { corvin } from './corvin';
import { lynx } from './lynx';

function variant(base: FighterDef, o: {
  id: string; name: string; title: string; weaponName: string; family: string; style: string; difficulty: number;
  maxHp: number; speed: number; dmg: number; rig: Partial<Rig>; visual: Partial<FighterDef['visual']>;
  rename?: Record<string, string>; hipScale?: number;
  /** Degrees to angle mid attacks downward so they still reach crouching opponents at this body size. */
  midTilt?: number;
}): FighterDef {
  const rig: Rig = { ...base.rig, ...o.rig };
  const k = rig.scale / base.rig.scale;
  const feet: [number, number, number] = [base.feet[0] * k, base.feet[1] * k, base.feet[2] * k * (o.hipScale ?? 1)];
  const legs = legsAt(rig, feet[0], feet[1], feet[2]);
  const moves: MoveDef[] = base.moves.map((m) => ({
    ...m,
    name: o.rename?.[m.id] ?? m.name,
    damage: Math.round(m.damage * o.dmg),
    keys: m.level === 'M' && o.midTilt ? m.keys.map((key, i) => (i >= 2 && i <= 4 ? { ...key, p: { ...key.p, ...(key.p.rUA !== undefined ? { rUA: key.p.rUA - o.midTilt! } : {}), ...(key.p.fUA !== undefined ? { fUA: key.p.fUA - o.midTilt! } : {}) } } : key)) : m.keys,
    projectile: m.projectile ? { ...m.projectile, damage: Math.round(m.projectile.damage * o.dmg) } : undefined,
  }));
  return {
    ...base, id: o.id, name: o.name, title: o.title, weaponName: o.weaponName, family: o.family, style: o.style, difficulty: o.difficulty,
    kit: base.id, maxHp: o.maxHp, walkF: Math.round(base.walkF * o.speed), walkB: Math.round(base.walkB * o.speed), dashV: Math.round(base.dashV * o.speed),
    rig, visual: { ...base.visual, ...o.visual }, stance: { ...base.stance, ...legs }, crouch: { ...base.crouch }, feet, moves,
  };
}

export const hermit = variant(corvin, {
  id: 'hermit', name: 'Hermit', title: 'The Storm Sage', weaponName: 'Twin Reed Blades', family: 'Katana', style: 'Disciplined swordsman: quick cuts, long reach, punishes rushing.', difficulty: 2,
  maxHp: 1000, speed: 1.05, dmg: 0.95, rig: { scale: 0.97, weapon: 'katana', weaponLen: 1.6 }, visual: { coat: true, topknot: false, hat: true, bulk: 0.95 },
  rename: { moonfall: 'Thunder Descent', wave: 'Lightning Crawl' },
});
export const shogun = variant(corvin, {
  id: 'shogun', midTilt: 10, name: 'Shogun', title: 'The Iron Warlord', weaponName: 'Daimyo Katana', family: 'Katana', style: 'Armored pressure: heavier hits, slower feet.', difficulty: 2,
  maxHp: 1025, speed: 0.92, dmg: 1.08, rig: { scale: 1.04, weapon: 'katana', weaponLen: 1.75 }, visual: { coat: true, topknot: false, helmet: true, armor: true, bulk: 1.1 },
  rename: { moonfall: 'Warlord Cleave', wave: 'Spectral Slash' },
});
export const butcher = variant(corvin, {
  id: 'butcher', midTilt: 12, name: 'Butcher', title: 'The Quarry Brute', weaponName: 'Twin Cleavers', family: 'Cleavers', style: 'Close-range bully: huge damage, short reach, slow.', difficulty: 1,
  maxHp: 1075, speed: 0.85, dmg: 1.15, rig: { scale: 1.08, weapon: 'cleaver', weaponLen: 1.05 }, visual: { coat: false, topknot: false, bulk: 1.35 },
  hipScale: 0.97, rename: { moonfall: 'Quake Stomp', wave: 'Ground Shock' },
});
export const titan = variant(corvin, {
  id: 'titan', midTilt: 20, name: 'Titan', title: 'The Colossus', weaponName: 'Colossus Blade', family: 'Two-handed heavy', style: 'Towering heavyweight: enormous reach, slow everything.', difficulty: 3,
  maxHp: 1100, speed: 0.8, dmg: 1.2, rig: { scale: 1.22, weapon: 'greatsword', weaponLen: 2.0 }, visual: { coat: true, topknot: false, helmet: true, armor: true, bulk: 1.25 },
  rename: { moonfall: 'Titan Fall', wave: 'Mind Wave' },
});
export const widow = variant(lynx, {
  id: 'widow', midTilt: 10, name: 'Widow', title: 'The Silk Blade', weaponName: 'Razor Fans', family: 'Fans', style: 'Evasive duelist: fast fans, slippery smoke, low health.', difficulty: 3,
  maxHp: 950, speed: 1.05, dmg: 0.95, rig: { scale: 0.95, weapon: 'fans', weaponLen: 0.5 }, visual: { hood: false, scarf: true, ponytail: true, bulk: 0.88 },
  rename: { smoke: 'Vanishing Silk', ashclaw: 'Fan Storm' },
});
export const wasp = variant(lynx, {
  id: 'wasp', midTilt: 10, name: 'Wasp', title: 'The Sky Striker', weaponName: 'Stinger Claws', family: 'Claws', style: 'Aerial hunter: long pounces and dives, fragile.', difficulty: 2,
  maxHp: 950, speed: 1.1, dmg: 0.92, rig: { scale: 0.96, weapon: 'claws', weaponLen: 0.5 }, visual: { hood: false, scarf: true, ponytail: true, bulk: 0.9 },
  rename: { smoke: 'Swarm Veil', ashclaw: 'Sting Dive' },
});
