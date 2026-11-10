// Hit sparks, ink bursts, dust, screen shake, flash and slow motion. Render-side only.
import { Graphics } from 'pixi.js';
import { PX } from './rig';
import { STAGE_THEME } from './stage';
import type { SimEvent } from '../sim/types';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: number;
  kind: 'spark' | 'fleck' | 'ink' | 'dust' | 'ring' | 'core';
  grav: number;
}

export class Vfx {
  add = new Graphics();
  ink = new Graphics();
  private ps: Particle[] = [];
  shake = 0;
  flash = 0;
  private slowT = 0;
  private slowScale = 1;

  timeScale(): number {
    return this.slowT > 0 ? this.slowScale : 1;
  }

  private slow(seconds: number, scale: number) {
    if (scale <= this.timeScale() || this.slowT <= 0) { this.slowT = seconds; this.slowScale = scale; }
  }

  private burst(x: number, y: number, dirX: number, n: number, speed: number, kind: Particle['kind'], color: number, size: number, life: number, grav = 0) {
    for (let i = 0; i < n; i++) {
      const a = (Math.random() - 0.5) * Math.PI * 1.3 + (dirX > 0 ? 0 : Math.PI);
      const sp = speed * (0.4 + Math.random() * 0.8);
      this.ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - speed * 0.15, life: life * (0.6 + Math.random() * 0.6), max: life, size: size * (0.6 + Math.random() * 0.8), color, kind, grav });
    }
  }

  onEvent(e: SimEvent, attackerFacing: number) {
    const x = ((e.x ?? 0) / 1000) * PX;
    const y = -((e.y ?? 0) / 1000) * PX;
    const w = e.weight ?? 2;
    switch (e.type) {
      case 'hit': {
        const throwHit = e.kind === 'throw';
        this.ps.push({ x, y, vx: 0, vy: 0, life: 0.12, max: 0.12, size: 22 + w * 10, color: 0xffffff, kind: 'core', grav: 0 });
        this.burst(x, y, attackerFacing, 8 + w * 4, 420 + w * 120, 'spark', 0xffffff, 2.2, 0.2);
        this.burst(x, y, attackerFacing, 6 + w * 3, 260, 'fleck', STAGE_THEME.fleck, 3, 0.45, 600);
        if (throwHit) this.burst(x, 0, attackerFacing, 18, 200, 'dust', 0x6f8784, 6, 0.7, -40);
        this.shake = Math.max(this.shake, Math.min(6, (e.dmg ?? 8) * 0.3));
        break;
      }
      case 'ch': {
        this.ps.push({ x, y, vx: 0, vy: 0, life: 0.16, max: 0.16, size: 60, color: 0xffffff, kind: 'core', grav: 0 });
        this.ps.push({ x, y, vx: 0, vy: 0, life: 0.35, max: 0.35, size: 110, color: STAGE_THEME.key, kind: 'ring', grav: 0 });
        this.burst(x, y, attackerFacing, 22, 700, 'spark', 0xffffff, 2.6, 0.25);
        this.burst(x, y, attackerFacing, 26, 380, 'ink', 0x000000, 7, 0.6, 700);
        this.burst(x, y, attackerFacing, 10, 300, 'fleck', STAGE_THEME.fleck, 3, 0.5, 600);
        this.shake = 6;
        this.flash = 0.1;
        this.slow(0.3, 0.4);
        break;
      }
      case 'block': {
        this.ps.push({ x, y, vx: 0, vy: 0, life: 0.08, max: 0.08, size: 14 + w * 4, color: 0xfff2dc, kind: 'core', grav: 0 });
        this.burst(x, y, -attackerFacing, 6 + w * 2, 380, 'spark', 0xffd9a0, 1.8, 0.16, 900);
        this.shake = Math.max(this.shake, 1.5);
        break;
      }
      case 'throwBreak':
        this.ps.push({ x, y, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 70, color: 0xffffff, kind: 'ring', grav: 0 });
        this.burst(x, y, 1, 8, 300, 'spark', 0xffffff, 2, 0.2);
        this.burst(x, y, -1, 8, 300, 'spark', 0xffffff, 2, 0.2);
        break;
      case 'kd':
      case 'land':
        this.burst(x, 0, 1, e.type === 'kd' ? 10 : 4, 120, 'dust', 0x5e7774, 5, 0.6, -30);
        this.burst(x, 0, -1, e.type === 'kd' ? 10 : 4, 120, 'dust', 0x5e7774, 5, 0.6, -30);
        if (e.type === 'kd') this.shake = Math.max(this.shake, 2);
        break;
      case 'ko':
        this.slow(1.4, 0.3);
        this.flash = 0.18;
        break;
    }
  }

  update(dt: number) {
    if (this.slowT > 0) this.slowT -= dt;
    this.shake = Math.max(0, this.shake - dt * 40);
    this.flash = Math.max(0, this.flash - dt * 0.6);
    for (const p of this.ps) {
      p.life -= dt;
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 3 * dt;
      if (p.kind === 'ink' && p.y > 0) { p.y = 0; p.vy = 0; p.vx *= 0.5; }
    }
    this.ps = this.ps.filter((p) => p.life > 0);
  }

  draw() {
    const a = this.add;
    const k = this.ink;
    a.clear();
    k.clear();
    for (const p of this.ps) {
      const t = Math.max(0, p.life / p.max);
      switch (p.kind) {
        case 'core':
          a.circle(p.x, p.y, p.size * (1.2 - t * 0.5)).fill({ color: p.color, alpha: t * 0.9 });
          break;
        case 'ring':
          a.circle(p.x, p.y, p.size * (1.1 - t)).stroke({ width: 3 * t + 1, color: p.color, alpha: t * 0.8 });
          break;
        case 'spark': {
          const len = 0.03;
          a.moveTo(p.x, p.y).lineTo(p.x - p.vx * len, p.y - p.vy * len).stroke({ width: p.size, color: p.color, alpha: t, cap: 'round' });
          break;
        }
        case 'fleck':
          a.circle(p.x, p.y, p.size * t).fill({ color: p.color, alpha: t * 0.8 });
          break;
        case 'ink':
          k.circle(p.x, p.y, p.size * (0.5 + t * 0.5)).fill({ color: 0x000000, alpha: Math.min(1, t * 1.5) });
          break;
        case 'dust':
          k.circle(p.x, p.y, p.size * (1.5 - t)).fill({ color: p.color, alpha: t * 0.25 });
          break;
      }
    }
  }
}

/** Fading ribbon behind a moving point pair (blade tip + mid, or limb end + joint). */
export class Trail {
  private pts: { a: [number, number]; b: [number, number]; age: number }[] = [];
  push(a: [number, number], b: [number, number]) { this.pts.push({ a, b, age: 0 }); }
  update(dt: number) {
    for (const p of this.pts) p.age += dt;
    this.pts = this.pts.filter((p) => p.age < 0.12);
  }
  clear() { this.pts = []; }
  draw(g: Graphics, color: number, strength: number) {
    for (let i = 1; i < this.pts.length; i++) {
      const p0 = this.pts[i - 1];
      const p1 = this.pts[i];
      const t = 1 - p1.age / 0.12;
      g.poly([p0.a[0], p0.a[1], p1.a[0], p1.a[1], p1.b[0], p1.b[1], p0.b[0], p0.b[1]]).fill({ color, alpha: 0.55 * t * t * strength });
    }
  }
}
