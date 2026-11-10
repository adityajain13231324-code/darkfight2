// Practice bots and training dummies. They read only visible state (animations, positions),
// never the opponent's input buffer, and react after a human-range delay.
import { ROSTER, type MoveC } from '../content/roster';
import { ACTIONABLE } from '../sim/sim';
import { A, BTNS, DOWN, K, LEFT, RIGHT, UP, cmdBits } from '../sim/input';
import type { GameState } from '../sim/types';

export type Difficulty = 'beginner' | 'normal' | 'hard' | 'expert';
export const DIFFICULTIES: Difficulty[] = ['beginner', 'normal', 'hard', 'expert'];
const PROFILE: Record<Difficulty, { react: [number, number]; block: number; duck: number; punish: number; brk: number; aggro: number; follow: number }> = {
  beginner: { react: [18, 27], block: 0.3, duck: 0.15, punish: 0.2, brk: 0.15, aggro: 0.025, follow: 0.2 },
  normal: { react: [13, 19], block: 0.55, duck: 0.35, punish: 0.5, brk: 0.35, aggro: 0.04, follow: 0.5 },
  hard: { react: [9, 14], block: 0.75, duck: 0.6, punish: 0.75, brk: 0.55, aggro: 0.055, follow: 0.75 },
  expert: { react: [7, 12], block: 0.88, duck: 0.8, punish: 0.9, brk: 0.75, aggro: 0.065, follow: 0.9 },
};

export type DummyMode = 'stand' | 'crouch' | 'jump' | 'guard' | 'crouchGuard' | 'guardAfterHit' | 'counter' | 'bot';
export const DUMMY_LABELS: Record<DummyMode, string> = {
  stand: 'Stand', crouch: 'Crouch', jump: 'Jump', guard: 'Guard (stand)', crouchGuard: 'Guard (crouch)',
  guardAfterHit: 'Guard after first hit', counter: 'Block then counter', bot: 'Bot (fights back)',
};

/** Reach of each move in sub-units in front of the body (from baked hitboxes). */
const reachCache = new Map<string, number>();
function reach(fid: string, m: MoveC): number {
  const key = fid + ':' + m.id;
  if (reachCache.has(key)) return reachCache.get(key)!;
  let r = 0;
  if (m.shapes) for (let t = m.startup; t < m.startup + m.active; t++) r = Math.max(r, m.shapes[t][0], m.shapes[t][2]);
  r = r + m.radius + m.advance - 450;
  if (m.projectile) r = 9000;
  if (m.level === 'T') r = 1000 + 450;
  reachCache.set(key, r);
  return r;
}

export class Bot {
  private rngState: number;
  private oppMoveKey = '';
  private defend = false;
  private reactAt = 0;
  private plan = 0;
  private planUntil = 0;
  private wake = '';
  private breakDecided = false;
  private lastPress = 0;
  private hitTimer = 0;
  private counterArmed = false;

  constructor(public idx: number, public diff: Difficulty, seed = 1) { this.rngState = seed >>> 0 || 1; }

  private rnd(): number {
    this.rngState = (Math.imul(this.rngState, 1664525) + 1013904223) >>> 0;
    return this.rngState / 4294967296;
  }

  /** Training dummy behaviour. Also sets the dummy's guard flag. */
  dummy(s: GameState, mode: DummyMode, breakThrows: boolean): number {
    const f = s.f[this.idx];
    const back = f.facing > 0 ? LEFT : RIGHT;
    if (breakThrows && f.act === 'thrownClinch' && f.t === 5) return A | K;
    if (f.act === 'hitstun' || f.act === 'air') this.hitTimer = 60;
    else if (this.hitTimer > 0) this.hitTimer--;
    switch (mode) {
      case 'stand': f.guard = false; return 0;
      case 'crouch': f.guard = false; return DOWN;
      case 'jump': f.guard = false; return ACTIONABLE.has(f.act) ? UP : 0;
      case 'guard': f.guard = true; return this.autoLevel(s, back);
      case 'crouchGuard': f.guard = true; return DOWN | back;
      case 'guardAfterHit': f.guard = this.hitTimer > 0; return f.guard ? this.autoLevel(s, back) : 0;
      case 'counter': {
        f.guard = true;
        if (f.act === 'blockstun') { this.counterArmed = true; return this.autoLevel(s, back); }
        if (this.counterArmed && ACTIONABLE.has(f.act)) { this.counterArmed = false; return A; }
        return this.autoLevel(s, back);
      }
      case 'bot': f.guard = true; return this.input(s);
    }
  }

  private autoLevel(s: GameState, back: number): number {
    const o = s.f[1 - this.idx];
    if (o.act === 'move') {
      const m = ROSTER[o.fid].moves[o.move];
      if (m?.level === 'L') return DOWN | back;
    }
    for (const p of s.proj) if (p.o !== this.idx && p.level === 'L') return DOWN | back;
    return back;
  }

  input(s: GameState): number {
    const P = PROFILE[this.diff];
    const me = s.f[this.idx];
    const op = s.f[1 - this.idx];
    const fd = ROSTER[me.fid];
    const back = me.facing > 0 ? LEFT : RIGHT;
    const fwd = me.facing > 0 ? RIGHT : LEFT;
    const gap = Math.abs(me.x - op.x) - 900;
    const press = (bits: number) => {
      if (this.lastPress & bits & BTNS) { this.lastPress = 0; return bits & ~BTNS; } // release between presses
      this.lastPress = bits;
      return bits;
    };
    if (s.phase !== 'fight') return 0;

    // Throw escape (one decision per throw)
    if (me.act === 'thrownClinch') {
      if (me.t === 1) this.breakDecided = this.rnd() < P.brk;
      return this.breakDecided && me.t >= 6 && me.t <= 8 ? A | K : 0;
    }
    // Wake-up choice
    if (me.act === 'kdGround') {
      if (me.t === 1) { const r = this.rnd(); this.wake = r < 0.5 ? 'rise' : r < 0.8 ? 'roll' : 'kick'; }
      if (me.t < 17) return 0;
      return this.wake === 'roll' ? back : this.wake === 'kick' ? press(K) : UP;
    }
    // String follow-ups on hit
    if (me.act === 'move') {
      const m = fd.moves[me.move];
      if (m.next.length && me.hitDone && this.rnd() < P.follow * 0.3) return press(m.next[0].mask);
      return 0;
    }
    // Defence: decide once per opponent move, after the reaction delay
    if (op.act === 'move') {
      const om = ROSTER[op.fid].moves[op.move];
      const key = s.frame - op.t + ':' + op.move;
      if (key !== this.oppMoveKey) {
        this.oppMoveKey = key;
        this.reactAt = P.react[0] + Math.floor(this.rnd() * (P.react[1] - P.react[0] + 1));
        this.defend = this.rnd() < P.block;
      }
      const inStartup = op.t <= om.startup + om.active - 1;
      if (inStartup && op.t >= this.reactAt && this.defend && om.strike && gap < reach(op.fid, om) + 300) {
        if (om.level === 'L') return DOWN | back;
        if (om.level === 'H' && this.rnd() < P.duck * 0.15) return DOWN; // duck a high, then punish
        return back;
      }
      if (om.level === 'T' && inStartup && op.t >= this.reactAt && this.defend) return DOWN;
      // Punish committed recovery
      if (!inStartup && ACTIONABLE.has(me.act) && op.t > om.startup + om.active + 2 && this.rnd() < P.punish * 0.25) {
        const left = om.total - op.t;
        const pick = this.pickMove(s, gap, left >= 16 ? ['df+A', 'f+A', 'A', 'K'] : ['A', 'K', 'd+K']);
        if (pick) return press(cmdBits(pick, me.facing));
      }
    }
    // Incoming projectile
    for (const p of s.proj) {
      if (p.o === this.idx) continue;
      const dist = (me.x - p.x) * Math.sign(p.vx);
      if (dist > 0 && dist < 3500 && this.rnd() < P.block) return p.level === 'H' ? DOWN : p.level === 'L' ? DOWN | back : back;
    }
    if (me.act === 'blockstun') return back;
    if (!ACTIONABLE.has(me.act)) return 0;

    // Neutral: spacing plan held for a while so the bot doesn't jitter into dashes.
    const ideal = me.fid === 'lynx' ? 700 : 1000;
    if (s.frame >= this.planUntil) {
      const r = this.rnd();
      this.plan = gap > ideal + 800 ? (r < 0.15 ? 3 : 1) : gap < ideal - 400 ? (r < 0.5 ? 2 : 0) : r < 0.45 ? 0 : r < 0.75 ? 1 : 2;
      this.planUntil = s.frame + 14 + Math.floor(this.rnd() * 16);
    }
    // Attack decision
    if (this.rnd() < P.aggro) {
      if (me.meter >= 500 && this.rnd() < 0.25 && fd.cmd.M) { const m = fd.moves[fd.cmd.M]; if (gap < reach(me.fid, m)) return press(cmdBits('M', me.facing)); }
      if (fd.cmd.S && me.sigCd === 0 && this.rnd() < 0.08) return press(cmdBits('S', me.facing));
      if (me.ammo > 0 && gap > 3000 && this.rnd() < 0.3) return press(cmdBits('R', me.facing));
      const pick = this.pickMove(s, gap, null);
      if (pick) return press(cmdBits(pick, me.facing));
    }
    if (this.plan === 3 && gap > 2500) return fwd; // (dash handled by walking; avoids accidental input spam)
    return this.plan === 1 ? fwd : this.plan === 2 ? back : 0;
  }

  private pickMove(s: GameState, gap: number, prefer: string[] | null): string | null {
    const me = s.f[this.idx];
    const fd = ROSTER[me.fid];
    const opts = fd.list.filter((m) => m.root && (m.strike || m.level === 'T') && !m.air && m.cmd !== 'wake' && !m.cost && !m.cmd.startsWith('f,f'));
    const fit = opts.filter((m) => { const r = reach(me.fid, m); return r >= gap + 50 && r < gap + 1600; });
    if (prefer) for (const c of prefer) { const m = fit.find((x) => x.cmd === c); if (m) return m.cmd; }
    if (!fit.length) return null;
    const throwOk = fit.filter((m) => m.level !== 'T' || gap < 400);
    const pool = throwOk.length ? throwOk : fit;
    return pool[Math.floor(this.rnd() * pool.length)].cmd;
  }
}
