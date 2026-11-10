// Deterministic 60 Hz fight simulation. Integer math only. No DOM, rendering, clocks or network.
import { ROSTER, type MoveC } from '../content/roster';
import * as C from './constants';
import { A, BTNS, DOWN, K, LEFT, RIGHT, UP, relDir } from './input';
import type { Act, Fighter, GameState, MatchOpts, SimEvent } from './types';

export const ACTIONABLE = new Set<Act>(['idle', 'walkF', 'walkB', 'crouch']);
const FACE_ACTS = new Set<Act>(['idle', 'walkF', 'walkB', 'crouch', 'land', 'kdGround', 'getup']);
const DIR_FALLBACK: Record<string, string[]> = {
  '': [''], f: ['f', ''], b: ['b', ''], d: ['d', ''], df: ['df', 'd', ''], db: ['db', 'd', ''],
  u: [''], uf: ['f', ''], ub: ['b', ''],
};

// ---------- state ----------
export function newFighter(fid: string, side: 0 | 1): Fighter {
  const fd = ROSTER[fid];
  return {
    fid, x: side === 0 ? -C.START_X : C.START_X, y: 0, vx: 0, vy: 0, facing: side === 0 ? 1 : -1,
    hp: fd.maxHp, maxHp: fd.maxHp, act: 'idle', t: 0,
    move: '', moveBtn: 0, hitDone: false, queued: '', airMove: false,
    stun: 0, crouchStun: false, hitLoc: 1, heavy: false,
    curIn: 0, prevIn: 0, pressed: 0, buf: 0, bufAge: 0, bufDir: '',
    lastTapF: -100, lastTapB: -100, dashF: false, dashB: false, jumpDir: 0,
    pushRem: 0, pushDir: 0, breakReq: false, throwBack: false,
    arcFrom: 0, arcTo: 0, pend: 0, combo: 0, comboDmg: 0, takenHits: 0, takenDmg: 0,
    airHits: 0, splatUsed: false, wallHit: false, lastFree: -1, guard: true, ko: false, calm: 0,
    meter: 0, ammo: C.AMMO, sigCd: 0, smoke: 0, armorUsed: false,
  };
}

export function createState(opts: MatchOpts): GameState {
  const s: GameState = {
    frame: 0, mode: opts.mode, roundsToWin: opts.roundsToWin,
    f: [newFighter(opts.fighters[0], 0), newFighter(opts.fighters[1], 1)],
    proj: [], nextProj: 1,
    hitstop: 0, timer: C.ROUND_FRAMES, round: 1, wins: [0, 0], draws: 0,
    phase: 'intro', phaseT: 0, roundWinner: -1, adv: null, lastAdv: null, lastMove: ['', ''],
    infiniteHp: true, refillMeter: false, events: [],
  };
  resetRound(s);
  return s;
}

export function resetRound(s: GameState, keepMeter = true): void {
  for (let i = 0; i < 2; i++) {
    const old = s.f[i];
    const f = newFighter(old.fid, i as 0 | 1);
    f.guard = old.guard;
    if (keepMeter) f.meter = old.meter;
    s.f[i] = f;
  }
  s.proj = [];
  s.phase = s.mode === 'training' ? 'fight' : 'intro';
  s.phaseT = 0; s.timer = C.ROUND_FRAMES; s.hitstop = 0; s.adv = null; s.roundWinner = -1;
}

export function resetPositions(s: GameState, where: 'center' | 'left' | 'right' = 'center'): void {
  resetRound(s);
  const off = where === 'center' ? 0 : where === 'left' ? -8000 : 8000;
  s.f[0].x += off; s.f[1].x += off;
}

export const moveOf = (f: Fighter): MoveC => ROSTER[f.fid].moves[f.move];
const ev = (s: GameState, e: SimEvent) => { s.events.push(e); };
const LIM = C.STAGE_HALF - C.BODY_HALF;
const clampX = (x: number) => Math.max(-LIM, Math.min(LIM, x));

function setAct(f: Fighter, a: Act): void { if (f.act !== a) { f.act = a; f.t = 0; } }
function toNeutral(f: Fighter): void {
  f.act = 'idle'; f.t = 0; f.move = ''; f.queued = ''; f.vx = 0; f.stun = 0; f.airMove = false;
  if (f.vy === 0) f.y = 0;
}

// ---------- hurtboxes ----------
type Box = [number, number, number, number, number]; // x0,y0,x1,y1,tag (0 head,1 torso,2 legs)
const STAND: number[][] = [[-300, 2900, 300, 3700, 0], [-430, 1400, 430, 2900, 1], [-450, 0, 450, 1400, 2]];
const CROUCH: number[][] = [[-300, 1900, 300, 2450, 0], [-480, 900, 480, 1900, 1], [-500, 0, 500, 900, 2]];

function isCrouching(f: Fighter): boolean {
  if (f.act === 'crouch') return true;
  if (f.act === 'move') return moveOf(f).crouch && f.t > 2;
  if (f.act === 'blockstun' || f.act === 'hitstun') return f.crouchStun;
  return false;
}

export function hurtboxes(f: Fighter): Box[] {
  if (f.ko) return [];
  switch (f.act) {
    case 'kdGround': case 'throwClinch': case 'thrownClinch': case 'throwExec': case 'thrownExec': case 'throwBreak': case 'win':
      return [];
    case 'getup': if (f.t <= C.GETUP_INV) return []; break;
    case 'roll': if (f.t <= C.ROLL_INV) return []; break;
    case 'air': {
      if (f.airHits >= C.JUGGLE_MAX) return [];
      return [[f.x - 750, f.y, f.x + 750, f.y + 1300, 1]];
    }
  }
  const k = ROSTER[f.fid].heightPm;
  const set = isCrouching(f) ? CROUCH : STAND;
  return set.map((b) => [f.x + b[0], f.y + Math.trunc((b[1] * k) / 1000), f.x + b[2], f.y + Math.trunc((b[3] * k) / 1000), b[4]] as Box);
}

/** Swept capsule test of a move's attack edge against boxes. Returns [tag, x, y] or null. */
function contact(a: Fighter, m: MoveC, boxes: Box[]): [number, number, number] | null {
  if (!m.shapes || !boxes.length) return null;
  const cur = m.shapes[Math.min(a.t, m.shapes.length - 1)];
  const prev = m.shapes[Math.max(m.startup, Math.min(a.t - 1, m.shapes.length - 1))]; // no hits from the wind-up
  const segs = [cur, prev, cur.map((v, i) => (v + prev[i]) >> 1)];
  const rad = m.radius;
  // priority: head, torso, legs (boxes are ordered that way)
  for (const b of boxes) {
    for (const sg of segs) {
      for (let k = 0; k <= 4; k++) {
        const lx = sg[0] + Math.trunc(((sg[2] - sg[0]) * k) / 4);
        const ly = sg[1] + Math.trunc(((sg[3] - sg[1]) * k) / 4);
        const x = a.x + lx * a.facing;
        const y = a.y + ly;
        if (x >= b[0] - rad && x <= b[2] + rad && y >= b[1] - rad && y <= b[3] + rad) return [b[4], x, y];
      }
    }
  }
  return null;
}

// ---------- input resolution ----------
function canUse(f: Fighter, m: MoveC): boolean {
  if (m.cost && f.meter < m.cost) return false;
  if (m.ammo && f.ammo <= 0) return false;
  if (m.cooldown && f.sigCd > 0) return false;
  return true;
}

function startMove(s: GameState, i: number, id: string): void {
  const f = s.f[i];
  const m = ROSTER[f.fid].moves[id];
  f.act = 'move'; f.move = id; f.t = 1; f.hitDone = false; f.queued = ''; f.buf = 0; f.armorUsed = false;
  f.moveBtn = m.btnMask;
  f.airMove = m.air;
  if (!m.air) { f.vx = 0; f.y = 0; }
  if (m.cost) f.meter -= m.cost;
  if (m.ammo) f.ammo--;
  if (m.cooldown) f.sigCd = m.cooldown;
  if (f.smoke && (m.strike || m.projectile)) { f.smoke = 0; ev(s, { type: 'reveal', p: i }); }
  s.lastMove[i] = id;
}

function resolveMove(f: Fighter, inDash: boolean, air: boolean): string {
  const fd = ROSTER[f.fid];
  const b = f.buf;
  const use = (id: string | undefined) => (id && canUse(f, fd.moves[id]) ? id : '');
  if (air) {
    if (b & A) return use(fd.cmd['j+A']);
    if (b & K) return use(fd.cmd['j+K']);
    return '';
  }
  if ((b & (A | K)) === (A | K)) return use(f.bufDir.includes('b') ? fd.cmd['b+A+K'] : fd.cmd['A+K']);
  const order: [number, string][] = [[A, 'A'], [K, 'K'], [64, 'R'], [128, 'M'], [256, 'S']];
  for (const [bit, name] of order) {
    if (!(b & bit)) continue;
    if (name === 'R' || name === 'M' || name === 'S') return use(fd.cmd[name]);
    if (inDash && fd.cmd['f,f+' + name]) return use(fd.cmd['f,f+' + name]);
    for (const k of DIR_FALLBACK[f.bufDir] ?? ['']) {
      const id = fd.cmd[k ? `${k}+${name}` : name];
      if (id) return use(id);
    }
  }
  return '';
}

function tryBuffered(s: GameState, i: number, inDash = false): boolean {
  const f = s.f[i];
  if (!f.buf) return false;
  // Wait CHORD ticks for a possible A+K throw before committing to A or K alone.
  const single = f.buf & (A | K);
  if ((single === A || single === K) && f.bufAge < C.CHORD && !(f.buf & ~(A | K))) return false;
  const id = resolveMove(f, inDash || f.dashF, false);
  if (!id) { f.buf = 0; return false; }
  startMove(s, i, id);
  return true;
}

function think(s: GameState, i: number): void {
  const f = s.f[i];
  f.lastFree = s.frame;
  if (tryBuffered(s, i)) return;
  const d = relDir(f.curIn, f.facing);
  const fd = ROSTER[f.fid];
  if (f.dashF) { setAct(f, 'dash'); f.vx = f.facing * fd.dashV; return; }
  if (f.dashB) { setAct(f, 'backdash'); f.vx = -f.facing * C.BDASH_V; return; }
  if (d === 'u' || d === 'uf' || d === 'ub') { setAct(f, 'jump'); f.jumpDir = d === 'uf' ? 1 : d === 'ub' ? -1 : 0; f.vx = 0; return; }
  if (d[0] === 'd') { setAct(f, 'crouch'); f.vx = 0; return; }
  if (d === 'f') { setAct(f, 'walkF'); f.vx = f.facing * fd.walkF; return; }
  if (d === 'b') { setAct(f, 'walkB'); f.vx = -f.facing * fd.walkB; return; }
  setAct(f, 'idle'); f.vx = 0;
}

function endCombo(s: GameState, def: number): void {
  const a = s.f[1 - def];
  const d = s.f[def];
  if (a.combo > 1) ev(s, { type: 'comboEnd', p: 1 - def, value: a.combo, dmg: a.comboDmg });
  a.combo = 0; a.comboDmg = 0; d.takenHits = 0; d.takenDmg = 0; d.airHits = 0; d.splatUsed = false; d.wallHit = false;
}

// ---------- per-fighter update ----------
function update(s: GameState, i: number): void {
  const f = s.f[i];
  f.t++;
  if (f.sigCd > 0) f.sigCd--;
  if (f.smoke > 0 && --f.smoke === 0) ev(s, { type: 'reveal', p: i });
  switch (f.act) {
    case 'move': {
      const m = moveOf(f);
      // A then K (or K then A) within the chord window upgrades to a throw.
      if (f.t <= C.CHORD + 1 && f.pressed && m.root && m.level !== 'T' && (m.btnMask === A || m.btnMask === K) && !m.air) {
        if (((f.moveBtn | f.pressed) & (A | K)) === (A | K)) {
          const fd = ROSTER[f.fid];
          const id = f.bufDir.includes('b') ? fd.cmd['b+A+K'] : fd.cmd['A+K'];
          if (id) { startMove(s, i, id); break; }
        }
      }
      if (m.next.length) {
        if (!f.queued && f.buf) {
          for (const n of m.next) if ((f.buf & n.mask) && f.t <= n.cancel) { f.queued = n.move; f.buf = 0; break; }
        }
        if (f.queued) {
          const n = m.next.find((x) => x.move === f.queued)!;
          if (f.t >= n.cancel) { startMove(s, i, f.queued); break; }
        }
      }
      if (!m.air) {
        f.vx = m.advance && f.t <= m.startup ? f.facing * Math.trunc(m.advance / m.startup) : 0;
        if (m.hop) {
          const [a, b, h] = m.hop;
          f.y = f.t > a && f.t < b ? Math.trunc((4 * h * (f.t - a) * (b - f.t)) / ((b - a) * (b - a))) : 0;
        }
      }
      if (f.t === m.startup) {
        ev(s, { type: 'swing', p: i, weight: m.weight, move: m.id });
        if (m.projectile) spawnProjectile(s, i, m);
        if (m.smoke) { f.smoke = m.smoke; ev(s, { type: 'smoke', p: i }); }
      }
      if (f.t > m.total && !m.air) { toNeutral(f); think(s, i); }
      break;
    }
    case 'blockstun':
    case 'hitstun':
      if (f.t > f.stun) {
        const wasHit = f.act === 'hitstun';
        toNeutral(f);
        if (wasHit) endCombo(s, i);
        think(s, i);
      }
      break;
    case 'dash':
      f.vx = f.facing * Math.trunc((ROSTER[f.fid].dashV * (C.DASH_T - f.t)) / C.DASH_T);
      if (f.buf && tryBuffered(s, i, true)) break;
      if (f.t >= C.DASH_T) { toNeutral(f); think(s, i); }
      break;
    case 'backdash':
      f.vx = -f.facing * Math.trunc((C.BDASH_V * (C.BDASH_T - f.t)) / C.BDASH_T);
      if (f.t >= C.BDASH_CANCEL && f.buf && tryBuffered(s, i)) break;
      if (f.t >= C.BDASH_T) { toNeutral(f); think(s, i); }
      break;
    case 'jump':
      if (f.t === C.JUMP_PRE) {
        f.vy = C.JUMP_V; f.vx = f.jumpDir * C.JUMP_VX * f.facing; f.y = 1;
        ev(s, { type: 'jump', p: i });
      } else if (f.t > C.JUMP_PRE && f.buf) {
        const id = resolveMove(f, false, true);
        if (id) { const vx = f.vx; const vy = f.vy; const y = f.y; startMove(s, i, id); f.vx = vx; f.vy = vy; f.y = y; }
        else f.buf = 0;
      }
      break;
    case 'land':
      if (f.t > C.LAND_T) { toNeutral(f); think(s, i); }
      break;
    case 'air': case 'splat':
      break;
    case 'kdGround': {
      if (f.ko) break;
      const d = relDir(f.curIn, f.facing);
      if (f.t >= C.KD_MIN) {
        const wake = ROSTER[f.fid].cmd.wake;
        if (f.pressed & K && wake) { startMove(s, i, wake); break; }
        if (d === 'b' || d === 'db' || d === 'ub') { setAct(f, 'roll'); break; }
        if (d.includes('u') || (f.pressed & A)) { setAct(f, 'getup'); break; }
      }
      if (f.t >= C.KD_MAX) setAct(f, 'getup');
      break;
    }
    case 'getup':
      if (f.t > C.GETUP_T) { toNeutral(f); think(s, i); }
      break;
    case 'roll':
      f.vx = -f.facing * Math.trunc((2 * C.ROLL_DIST * (C.ROLL_T - f.t + 1)) / (C.ROLL_T * (C.ROLL_T + 1)));
      if (f.t > C.ROLL_T) { toNeutral(f); think(s, i); }
      break;
    case 'thrownClinch':
      if (f.t <= C.THROW_BREAK && (f.pressed & (A | K)) && (f.curIn & (A | K)) === (A | K)) f.breakReq = true;
      break;
    case 'throwExec':
      if (f.t > C.THROW_EXEC_T) { toNeutral(f); think(s, i); }
      break;
    case 'thrownExec': {
      const T = C.THROW_SLAM;
      if (f.t < T) {
        f.x = f.arcFrom + Math.trunc(((f.arcTo - f.arcFrom) * f.t) / T);
        f.y = Math.trunc((4 * C.THROW_ARC * f.t * (T - f.t)) / (T * T));
      } else {
        f.x = f.arcTo; f.y = 0;
        const a = s.f[1 - i];
        const dmg = Math.min(f.hp, f.pend);
        f.hp -= dmg;
        a.combo++; a.comboDmg += dmg;
        gainMeter(a, dmg); gainMeter(f, Math.trunc((dmg * 6) / 10));
        ev(s, { type: 'hit', p: 1 - i, x: f.x, y: 300, dmg, level: 'T', weight: 3, kind: 'throw' });
        s.hitstop = 6;
        f.act = 'kdGround'; f.t = 0;
        endCombo(s, i);
      }
      break;
    }
    case 'throwClinch':
      break;
    case 'throwBreak':
      if (f.t > C.BREAK_T) { toNeutral(f); think(s, i); }
      break;
    case 'win':
      f.vx = 0;
      break;
    default:
      think(s, i);
  }
}

function gainMeter(f: Fighter, v: number) { f.meter = Math.min(C.METER_MAX, f.meter + v); }

function spawnProjectile(s: GameState, i: number, m: MoveC): void {
  const f = s.f[i];
  const p = m.projectile!;
  s.proj.push({
    id: s.nextProj++, o: i, kind: p.kind, x: f.x + f.facing * (C.BODY_HALF + 300), y: f.y + p.y,
    vx: f.facing * p.speed, life: p.life, dmg: p.damage, level: p.level, r: p.radius, kd: p.knockdown, hs: p.hitstun, bs: p.blockstun,
  });
  ev(s, { type: 'proj', p: i, kind: p.kind });
}

// ---------- interactions ----------
function interactions(s: GameState): void {
  for (let i = 0; i < 2; i++) {
    const a = s.f[i];
    const d = s.f[1 - i];
    if (a.act !== 'throwClinch' || d.act !== 'thrownClinch') continue;
    if (d.breakReq) {
      d.breakReq = false;
      a.act = 'throwBreak'; a.t = 0; d.act = 'throwBreak'; d.t = 0;
      a.pushRem = C.BREAK_PUSH; a.pushDir = -a.facing; d.pushRem = C.BREAK_PUSH; d.pushDir = a.facing;
      ev(s, { type: 'throwBreak', p: 1 - i, x: (a.x + d.x) >> 1, y: 2400 });
    } else if (a.t > C.THROW_BREAK) {
      a.act = 'throwExec'; a.t = 0; d.act = 'thrownExec'; d.t = 0;
      d.arcFrom = d.x;
      d.arcTo = clampX(a.throwBack ? a.x - a.facing * C.THROW_SWAP : a.x + a.facing * C.THROW_TOSS);
      d.pend = moveOf(a).damage;
      ev(s, { type: 'throwExec', p: i, kind: a.throwBack ? 'B' : 'F' });
    }
  }
}

type HitKind = 'hit' | 'ch' | 'crit' | 'block' | 'throw' | 'armor';
interface Hit { i: number; kind: HitKind; m: MoveC; loc: number; x: number; y: number }

function guardState(d: Fighter): { stand: boolean; crouch: boolean } {
  const dir = relDir(d.curIn, d.facing);
  const ok = d.guard && (d.act === 'idle' || d.act === 'walkB' || d.act === 'crouch' || d.act === 'blockstun');
  // Neutral standing or holding back blocks high/mid. Only down-back blocks lows.
  const stand = ok && (dir === '' || dir === 'b') && d.act !== 'crouch';
  const crouch = ok && dir === 'db';
  return { stand, crouch };
}

function resolveHits(s: GameState): void {
  const hits: Hit[] = [];
  for (let i = 0; i < 2; i++) {
    const a = s.f[i];
    const d = s.f[1 - i];
    if (a.act !== 'move' || a.hitDone) continue;
    const m = moveOf(a);
    if (a.t < m.startup || a.t > m.startup + m.active - 1) continue;
    if (m.level === 'T') {
      const gap = Math.abs(a.x - d.x) - 2 * C.BODY_HALF;
      const grabbable = (ACTIONABLE.has(d.act) && d.act !== 'crouch') || d.act === 'dash' || d.act === 'backdash' || (d.act === 'move' && !moveOf(d).crouch && !d.airMove && d.y === 0);
      if (gap <= C.THROW_RANGE && grabbable && d.y === 0 && !d.ko && (d.x - a.x) * a.facing > 0) hits.push({ i, kind: 'throw', m, loc: 1, x: d.x, y: 2400 });
      continue;
    }
    if (!m.strike) continue;
    if (!m.juggle && d.act === 'air') continue;
    const c = contact(a, m, hurtboxes(d));
    if (!c) continue;
    const [loc, x, y] = c;
    const g = guardState(d);
    let kind: HitKind;
    if ((m.level === 'H' || m.level === 'M') && g.stand) kind = 'block';
    else if (m.level === 'L' && g.crouch) kind = 'block';
    else if (d.act === 'move' && moveOf(d).armor && !d.armorUsed && d.t >= moveOf(d).armor![0] && d.t <= moveOf(d).armor![1]) kind = 'armor';
    else if (d.act === 'move' && d.t <= moveOf(d).startup + moveOf(d).active - 1) kind = 'ch';
    else if (m.precision && d.act === 'move') kind = 'crit';
    else kind = 'hit';
    hits.push({ i, kind, m, loc, x, y });
  }
  const strikes = hits.filter((h) => h.kind !== 'throw');
  const throws = hits.filter((h) => h.kind === 'throw');
  for (const h of strikes) applyStrike(s, h);
  if (throws.length === 2) {
    for (const f of s.f) { f.act = 'throwBreak'; f.t = 0; f.pushRem = C.BREAK_PUSH; f.pushDir = -f.facing; }
    ev(s, { type: 'throwBreak', p: 0, x: (s.f[0].x + s.f[1].x) >> 1, y: 2400 });
    return;
  }
  for (const h of throws) {
    if (strikes.some((x) => x.i !== h.i)) continue; // thrower was struck this tick
    const a = s.f[h.i];
    const d = s.f[1 - h.i];
    a.hitDone = true; a.throwBack = h.m.cmd.startsWith('b');
    a.act = 'throwClinch'; a.t = 0; a.vx = 0; a.pushRem = 0;
    d.act = 'thrownClinch'; d.t = 0; d.vx = 0; d.pushRem = 0; d.move = ''; d.queued = ''; d.breakReq = false; d.y = 0;
    if (d.smoke) { d.smoke = 0; ev(s, { type: 'reveal', p: 1 - h.i }); }
    d.x = clampX(a.x + a.facing * (2 * C.BODY_HALF + C.THROW_GAP));
    a.x = clampX(d.x - a.facing * (2 * C.BODY_HALF + C.THROW_GAP));
    ev(s, { type: 'throw', p: h.i, kind: a.throwBack ? 'B' : 'F', x: d.x, y: 2400 });
  }
}

function applyStrike(s: GameState, h: Hit): void {
  const a = s.f[h.i];
  const d = s.f[1 - h.i];
  const m = h.m;
  a.hitDone = true;
  const remaining = m.total - a.t;
  if (h.kind === 'block') {
    d.act = 'blockstun'; d.t = 0; d.stun = Math.max(1, m.onBlock + remaining);
    d.crouchStun = relDir(d.curIn, d.facing) === 'db';
    d.pushRem = m.pushback; d.pushDir = a.facing; d.vx = 0; d.move = ''; d.queued = '';
    gainMeter(a, Math.trunc(m.damage / 5)); gainMeter(d, Math.trunc(m.damage / 10));
    s.hitstop = Math.max(s.hitstop, Math.max(2, m.hitstop - 2));
    s.adv = { att: h.i, move: m.id, kind: 'block', aFree: -1, dFree: -1, since: s.frame };
    ev(s, { type: 'block', p: h.i, x: h.x, y: h.y, level: m.level, weight: m.weight, move: m.id });
    return;
  }
  // Damage pipeline: base x max(CH, crit) x head (capped) x combo scaling, combo cap.
  let bonus = h.kind === 'ch' ? C.CH_BONUS : h.kind === 'crit' ? C.CRIT_BONUS : 100;
  if (h.loc === 0) bonus = Math.min(C.BONUS_CAP, Math.trunc((bonus * C.HEAD_BONUS) / 100));
  const scale = C.SCALE[Math.min(d.takenHits, C.SCALE.length - 1)];
  let dmg = Math.trunc((m.damage * bonus * scale) / 10000);
  dmg = Math.min(dmg, Math.max(0, C.COMBO_CAP - d.takenDmg), d.hp);
  if (s.mode === 'training' && d.hp - dmg < 1) dmg = Math.max(0, d.hp - 1);
  d.hp -= dmg;
  d.takenHits++; d.takenDmg += dmg; d.calm = 0;
  a.combo++; a.comboDmg += dmg;
  gainMeter(a, dmg); gainMeter(d, Math.trunc((dmg * 6) / 10));
  d.hitLoc = h.loc; d.heavy = m.weight >= 3;
  if (d.smoke) { d.smoke = 0; ev(s, { type: 'reveal', p: 1 - h.i }); }
  s.hitstop = h.kind === 'ch' || h.kind === 'crit' ? Math.max(m.hitstop, 7) : m.hitstop;
  ev(s, { type: 'hit', p: h.i, x: h.x, y: h.y, dmg, level: m.level, weight: m.weight, move: m.id, kind: h.kind, loc: h.loc });
  if (h.kind === 'armor') {
    d.armorUsed = true;
    ev(s, { type: 'armor', p: 1 - h.i, x: h.x, y: h.y });
    s.adv = null;
    if (d.hp <= 0) knock(d, a.facing, C.KD_VY, C.KD_VX);
    return;
  }
  const res = h.kind === 'ch' ? m.onCH : m.onHit;
  const wasAir = d.act === 'air' || d.y > 0 || d.act === 'splat';
  d.wallHit = m.wall;
  if (wasAir) {
    d.airHits++;
    if (d.act === 'splat') d.splatUsed = true;
    const pop = res === 'launch' && m.launch ? Math.trunc((m.launch[0] * 7) / 10) : C.JUGGLE_POP;
    knock(d, a.facing, Math.max(30, pop - 15 * d.airHits), 35);
    s.adv = null;
  } else if (res === 'launch' && m.launch) {
    knock(d, a.facing, m.launch[0], m.launch[1]);
    s.adv = null;
  } else if (res === 'kd' || d.hp <= 0) {
    knock(d, a.facing, C.KD_VY, C.KD_VX);
    s.adv = null;
  } else {
    d.act = 'hitstun'; d.t = 0; d.stun = Math.max(1, (res as number) + remaining);
    d.crouchStun = isCrouching(d);
    d.pushRem = m.pushback; d.pushDir = a.facing; d.vx = 0; d.move = ''; d.queued = '';
    s.adv = { att: h.i, move: m.id, kind: h.kind, aFree: -1, dFree: -1, since: s.frame };
  }
  if (!s.adv) s.lastAdv = { att: h.i, move: m.id, kind: 'kd', aFree: -1, dFree: -1, since: s.frame, value: NaN };
}

function knock(d: Fighter, dir: number, vy: number, vx: number): void {
  d.act = 'air'; d.t = 0; d.vy = vy; d.vx = dir * vx; d.y = Math.max(d.y, 1);
  d.pushRem = 0; d.move = ''; d.queued = ''; d.airMove = false;
}

// ---------- projectiles ----------
function updateProjectiles(s: GameState): void {
  for (const p of s.proj) { p.x += p.vx; p.life--; }
  // Opposing projectiles cancel each other.
  for (const p of s.proj) for (const q of s.proj) {
    if (p.o !== q.o && p.life > 0 && q.life > 0 && Math.abs(p.x - q.x) <= p.r + q.r && Math.abs(p.y - q.y) <= p.r + q.r + 400) {
      p.life = 0; q.life = 0; ev(s, { type: 'clash', p: p.o, x: (p.x + q.x) >> 1, y: p.y });
    }
  }
  for (const p of s.proj) {
    if (p.life <= 0) continue;
    const d = s.f[1 - p.o];
    const boxes = hurtboxes(d);
    let loc = -1;
    for (const b of boxes) if (p.x >= b[0] - p.r && p.x <= b[2] + p.r && p.y >= b[1] - p.r && p.y <= b[3] + p.r) { loc = b[4]; break; }
    if (loc < 0) continue;
    p.life = 0;
    const g = guardState(d);
    const blocked = ((p.level === 'H' || p.level === 'M') && g.stand) || (p.level === 'L' && g.crouch);
    if (blocked) {
      d.act = 'blockstun'; d.t = 0; d.stun = p.bs; d.crouchStun = relDir(d.curIn, d.facing) === 'db'; d.move = ''; d.queued = '';
      d.pushRem = 300; d.pushDir = Math.sign(p.vx);
      s.hitstop = Math.max(s.hitstop, 2);
      ev(s, { type: 'block', p: p.o, x: p.x, y: p.y, level: p.level, weight: 1, kind: p.kind });
      continue;
    }
    const scale = C.SCALE[Math.min(d.takenHits, C.SCALE.length - 1)];
    let dmg = Math.min(Math.trunc((p.dmg * scale) / 100), Math.max(0, C.COMBO_CAP - d.takenDmg), d.hp);
    if (s.mode === 'training' && d.hp - dmg < 1) dmg = Math.max(0, d.hp - 1);
    d.hp -= dmg; d.takenHits++; d.takenDmg += dmg; d.hitLoc = loc; d.heavy = p.kd;
    const a = s.f[p.o];
    a.combo++; a.comboDmg += dmg; gainMeter(a, dmg); gainMeter(d, Math.trunc((dmg * 6) / 10));
    if (d.smoke) { d.smoke = 0; ev(s, { type: 'reveal', p: 1 - p.o }); }
    if (p.kd || d.act === 'air' || d.y > 0 || d.hp <= 0) { if (d.act === 'air') d.airHits++; knock(d, Math.sign(p.vx), C.KD_VY, C.KD_VX); }
    else { d.act = 'hitstun'; d.t = 0; d.stun = p.hs; d.crouchStun = isCrouching(d); d.move = ''; d.queued = ''; d.pushRem = 350; d.pushDir = Math.sign(p.vx); }
    s.hitstop = Math.max(s.hitstop, 4);
    ev(s, { type: 'hit', p: p.o, x: p.x, y: p.y, dmg, level: p.level, weight: p.kd ? 3 : 1, kind: 'proj', loc });
  }
  s.proj = s.proj.filter((p) => p.life > 0 && Math.abs(p.x) < C.STAGE_HALF + 1500);
}

// ---------- physics ----------
function physics(s: GameState): void {
  for (let i = 0; i < 2; i++) {
    const f = s.f[i];
    const o = s.f[1 - i];
    const ballistic = (f.act === 'jump' && f.t >= C.JUMP_PRE && (f.y > 0 || f.vy > 0)) || f.act === 'air' || (f.act === 'move' && f.airMove);
    if (ballistic) {
      f.vy -= C.GRAVITY;
      f.y += f.vy;
      f.x += f.vx;
      if (f.y <= 0) {
        f.y = 0; f.vy = 0; f.vx = 0;
        if (f.act === 'air') { f.act = 'kdGround'; f.t = 0; endCombo(s, i); ev(s, { type: 'kd', p: i, x: f.x }); }
        else { f.act = 'land'; f.t = 0; f.move = ''; f.airMove = false; ev(s, { type: 'land', p: i, x: f.x }); }
      }
    } else if (f.act === 'splat') {
      if (f.y > 0) f.y = Math.max(0, f.y - 25);
      if (f.t > C.SPLAT_T) { f.act = f.y > 0 ? 'air' : 'kdGround'; f.t = 0; f.vy = 0; if (f.act === 'kdGround') { endCombo(s, i); ev(s, { type: 'kd', p: i, x: f.x }); } }
    } else if (f.act !== 'thrownExec') {
      f.x += f.vx;
    }
    if (f.pushRem > 0) {
      const p = Math.min(f.pushRem, Math.max(C.PUSH_MIN, Math.trunc(f.pushRem / 4)));
      f.pushRem -= p;
      f.x += f.pushDir * p;
    }
    if (f.x > LIM || f.x < -LIM) {
      const over = f.x > LIM ? f.x - LIM : f.x + LIM;
      f.x -= over;
      if ((f.act === 'air' || (f.act === 'hitstun' && f.wallHit)) && !f.splatUsed && f.takenHits > 0) {
        f.act = 'splat'; f.t = 0; f.vx = 0; f.vy = 0; f.splatUsed = true; f.pushRem = 0;
        ev(s, { type: 'wall', p: i, x: f.x, y: f.y + 2000 });
      } else if ((f.act === 'hitstun' || f.act === 'blockstun') && o.y === 0) {
        o.x = clampX(o.x - over); // the attacker absorbs pushback at the wall
      }
    }
  }
  const a = s.f[0];
  const b = s.f[1];
  const skip = (f: Fighter) => f.act === 'thrownExec' || f.act === 'kdGround' || f.act === 'getup' || f.act === 'roll' || f.act === 'air';
  if (!skip(a) && !skip(b) && Math.abs(a.y - b.y) < 1200) {
    const gap = Math.abs(a.x - b.x) - 2 * C.BODY_HALF;
    if (gap < 0) {
      const dir = Math.sign(b.x - a.x) || a.facing;
      const pen = -gap;
      const h = Math.trunc(pen / 2);
      a.x = clampX(a.x - dir * h);
      b.x = clampX(b.x + dir * (pen - h));
      if (Math.abs(a.x - b.x) < 2 * C.BODY_HALF) { b.x = clampX(a.x + dir * 2 * C.BODY_HALF); a.x = clampX(b.x - dir * 2 * C.BODY_HALF); }
    }
  }
}

function faceUpdate(s: GameState): void {
  for (let i = 0; i < 2; i++) {
    const f = s.f[i];
    const o = s.f[1 - i];
    if (FACE_ACTS.has(f.act) && f.x !== o.x) f.facing = o.x > f.x ? 1 : -1;
  }
}

function trackAdv(s: GameState): void {
  const t = s.adv;
  if (!t || t.since === s.frame) return;
  const a = s.f[t.att];
  const d = s.f[1 - t.att];
  if (t.aFree < 0 && a.lastFree === s.frame) t.aFree = s.frame;
  if (t.dFree < 0 && d.lastFree === s.frame) t.dFree = s.frame;
  if (t.aFree >= 0 && t.dFree >= 0) {
    s.lastAdv = { ...t, value: t.dFree - t.aFree };
    ev(s, { type: 'adv', p: t.att, value: t.dFree - t.aFree, move: t.move, kind: t.kind });
    s.adv = null;
  }
}

function roundLogic(s: GameState): void {
  if (s.mode === 'training') {
    for (let i = 0; i < 2; i++) {
      const f = s.f[i];
      const o = s.f[1 - i];
      if (s.refillMeter) f.meter = C.METER_MAX;
      if (!s.infiniteHp) continue;
      if (ACTIONABLE.has(f.act) && ACTIONABLE.has(o.act)) { if (++f.calm > C.CALM_REFILL) { f.hp = f.maxHp; f.ammo = C.AMMO; } }
      else f.calm = 0;
    }
    return;
  }
  if (s.phase === 'fight') {
    const k0 = s.f[0].hp <= 0;
    const k1 = s.f[1].hp <= 0;
    if (k0 || k1) {
      s.phase = 'ko'; s.phaseT = 0;
      s.roundWinner = k0 && k1 ? -1 : k0 ? 1 : 0;
      s.f[0].ko = k0; s.f[1].ko = k1;
      ev(s, { type: 'ko', p: s.roundWinner });
    } else if (--s.timer <= 0) {
      s.phase = 'ko'; s.phaseT = 0;
      // Compare health percentage (fighters can have different maximum health).
      const p0 = s.f[0].hp * s.f[1].maxHp;
      const p1 = s.f[1].hp * s.f[0].maxHp;
      s.roundWinner = p0 === p1 ? -1 : p0 > p1 ? 0 : 1;
      ev(s, { type: 'timeup', p: s.roundWinner });
    }
  } else if (s.phase === 'ko') {
    s.phaseT++;
    const w = s.roundWinner;
    if (w >= 0 && s.phaseT > 40 && ACTIONABLE.has(s.f[w].act)) { s.f[w].act = 'win'; s.f[w].t = 0; s.f[w].vx = 0; }
    if (s.phaseT >= C.KO_FRAMES) {
      if (w >= 0) { s.wins[w]++; s.draws = 0; }
      else if (++s.draws >= C.MAX_DRAWS) { s.wins[0]++; s.wins[1]++; s.draws = 0; } // repeated draw: both score
      if (s.wins[0] >= s.roundsToWin || s.wins[1] >= s.roundsToWin) {
        s.phase = 'end'; s.phaseT = 0;
        const both = s.wins[0] >= s.roundsToWin && s.wins[1] >= s.roundsToWin;
        ev(s, { type: 'matchEnd', p: both ? -1 : s.wins[0] >= s.roundsToWin ? 0 : 1 });
      } else { s.round++; resetRound(s); }
    }
  } else if (s.phase === 'end') s.phaseT++;
}

/** Advance the simulation by exactly one tick. */
export function step(s: GameState, inputs: readonly [number, number]): void {
  s.events = [];
  s.frame++;
  const live = s.phase === 'fight';
  for (let i = 0; i < 2; i++) {
    const f = s.f[i];
    f.prevIn = f.curIn;
    f.curIn = live ? inputs[i] & (BTNS | UP | DOWN | LEFT | RIGHT) : 0;
    f.pressed = f.curIn & ~f.prevIn & BTNS;
    if (f.pressed) { f.buf |= f.pressed; f.bufAge = 0; f.bufDir = relDir(f.curIn, f.facing); }
    const fwd = f.facing > 0 ? RIGHT : LEFT;
    const back = f.facing > 0 ? LEFT : RIGHT;
    const vert = f.curIn & (UP | DOWN);
    f.dashF = false; f.dashB = false;
    if (f.curIn & fwd && !(f.prevIn & fwd) && !vert) { if (s.frame - f.lastTapF <= C.DASH_WINDOW) { f.dashF = true; f.lastTapF = -100; } else f.lastTapF = s.frame; }
    if (f.curIn & back && !(f.prevIn & back) && !vert) { if (s.frame - f.lastTapB <= C.DASH_WINDOW) { f.dashB = true; f.lastTapB = -100; } else f.lastTapB = s.frame; }
  }
  if (s.phase === 'intro') {
    s.phaseT++;
    if (s.phaseT === 1) ev(s, { type: 'round', p: -1, value: s.round });
    if (s.phaseT >= C.INTRO_FRAMES) { s.phase = 'fight'; ev(s, { type: 'fight', p: -1 }); }
  }
  if (s.hitstop > 0) { s.hitstop--; return; }
  for (const f of s.f) if (f.buf) { f.bufAge++; if (f.bufAge > C.BUFFER) f.buf = 0; }
  update(s, 0);
  update(s, 1);
  interactions(s);
  resolveHits(s);
  updateProjectiles(s);
  physics(s);
  faceUpdate(s);
  trackAdv(s);
  roundLogic(s);
}

export function cloneState(s: GameState): GameState { return structuredClone(s); }

export function hashState(s: GameState): number {
  const str = JSON.stringify({ ...s, events: undefined });
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
