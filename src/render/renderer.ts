import { Application, Container, Graphics, Sprite, TilingSprite } from 'pixi.js';
import { ROSTER } from '../data/roster';
import * as C from '../sim/constants';
import type { GameState } from '../sim/types';
import { animKey, GUARD, lerpPose, moveTrail, poseFor, type Pose } from '../anim/poses';
import { drawAccents, drawFigure, PX, solve, toScreen, type Joints } from './rig';
import { Stage, STAGE_THEME } from './stage';
import { grain, vignette } from './textures';
import { Trail, Vfx } from './vfx';

export const PLAYER_COLORS = [0x9fe3ff, 0xff7a4a];

class FighterView {
  rim = new Graphics();
  body = new Graphics();
  accents = new Graphics();
  trail = new Trail();
  private shown: Pose = { ...GUARD };
  private from: Pose = { ...GUARD };
  private blend = 1;
  private key = '';
  private coat = 0;
  private coatV = 0;
  private lastX = 0;
  joints: Joints | null = null;
  screenX = 0;

  constructor(public idx: number) {}

  update(s: GameState, time: number, dt: number, rx: number, ry: number) {
    const f = s.f[this.idx];
    const key = animKey(f);
    if (key !== this.key) { this.from = this.shown; this.blend = 0; this.key = key; }
    const target = poseFor(f, time + this.idx * 1.3);
    this.blend = Math.min(1, this.blend + dt / 0.06);
    this.shown = this.blend < 1 ? lerpPose(this.from, target, this.blend) : target;
    const j = solve(this.shown);
    this.joints = j;
    // coat secondary motion (spring toward lagging behind velocity)
    const vel = (rx - this.lastX) / Math.max(dt, 1e-3);
    this.lastX = rx;
    const targetCoat = Math.max(-35, Math.min(35, -vel * f.facing * 0.06)) + this.shown.lean * 0.4 - 6;
    this.coatV += (targetCoat - this.coat) * 120 * dt;
    this.coatV *= Math.exp(-9 * dt);
    this.coat += this.coatV * dt;

    const x = (rx / 1000) * PX;
    const y = -(ry / 1000) * PX;
    this.screenX = x;
    const opts = { x, y, facing: f.facing, color: 0x050507, alpha: 1, coat: this.coat };
    this.rim.clear();
    this.body.clear();
    this.accents.clear();
    drawFigure(this.rim, j, { ...opts, color: STAGE_THEME.key, alpha: 0.32, widthBoost: 0.035 });
    this.rim.position.set(2.2, -1.6);
    drawFigure(this.body, j, opts);
    drawAccents(this.accents, j, opts, PLAYER_COLORS[this.idx], STAGE_THEME.key);

    // Trails: weapon or limb during the strike
    this.trail.update(dt);
    if (f.act === 'move') {
      const m = ROSTER[f.fid].moves[f.move];
      const kind = moveTrail(f.move);
      if (m && kind !== 'none' && f.t >= m.startup - 4 && f.t <= m.startup + m.active + 1) {
        const pair = kind === 'weapon' ? (['tip', 'bladeMid'] as const)
          : kind === 'fHand' ? (['fHand', 'fElbow'] as const)
          : kind === 'fFoot' ? (['fFoot', 'fKnee'] as const) : (['rFoot', 'rKnee'] as const);
        this.trail.push(toScreen(j, pair[0], x, y, f.facing), toScreen(j, pair[1], x, y, f.facing));
      }
    }
  }
}

export interface RenderOpts { hitboxes: boolean }

export class Renderer {
  app = new Application();
  private stage!: Stage;
  private world = new Container();
  private fighters = [new FighterView(0), new FighterView(1)];
  private trailG = new Graphics();
  private boxes = new Graphics();
  vfx = new Vfx();
  private flash = new Graphics();
  private vig!: Sprite;
  private grain!: TilingSprite;
  private camX = 0;
  private zoom = 1;
  private prev: [number, number, number, number] = [0, 0, 0, 0];
  private time = 0;

  async init(parent: HTMLElement) {
    await this.app.init({ resizeTo: window, background: '#03070a', antialias: true, autoDensity: true, resolution: Math.min(2, window.devicePixelRatio || 1) });
    parent.appendChild(this.app.canvas);
    this.stage = new Stage();
    const root = this.app.stage;
    root.addChild(this.stage.root);
    root.addChild(this.world);
    for (const fv of this.fighters) this.world.addChild(fv.rim);
    for (const fv of this.fighters) this.world.addChild(fv.body);
    this.trailG.blendMode = 'add';
    this.vfx.add.blendMode = 'add';
    this.world.addChild(this.vfx.ink);
    for (const fv of this.fighters) this.world.addChild(fv.accents);
    this.world.addChild(this.trailG, this.vfx.add, this.boxes);
    root.addChild(this.stage.front);
    root.addChild(this.flash);
    this.vig = new Sprite(vignette());
    root.addChild(this.vig);
    this.grain = new TilingSprite({ texture: grain(), width: 100, height: 100 });
    this.grain.alpha = 0.035;
    root.addChild(this.grain);
  }

  /** Remember positions before a sim step, for smooth interpolation on high-refresh screens. */
  snapshot(s: GameState) {
    this.prev = [s.f[0].x, s.f[0].y, s.f[1].x, s.f[1].y];
  }

  render(s: GameState, alpha: number, dt: number, opts: RenderOpts) {
    this.time += dt;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const lerp = (a: number, b: number) => a + (b - a) * alpha;
    const big = (a: number, b: number) => Math.abs(a - b) > 1500; // teleport (round reset)
    const rx0 = big(this.prev[0], s.f[0].x) ? s.f[0].x : lerp(this.prev[0], s.f[0].x);
    const ry0 = big(this.prev[1], s.f[0].y) ? s.f[0].y : lerp(this.prev[1], s.f[0].y);
    const rx1 = big(this.prev[2], s.f[1].x) ? s.f[1].x : lerp(this.prev[2], s.f[1].x);
    const ry1 = big(this.prev[3], s.f[1].y) ? s.f[1].y : lerp(this.prev[3], s.f[1].y);

    // Camera: frame both fighters, never past the walls
    const mid = (rx0 + rx1) / 2000;
    const gap = Math.abs(rx0 - rx1) / 1000;
    const viewUnits = Math.max(11, Math.min(20, gap + 7.5));
    const targetZoom = Math.min(w / (viewUnits * PX), h / (7.2 * PX));
    this.zoom += (targetZoom - this.zoom) * Math.min(1, dt * 4);
    const halfView = w / (2 * PX * this.zoom);
    const limit = C.STAGE_HALF / 1000 + 1.2 - halfView;
    const targetX = limit > 0 ? Math.max(-limit, Math.min(limit, mid)) : 0;
    this.camX += (targetX - this.camX) * Math.min(1, dt * 6);
    const groundY = h * 0.8;
    const shakeX = (Math.random() - 0.5) * 2 * this.vfx.shake;
    const shakeY = (Math.random() - 0.5) * 2 * this.vfx.shake;

    this.world.scale.set(this.zoom);
    this.world.position.set(w / 2 - this.camX * PX * this.zoom + shakeX, groundY + shakeY);
    this.stage.update(w, h, this.camX, this.zoom, groundY, this.time, dt);
    this.stage.root.position.set(shakeX * 0.4, shakeY * 0.4);

    this.fighters[0].update(s, this.time, dt, rx0, ry0);
    this.fighters[1].update(s, this.time, dt, rx1, ry1);
    this.trailG.clear();
    for (const fv of this.fighters) fv.trail.draw(this.trailG, PLAYER_COLORS[fv.idx], 1);

    this.vfx.update(dt);
    this.vfx.draw();

    this.boxes.clear();
    if (opts.hitboxes) this.drawBoxes(s, [rx0, rx1]);

    this.flash.clear();
    if (this.vfx.flash > 0) this.flash.rect(0, 0, w, h).fill({ color: 0xffffff, alpha: this.vfx.flash });
    this.vig.width = w;
    this.vig.height = h;
    this.grain.width = w;
    this.grain.height = h;
    this.grain.tilePosition.set(Math.random() * 256, Math.random() * 256);
  }

  onEvents(s: GameState) {
    for (const e of s.events) {
      const att = e.p >= 0 && e.p <= 1 ? s.f[e.p] : null;
      this.vfx.onEvent(e, att ? att.facing : 1);
    }
  }

  private drawBoxes(s: GameState, xs: [number, number]) {
    const g = this.boxes;
    for (let i = 0; i < 2; i++) {
      const f = s.f[i];
      const x = (xs[i] / 1000) * PX;
      const crouch = f.act === 'crouch' || (f.act === 'move' && ROSTER[f.fid].moves[f.move]?.crouch) || f.crouchStun;
      const hh = (crouch ? 2.3 : 3.5) * PX;
      const bw = (C.BODY_HALF / 1000) * PX;
      const y = -(f.y / 1000) * PX;
      g.rect(x - bw, y - hh, bw * 2, hh).stroke({ width: 1.5, color: 0x6dff9e, alpha: 0.7 });
      if (f.act === 'move') {
        const m = ROSTER[f.fid].moves[f.move];
        if (m && f.t >= m.startup && f.t < m.startup + m.active) {
          const front = x + f.facing * bw;
          const len = (m.range / 1000) * PX;
          const band = m.level === 'H' ? [2.7, 3.5] : m.level === 'M' ? [1.4, 2.8] : m.level === 'L' ? [0, 1.2] : [1.2, 3.2];
          const x0 = Math.min(front, front + f.facing * len);
          g.rect(x0, y - band[1] * PX, len, (band[1] - band[0]) * PX).fill({ color: 0xff3b3b, alpha: 0.28 }).stroke({ width: 1.5, color: 0xff5050, alpha: 0.9 });
        }
      }
    }
  }
}
