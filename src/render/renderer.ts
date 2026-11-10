import { Application, Container, Graphics, Rectangle, Sprite, TilingSprite } from 'pixi.js';
import { legsAt, solve, type Joints, type Pose, type V, lerpPose } from '../content/rig';
import { ROSTER } from '../content/roster';
import * as C from '../sim/constants';
import type { GameState } from '../sim/types';
import { drawAccents, drawFigure, PX } from './figure';
import { animKey, blendTime, groundFor, poseFor } from './posing';
import { ARENAS, Stage, STAGE_THEME } from './stage';
import { grain, vignette } from './textures';
import { Trail, Vfx } from './vfx';

export const PLAYER_COLORS = [0x9fe3ff, 0xff8a5c];

class FighterView {
  rim = new Graphics();
  body = new Graphics();
  accents = new Graphics();
  trail = new Trail();
  trail2 = new Trail();
  private shown: Pose | null = null;
  private from: Pose | null = null;
  private blend = 1;
  private blendDur = 0.07;
  private key = '';
  private coat = 0;
  private coatV = 0;
  private lastX = 0;
  private walkPhase = 0;
  private scarf: V[] = [];
  private scarfV: V[] = [];
  joints: Joints | null = null;

  constructor(public idx: number) {}

  update(s: GameState, alpha: number, time: number, dt: number, rx: number, ry: number) {
    const f = s.f[this.idx];
    const fd = ROSTER[f.fid];
    const def = fd.def;
    const frozen = s.hitstop > 0;
    // Round reset / rematch / rollback teleport: drop all smoothing state instead of sliding into place.
    const teleported = Math.abs(rx - this.lastX) > 2500;
    if (teleported) { this.shown = null; this.from = null; this.key = ''; this.blend = 1; this.scarf = []; }
    // Facing-relative walk phase accumulated from real movement: continuous through direction changes,
    // stops and facing flips, so a supporting foot never skates.
    if (!teleported && (f.act === 'walkF' || f.act === 'walkB')) this.walkPhase += ((rx - this.lastX) / 1000) * f.facing / (0.95 * def.rig.scale);
    const introT = s.phase === 'intro' ? s.phaseT : 999;
    const intro = introT >= 90 ? 0 : Math.min(1, introT / 30) * (introT > 70 ? 1 - (introT - 70) / 20 : 1);
    const target = poseFor(f, frozen ? 0 : alpha, time + this.idx * 1.7, { walkPhase: this.walkPhase, intro });
    const key = animKey(f);
    if (key !== this.key) { this.blendDur = blendTime(this.key, key); this.from = this.shown ?? target; this.blend = this.shown ? 0 : 1; this.key = key; }
    // Per-action-pair blend: attacks and reactions snap, locomotion eases. Contact poses are never blended away.
    this.blend = Math.min(1, this.blend + dt / this.blendDur);
    this.shown = this.blend < 1 && this.from ? lerpPose(this.from, target, this.blend) : target;
    const gm = groundFor(f);
    const j = solve(this.shown, def.rig, gm.mode, def.feet[2] + 0.04, gm.blend);
    this.joints = j;
    const vel = (rx - this.lastX) / Math.max(dt, 1e-3);
    this.lastX = rx;
    const targetCoat = Math.max(-35, Math.min(35, -vel * f.facing * 0.05)) + this.shown.lean * 0.45 - 6;
    this.coatV += (targetCoat - this.coat) * 140 * dt;
    this.coatV *= Math.exp(-10 * dt);
    this.coat += this.coatV * dt;

    // Impact shudder on the victim during hit-stop
    const shake = frozen && (f.act === 'hitstun' || f.act === 'air' || f.act === 'blockstun') ? (Math.random() - 0.5) * 4 : 0;
    const x = (rx / 1000) * PX + shake;
    const y = -(ry / 1000) * PX;
    this.updateScarf(j, x, y, f.facing, dt);
    const smoke = f.smoke > 0;
    const alphaBody = smoke ? 0.14 + Math.sin(time * 9) * 0.04 : 1;
    const opts = { x, y, facing: f.facing, color: 0x000000, alpha: alphaBody, coat: this.coat, scarf: this.scarf, scale: def.rig.scale, grip: def.rig.grip, offLen: def.rig.offLen };
    this.rim.clear(); this.body.clear(); this.accents.clear();
    if (!smoke) {
      drawFigure(this.rim, j, def.visual, def.rig.weapon, { ...opts, color: STAGE_THEME.key, alpha: 0.16, grow: 0.02 });
      this.rim.position.set(2, -1.5);
    }
    drawFigure(this.body, j, def.visual, def.rig.weapon, opts);
    drawAccents(this.accents, j, opts, PLAYER_COLORS[this.idx], STAGE_THEME.key, def.rig.weapon);

    this.trail.update(dt);
    this.trail2.update(dt);
    if (f.act === 'move' && !frozen) {
      const m = def.moves.find((mm) => mm.id === f.move);
      if (m && m.shape && f.t >= m.startup - 3 && f.t <= m.startup + m.active + 1) {
        const tx = (v: V): V => [x + v[0] * f.facing * PX, y - v[1] * PX];
        const pairs: Record<string, [V, V]> = {
          weapon: [j.tip, j.rHand], rClaw: [j.tip, j.rHand], fClaw: [j.fTip, j.fHand],
          fHand: [j.fHand, j.fElbow], fFoot: [j.fToe, j.fFoot], rFoot: [j.rToe, j.rFoot],
        };
        const pr = pairs[m.shape];
        if (m.shape === 'weapon') {
          const mid: V = [(j.tip[0] + j.rHand[0]) / 2, (j.tip[1] + j.rHand[1]) / 2];
          this.trail.push(tx(j.tip), tx(mid));
        } else this.trail.push(tx(pr[0]), tx(pr[1]));
        if (def.rig.grip === 'dual' && m.shape === 'weapon') {
          const mid2: V = [(j.fTip[0] + j.fHand[0]) / 2, (j.fTip[1] + j.fHand[1]) / 2];
          this.trail2.push(tx(j.fTip), tx(mid2));
        }
      }
    }
  }

  private updateScarf(j: Joints, x: number, y: number, facing: number, dt: number) {
    const anchor: V = [x + j.neck[0] * facing * PX, y - j.neck[1] * PX];
    const N = 6;
    const seg = 9;
    if (this.scarf.length !== N) { this.scarf = Array.from({ length: N }, (_, i) => [anchor[0] - facing * i * seg, anchor[1]] as V); this.scarfV = this.scarf.map(() => [0, 0] as V); }
    this.scarf[0] = anchor;
    for (let i = 1; i < N; i++) {
      const p = this.scarf[i];
      const v = this.scarfV[i];
      v[1] += 380 * dt; v[0] += -facing * 120 * dt;
      v[0] *= 0.9; v[1] *= 0.9;
      p[0] += v[0] * dt * 8; p[1] += v[1] * dt * 8;
      const prev = this.scarf[i - 1];
      const dx = p[0] - prev[0], dy = p[1] - prev[1];
      const d = Math.hypot(dx, dy) || 1;
      p[0] = prev[0] + (dx / d) * seg; p[1] = prev[1] + (dy / d) * seg;
    }
  }
}

export interface RenderOpts { hitboxes: boolean; joints?: boolean; shapes?: boolean }

export class Renderer {
  app = new Application();
  private stage!: Stage;
  private world = new Container();
  private fighters = [new FighterView(0), new FighterView(1)];
  private trailG = new Graphics();
  private projG = new Graphics();
  private boxes = new Graphics();
  vfx = new Vfx();
  private flash = new Graphics();
  private vig!: Sprite;
  private grain!: TilingSprite;
  private camX = 0;
  private zoom = 1;
  private prev: number[] = [0, 0, 0, 0];
  private time = 0;
  /** Inspector: draw the baked attack edge on every tick, not just active ones. */
  showAllShapes = false;

  async init(parent: HTMLElement) {
    await this.app.init({ resizeTo: window, background: '#05080b', antialias: true, autoDensity: true, resolution: Math.min(2, window.devicePixelRatio || 1) });
    parent.appendChild(this.app.canvas);
    this.stage = new Stage(ARENAS.sunset);
    const root = this.app.stage;
    root.addChild(this.stage.root, this.world);
    for (const fv of this.fighters) this.world.addChild(fv.rim);
    this.world.addChild(this.vfx.ink);
    for (const fv of this.fighters) this.world.addChild(fv.body);
    for (const fv of this.fighters) this.world.addChild(fv.accents);
    this.trailG.blendMode = 'add';
    this.vfx.add.blendMode = 'add';
    this.world.addChild(this.projG, this.trailG, this.vfx.add, this.boxes);
    root.addChild(this.stage.front, this.flash);
    this.vig = new Sprite(vignette());
    root.addChild(this.vig);
    this.grain = new TilingSprite({ texture: grain(), width: 100, height: 100 });
    this.grain.alpha = 0.03;
    root.addChild(this.grain);
  }

  setArena(id: string) {
    const theme = ARENAS[id] ?? ARENAS.sunset;
    if (this.stage.theme.id === theme.id) return;
    const root = this.app.stage;
    const old = this.stage;
    const next = new Stage(theme);
    root.addChildAt(next.root, root.getChildIndex(old.root));
    root.removeChild(old.root);
    root.addChildAt(next.front, root.getChildIndex(old.front));
    root.removeChild(old.front);
    old.root.destroy({ children: true });
    old.front.destroy({ children: true });
    this.stage = next;
  }

  /** Silhouette portrait of a fighter in stance, as a data URL (for menus). */
  async portrait(fid: string, accent: number): Promise<string> {
    const def = ROSTER[fid].def;
    const rig = def.rig;
    const [ffx, frx, fh] = def.feet;
    // Showcase pose: the fighter's own pose channels over a slightly wider, lower stance.
    const pose = { ...def.stance, ...legsAt(rig, ffx * 1.2, frx * 1.15, fh * 0.94), ...def.anim?.showcase } as Pose;
    const j = solve(pose, rig);
    const o = { x: 0, y: 0, facing: 1, color: 0x000000, alpha: 1, coat: -10, scarf: [] as V[], scale: rig.scale, grip: rig.grip, offLen: rig.offLen };
    const g = new Graphics();
    drawFigure(g, j, def.visual, rig.weapon, o);
    const acc = new Graphics();
    drawAccents(acc, j, o, accent, 0xffd58a, rig.weapon);
    const c = new Container();
    c.addChild(g, acc);
    this.app.stage.addChild(c);
    // Tight crop from the real silhouette bounds (weapon tips, hat/helmet, coat hem), with a margin.
    const pts: V[] = [j.head, j.tip, j.fTip, j.rHand, j.fHand, j.rToe, j.fToe, j.rFoot, j.fFoot, j.pelvis, j.neck, j.rElbow, j.fElbow];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const hr = j.headR;
    if (def.visual.hat) { x0 = Math.min(x0, j.head[0] - hr * 3.3); x1 = Math.max(x1, j.head[0] + hr * 3.1); y1 = Math.max(y1, j.head[1] + hr * 1.4); }
    if (def.visual.helmet) y1 = Math.max(y1, j.head[1] + hr * 3.4);
    if (def.visual.coat) { y0 = Math.min(y0, j.pelvis[1] - 1.0 * rig.scale); x0 = Math.min(x0, j.pelvis[0] - 0.5); }
    if (def.visual.ponytail) x0 = Math.min(x0, j.head[0] - hr * 3.2);
    const m = 0.28;
    const px = PX;
    const frame = new Rectangle((x0 - m) * px, -(y1 + m) * px, (x1 - x0 + 2 * m) * px, (y1 - y0 + 2 * m) * px);
    const res = Math.min(300 / frame.width, 400 / frame.height) * 1.5;
    const url = await this.app.renderer.extract.base64({ target: c, frame, resolution: res });
    this.app.stage.removeChild(c);
    c.destroy({ children: true });
    return url;
  }

  snapshot(s: GameState) { this.prev = [s.f[0].x, s.f[0].y, s.f[1].x, s.f[1].y]; }

  render(s: GameState, alpha: number, dt: number, opts: RenderOpts) {
    this.time += dt;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const a = s.hitstop > 0 ? 1 : alpha;
    const L = (p: number, c: number) => (Math.abs(p - c) > 1500 ? c : p + (c - p) * a);
    const rx0 = L(this.prev[0], s.f[0].x), ry0 = L(this.prev[1], s.f[0].y);
    const rx1 = L(this.prev[2], s.f[1].x), ry1 = L(this.prev[3], s.f[1].y);

    const mid = (rx0 + rx1) / 2000;
    const gap = Math.abs(rx0 - rx1) / 1000;
    const viewUnits = Math.max(10.5, Math.min(19, gap + 7.5));
    const targetZoom = Math.min(w / (viewUnits * PX), h / (6.9 * PX));
    this.zoom += (targetZoom - this.zoom) * Math.min(1, dt * 4);
    const halfView = w / (2 * PX * this.zoom);
    const limit = C.STAGE_HALF / 1000 + 1.2 - halfView;
    const targetX = limit > 0 ? Math.max(-limit, Math.min(limit, mid)) : 0;
    this.camX += (targetX - this.camX) * Math.min(1, dt * 6);
    const groundY = h * 0.8;
    const sh = this.vfx.shake;
    const shakeX = (Math.random() - 0.5) * 2 * sh;
    const shakeY = (Math.random() - 0.5) * 2 * sh;
    this.world.scale.set(this.zoom);
    this.world.position.set(w / 2 - this.camX * PX * this.zoom + shakeX, groundY + shakeY);
    this.stage.update(w, h, this.camX, this.zoom, groundY, this.time, dt);
    this.stage.root.position.set(shakeX * 0.4, shakeY * 0.4);

    this.fighters[0].update(s, alpha, this.time, dt, rx0, ry0);
    this.fighters[1].update(s, alpha, this.time, dt, rx1, ry1);
    this.trailG.clear();
    for (const fv of this.fighters) { fv.trail.draw(this.trailG, PLAYER_COLORS[fv.idx], 1); fv.trail2.draw(this.trailG, PLAYER_COLORS[fv.idx], 0.6); }
    this.drawProjectiles(s);
    this.vfx.update(dt);
    this.vfx.draw();
    this.boxes.clear();
    if (opts.hitboxes || opts.shapes) this.drawBoxes(s, !!opts.hitboxes, !!opts.shapes);
    if (opts.joints) this.drawJoints(s);

    this.flash.clear();
    if (this.vfx.flash > 0) this.flash.rect(0, 0, w, h).fill({ color: 0xffffff, alpha: this.vfx.flash });
    this.vig.width = w; this.vig.height = h;
    this.grain.width = w; this.grain.height = h;
    this.grain.tilePosition.set(Math.random() * 256, Math.random() * 256);
  }

  onEvents(s: GameState) {
    for (const e of s.events) {
      const att = e.p === 0 || e.p === 1 ? s.f[e.p] : null;
      this.vfx.onEvent(e, att ? att.facing : 1, s);
    }
  }

  private drawProjectiles(s: GameState) {
    const g = this.projG;
    g.clear();
    for (const p of s.proj) {
      const x = (p.x / 1000) * PX;
      const y = -(p.y / 1000) * PX;
      const dir = Math.sign(p.vx);
      if (p.kind === 'wave') {
        for (let i = 0; i < 4; i++) {
          const hh = 34 - i * 7;
          g.ellipse(x - dir * i * 16, -hh / 2, 16 - i * 2, hh / 2).fill({ color: 0x080a0e, alpha: 0.9 - i * 0.18 });
        }
        g.ellipse(x, -14, 18, 18).stroke({ width: 2, color: 0x80aebb, alpha: 0.6 });
      } else if (p.kind === 'shuriken') {
        const r = 10;
        const a0 = this.time * 30;
        const pts: number[] = [];
        for (let i = 0; i < 8; i++) { const a = a0 + (i * Math.PI) / 4; const rr = i % 2 ? r * 0.35 : r; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        g.poly(pts).fill({ color: 0x0a0c10 });
        g.circle(x, y, 2).fill({ color: 0x9fd8d0, alpha: 0.6 });
      } else {
        g.moveTo(x - dir * 18, y).lineTo(x + dir * 14, y - 1).lineTo(x + dir * 18, y).lineTo(x + dir * 14, y + 2).lineTo(x - dir * 18, y + 1).fill({ color: 0x0a0c10 });
        g.moveTo(x - dir * 40, y).lineTo(x - dir * 18, y).stroke({ width: 2, color: 0x9fd8d0, alpha: 0.25 });
      }
    }
  }

  private drawJoints(s: GameState) {
    const g = this.boxes;
    for (let i = 0; i < 2; i++) {
      const f = s.f[i];
      const j = this.fighters[i].joints;
      if (!j) continue;
      const x = (f.x / 1000) * PX;
      const y = -(f.y / 1000) * PX;
      const pts: [V, number][] = [[j.pelvis, 0xffffff], [j.neck, 0xffffff], [j.head, 0xffffff], [j.fShoulder, 0x7dd3ff], [j.fElbow, 0x7dd3ff], [j.fHand, 0x7dd3ff], [j.rShoulder, 0xffd27a], [j.rElbow, 0xffd27a], [j.rHand, 0xffd27a], [j.tip, 0xff6a6a], [j.fTip, 0xff9a6a], [j.fHip, 0x9dff9d], [j.fKnee, 0x9dff9d], [j.fFoot, 0x9dff9d], [j.fToe, 0x9dff9d], [j.rHip, 0xc9a0ff], [j.rKnee, 0xc9a0ff], [j.rFoot, 0xc9a0ff], [j.rToe, 0xc9a0ff]];
      for (const [v, c] of pts) g.circle(x + v[0] * f.facing * PX, y - v[1] * PX, 2.6).fill({ color: c });
      // floor line and the lowest foot, to see ground contact
      g.moveTo(x - 90, 0).lineTo(x + 90, 0).stroke({ width: 1, color: 0x6dff9e, alpha: 0.5 });
    }
  }

  private drawBoxes(s: GameState, hurt = true, shapes = true) {
    const g = this.boxes;
    for (let i = 0; i < 2; i++) {
      const f = s.f[i];
      const fd = ROSTER[f.fid];
      const crouch = f.act === 'crouch' || (f.act === 'move' && fd.moves[f.move]?.crouch) || f.crouchStun;
      const k = fd.heightPm / 1000;
      const set = crouch ? [[-300, 1900, 300, 2450], [-480, 900, 480, 1900], [-500, 0, 500, 900]] : [[-300, 2900, 300, 3700], [-430, 1400, 430, 2900], [-450, 0, 450, 1400]];
      if (hurt) for (const b of set) {
        const x0 = ((f.x + b[0]) / 1000) * PX, x1 = ((f.x + b[2]) / 1000) * PX;
        const y0 = -((f.y + b[1] * k) / 1000) * PX, y1 = -((f.y + b[3] * k) / 1000) * PX;
        g.rect(x0, y1, x1 - x0, y0 - y1).stroke({ width: 1.2, color: 0x6dff9e, alpha: 0.6 });
      }
      if (shapes && f.act === 'move') {
        const m = fd.moves[f.move];
        // In the inspector (all ticks) draw the edge at any tick; in play only while it is active.
        if (m?.shapes && (!hurt || (f.t >= m.startup && f.t < m.startup + m.active) || this.showAllShapes)) {
          const sg = m.shapes[f.t];
          const ax = ((f.x + sg[0] * f.facing) / 1000) * PX, ay = -((f.y + sg[1]) / 1000) * PX;
          const bx = ((f.x + sg[2] * f.facing) / 1000) * PX, by = -((f.y + sg[3]) / 1000) * PX;
          g.moveTo(ax, ay).lineTo(bx, by).stroke({ width: (m.radius / 1000) * PX * 2, color: 0xff3b3b, alpha: 0.45, cap: 'round' });
        }
      }
    }
  }
}
