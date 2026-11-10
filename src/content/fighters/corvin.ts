// Corvin — original UMBRA baseline: straight-sword all-rounder (Moonbite Sabre), long coat.
import { F, LYING, R, legs } from '../author';
import { strike } from '../clips';
import { legsAt, type Pose, type Rig } from '../rig';
import type { FighterDef, MoveDef } from '../types';

const rig: Rig = { scale: 1, thigh: 0.95, shin: 0.95, torso: 1.2, ua: 0.62, fa: 0.58, weapon: 'sabre', weaponLen: 1.55 };
const FEET: [number, number, number] = [0.62, -0.72, 1.74];
const stanceLegs = legsAt(rig, FEET[0], FEET[1], FEET[2]);
const stance = {
  head: -4, twist: 0.25, px: 0, rot: 0,
  ...F(8, 40, 115), ...R(8, 5, 95, 125),
  ...stanceLegs,
} as Pose;
const crouchLegs = legsAt(rig, 0.55, -0.62, 1.02);
const crouch = { ...stance, ...crouchLegs, ...F(20, 45, 120), ...R(20, 15, 100, 120) } as Pose;

const lunge = (f = 1.0, r = -0.95, h = 1.5) => legsAt(rig, f, r, h);
const C = (o: Partial<Pose>): Partial<Pose> => ({ ...crouchLegs, ...o });

type M = Omit<MoveDef, 'keys'>;
const mk = (m: M, antic: Partial<Pose>, contact: Partial<Pose>, follow: Partial<Pose>, opts: Parameters<typeof strike>[4] = {}): MoveDef =>
  ({ ...m, keys: strike(m, antic, contact, follow, opts) });

const moves: MoveDef[] = [
  mk({ id: 'cut', name: 'Quick Cut', cmd: 'A', level: 'H', startup: 10, active: 2, recovery: 14, damage: 45, onBlock: 1, onHit: 8, pushback: 0.35, hitstop: 3, shape: 'weapon', radius: 0.12, weight: 1, next: [{ btn: 'A', move: 'cut2', cancel: 13 }] },
    { ...R(6, -40, 40, 130), twist: 0.05 },
    { ...R(14, 92, 92, 96), twist: 0.75 },
    { ...R(16, 100, 112, 128), twist: 0.85 }),
  mk({ id: 'cut2', name: 'Return Cut', cmd: 'A,A', level: 'H', startup: 10, active: 2, recovery: 18, damage: 50, onBlock: -2, onHit: 5, pushback: 0.45, hitstop: 4, shape: 'weapon', radius: 0.12, weight: 2, next: [{ btn: 'A', move: 'cut3', cancel: 14 }] },
    { ...R(16, 110, 135, 160), twist: 0.9 },
    { ...R(10, 70, 85, 92), twist: 0.3 },
    { ...R(6, 30, 70, 70), twist: 0.1 }),
  mk({ id: 'cut3', name: 'Falling Moon', cmd: 'A,A,A', level: 'M', startup: 14, active: 3, recovery: 24, damage: 75, onBlock: -12, onHit: 'kd', pushback: 0.9, hitstop: 6, shape: 'weapon', radius: 0.13, weight: 3, wall: true },
    { ...R(-4, 170, 185, 200), ...F(-4, 20, 60), twist: 0.2 },
    { ...R(22, 92, 82, 70), ...F(22, 10, 40), twist: 0.85, ...lunge(0.95, -0.9, 1.55) },
    { ...R(28, 55, 45, 30), ...F(28, 0, 30), twist: 0.95, ...lunge(1.0, -0.95, 1.5) }),
  mk({ id: 'thrust', name: 'Advancing Thrust', cmd: 'f+A', level: 'M', startup: 14, active: 3, recovery: 20, damage: 70, onBlock: -6, onHit: 4, pushback: 0.6, hitstop: 5, shape: 'weapon', radius: 0.12, advance: 0.6, precision: true, weight: 2 },
    { ...R(4, -20, 70, 80), ...F(4, 60, 120), twist: 0 },
    { ...R(20, 66, 60, 56), ...F(20, 30, 70), twist: 1, ...lunge(1.05, -0.95, 1.45) },
    { ...R(22, 64, 58, 54), ...F(22, 25, 60), twist: 1, ...lunge(1.1, -1.0, 1.4) }),
  mk({ id: 'spin', name: 'Spinning Slash', cmd: 'b+A', level: 'H', startup: 16, active: 3, recovery: 20, damage: 80, onBlock: -8, onHit: 3, pushback: 0.7, hitstop: 5, shape: 'weapon', radius: 0.13, advance: -0.3, weight: 3 },
    { ...R(-8, -70, -10, 60), ...F(-8, 120, 150), twist: 0 },
    { ...R(8, 98, 98, 100), twist: 0.9 },
    { ...R(10, 120, 140, 165), twist: 0.6 }),
  mk({ id: 'lowcut', name: 'Low Cut', cmd: 'd+A', level: 'L', startup: 15, active: 2, recovery: 22, damage: 50, onBlock: -12, onHit: -1, pushback: 0.4, hitstop: 4, shape: 'weapon', radius: 0.12, crouch: true, crouchRest: true, weight: 2 },
    C({ ...R(22, -20, 50, 90), twist: 0.1 }),
    C({ ...R(30, 62, 45, 22), twist: 0.8 }),
    C({ ...R(30, 55, 30, 12), twist: 0.9 }),
    { rest: { ...crouchLegs, lean: 20 } }),
  mk({ id: 'riser', name: 'Rising Moon', cmd: 'df+A', level: 'M', startup: 15, active: 3, recovery: 26, damage: 70, onBlock: -14, onHit: 'launch', pushback: 0.5, hitstop: 6, shape: 'weapon', radius: 0.14, launch: [150, 20], precision: true, weight: 3 },
    C({ ...R(24, -10, 30, 15), twist: 0.2 }),
    { ...R(16, 50, 62, 70), twist: 0.8, ...legsAt(rig, 0.7, -0.7, 1.35) },
    { ...R(-8, 170, 178, 180), twist: 0.5, ...legs(20, 0, -20, -25) }),
  mk({ id: 'sweep', name: 'Reed Sweep', cmd: 'db+A', level: 'L', startup: 20, active: 3, recovery: 28, damage: 85, onBlock: -18, onHit: 'kd', pushback: 0.5, hitstop: 6, shape: 'weapon', radius: 0.14, crouch: true, crouchRest: true, weight: 3 },
    C({ ...R(24, -60, -20, 40), twist: 0 }),
    C({ ...R(34, 50, 30, 10), twist: 0.9, ...legsAt(rig, 0.9, -0.7, 0.95) }),
    C({ ...R(34, 70, 60, 50), twist: 0.9, ...legsAt(rig, 0.9, -0.7, 0.95) }),
    { rest: { ...crouchLegs, lean: 20 } }),
  mk({ id: 'kick', name: 'Front Kick', cmd: 'K', level: 'M', startup: 12, active: 2, recovery: 18, damage: 55, onBlock: -4, onHit: 4, pushback: 0.55, hitstop: 4, shape: 'fFoot', radius: 0.16, weight: 2, next: [{ btn: 'K', move: 'kick2', cancel: 15 }] },
    { ...legs(75, -40, -18, -30), lean: 0 },
    { ...legs(84, 78, -14, -24), lean: -10 },
    { ...legs(80, 70, -14, -24), lean: -10 }),
  mk({ id: 'kick2', name: 'High Roundhouse', cmd: 'K,K', level: 'H', startup: 12, active: 3, recovery: 22, damage: 65, onBlock: -9, onHit: 4, pushback: 0.6, hitstop: 5, shape: 'rFoot', radius: 0.16, weight: 3 },
    { ...legs(15, 5, 60, -40), lean: -4, twist: 0.6 },
    { ...legs(8, 2, 125, 128), lean: -26, twist: 0.9 },
    { ...legs(8, 2, 115, 110), lean: -24, twist: 0.9 }),
  mk({ id: 'knee', name: 'Step Knee', cmd: 'f+K', level: 'M', startup: 13, active: 2, recovery: 18, damage: 60, onBlock: -5, onHit: 5, pushback: 0.5, hitstop: 5, shape: 'fFoot', radius: 0.18, advance: 0.4, weight: 2 },
    { ...legs(40, -30, -20, -30), lean: 6 },
    { ...legs(95, -20, -25, -35), lean: -6, ...F(-6, 60, 110) },
    { ...legs(90, -25, -25, -35), lean: -6 }),
  mk({ id: 'roundhouse', name: 'Roundhouse', cmd: 'b+K', level: 'H', startup: 14, active: 3, recovery: 22, damage: 75, onBlock: -8, onHit: 6, onCH: 'kd', pushback: 0.7, hitstop: 6, shape: 'rFoot', radius: 0.16, weight: 3 },
    { ...legs(20, 5, 50, -60), lean: -6, twist: 0.7 },
    { ...legs(10, 4, 145, 150), lean: -32, twist: 1 },
    { ...legs(10, 4, 138, 140), lean: -30, twist: 1 }),
  mk({ id: 'shin', name: 'Shin Kick', cmd: 'd+K', level: 'L', startup: 13, active: 2, recovery: 18, damage: 40, onBlock: -11, onHit: 1, pushback: 0.35, hitstop: 4, shape: 'fFoot', radius: 0.16, crouch: true, crouchRest: true, weight: 1 },
    C({ lean: 18, ...legsAt(rig, 0.3, -0.62, 1.0) }),
    C({ lean: 10, ...legs(72, 82, 12, -80) }),
    C({ lean: 10, ...legs(70, 80, 12, -80) }),
    { rest: { ...crouchLegs, lean: 20 } }),
  mk({ id: 'lunge', name: 'Moonbite Lunge', cmd: 'f,f+A', level: 'M', startup: 16, active: 3, recovery: 24, damage: 90, onBlock: -10, onHit: 'kd', pushback: 0.9, hitstop: 6, shape: 'weapon', radius: 0.13, advance: 1.0, wall: true, weight: 3 },
    { ...R(20, 20, 80, 70), twist: 0.2, ...lunge(0.8, -0.9, 1.6) },
    { ...R(28, 66, 62, 58), ...F(28, -20, 10), twist: 1, ...lunge(1.25, -1.05, 1.4) },
    { ...R(28, 64, 60, 56), twist: 1, ...lunge(1.3, -1.1, 1.38) }),
  mk({ id: 'airkick', name: 'Heron Kick', cmd: 'j+K', level: 'M', startup: 6, active: 8, recovery: 8, damage: 65, onBlock: -2, onHit: 'kd', pushback: 0.6, hitstop: 5, shape: 'fFoot', radius: 0.18, air: true, weight: 2 },
    { ...legs(70, -40, 35, -60), lean: 5 },
    { ...legs(70, 55, 30, -80), lean: -15 },
    { ...legs(68, 52, 30, -80), lean: -15 }),
  mk({ id: 'airslash', name: 'Descending Cut', cmd: 'j+A', level: 'M', startup: 7, active: 6, recovery: 8, damage: 60, onBlock: -2, onHit: 'kd', pushback: 0.6, hitstop: 5, shape: 'weapon', radius: 0.13, air: true, weight: 2 },
    { ...R(0, 170, 185, 195), ...legs(70, -40, 35, -60) },
    { ...R(15, 80, 60, 45), ...legs(60, -30, 30, -60) },
    { ...R(15, 50, 30, 20), ...legs(60, -30, 30, -60) }),
  mk({ id: 'throwF', name: 'Front Throw', cmd: 'A+K', level: 'T', startup: 12, active: 2, recovery: 28, damage: 90, onBlock: 0, onHit: 'kd', pushback: 0, hitstop: 0, radius: 0.1, weight: 2 },
    { ...R(10, 60, 80, 170), ...F(10, 70, 100) },
    { ...R(16, 88, 92, 175), ...F(16, 92, 96) },
    { ...R(16, 88, 92, 175), ...F(16, 92, 96) }),
  mk({ id: 'throwB', name: 'Back Throw', cmd: 'b+A+K', level: 'T', startup: 12, active: 2, recovery: 28, damage: 95, onBlock: 0, onHit: 'kd', pushback: 0, hitstop: 0, radius: 0.1, weight: 2 },
    { ...R(10, 60, 80, 170), ...F(10, 70, 100) },
    { ...R(16, 88, 92, 175), ...F(16, 92, 96) },
    { ...R(16, 88, 92, 175), ...F(16, 92, 96) }),
  mk({ id: 'knife', name: 'Throwing Knife', cmd: 'R', level: 'H', startup: 14, active: 1, recovery: 18, damage: 0, onBlock: 0, onHit: 0, pushback: 0, hitstop: 0, ammo: true, weight: 1,
    projectile: { kind: 'knife', speed: 0.26, damage: 40, level: 'H', y: 2.75, life: 70, radius: 0.15, hitstun: 16, blockstun: 10 } },
    { ...F(4, -30, 60), twist: 0.1 },
    { ...F(14, 100, 95), twist: 0.9 },
    { ...F(14, 80, 60), twist: 0.9 }),
  mk({ id: 'wave', name: 'Shadow Wave', cmd: 'M', level: 'L', startup: 18, active: 1, recovery: 22, damage: 0, onBlock: 0, onHit: 0, pushback: 0, hitstop: 0, cost: 500, weight: 3,
    projectile: { kind: 'wave', speed: 0.16, damage: 90, level: 'L', y: 0.45, life: 90, radius: 0.35, knockdown: true, blockstun: 16 } },
    C({ ...R(10, 170, 180, 190), twist: 0.3 }),
    C({ ...R(30, 55, 30, 5), twist: 0.9 }),
    C({ ...R(30, 50, 25, 0), twist: 0.9 })),
  mk({ id: 'moonfall', name: 'Moonfall', cmd: 'S', level: 'M', startup: 22, active: 3, recovery: 30, damage: 130, onBlock: -16, onHit: 'kd', pushback: 1.0, hitstop: 8, shape: 'weapon', radius: 0.16, advance: 1.2, hop: [5, 21, 1.1], armor: [4, 20], cost: 500, wall: true, weight: 3 },
    { ...R(-6, 175, 182, 190), ...F(-6, 150, 170), ...legs(60, -30, 20, -70) },
    { ...R(24, 85, 70, 50), ...F(24, 20, 50), twist: 1, ...lunge(1.0, -0.9, 1.45) },
    { ...R(30, 50, 30, 15), twist: 1, ...lunge(1.05, -0.95, 1.4) },
    { anticAt: 14 }),
  {
    id: 'wake', name: 'Wake-up Kick', cmd: 'wake', level: 'L', startup: 14, active: 2, recovery: 26, damage: 40, onBlock: -16, onHit: 2, pushback: 0.5, hitstop: 4, shape: 'fFoot', radius: 0.17, crouch: true, crouchRest: true, weight: 2,
    keys: [
      { t: 0, p: LYING },
      { t: 8, p: { rot: 45, ...legs(60, 20, 10, -60), lean: 0 }, e: 'inout' },
      { t: 14, p: { rot: 20, ...legs(78, 84, 14, -82), lean: 10 }, e: 'in' },
      { t: 16, p: { rot: 20, ...legs(76, 82, 14, -82), lean: 10 }, e: 'out' },
      { t: 41, p: { ...crouchLegs, lean: 20 }, e: 'inout' },
    ],
  },
];

export const corvin: FighterDef = {
  id: 'corvin', name: 'Corvin', title: 'The Ferryman', weaponName: 'Moonbite Sabre', family: 'Straight sword', style: 'All-rounder: honest pokes, strong punishes, no gimmicks.', difficulty: 1,
  maxHp: 1000, walkF: 70, walkB: 56, dashV: 210,
  rig, visual: { coat: true, topknot: true, hood: false, scarf: false, bulk: 1 },
  stance, crouch, feet: FEET, moves,
  anim: {
    idleRate: 2.8, idleBob: 0.04,
    guard: { ...F(0, 55, 125), ...R(0, 25, 118, 165) },
    win: { ...F(-4, 20, 30), ...R(-4, 170, 175, 178) },
    intro: { ...F(2, 90, 130), ...R(2, 40, 100, 150) },
    showcase: { lean: 10, ...F(10, 75, 140), ...R(10, 95, 130, 160) },
  },
};
