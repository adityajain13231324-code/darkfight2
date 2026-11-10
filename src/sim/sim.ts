// Deterministic 60 Hz fight simulation. Integer math only. No DOM, no rendering.
import { ROSTER, type MoveC } from '../data/roster';
import * as C from './constants';
import { B1, B2, B3, B4, BTNS, DOWN, LEFT, RIGHT, UP, relDir } from './input';
import type { Act, Fighter, GameState, SimEvent } from './types';

export const ACTIONABLE = new Set<Act>(['idle', 'walkF', 'walkB', 'crouch']);
const INVULN = new Set<Act>([
  'kdAir', 'kdGround', 'getup', 'throwClinch', 'thrownClinch', 'throwExec', 'thrownExec', 'throwBreak', 'win',
]);
const FACE_ACTS = new Set<Act>(['idle', 'walkF', 'walkB', 'crouch', 'land', 'kdGround', 'getup']);

const DIR_FALLBACK: Record<string, string[]> = {
  '': [''], f: ['f', ''], b: ['b', ''], d: ['d', ''], df: ['df', 'd', ''], db: ['db', 'd', ''],
  u: ['u', ''], uf: ['uf', 'u', 'f', ''], ub: ['ub', 'u', 'b', ''],
};

export function newFighter(fid: string, side: 0 | 1): Fighter {
  return {
    fid,
    x: side === 0 ? -C.START_X : C.START_X, y: 0, vx: 0, vy: 0,
    facing: side === 0 ? 1 : -1,
    hp: C.HP_MAX,
    act: 'idle', t: 0, move: '', moveBtn: 0, hitDone: false, queued: '',
    stun: 0, crouchStun: false, hitLevel: '',
    curIn: 0, prevIn: 0, pressed: 0,
    buf: 0, bufAge: 0, bufDir: '',
    lastTapF: -100, lastTapB: -100, dashF: false, dashB: false,
    jumpDir: 0, pushRem: 0, pushDir: 0,
    breakLock: false, breakReq: false,
    arcFrom: 0, arcTo: 0, pend: 0,
    combo: 0, comboDmg: 0, lastFree: -1,
    guard: true, ko: false, calm: 0,
  };
}

export function createState(mode: 'versus' | 'training', fids: [string, string]): GameState {
  const s: GameState = {
    frame: 0, mode,
    f: [newFighter(fids[0], 0), newFighter(fids[1], 1)],
    hitstop: 0, timer: C.ROUND_FRAMES, round: 1, wins: [0, 0],
    phase: 'intro', phaseT: 0, roundWinner: -1, throwSide: 0,
    adv: null, lastAdv: null, lastMove: ['', ''],
    infiniteHp: true, events: [],
  };
  resetRound(s);
  return s;
}

export function resetRound(s: GameState): void {
  for (let i = 0; i < 2; i++) {
    const old = s.f[i];
    const f = newFighter(old.fid, i as 0 | 1);
    f.guard = old.guard;
    s.f[i] = f;
  }
  s.phase = s.mode === 'training' ? 'fight' : 'intro';
  s.phaseT = 0;
  s.timer = C.ROUND_FRAMES;
  s.hitstop = 0;
  s.adv = null;
  s.roundWinner = -1;
}

/** Reset positions only (training). */
export function resetPositions(s: GameState): void {
  const keepGuard = [s.f[0].guard, s.f[1].guard];
  resetRound(s);
  s.f[0].guard = keepGuard[0];
  s.f[1].guard = keepGuard[1];
}

const mv = (f: Fighter): MoveC => ROSTER[f.fid].moves[f.move];
const ev = (s: GameState, e: SimEvent) => { s.events.push(e); };
const clampX = (x: number) => Math.max(-(C.STAGE_HALF - C.BODY_HALF), Math.min(C.STAGE_HALF - C.BODY_HALF, x));

function setAct(f: Fighter, a: Act): void {
  if (f.act !== a) { f.act = a; f.t = 0; }
}

function toNeutral(f: Fighter): void {
  f.act = 'idle'; f.t = 0; f.move = ''; f.queued = ''; f.vx = 0; f.stun = 0;
  if (f.vy === 0) f.y = 0;
}

function startMove(s: GameState, i: number, id: string): void {
  const f = s.f[i];
  const m = ROSTER[f.fid].moves[id];
  f.act = 'move'; f.move = id; f.t = 1; f.hitDone = false; f.queued = '';
  f.buf = 0; f.vx = 0; f.y = 0; f.moveBtn = m.btnMask;
  s.lastMove[i] = id;
}

function resolveMove(f: Fighter, inDash: boolean): string {
  const fd = ROSTER[f.fid];
  const b = f.buf;
  if ((b & (B1 | B3)) === (B1 | B3) && fd.cmd['1+3']) return fd.cmd['1+3'];
  if ((b & (B2 | B4)) === (B2 | B4) && fd.cmd['2+4']) return fd.cmd['2+4'];
  const btn = b & B1 ? 1 : b & B2 ? 2 : b & B3 ? 3 : 4;
  if (inDash && fd.cmd['f,f+' + btn]) return fd.cmd['f,f+' + btn];
  for (const k of DIR_FALLBACK[f.bufDir] ?? ['']) {
    const key = k ? `${k}+${btn}` : String(btn);
    if (fd.cmd[key]) return fd.cmd[key];
  }
  return '';
}

function tryBuffered(s: GameState, i: number, inDash = false): boolean {
  const f = s.f[i];
  if (!f.buf) return false;
  const id = resolveMove(f, inDash || f.dashF);
  if (!id) { f.buf = 0; return false; }
  startMove(s, i, id);
  return true;
}

/** Called whenever the fighter is free to act this frame. */
function think(s: GameState, i: number): void {
  const f = s.f[i];
  f.lastFree = s.frame;
  if (tryBuffered(s, i)) return;
  const d = relDir(f.curIn, f.facing);
  if (f.dashF) { setAct(f, 'dash'); f.vx = f.facing * C.DASH_V; return; }
  if (f.dashB) { setAct(f, 'backdash'); f.vx = -f.facing * C.BDASH_V; return; }
  if (d === 'u' || d === 'uf' || d === 'ub') {
    setAct(f, 'jump'); f.jumpDir = d === 'uf' ? 1 : d === 'ub' ? -1 : 0; f.vx = 0; return;
  }
  if (d[0] === 'd') { setAct(f, 'crouch'); f.vx = 0; return; }
  const fd = ROSTER[f.fid];
  if (d === 'f') { setAct(f, 'walkF'); f.vx = f.facing * fd.walkF; return; }
  if (d === 'b') { setAct(f, 'walkB'); f.vx = -f.facing * fd.walkB; return; }
  setAct(f, 'idle'); f.vx = 0;
}

function endCombo(s: GameState, att: number): void {
  const a = s.f[att];
  if (a.combo > 1) ev(s, { type: 'comboEnd', p: att, value: a.combo, dmg: a.comboDmg });
  a.combo = 0; a.comboDmg = 0;
}

function update(s: GameState, i: number): void {
  const f = s.f[i];
  f.t++;
  switch (f.act) {
    case 'move': {
      const m = mv(f);
      // Chord upgrade: 1 then 3 (or 2 then 4) within 3 frames becomes a throw.
      if (f.t <= 3 && f.pressed && m.level !== 'T' && m.root) {
        const all = f.moveBtn | f.pressed;
        const fd = ROSTER[f.fid];
        if ((all & (B1 | B3)) === (B1 | B3) && fd.cmd['1+3']) { startMove(s, i, fd.cmd['1+3']); break; }
        if ((all & (B2 | B4)) === (B2 | B4) && fd.cmd['2+4']) { startMove(s, i, fd.cmd['2+4']); break; }
      }
      if (m.next.length) {
        if (!f.queued && f.buf) {
          for (const n of m.next) {
            if ((f.buf & n.mask) && f.t <= n.cancel) { f.queued = n.move; f.buf = 0; break; }
          }
        }
        if (f.queued) {
          const n = m.next.find((x) => x.move === f.queued)!;
          if (f.t >= n.cancel) { startMove(s, i, f.queued); break; }
        }
      }
      f.vx = m.advance && f.t <= m.startup ? f.facing * Math.trunc(m.advance / m.startup) : 0;
      if (m.hop) {
        const [a, b, h] = m.hop;
        f.y = f.t > a && f.t < b ? Math.trunc((4 * h * (f.t - a) * (b - f.t)) / ((b - a) * (b - a))) : 0;
      }
      if (f.t === m.startup) ev(s, { type: 'swing', p: i, weight: m.weight, move: m.id });
      if (f.t > m.total) { toNeutral(f); think(s, i); }
      break;
    }
    case 'blockstun':
    case 'hitstun':
      if (f.t > f.stun) {
        const wasHit = f.act === 'hitstun';
        toNeutral(f);
        if (wasHit) endCombo(s, 1 - i);
        think(s, i);
      }
      break;
    case 'dash':
      f.vx = f.facing * Math.trunc((C.DASH_V * (C.DASH_T - f.t)) / C.DASH_T);
      if (f.buf && tryBuffered(s, i, true)) break;
      if (f.t >= C.DASH_T) { toNeutral(f); think(s, i); }
      break;
    case 'backdash':
      f.vx = -f.facing * Math.trunc((C.BDASH_V * (C.BDASH_T - f.t)) / C.BDASH_T);
      if (f.t >= C.BDASH_CANCEL && f.buf && tryBuffered(s, i)) break;
      if (f.t >= C.BDASH_T) { toNeutral(f); think(s, i); }
      break;
    case 'jump':
      if (f.t <= C.JUMP_PRE) {
        if (f.buf & B4) {
          const id = ROSTER[f.fid].cmd['uf+4'];
          if (id) { startMove(s, i, id); break; }
        }
        if (f.t === C.JUMP_PRE) {
          f.vy = C.JUMP_V; f.vx = f.jumpDir * C.JUMP_VX * f.facing; f.y = 1;
          ev(s, { type: 'jump', p: i });
        }
      }
      break;
    case 'land':
      if (f.t > C.LAND_T) { toNeutral(f); think(s, i); }
      break;
    case 'kdAir':
      break;
    case 'kdGround':
      if (f.ko) break;
      if ((f.t >= C.KD_MIN && (f.pressed || (f.curIn & (UP | DOWN)))) || f.t >= C.KD_MAX) setAct(f, 'getup');
      break;
    case 'getup':
      if (f.t > C.GETUP_T) { toNeutral(f); think(s, i); }
      break;
    case 'throwClinch':
      break;
    case 'thrownClinch':
      if (f.pressed && !f.breakLock && f.t <= C.THROW_BREAK) {
        const need = s.throwSide === 1 ? B1 : B2;
        if ((f.pressed & BTNS) === need) f.breakReq = true;
        else f.breakLock = true;
      }
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
        f.hp = Math.max(0, f.hp - f.pend);
        a.combo++; a.comboDmg += f.pend;
        ev(s, { type: 'hit', p: 1 - i, x: f.x, y: 300, dmg: f.pend, level: 'T', weight: 3, kind: 'throw' });
        s.hitstop = 7;
        f.act = 'kdGround'; f.t = 0;
        endCombo(s, 1 - i);
      }
      break;
    }
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

/** Cross-fighter transitions that must not depend on update order. */
function interactions(s: GameState): void {
  for (let i = 0; i < 2; i++) {
    const a = s.f[i];
    const d = s.f[1 - i];
    if (a.act !== 'throwClinch' || d.act !== 'thrownClinch') continue;
    if (d.breakReq) {
      d.breakReq = false;
      a.act = 'throwBreak'; a.t = 0; d.act = 'throwBreak'; d.t = 0;
      a.pushRem = C.BREAK_PUSH; a.pushDir = -a.facing;
      d.pushRem = C.BREAK_PUSH; d.pushDir = a.facing;
      ev(s, { type: 'throwBreak', p: 1 - i, x: (a.x + d.x) >> 1, y: 2400 });
    } else if (a.t > C.THROW_BREAK) {
      const m = mv(a);
      a.act = 'throwExec'; a.t = 0;
      d.act = 'thrownExec'; d.t = 0;
      d.arcFrom = d.x;
      d.arcTo = clampX(s.throwSide === 1 ? a.x - a.facing * C.THROW_SWAP : a.x + a.facing * C.THROW_TOSS);
      d.pend = m.damage;
      ev(s, { type: 'throwExec', p: i, kind: s.throwSide === 1 ? 'L' : 'R' });
    }
  }
}

type HitResult = 'whiff' | 'hit' | 'ch' | 'block' | 'throw';

function isCrouching(d: Fighter): boolean {
  if (d.act === 'crouch') return true;
  if (d.act === 'move') return mv(d).crouch;
  if (d.act === 'blockstun' || d.act === 'hitstun') return d.crouchStun;
  return false;
}

function classify(a: Fighter, d: Fighter, m: MoveC): HitResult {
  if (INVULN.has(d.act) || d.ko) return 'whiff';
  const dirD = relDir(d.curIn, d.facing);
  const crouching = isCrouching(d);
  const airborne = d.y > 0;
  if (m.level === 'T') {
    if (crouching || airborne || d.act === 'jump' || d.act === 'hitstun' || d.act === 'blockstun') return 'whiff';
    return 'throw';
  }
  const guardOk = d.guard && dirD !== 'f' && dirD !== 'uf' && dirD !== 'df';
  const holdsDown = dirD === 'd' || dirD === 'db';
  const standGuard = guardOk && !holdsDown && (d.act === 'idle' || d.act === 'walkB' || d.act === 'blockstun');
  const crouchGuard = guardOk && holdsDown && (d.act === 'crouch' || d.act === 'blockstun');
  if (m.level === 'H' && crouching) return 'whiff';
  if (m.level === 'L' && airborne) return 'whiff';
  if ((m.level === 'H' || m.level === 'M') && standGuard) return 'block';
  if (m.level === 'L' && crouchGuard) return 'block';
  void a;
  if (d.act === 'move') {
    const dm = mv(d);
    if (d.t <= dm.startup + dm.active - 1) return 'ch';
  }
  return 'hit';
}

function knockdown(d: Fighter, dir: number): void {
  d.act = 'kdAir'; d.t = 0; d.vy = C.KD_VY; d.vx = dir * C.KD_VX;
  d.y = Math.max(d.y, 1); d.pushRem = 0; d.move = ''; d.queued = '';
}

function resolveHits(s: GameState): void {
  const hits: { i: number; r: HitResult; m: MoveC }[] = [];
  for (let i = 0; i < 2; i++) {
    const a = s.f[i];
    const d = s.f[1 - i];
    if (a.act !== 'move' || a.hitDone) continue;
    const m = mv(a);
    if (a.t < m.startup || a.t > m.startup + m.active - 1) continue;
    if ((d.x - a.x) * a.facing < 0) continue; // opponent behind
    const gap = Math.abs(a.x - d.x) - 2 * C.BODY_HALF;
    if (gap > m.range) continue;
    const r = classify(a, d, m);
    if (r !== 'whiff') hits.push({ i, r, m });
  }
  const throws = hits.filter((h) => h.r === 'throw');
  const strikes = hits.filter((h) => h.r !== 'throw');
  // Two throws at once: both get broken apart.
  if (throws.length === 2) {
    for (let i = 0; i < 2; i++) {
      const f = s.f[i];
      f.act = 'throwBreak'; f.t = 0; f.pushRem = C.BREAK_PUSH; f.pushDir = -f.facing;
    }
    ev(s, { type: 'throwBreak', p: 0, x: (s.f[0].x + s.f[1].x) >> 1, y: 2400 });
    return;
  }
  for (const h of strikes) applyStrike(s, h.i, h.r, h.m);
  for (const h of throws) {
    if (strikes.some((x) => x.i !== h.i)) continue; // any strike beats a throw
    const a = s.f[h.i];
    const d = s.f[1 - h.i];
    a.hitDone = true;
    a.act = 'throwClinch'; a.t = 0; a.vx = 0; a.pushRem = 0;
    d.act = 'thrownClinch'; d.t = 0; d.vx = 0; d.pushRem = 0; d.move = ''; d.queued = '';
    d.breakLock = false; d.breakReq = false; d.y = 0;
    s.throwSide = h.m.throwSide;
    d.x = clampX(a.x + a.facing * (2 * C.BODY_HALF + C.THROW_GAP));
    a.x = clampX(d.x - a.facing * (2 * C.BODY_HALF + C.THROW_GAP));
    ev(s, { type: 'throw', p: h.i, kind: h.m.throwSide === 1 ? 'L' : 'R', x: d.x, y: 2400 });
  }
}

function applyStrike(s: GameState, i: number, r: HitResult, m: MoveC): void {
  const a = s.f[i];
  const d = s.f[1 - i];
  a.hitDone = true;
  const remaining = m.total - a.t;
  const hx = d.x - a.facing * C.BODY_HALF;
  const hy = C.LEVEL_Y[m.level] + (d.y > 0 ? d.y : 0) - (isCrouching(d) && m.level !== 'L' ? 900 : 0);
  const crouching = isCrouching(d);
  if (r === 'block') {
    d.act = 'blockstun'; d.t = 0;
    d.stun = m.onBlock + remaining;
    const dirD = relDir(d.curIn, d.facing);
    d.crouchStun = dirD === 'd' || dirD === 'db';
    d.pushRem = m.pushback; d.pushDir = a.facing; d.vx = 0; d.move = ''; d.queued = '';
    s.hitstop = Math.max(s.hitstop, Math.max(2, m.hitstop - 2));
    s.adv = { att: i, move: m.id, kind: 'block', aFree: -1, dFree: -1, since: s.frame };
    ev(s, { type: 'block', p: i, x: hx, y: hy, level: m.level, weight: m.weight, move: m.id });
    return;
  }
  const ch = r === 'ch';
  const dmg = ch ? Math.trunc((m.damage * 6) / 5) : m.damage;
  const res = ch ? m.onCH : m.onHit;
  const wasAir = d.y > 0;
  d.hp = Math.max(0, d.hp - dmg);
  d.calm = 0;
  a.combo++; a.comboDmg += dmg;
  d.hitLevel = m.level;
  if (res === 'kd' || wasAir || (d.hp <= 0 && s.mode === 'versus')) {
    knockdown(d, a.facing);
    s.adv = null;
    s.lastAdv = { att: i, move: m.id, kind: ch ? 'ch' : 'hit', aFree: -1, dFree: -1, since: s.frame, value: NaN };
  } else {
    d.act = 'hitstun'; d.t = 0;
    d.stun = res + remaining;
    d.crouchStun = crouching;
    d.pushRem = m.pushback; d.pushDir = a.facing; d.vx = 0; d.move = ''; d.queued = '';
    s.adv = { att: i, move: m.id, kind: ch ? 'ch' : 'hit', aFree: -1, dFree: -1, since: s.frame };
  }
  s.hitstop = ch ? 10 : m.hitstop;
  ev(s, { type: ch ? 'ch' : 'hit', p: i, x: hx, y: hy, dmg, level: m.level, weight: m.weight, move: m.id });
}

function physics(s: GameState): void {
  const lim = C.STAGE_HALF - C.BODY_HALF;
  for (let i = 0; i < 2; i++) {
    const f = s.f[i];
    const o = s.f[1 - i];
    const air = (f.act === 'jump' && f.t >= C.JUMP_PRE && (f.y > 0 || f.vy > 0)) || f.act === 'kdAir';
    if (air) {
      f.vy -= C.GRAVITY;
      f.y += f.vy;
      f.x += f.vx;
      if (f.y <= 0) {
        f.y = 0; f.vy = 0; f.vx = 0;
        if (f.act === 'jump') { f.act = 'land'; f.t = 0; ev(s, { type: 'land', p: i, x: f.x }); }
        else { f.act = 'kdGround'; f.t = 0; endCombo(s, 1 - i); ev(s, { type: 'kd', p: i, x: f.x }); }
      }
    } else if (f.act !== 'thrownExec') {
      f.x += f.vx;
    }
    if (f.pushRem > 0) {
      const p = Math.min(f.pushRem, Math.max(C.PUSH_MIN, Math.trunc(f.pushRem / 4)));
      f.pushRem -= p;
      f.x += f.pushDir * p;
    }
    if (f.x > lim || f.x < -lim) {
      const over = f.x > lim ? f.x - lim : f.x + lim;
      f.x -= over;
      // Pushed into the wall: the attacker takes the rest of the pushback.
      if ((f.act === 'hitstun' || f.act === 'blockstun') && o.y === 0) o.x = clampX(o.x - over);
    }
  }
  const a = s.f[0];
  const b = s.f[1];
  const skip = (f: Fighter) => f.act === 'thrownExec' || f.act === 'kdGround' || f.act === 'getup';
  if (!skip(a) && !skip(b) && Math.abs(a.y - b.y) < 1200) {
    const gap = Math.abs(a.x - b.x) - 2 * C.BODY_HALF;
    if (gap < 0) {
      const dir = Math.sign(b.x - a.x) || a.facing;
      const pen = -gap;
      const h = Math.trunc(pen / 2);
      a.x = clampX(a.x - dir * h);
      b.x = clampX(b.x + dir * (pen - h));
      if (Math.abs(a.x - b.x) < 2 * C.BODY_HALF) {
        b.x = clampX(a.x + dir * 2 * C.BODY_HALF);
        a.x = clampX(b.x - dir * 2 * C.BODY_HALF);
      }
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
      if (f.hp < 1) f.hp = 1;
      if (!s.infiniteHp) continue;
      if (ACTIONABLE.has(f.act) && ACTIONABLE.has(o.act)) {
        f.calm++;
        if (f.calm > C.CALM_REFILL) f.hp = C.HP_MAX;
      } else f.calm = 0;
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
    } else {
      s.timer--;
      if (s.timer <= 0) {
        s.phase = 'ko'; s.phaseT = 0;
        const h0 = s.f[0].hp;
        const h1 = s.f[1].hp;
        s.roundWinner = h0 === h1 ? -1 : h0 > h1 ? 0 : 1;
        ev(s, { type: 'timeup', p: s.roundWinner });
      }
    }
  } else if (s.phase === 'ko') {
    s.phaseT++;
    const w = s.roundWinner;
    if (w >= 0 && s.phaseT > 40 && ACTIONABLE.has(s.f[w].act)) { s.f[w].act = 'win'; s.f[w].t = 0; s.f[w].vx = 0; }
    if (s.phaseT >= C.KO_FRAMES) {
      if (w >= 0) s.wins[w]++;
      else { s.wins[0]++; s.wins[1]++; }
      if (s.wins[0] >= C.ROUNDS_TO_WIN || s.wins[1] >= C.ROUNDS_TO_WIN) {
        s.phase = 'end'; s.phaseT = 0;
        const both = s.wins[0] >= C.ROUNDS_TO_WIN && s.wins[1] >= C.ROUNDS_TO_WIN;
        ev(s, { type: 'matchEnd', p: both ? -1 : s.wins[0] >= C.ROUNDS_TO_WIN ? 0 : 1 });
      } else {
        s.round++;
        resetRound(s);
      }
    }
  } else if (s.phase === 'end') {
    s.phaseT++;
  }
}

/** Advance the simulation by exactly one frame. */
export function step(s: GameState, inputs: readonly [number, number]): void {
  s.events = [];
  s.frame++;
  const live = s.phase === 'fight';
  for (let i = 0; i < 2; i++) {
    const f = s.f[i];
    f.prevIn = f.curIn;
    f.curIn = live ? inputs[i] : 0;
    f.pressed = f.curIn & ~f.prevIn & BTNS;
    if (f.pressed) { f.buf |= f.pressed; f.bufAge = 0; f.bufDir = relDir(f.curIn, f.facing); }
    const fwd = f.facing > 0 ? RIGHT : LEFT;
    const back = f.facing > 0 ? LEFT : RIGHT;
    const vert = f.curIn & (UP | DOWN);
    f.dashF = false; f.dashB = false;
    if (f.curIn & fwd && !(f.prevIn & fwd) && !vert) {
      if (s.frame - f.lastTapF <= C.DASH_WINDOW) { f.dashF = true; f.lastTapF = -100; } else f.lastTapF = s.frame;
    }
    if (f.curIn & back && !(f.prevIn & back) && !vert) {
      if (s.frame - f.lastTapB <= C.DASH_WINDOW) { f.dashB = true; f.lastTapB = -100; } else f.lastTapB = s.frame;
    }
  }
  if (s.phase === 'intro') {
    s.phaseT++;
    if (s.phaseT === 1) ev(s, { type: 'round', p: -1, value: s.round });
    if (s.phaseT >= C.INTRO_FRAMES) { s.phase = 'fight'; ev(s, { type: 'fight', p: -1 }); }
  }
  if (s.hitstop > 0) { s.hitstop--; return; }
  for (const f of s.f) {
    if (f.buf) { f.bufAge++; if (f.bufAge > C.BUFFER) f.buf = 0; }
  }
  update(s, 0);
  update(s, 1);
  interactions(s);
  resolveHits(s);
  physics(s);
  faceUpdate(s);
  trackAdv(s);
  roundLogic(s);
}

export function cloneState(s: GameState): GameState {
  return structuredClone(s);
}

export function hashState(s: GameState): number {
  const str = JSON.stringify({ ...s, events: undefined });
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
