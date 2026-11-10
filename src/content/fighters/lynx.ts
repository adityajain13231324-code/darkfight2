// Lynx — boss-inspired claw assassin. Compact, fast, smoke concealment signature.
import { LYING, arms, legs } from '../author';
import { strike } from '../clips';
import { legsAt, type Pose, type Rig } from '../rig';
import type { FighterDef, MoveDef } from '../types';

const rig: Rig = { scale: 0.94, thigh: 0.95, shin: 0.95, torso: 1.15, ua: 0.6, fa: 0.56, weapon: 'claws', weaponLen: 0.42 };
const FEET: [number, number, number] = [0.68, -0.7, 1.55];
const stanceLegs = legsAt(rig, FEET[0], FEET[1], FEET[2]);
const stance = { head: -6, twist: 0.3, px: 0, rot: 0, ...arms(16, [55, 125], [20, 105], 10), ...stanceLegs } as Pose;
const crouchLegs = legsAt(rig, 0.6, -0.6, 0.95);
const crouch = { ...stance, ...crouchLegs, ...arms(24, [50, 115], [25, 100], 10) } as Pose;

const lunge = (f = 1.05, r = -1.0, h = 1.35) => legsAt(rig, f, r, h);
const C = (o: Partial<Pose>): Partial<Pose> => ({ ...crouchLegs, ...o });

type M = Omit<MoveDef, 'keys'>;
const mk = (m: M, antic: Partial<Pose>, contact: Partial<Pose>, follow: Partial<Pose>, opts: Parameters<typeof strike>[4] = {}): MoveDef =>
  ({ ...m, keys: strike(m, antic, contact, follow, opts) });

const moves: MoveDef[] = [
  mk({ id: 'jab', name: 'Claw Jab', cmd: 'A', level: 'H', startup: 10, active: 2, recovery: 13, damage: 40, onBlock: 1, onHit: 8, pushback: 0.3, hitstop: 3, shape: 'fClaw', radius: 0.13, weight: 1, next: [{ btn: 'A', move: 'rake', cancel: 12 }] },
    { ...arms(12, [20, 120], [15, 100], 20), twist: 0 },
    { ...arms(18, [100, 102], [10, 95], 0), twist: 0.9 },
    { ...arms(18, [104, 108], [10, 95], 5), twist: 0.9 }),
  mk({ id: 'rake', name: 'Cross Rake', cmd: 'A,A', level: 'H', startup: 10, active: 2, recovery: 16, damage: 45, onBlock: -3, onHit: 5, pushback: 0.4, hitstop: 4, shape: 'rClaw', radius: 0.13, weight: 2, next: [{ btn: 'A', move: 'rend', cancel: 13 }] },
    { ...arms(14, [80, 100], [-30, 60], 20), twist: 0.9 },
    { ...arms(20, [40, 90], [92, 96], 0), twist: 0.1 },
    { ...arms(20, [40, 90], [100, 110], 10), twist: 0.05 }),
  mk({ id: 'rend', name: 'Rending Pounce', cmd: 'A,A,A', level: 'M', startup: 13, active: 3, recovery: 24, damage: 70, onBlock: -13, onHit: 'kd', pushback: 0.9, hitstop: 6, shape: 'rClaw', radius: 0.15, advance: 0.5, wall: true, weight: 3 },
    { ...arms(-4, [160, 170], [170, 185], 20), ...legsAt(rig, 0.5, -0.8, 1.6) },
    { ...arms(30, [70, 60], [78, 65], -10), twist: 0.9, ...lunge(1.1, -1.0, 1.3) },
    { ...arms(34, [50, 40], [55, 40], -10), twist: 0.9, ...lunge(1.15, -1.05, 1.25) }),
  mk({ id: 'pounce', name: 'Pounce', cmd: 'f+A', level: 'M', startup: 15, active: 3, recovery: 22, damage: 75, onBlock: -8, onHit: 3, pushback: 0.6, hitstop: 5, shape: 'fClaw', radius: 0.14, advance: 1.2, hop: [3, 15, 0.35], precision: true, weight: 2 },
    C({ ...arms(24, [10, 60], [0, 50], 0) }),
    { ...arms(26, [76, 74], [70, 70], -5), twist: 0.9, ...lunge(1.15, -1.0, 1.35) },
    { ...arms(26, [74, 72], [68, 66], -5), twist: 0.9, ...lunge(1.2, -1.05, 1.3) }),
  mk({ id: 'evade', name: 'Evasive Rake', cmd: 'b+A', level: 'H', startup: 13, active: 3, recovery: 18, damage: 55, onBlock: -5, onHit: 4, pushback: 0.5, hitstop: 4, shape: 'rClaw', radius: 0.13, advance: -0.5, weight: 2 },
    { ...arms(-6, [60, 110], [-40, 30], 10), twist: 0.2 },
    { ...arms(10, [40, 90], [96, 100], 0), twist: 0.8 },
    { ...arms(10, [40, 90], [110, 125], 10), twist: 0.7 }),
  mk({ id: 'ankle', name: 'Ankle Rake', cmd: 'd+A', level: 'L', startup: 12, active: 2, recovery: 18, damage: 40, onBlock: -10, onHit: 2, pushback: 0.35, hitstop: 4, shape: 'fClaw', radius: 0.13, crouch: true, crouchRest: true, weight: 1 },
    C({ ...arms(26, [20, 80], [20, 90], 0) }),
    C({ ...arms(34, [50, 35], [25, 90], -10), twist: 0.9 }),
    C({ ...arms(34, [45, 28], [25, 90], -10), twist: 0.9 }),
    { rest: { ...crouchLegs, ...arms(24, [50, 115], [25, 100], 10) } }),
  mk({ id: 'uprend', name: 'Upward Rend', cmd: 'df+A', level: 'M', startup: 15, active: 3, recovery: 26, damage: 65, onBlock: -14, onHit: 'launch', pushback: 0.5, hitstop: 6, shape: 'rClaw', radius: 0.15, launch: [155, 20], precision: true, weight: 3 },
    C({ ...arms(26, [20, 70], [-10, 10], -10) }),
    { ...arms(18, [60, 100], [45, 58], 5), twist: 0.9, ...legsAt(rig, 0.75, -0.7, 1.2) },
    { ...arms(-6, [60, 100], [165, 175], 10), twist: 0.6, ...legs(22, 2, -22, -26) }),
  mk({ id: 'slide', name: 'Low Slide', cmd: 'db+A', level: 'L', startup: 18, active: 4, recovery: 26, damage: 70, onBlock: -16, onHit: 'kd', pushback: 0.5, hitstop: 6, shape: 'fClaw', radius: 0.15, advance: 0.8, crouch: true, crouchRest: true, weight: 3 },
    C({ ...arms(28, [-20, 40], [-10, 40], 0) }),
    C({ ...arms(40, [45, 30], [30, 40], -10), twist: 0.9, ...legsAt(rig, 1.0, -0.8, 0.85) }),
    C({ ...arms(40, [40, 25], [30, 40], -10), twist: 0.9, ...legsAt(rig, 1.0, -0.8, 0.85) }),
    { rest: { ...crouchLegs, ...arms(24, [50, 115], [25, 100], 10) } }),
  mk({ id: 'snap', name: 'Snap Kick', cmd: 'K', level: 'M', startup: 11, active: 2, recovery: 16, damage: 45, onBlock: -3, onHit: 4, pushback: 0.5, hitstop: 4, shape: 'fFoot', radius: 0.15, weight: 1, next: [{ btn: 'K', move: 'heel', cancel: 13 }] },
    { ...legs(72, -45, -18, -30), lean: 4 },
    { ...legs(84, 76, -14, -24), lean: -8 },
    { ...legs(80, 70, -14, -24), lean: -8 }),
  mk({ id: 'heel', name: 'Hook Heel', cmd: 'K,K', level: 'H', startup: 12, active: 2, recovery: 20, damage: 55, onBlock: -8, onHit: 5, pushback: 0.55, hitstop: 5, shape: 'rFoot', radius: 0.15, weight: 2 },
    { ...legs(15, 5, 60, -40), lean: -4, twist: 0.6 },
    { ...legs(8, 2, 130, 135), lean: -26, twist: 0.9 },
    { ...legs(8, 2, 120, 118), lean: -24, twist: 0.9 }),
  mk({ id: 'flyknee', name: 'Flying Knee', cmd: 'f+K', level: 'M', startup: 14, active: 3, recovery: 20, damage: 65, onBlock: -7, onHit: 4, pushback: 0.55, hitstop: 5, shape: 'fFoot', radius: 0.18, advance: 0.7, hop: [3, 16, 0.45], weight: 2 },
    { ...legs(40, -30, -10, -40), lean: 8 },
    { ...legs(100, -10, -30, -70), lean: -6 },
    { ...legs(96, -15, -30, -70), lean: -6 }),
  mk({ id: 'spinheel', name: 'Spin Heel', cmd: 'b+K', level: 'H', startup: 15, active: 3, recovery: 22, damage: 70, onBlock: -9, onHit: 6, onCH: 'kd', pushback: 0.65, hitstop: 6, shape: 'rFoot', radius: 0.15, weight: 3 },
    { ...legs(20, 5, 50, -60), lean: -8, twist: 0.8 },
    { ...legs(10, 4, 148, 152), lean: -34, twist: 1 },
    { ...legs(10, 4, 140, 142), lean: -32, twist: 1 }),
  mk({ id: 'sweep', name: 'Tail Sweep', cmd: 'd+K', level: 'L', startup: 16, active: 3, recovery: 26, damage: 60, onBlock: -15, onHit: 'kd', pushback: 0.45, hitstop: 6, shape: 'rFoot', radius: 0.16, crouch: true, crouchRest: true, weight: 2 },
    C({ lean: 26, ...legsAt(rig, 0.5, -0.5, 0.9) }),
    C({ lean: 30, ...legs(-10, -60, 76, 84), twist: 1 }),
    C({ lean: 30, ...legs(-10, -60, 74, 82), twist: 1 }),
    { rest: { ...crouchLegs, ...arms(24, [50, 115], [25, 100], 10) } }),
  mk({ id: 'shadowlunge', name: 'Shadow Lunge', cmd: 'f,f+A', level: 'M', startup: 14, active: 3, recovery: 24, damage: 80, onBlock: -11, onHit: 'kd', pushback: 0.9, hitstop: 6, shape: 'fClaw', radius: 0.14, advance: 1.3, wall: true, weight: 3 },
    { ...arms(26, [0, 50], [-20, 30], 0), ...lunge(0.8, -0.9, 1.4) },
    { ...arms(32, [72, 70], [60, 55], -5), twist: 1, ...lunge(1.3, -1.1, 1.25) },
    { ...arms(32, [70, 68], [58, 52], -5), twist: 1, ...lunge(1.35, -1.1, 1.22) }),
  mk({ id: 'airkick', name: 'Diving Talon', cmd: 'j+K', level: 'M', startup: 6, active: 8, recovery: 8, damage: 60, onBlock: -2, onHit: 'kd', pushback: 0.6, hitstop: 5, shape: 'fFoot', radius: 0.18, air: true, weight: 2 },
    { ...legs(70, -40, 35, -60), lean: 5 },
    { ...legs(60, 40, 30, -80), lean: -12 },
    { ...legs(58, 38, 30, -80), lean: -12 }),
  mk({ id: 'airclaw', name: 'Falling Claw', cmd: 'j+A', level: 'M', startup: 6, active: 6, recovery: 8, damage: 55, onBlock: -2, onHit: 'kd', pushback: 0.55, hitstop: 5, shape: 'rClaw', radius: 0.15, air: true, weight: 2 },
    { ...arms(0, [150, 170], [160, 180], 10), ...legs(70, -40, 35, -60) },
    { ...arms(20, [60, 50], [55, 40], -10), ...legs(60, -30, 30, -60) },
    { ...arms(20, [50, 40], [45, 30], -10), ...legs(60, -30, 30, -60) }),
  mk({ id: 'throwF', name: 'Front Throw', cmd: 'A+K', level: 'T', startup: 12, active: 2, recovery: 28, damage: 85, onBlock: 0, onHit: 'kd', pushback: 0, hitstop: 0, weight: 2 },
    { ...arms(12, [70, 100], [65, 95], 20) }, { ...arms(18, [92, 96], [88, 92], 20) }, { ...arms(18, [92, 96], [88, 92], 20) }),
  mk({ id: 'throwB', name: 'Back Throw', cmd: 'b+A+K', level: 'T', startup: 12, active: 2, recovery: 28, damage: 90, onBlock: 0, onHit: 'kd', pushback: 0, hitstop: 0, weight: 2 },
    { ...arms(12, [70, 100], [65, 95], 20) }, { ...arms(18, [92, 96], [88, 92], 20) }, { ...arms(18, [92, 96], [88, 92], 20) }),
  mk({ id: 'shuriken', name: 'Shuriken', cmd: 'R', level: 'H', startup: 12, active: 1, recovery: 18, damage: 0, onBlock: 0, onHit: 0, pushback: 0, hitstop: 0, ammo: true, weight: 1,
    projectile: { kind: 'shuriken', speed: 0.3, damage: 35, level: 'H', y: 2.6, life: 60, radius: 0.15, hitstun: 15, blockstun: 9 } },
    { ...arms(10, [55, 125], [-40, 40], 0) }, { ...arms(16, [55, 125], [96, 92], 0), twist: 0.9 }, { ...arms(16, [55, 125], [80, 60], 0), twist: 0.9 }),
  mk({ id: 'ashclaw', name: 'Ash Claw', cmd: 'M', level: 'M', startup: 16, active: 3, recovery: 28, damage: 110, onBlock: -14, onHit: 'kd', pushback: 1.0, hitstop: 7, shape: 'rClaw', radius: 0.16, advance: 2.2, precision: true, cost: 500, wall: true, weight: 3 },
    C({ ...arms(30, [-30, 20], [-40, 0], 0) }),
    { ...arms(34, [70, 60], [80, 70], -10), twist: 1, ...lunge(1.4, -1.2, 1.2) },
    { ...arms(34, [60, 50], [70, 55], -10), twist: 1, ...lunge(1.45, -1.2, 1.18) }),
  mk({ id: 'smoke', name: 'Smoke Veil', cmd: 'S', level: 'M', startup: 10, active: 1, recovery: 16, damage: 0, onBlock: 0, onHit: 0, pushback: 0, hitstop: 0, smoke: 90, cooldown: 720, weight: 1 },
    C({ ...arms(24, [120, 160], [110, 150], 0) }), C({ ...arms(30, [20, 50], [10, 40], 0) }), C({ ...arms(30, [20, 50], [10, 40], 0) })),
  {
    id: 'wake', name: 'Wake-up Kick', cmd: 'wake', level: 'L', startup: 14, active: 2, recovery: 26, damage: 40, onBlock: -16, onHit: 2, pushback: 0.5, hitstop: 4, shape: 'fFoot', radius: 0.17, crouch: true, crouchRest: true, weight: 2,
    keys: [
      { t: 0, p: LYING },
      { t: 8, p: { rot: 45, ...legs(60, 20, 10, -60), lean: 0 }, e: 'inout' },
      { t: 14, p: { rot: 20, ...legs(78, 84, 14, -82), lean: 10 }, e: 'in' },
      { t: 16, p: { rot: 20, ...legs(76, 82, 14, -82), lean: 10 }, e: 'out' },
      { t: 41, p: { ...crouchLegs, lean: 24 }, e: 'inout' },
    ],
  },
];

export const lynx: FighterDef = {
  id: 'lynx', name: 'Lynx', title: 'The Unseen Claw', weaponName: 'Night Claws', family: 'Claws', style: 'Assassin: fast strings, long pounces, smoke to vanish. Weak at long range.', difficulty: 2,
  maxHp: 950, walkF: 80, walkB: 64, dashV: 230,
  rig, visual: { coat: false, topknot: false, hood: true, scarf: true, bulk: 0.92 },
  stance, crouch, feet: FEET, moves,
};
