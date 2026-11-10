// Hit sparks, ink bursts, dust, smoke, shake and flash. Render-side only.
// Slow motion is reserved for the resolved final KO (never during play).
import { Graphics } from 'pixi.js';
import { PX } from './figure';
import { STAGE_THEME } from './stage';
import type { GameState, SimEvent } from '../sim/types';

type Kind = 'spark' | 'fleck' | 'ink' | 'dust' | 'ring' | 'core' | 'smoke';
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: number; kind: Kind; grav: number }

export class Vfx {
  add = new Graphics();
  ink = new Graphics();
  private ps: Particle[] = [];
  shake = 0;
  flash = 0;
  private slowT = 0;
  reducedFlash = false;
  reducedShake = false;

  timeScale(): number { return this.slowT > 0 ? 0.3 : 1; }

  private burst(x: number, y: number, dirX: number, n: number, speed: number, kind: Kind, color: number, size: number, life: number, grav = 0, spread = 1.3) {
    for (let i = 0; i < n; i++) {
      const a = (Math.random() - 0.5) * Math.PI * spread + (dirX > 0 ? 0 : Math.PI);
      const sp = speed * (0.4 + Math.random() * 0.8);
      this.ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - speed * 0.15, life: life * (0.6 + Math.random() * 0.6), max: life, size: size * (0.6 + Math.random() * 0.8), color, kind, grav });
    }
  }
  private one(x: number, y: number, kind: Kind, size: number, life: number, color: number) {
    this.ps.push({ x, y, vx: 0, vy: 0, life, max: life, size, color, kind, grav: 0 });
  }
  private shakeBy(v: number) { if (!this.reducedShake) this.shake = Math.max(this.shake, v); }
  private flashBy(v: number) { if (!this.reducedFlash) this.flash = Math.max(this.flash, v); }

  onEvent(e: SimEvent, facing: number, s: GameState) {
    const x = ((e.x ?? 0) / 1000) * PX;
    const y = -((e.y ?? 0) / 1000) * PX;
    const w = e.weight ?? 2;
    switch (e.type) {
      case 'hit': {
        const big = e.kind === 'ch' || e.kind === 'crit';
        this.one(x, y, 'core', (big ? 34 : 18) + w * 8, big ? 0.16 : 0.11, 0xffffff);
        this.burst(x, y, facing, 8 + w * 4 + (big ? 10 : 0), 420 + w * 120, 'spark', 0xffffff, 2.2, 0.2);
        this.burst(x, y, facing, 6 + w * 3, 260, 'fleck', STAGE_THEME.fleck, 3, 0.45, 600);
        if (e.kind === 'crit') { this.one(x, y, 'ring', 90, 0.32, 0xb8753a); this.burst(x, y, facing, 22, 360, 'ink', 0x000000, 7, 0.6, 700); this.flashBy(0.06); }
        if (e.kind === 'ch') { this.one(x, y, 'ring', 80, 0.28, STAGE_THEME.key); this.burst(x, y, facing, 16, 340, 'ink', 0x000000, 6, 0.5, 700); }
        if (e.kind === 'throw') this.burst(x, 0, facing, 18, 200, 'dust', 0x6f8784, 6, 0.7, -40);
        if (e.loc === 0) this.burst(x, y, facing, 6, 500, 'spark', 0xffe2c0, 2, 0.15);
        this.shakeBy(Math.min(6, (e.dmg ?? 40) * 0.05 + (big ? 2 : 0)));
        break;
      }
      case 'block':
        this.one(x, y, 'core', 12 + w * 4, 0.08, 0xfff2dc);
        this.burst(x, y, -facing, 6 + w * 2, 380, 'spark', 0xffd9a0, 1.8, 0.16, 900);
        this.shakeBy(1.2);
        break;
      case 'armor':
        this.one(x, y, 'ring', 60, 0.25, 0xa93e35);
        this.burst(x, y, -facing, 10, 300, 'spark', 0xffb090, 2, 0.18);
        break;
      case 'wall':
        this.burst(x, y, -facing, 24, 260, 'dust', 0x7d8f8c, 7, 0.9, -20, 2);
        this.one(x, y, 'ring', 70, 0.3, 0xffffff);
        this.shakeBy(5);
        break;
      case 'throwBreak':
        this.one(x, y, 'ring', 70, 0.25, 0xffffff);
        this.burst(x, y, 1, 8, 300, 'spark', 0xffffff, 2, 0.2);
        this.burst(x, y, -1, 8, 300, 'spark', 0xffffff, 2, 0.2);
        break;
      case 'clash':
        this.one(x, y, 'core', 30, 0.15, 0xffffff);
        this.burst(x, y, 1, 10, 300, 'spark', 0xffffff, 2, 0.2, 0, 6);
        break;
      case 'smoke':
      case 'reveal': {
        const f = s.f[e.p];
        const fx = (f.x / 1000) * PX;
        for (let i = 0; i < (e.type === 'smoke' ? 26 : 12); i++) {
          this.ps.push({ x: fx + (Math.random() - 0.5) * 80, y: -Math.random() * 200, vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 40, life: 1.2, max: 1.2, size: 18 + Math.random() * 22, color: 0x2a3138, kind: 'smoke', grav: 0 });
        }
        break;
      }
      case 'kd':
      case 'land':
        this.burst(x, 0, 1, e.type === 'kd' ? 10 : 4, 120, 'dust', 0x5e7774, 5, 0.6, -30);
        this.burst(x, 0, -1, e.type === 'kd' ? 10 : 4, 120, 'dust', 0x5e7774, 5, 0.6, -30);
        if (e.type === 'kd') this.shakeBy(2);
        break;
      case 'ko':
        this.slowT = 1.3;
        this.flashBy(0.15);
        break;
    }
  }

  update(dt: number) {
    if (this.slowT > 0) this.slowT -= dt;
    this.shake = Math.max(0, this.shake - dt * 40);
    this.flash = Math.max(0, this.flash - dt * 0.6);
    for (const p of this.ps) {
      p.life -= dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 3 * dt;
      if (p.kind === 'ink' && p.y > 0) { p.y = 0; p.vy = 0; p.vx *= 0.5; }
    }
    this.ps = this.ps.filter((p) => p.life > 0);
  }

  draw() {
    const a = this.add;
    const k = this.ink;
    a.clear(); k.clear();
    for (const p of this.ps) {
      const t = Math.max(0, p.life / p.max);
      switch (p.kind) {
        case 'core': a.circle(p.x, p.y, p.size * (1.2 - t * 0.5)).fill({ color: p.color, alpha: t * 0.9 }); break;
        case 'ring': a.circle(p.x, p.y, p.size * (1.1 - t)).stroke({ width: 3 * t + 1, color: p.color, alpha: t * 0.8 }); break;
        case 'spark': a.moveTo(p.x, p.y).lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03).stroke({ width: p.size, color: p.color, alpha: t, cap: 'round' }); break;
        case 'fleck': a.circle(p.x, p.y, p.size * t).fill({ color: p.color, alpha: t * 0.8 }); break;
        case 'ink': k.circle(p.x, p.y, p.size * (0.5 + t * 0.5)).fill({ color: 0x000000, alpha: Math.min(1, t * 1.5) }); break;
        case 'dust': k.circle(p.x, p.y, p.size * (1.5 - t)).fill({ color: p.color, alpha: t * 0.25 }); break;
        case 'smoke': k.circle(p.x, p.y, p.size * (1.6 - t * 0.6)).fill({ color: p.color, alpha: t * 0.45 }); break;
      }
    }
  }
}

export class Trail {
  private pts: { a: [number, number]; b: [number, number]; age: number }[] = [];
  push(a: [number, number], b: [number, number]) { this.pts.push({ a, b, age: 0 }); }
  update(dt: number) { for (const p of this.pts) p.age += dt; this.pts = this.pts.filter((p) => p.age < 0.12); }
  draw(g: Graphics, color: number, strength: number) {
    for (let i = 1; i < this.pts.length; i++) {
      const p0 = this.pts[i - 1];
      const p1 = this.pts[i];
      const t = 1 - p1.age / 0.12;
      g.poly([p0.a[0], p0.a[1], p1.a[0], p1.a[1], p1.b[0], p1.b[1], p0.b[0], p0.b[1]]).fill({ color, alpha: 0.5 * t * t * strength });
    }
  }
}
