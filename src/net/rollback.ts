// GGPO-style rollback over any ordered message transport (WebSocket relay first).
// Only inputs travel during play; periodic state hashes detect desyncs.
import { cloneState, createState, hashState, step } from '../sim/sim';
import type { GameState, MatchOpts, SimEvent } from '../sim/types';

export const MAX_ROLLBACK = 8;
const HASH_EVERY = 30;

export type NetMsg =
  | { t: 'in'; cur: number; ack: number; inputs: [number, number][] }
  | { t: 'hash'; f: number; h: number }
  | { t: 'ping'; at: number }
  | { t: 'pong'; at: number };

export interface RollbackStats { frame: number; confirmed: number; rollbacks: number; maxRollback: number; stalls: number; rtt: number; desync: number; advantage: number }

export class RollbackSession {
  state: GameState;
  frame = 0; // next frame to simulate
  private local = new Map<number, number>();
  private remote = new Map<number, number>();
  private predicted = new Map<number, number>();
  private snaps = new Map<number, GameState>();
  private remoteContig = -1; // all remote inputs <= this are known
  private remoteAck = -1;    // remote has all our inputs <= this
  private rollbackFrom = Infinity;
  private localHashes = new Map<number, number>();
  private remoteHashes = new Map<number, number>();
  private played = new Set<string>();
  private remoteCur = 0;
  private skipCounter = 0;
  stats: RollbackStats = { frame: 0, confirmed: -1, rollbacks: 0, maxRollback: 0, stalls: 0, rtt: 0, desync: -1, advantage: 0 };

  constructor(public seat: 0 | 1, opts: MatchOpts, private send: (m: NetMsg) => void, public delay = 2) {
    this.state = createState(opts);
    for (let f = 0; f < delay; f++) { this.local.set(f, 0); this.remote.set(f, 0); }
    this.remoteContig = delay - 1;
  }

  receive(m: NetMsg): void {
    switch (m.t) {
      case 'in':
        this.remoteCur = m.cur;
        this.remoteAck = Math.max(this.remoteAck, m.ack);
        for (const [f, b] of m.inputs) {
          if (this.remote.has(f)) continue;
          this.remote.set(f, b);
          if (f < this.frame && this.predicted.get(f) !== b) this.rollbackFrom = Math.min(this.rollbackFrom, f);
        }
        while (this.remote.has(this.remoteContig + 1)) this.remoteContig++;
        break;
      case 'hash': {
        this.remoteHashes.set(m.f, m.h);
        this.checkHash(m.f);
        break;
      }
      case 'ping': this.send({ t: 'pong', at: m.at }); break;
      case 'pong': this.stats.rtt = Math.round(performance.now() - m.at); break;
    }
  }

  ping(): void { this.send({ t: 'ping', at: performance.now() }); }

  private checkHash(f: number) {
    const a = this.localHashes.get(f);
    const b = this.remoteHashes.get(f);
    if (a !== undefined && b !== undefined && a !== b && this.stats.desync < 0) this.stats.desync = f;
  }

  /** Advance one tick with this player's input. Returns new events to present (deduplicated). */
  tick(localBits: number): SimEvent[] {
    const out: SimEvent[] = [];
    // Keep the two clocks close: if we run ahead of the peer, wait a frame now and then.
    const estRemote = this.remoteCur + Math.round(this.stats.rtt / 2 / (1000 / 60));
    this.stats.advantage = this.frame - estRemote;
    if (this.stats.advantage > 2 && ++this.skipCounter % 3 === 0) { this.stats.stalls++; this.flush(); return out; }
    if (this.frame - this.remoteContig > MAX_ROLLBACK) { this.stats.stalls++; this.flush(); return out; } // too far ahead: wait
    this.local.set(this.frame + this.delay, localBits);
    if (this.rollbackFrom < this.frame) this.doRollback(out);
    this.simulate(this.frame, out);
    this.frame++;
    this.flush();
    this.prune();
    return out;
  }

  private flush(): void {
    const inputs: [number, number][] = [];
    for (let f = Math.max(this.remoteAck + 1, this.frame - 30); f <= this.frame + this.delay; f++) {
      const b = this.local.get(f);
      if (b !== undefined) inputs.push([f, b]);
    }
    this.send({ t: 'in', cur: this.frame, ack: this.remoteContig, inputs });
  }

  private doRollback(out: SimEvent[]): void {
    const from = this.rollbackFrom;
    this.rollbackFrom = Infinity;
    const snap = this.snaps.get(from);
    if (!snap) return; // should not happen within the window
    const depth = this.frame - from;
    this.stats.rollbacks++;
    this.stats.maxRollback = Math.max(this.stats.maxRollback, depth);
    this.state = cloneState(snap);
    for (let f = from; f < this.frame; f++) this.simulate(f, out);
  }

  private remoteFor(f: number): number {
    const known = this.remote.get(f);
    if (known !== undefined) return known;
    // Prediction: repeat the last confirmed remote input.
    return this.remote.get(this.remoteContig) ?? 0;
  }

  private simulate(f: number, out: SimEvent[]): void {
    this.snaps.set(f, cloneState(this.state));
    const mine = this.local.get(f) ?? 0;
    const theirs = this.remoteFor(f);
    this.predicted.set(f, theirs);
    step(this.state, this.seat === 0 ? [mine, theirs] : [theirs, mine]);
    for (const e of this.state.events) {
      const key = `${f}:${e.type}:${e.p}:${e.move ?? e.kind ?? ''}`;
      if (this.played.has(key)) continue;
      this.played.add(key);
      out.push(e);
    }
    // Hash confirmed frames (both inputs known at simulation time).
    if (f % HASH_EVERY === 0 && f <= this.remoteContig && this.remote.has(f)) {
      const h = hashState(this.state);
      this.localHashes.set(f, h);
      this.send({ t: 'hash', f, h });
      this.checkHash(f);
    }
    this.stats.frame = this.frame;
    this.stats.confirmed = this.remoteContig;
  }

  private prune(): void {
    const keep = Math.min(this.remoteContig, this.frame) - 2;
    for (const k of this.snaps.keys()) if (k < keep) this.snaps.delete(k);
    for (const k of this.predicted.keys()) if (k < keep) this.predicted.delete(k);
    if (this.played.size > 4000) this.played = new Set([...this.played].slice(-1500));
  }

  /** Confirmed input log for replays (frames where both inputs are known). */
  confirmedInputs(): [number, number][] {
    const out: [number, number][] = [];
    for (let f = 0; f <= Math.min(this.remoteContig, this.frame - 1); f++) {
      const m = this.local.get(f) ?? 0;
      const r = this.remote.get(f) ?? 0;
      out.push(this.seat === 0 ? [m, r] : [r, m]);
    }
    return out;
  }
}
