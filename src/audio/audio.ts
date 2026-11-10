// Procedural WebAudio: SFX from simulation events + an ambient stage loop.
import type { GameState, SimEvent } from '../sim/types';

const PENTA = [0, 3, 5, 7, 10]; // D minor pentatonic intervals
const ROOT = 146.83; // D3

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private verb!: ConvolverNode;
  private verbIn!: GainNode;
  private drums!: GainNode;
  private noise!: AudioBuffer;
  private nextPluck = 0;
  private nextBeat = 0;
  private beat = 0;
  tension = false;
  muted = false;

  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(ctx.destination);
    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.9;
    this.sfx.connect(this.master);
    this.music = ctx.createGain();
    this.music.gain.value = 0.55;
    this.music.connect(this.master);
    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(3.2);
    this.verbIn = ctx.createGain();
    this.verbIn.gain.value = 0.5;
    this.verbIn.connect(this.verb);
    this.verb.connect(this.master);
    this.drums = ctx.createGain();
    this.drums.gain.value = 0;
    this.drums.connect(this.music);
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.startDrone();
    this.nextPluck = ctx.currentTime + 1;
    this.nextBeat = ctx.currentTime + 0.5;
    window.setInterval(() => this.schedule(), 100);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  private impulse(sec: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = b.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return b;
  }

  private startDrone() {
    const ctx = this.ctx!;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 280;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();
    const g = ctx.createGain();
    g.gain.value = 0.06;
    for (const [f, det] of [[73.42, -5], [73.42, 6], [110, 0], [36.71, 0]]) {
      const o = ctx.createOscillator();
      o.type = f < 40 ? 'sine' : 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      o.start();
    }
    lp.connect(g).connect(this.music);
    g.connect(this.verbIn);
    // wind
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    n.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 500;
    bp.Q.value = 0.6;
    const wl = ctx.createOscillator();
    wl.frequency.value = 0.08;
    const wg = ctx.createGain();
    wg.gain.value = 300;
    wl.connect(wg).connect(bp.frequency);
    wl.start();
    const ng = ctx.createGain();
    ng.gain.value = 0.025;
    n.connect(bp).connect(ng).connect(this.music);
    n.start();
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    this.drums.gain.setTargetAtTime(this.tension ? 0.9 : 0, now, 1.2);
    while (this.nextPluck < now + 0.3) {
      const deg = PENTA[Math.floor(Math.random() * PENTA.length)];
      const oct = Math.random() < 0.3 ? 2 : 1;
      this.pluck(ROOT * Math.pow(2, deg / 12) * oct, this.nextPluck, Math.random() < 0.15);
      this.nextPluck += 1.1 + Math.random() * 2.4;
    }
    while (this.nextBeat < now + 0.3) {
      // 70 BPM frame drum: strong 1, soft "and" of 2, 3
      const step = this.beat % 8;
      if (step === 0) this.drum(this.nextBeat, 1);
      else if (step === 3 || step === 4) this.drum(this.nextBeat, 0.45);
      else if (step === 6) this.drum(this.nextBeat, 0.3);
      this.beat++;
      this.nextBeat += 60 / 70 / 2;
    }
  }

  private pluck(freq: number, t: number, bell: boolean) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = bell ? 'sine' : 'triangle';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(bell ? 0.05 : 0.07, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (bell ? 4 : 1.8));
    o.connect(g);
    g.connect(this.music);
    g.connect(this.verbIn);
    o.start(t);
    o.stop(t + 4.2);
    if (bell) {
      const o2 = ctx.createOscillator();
      o2.frequency.value = freq * 2.76;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.02, t);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
      o2.connect(g2).connect(this.verbIn);
      o2.start(t);
      o2.stop(t + 2.6);
    }
  }

  private drum(t: number, v: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35 * v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(this.drums);
    g.connect(this.verbIn);
    o.start(t);
    o.stop(t + 0.55);
  }

  // ----- SFX -----
  private noiseHit(t: number, dur: number, type: BiquadFilterType, freq: number, gain: number, freqEnd?: number, q = 1) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfx);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
    return g;
  }

  private tone(t: number, type: OscillatorType, f0: number, f1: number, dur: number, gain: number, toVerb = false) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfx);
    if (toVerb) g.connect(this.verbIn);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private whoosh(w: number) {
    const t = this.ctx!.currentTime;
    const base = w === 3 ? 380 : w === 2 ? 650 : 1000;
    this.noiseHit(t, 0.14 + w * 0.04, 'bandpass', base, 0.22 + w * 0.05, base * 2.6, 1.4);
  }

  private impact(w: number) {
    const t = this.ctx!.currentTime;
    this.tone(t, 'sine', 120 + w * 10, 40, 0.15 + w * 0.06, 0.35 + w * 0.12);
    this.noiseHit(t, 0.06 + w * 0.02, 'lowpass', 2200, 0.35 + w * 0.08);
    this.noiseHit(t, 0.09, 'bandpass', 900, 0.25, 500, 2);
  }

  private clank(w: number) {
    const t = this.ctx!.currentTime;
    for (const f of [1800, 2650, 3900]) this.tone(t, 'triangle', f, f * 0.98, 0.12 + w * 0.03, 0.06, true);
    this.noiseHit(t, 0.05, 'highpass', 2500, 0.25);
    this.tone(t, 'sine', 90, 60, 0.1, 0.2);
  }

  private counter() {
    const t = this.ctx!.currentTime;
    this.tone(t, 'sine', 70, 28, 0.7, 0.7);
    this.tone(t, 'sine', 1200, 1190, 1.3, 0.06, true);
    this.tone(t, 'sine', 1810, 1800, 1.0, 0.04, true);
    this.impact(3);
  }

  private bell(freq: number, gain = 0.18) {
    const t = this.ctx!.currentTime;
    for (const [m, g] of [[1, 1], [2.01, 0.5], [2.76, 0.35], [5.4, 0.12]]) this.tone(t, 'sine', freq * m, freq * m, 3.2, gain * g, true);
  }

  private swell() {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(200, t);
    f.frequency.exponentialRampToValueAtTime(3000, t + 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    src.connect(f).connect(g).connect(this.verbIn);
    src.start(t);
    src.stop(t + 1.2);
  }

  onEvents(s: GameState) {
    if (!this.ctx || this.muted) return;
    for (const e of s.events) this.play(e);
    this.tension = s.phase === 'fight' && s.mode !== 'training' && s.f.some((f) => f.hp < f.maxHp * 0.3);
  }

  private play(e: SimEvent) {
    const w = e.weight ?? 2;
    switch (e.type) {
      case 'swing': this.whoosh(w); break;
      case 'hit':
        if (e.kind === 'ch' || e.kind === 'crit') this.counter();
        else this.impact(e.kind === 'throw' ? 3 : w);
        break;
      case 'armor': this.clank(3); break;
      case 'wall': this.impact(3); this.noiseHit(this.ctx!.currentTime, 0.25, 'lowpass', 300, 0.4); break;
      case 'proj': this.whoosh(1); break;
      case 'clash': this.clank(2); break;
      case 'smoke': this.noiseHit(this.ctx!.currentTime, 0.6, 'lowpass', 900, 0.25, 200); break;
      case 'reveal': this.noiseHit(this.ctx!.currentTime, 0.2, 'bandpass', 1200, 0.12); break;
      case 'block': this.clank(w); break;
      case 'throw': this.noiseHit(this.ctx!.currentTime, 0.12, 'lowpass', 700, 0.3); break;
      case 'throwExec': this.whoosh(3); break;
      case 'throwBreak':
        this.noiseHit(this.ctx!.currentTime, 0.05, 'highpass', 3000, 0.35);
        this.tone(this.ctx!.currentTime, 'sine', 2200, 1800, 0.12, 0.12, true);
        break;
      case 'kd': this.tone(this.ctx!.currentTime, 'sine', 80, 40, 0.25, 0.4); this.noiseHit(this.ctx!.currentTime, 0.15, 'lowpass', 500, 0.3); break;
      case 'land': this.noiseHit(this.ctx!.currentTime, 0.08, 'lowpass', 400, 0.15); break;
      case 'round': this.bell(220); break;
      case 'fight': this.bell(330, 0.14); this.drum(this.ctx!.currentTime, 1); break;
      case 'ko': this.counter(); this.swell(); break;
      case 'timeup': this.bell(196); break;
      case 'matchEnd': this.bell(146.83, 0.22); break;
    }
  }
}
