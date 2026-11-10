// Room client: create/join by code, exchange build/ruleset/picks, start matches, relay rollback traffic.
import baked from '../content/baked.json';
import { ROSTER } from '../content/roster';
import type { NetMsg } from './rollback';

export const PROTOCOL = 1;
/** Build fingerprint: protocol + all combat data. Peers with different data cannot play. */
export const BUILD_HASH = (() => {
  const src = JSON.stringify({ p: PROTOCOL, baked, moves: Object.values(ROSTER).map((f) => [f.id, f.maxHp, f.walkF, f.walkB, f.dashV, f.list.map((m) => [m.id, m.startup, m.active, m.recovery, m.damage, m.onBlock, m.onHit])]) });
  let h = 0x811c9dc5;
  for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
})();

export function relayUrl(): string {
  const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_RELAY_URL;
  const q = new URLSearchParams(location.search).get('relay');
  if (q) return q;
  if (env) return env;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.hostname || 'localhost'}:8787`;
}

export type LobbyMsg =
  | { t: 'created'; code: string; seat: 0 }
  | { t: 'joined'; code: string; seat: 1 }
  | { t: 'peerJoined' } | { t: 'peerLeft' } | { t: 'error'; reason: string }
  | { t: 'hello'; build: string; protocol: number }
  | { t: 'pick'; fighter: string; ready: boolean }
  | { t: 'start'; fighters: [string, string]; rounds: number; id: number }
  | { t: 'rematch' } | { t: 'leave' }
  | NetMsg;

export class RoomClient {
  ws: WebSocket | null = null;
  seat: 0 | 1 = 0;
  code = '';
  onMessage: (m: LobbyMsg) => void = () => {};
  onClose: (reason: string) => void = () => {};

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(relayUrl());
      this.ws = ws;
      const timer = setTimeout(() => { ws.close(); reject(new Error('Could not reach the relay server')); }, 6000);
      ws.onopen = () => { clearTimeout(timer); resolve(); };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('Could not reach the relay server at ' + relayUrl())); };
      ws.onclose = () => this.onClose('Connection to the relay closed');
      ws.onmessage = (ev) => {
        let m: LobbyMsg;
        try { m = JSON.parse(ev.data); } catch { return; }
        if (m.t === 'created' || m.t === 'joined') { this.seat = m.seat; this.code = m.code; }
        this.onMessage(m);
      };
    });
  }

  send(m: LobbyMsg): void { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(m)); }
  create(): void { this.send({ t: 'create' } as unknown as LobbyMsg); }
  join(code: string): void { this.send({ t: 'join', code } as unknown as LobbyMsg); }
  close(): void { this.onClose = () => {}; this.ws?.close(); this.ws = null; }
}
