// Ashen Ferry: cold teal mist, moonlight, river reeds. Procedural parallax layers.
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { PX } from './figure';
import { softBlob, verticalGradient } from './textures';
import { STAGE_HALF, U } from '../sim/constants';

export interface ArenaTheme {
  id: string; name: string;
  sky: [number, string][]; sun: number; sunGlow: number; sunSize: number;
  far: number; far2: number; water: [number, string][]; bank: number; dock: number; dockEdge: number;
  fog: number; fogAlpha: number; fg: number; key: number; fleck: number; mote: number;
}
export const ARENAS: Record<string, ArenaTheme> = {
  sunset: { id: 'sunset', name: 'Sunset Gate', sky: [[0, '#f3b24f'], [0.45, '#f7cf73'], [0.8, '#fbe6a6'], [1, '#f6d58a']], sun: 0xfff3c4, sunGlow: 0xffd27a, sunSize: 70,
    far: 0xd59a4c, far2: 0xb7783a, water: [[0, '#c98a44'], [1, '#8f5a2a']], bank: 0x3a220f, dock: 0x24150a, dockEdge: 0xffd58a, fog: 0xffe2a8, fogAlpha: 0.22, fg: 0x0b0603, key: 0xffd58a, fleck: 0xffc26b, mote: 0xfff0c0 },
  bamboo: { id: 'bamboo', name: 'Bamboo Grove', sky: [[0, '#a9d65a'], [0.5, '#d4ef8c'], [0.85, '#eaf7b8'], [1, '#c9e47e']], sun: 0xf8ffd8, sunGlow: 0xe6ff9a, sunSize: 55,
    far: 0x7fae3f, far2: 0x5d8a2c, water: [[0, '#6f9c36'], [1, '#3f6a1c']], bank: 0x1d3010, dock: 0x16220b, dockEdge: 0xeaff9a, fog: 0xf0ffc8, fogAlpha: 0.25, fg: 0x050a02, key: 0xeaff9a, fleck: 0xd8f07a, mote: 0xf6ffd0 },
  ferry: { id: 'ferry', name: 'Ashen Ferry', sky: [[0, '#0b1c20'], [0.45, '#1c3a3e'], [0.8, '#3b6462'], [1, '#4a7470']], sun: 0xdcefe9, sunGlow: 0x9fd8d0, sunSize: 44,
    far: 0x24464a, far2: 0x18363a, water: [[0, '#2a5052'], [1, '#10272a']], bank: 0x081214, dock: 0x091316, dockEdge: 0x9fd8d0, fog: 0x9dc4c0, fogAlpha: 0.16, fg: 0x020405, key: 0x9fd8d0, fleck: 0x7fc9c0, mote: 0xcfeee6 },
};
export const STAGE_THEME = { key: 0xffd58a, fleck: 0xffc26b, fog: 0xffe2a8 };

interface Layer { c: Container; factor: number }

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

function reedClump(g: Graphics, x: number, base: number, h: number, color: number, alpha: number, rnd: () => number) {
  const n = 5 + Math.floor(rnd() * 6);
  for (let i = 0; i < n; i++) {
    const ox = x + (rnd() - 0.5) * 40;
    const hh = h * (0.6 + rnd() * 0.6);
    const bend = (rnd() - 0.3) * 30;
    g.moveTo(ox, base).quadraticCurveTo(ox + bend * 0.3, base - hh * 0.6, ox + bend, base - hh).stroke({ width: 2 + rnd() * 2, color, alpha, cap: 'round' });
    if (rnd() < 0.35) g.ellipse(ox + bend, base - hh - 8, 3, 12).fill({ color, alpha });
  }
}

export class Stage {
  root = new Container();
  front = new Container();
  private sky: Sprite;
  private layers: Layer[] = [];
  private fogs: { s: Sprite; speed: number; base: number }[] = [];
  private shimmer = new Graphics();
  private motes: { x: number; y: number; vx: number; vy: number; a: number }[] = [];
  private moteG = new Graphics();
  private blob: Texture;
  private moon: Container;

  constructor(public theme: ArenaTheme = ARENAS.sunset) {
    const T = theme;
    STAGE_THEME.key = T.key; STAGE_THEME.fleck = T.fleck; STAGE_THEME.fog = T.fog;
    this.blob = softBlob(256);
    this.sky = new Sprite(verticalGradient(T.sky));
    this.root.addChild(this.sky);

    // Moon + glow
    const moon = new Container();
    const glow = new Sprite(this.blob);
    glow.anchor.set(0.5); glow.width = glow.height = 700; glow.tint = T.sunGlow; glow.alpha = 0.45;
    const glow2 = new Sprite(this.blob);
    glow2.anchor.set(0.5); glow2.width = glow2.height = 220; glow2.tint = T.sun; glow2.alpha = 0.7;
    const disc = new Graphics().circle(0, 0, T.sunSize).fill({ color: T.sun });
    disc.circle(-12, -8, 9).fill({ color: 0xc4ddd6, alpha: 0.6 }).circle(14, 12, 6).fill({ color: 0xc4ddd6, alpha: 0.5 });
    const moonInner = new Container();
    moonInner.addChild(glow, glow2, disc);
    moonInner.scale.set(0.8);
    moon.addChild(moonInner);
    this.moon = moon;
    this.addLayer(moon, 0.03);

    const rnd = seeded(7);
    // Far mountains
    const far = new Graphics();
    far.moveTo(-3200, 0);
    for (let x = -3200; x <= 3200; x += 80) far.lineTo(x, -260 - Math.sin(x * 0.0017) * 120 - Math.sin(x * 0.0061) * 40 - rnd() * 20);
    far.lineTo(3200, 0).closePath().fill({ color: T.far });
    this.addLayer(far, 0.08);
    const far2 = new Graphics();
    far2.moveTo(-3200, 0);
    for (let x = -3200; x <= 3200; x += 60) far2.lineTo(x, -150 - Math.sin(x * 0.0031 + 2) * 70 - rnd() * 18);
    far2.lineTo(3200, 0).closePath().fill({ color: T.far2 });
    this.addLayer(far2, 0.16);

    // River with moon shimmer and a distant ferry
    const river = new Container();
    const water = new Sprite(verticalGradient(T.water, 128));
    water.width = 7000; water.height = 150; water.position.set(-3500, -150);
    river.addChild(water);
    const boat = new Graphics();
    boat.moveTo(-60, 0).lineTo(70, 0).lineTo(50, 12).lineTo(-45, 12).closePath().fill({ color: 0x07110f });
    boat.moveTo(10, 0).lineTo(14, -70).stroke({ width: 3, color: 0x07110f });
    boat.circle(-20, -12, 8).fill({ color: 0x07110f }).rect(-27, -6, 14, 8).fill({ color: 0x07110f });
    boat.position.set(-700, -110);
    const lantern = new Sprite(this.blob);
    lantern.anchor.set(0.5); lantern.width = lantern.height = 40; lantern.tint = 0xffc27a; lantern.alpha = 0.55;
    lantern.position.set(-686, -180);
    river.addChild(boat, lantern, this.shimmer);
    this.addLayer(river, 0.32);

    // River mist band
    for (let i = 0; i < 3; i++) {
      const f = new Sprite(this.blob);
      f.anchor.set(0.5); f.width = 1800; f.height = 160; f.tint = T.fog; f.alpha = T.fogAlpha;
      f.position.set(-1500 + i * 1500, -120);
      river.addChild(f);
      this.fogs.push({ s: f, speed: 6 + i * 3, base: f.x });
    }

    // Near bank: posts and reeds behind the dock
    const bank = new Graphics();
    for (let x = -2600; x <= 2600; x += 110 + rnd() * 120) reedClump(bank, x, -10, 90 + rnd() * 90, T.bank, 1, rnd);
    for (let x = -2400; x <= 2400; x += 520 + rnd() * 200) bank.rect(x, -150 - rnd() * 40, 14, 160).fill({ color: T.bank });
    this.addLayer(bank, 0.6);

    // Dock (world layer, factor 1): planks + wall posts at the stage edges
    const dock = new Graphics();
    const half = (STAGE_HALF / U) * PX;
    dock.rect(-half - 400, 0, half * 2 + 800, 260).fill({ color: T.dock });
    for (let x = -half - 400; x < half + 400; x += 46) dock.moveTo(x, 4).lineTo(x - 30, 260).stroke({ width: 1, color: 0x050b0d, alpha: 0.8 });
    dock.moveTo(-half - 400, 1).lineTo(half + 400, 1).stroke({ width: 2, color: T.dockEdge, alpha: 0.35 });
    for (const sx of [-1, 1]) {
      const x = sx * (half + 18);
      dock.rect(x - 16, -330, 32, 590).fill({ color: 0x040809 });
      dock.rect(x - 22, -342, 44, 16).fill({ color: 0x040809 });
      dock.moveTo(x, -250).quadraticCurveTo(x - sx * 140, -200, x - sx * 300, -260).stroke({ width: 3, color: 0x040809 });
      dock.moveTo(x - sx * 15, -330).lineTo(x - sx * 15, 0).stroke({ width: 1.5, color: T.dockEdge, alpha: 0.2 });
    }
    this.addLayer(dock, 1);

    // Low fog between the background and fighters
    const lowFog = new Container();
    for (let i = 0; i < 4; i++) {
      const f = new Sprite(this.blob);
      f.anchor.set(0.5); f.width = 1400; f.height = 220; f.tint = T.fog; f.alpha = T.fogAlpha * 0.7;
      f.position.set(-1600 + i * 1100, -60);
      lowFog.addChild(f);
      this.fogs.push({ s: f, speed: 12 + i * 4, base: f.x });
    }
    this.addLayer(lowFog, 0.95);

    // Foreground reeds (in front of fighters)
    const fg = new Container();
    const fgReeds = new Graphics();
    fg.addChild(fgReeds);
    const rnd2 = seeded(31);
    for (let x = -3000; x <= 3000; x += 260 + rnd2() * 380) reedClump(fgReeds, x, 120, 160 + rnd2() * 120, T.fg, 1, rnd2);
    const fgL: Layer = { c: fg, factor: 1.35 };
    this.front.addChild(fg);
    this.layers.push(fgL);
    const fgFog = new Sprite(this.blob);
    fgFog.anchor.set(0.5); fgFog.width = 3000; fgFog.height = 200; fgFog.tint = STAGE_THEME.fog; fgFog.alpha = 0.06;
    fgFog.position.set(0, 60);
    fg.addChild(fgFog);

    for (let i = 0; i < 40; i++) this.motes.push({ x: Math.random(), y: Math.random(), vx: 0.004 + Math.random() * 0.01, vy: -0.003 - Math.random() * 0.006, a: Math.random() });
    this.front.addChild(this.moteG);
  }

  private addLayer(c: Container, factor: number) {
    this.layers.push({ c, factor });
    this.root.addChild(c);
  }

  update(w: number, h: number, camX: number, zoom: number, groundY: number, time: number, dt: number) {
    this.sky.width = w;
    this.sky.height = h;
    for (const l of this.layers) {
      const z = 1 + (zoom - 1) * Math.min(1, l.factor);
      l.c.scale.set(z * (l.factor > 1 ? 1.05 : 1));
      l.c.x = w / 2 - camX * PX * zoom * l.factor;
      l.c.y = l.factor >= 1 ? groundY : groundY - (1 - l.factor) * 30;
    }
    this.moon.y = Math.max(70, h * 0.17);
    this.moon.x = w * 0.72 - camX * PX * zoom * 0.03;
    for (const f of this.fogs) {
      f.s.x = f.base + Math.sin(time * 0.05 + f.base) * 200 + ((time * f.speed) % 600) - 300;
    }
    // moon shimmer on the water
    const g = this.shimmer;
    g.clear();
    for (let i = 0; i < 14; i++) {
      const y = -140 + i * 9;
      const wdt = 30 + i * 9 + Math.sin(time * 2 + i) * 14;
      const x = 520 * (0.03 / 0.32) + 230 + Math.sin(time * 1.3 + i * 1.7) * 10;
      g.rect(x - wdt / 2, y, wdt, 1.6).fill({ color: 0xcfeee6, alpha: 0.08 + 0.18 * Math.abs(Math.sin(time * 1.7 + i)) });
    }
    // drifting motes (screen space)
    const m = this.moteG;
    m.clear();
    for (const p of this.motes) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x > 1.05) p.x = -0.05;
      if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
      const a = 0.25 + 0.35 * Math.abs(Math.sin(time * 1.5 + p.a * 10));
      m.circle(p.x * w, p.y * h, 1.4).fill({ color: this.theme.mote, alpha: a });
    }
  }
}
