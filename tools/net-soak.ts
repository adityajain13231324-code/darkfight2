// Real-time soak test: two clients through the actual relay server over WebSocket,
// 60 Hz ticks, optional extra one-way delay/jitter. Usage:
//   node server/relay.mjs &  then  npx vite-node tools/net-soak.ts -- 60 50 15
import WebSocket from 'ws';
import { RollbackSession, type NetMsg } from '../src/net/rollback';

const args = process.argv.slice(2).filter((a) => a !== '--').map(Number);
const SECONDS = args[0] || 30;
const DELAY = args[1] ?? 40; // extra one-way delay, ms
const JITTER = args[2] ?? 10;
const URL = process.env.RELAY || 'ws://localhost:8787';

function client(): Promise<WebSocket> {
  return new Promise((res, rej) => { const ws = new WebSocket(URL); ws.on('open', () => res(ws)); ws.on('error', rej); });
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const a = await client();
  const b = await client();
  const once = (ws: WebSocket, t: string) => new Promise<Record<string, unknown>>((r) => { const h = (d: WebSocket.RawData) => { const m = JSON.parse(d.toString()); if (m.t === t) { ws.off('message', h); r(m); } }; ws.on('message', h); });
  a.send(JSON.stringify({ t: 'create' }));
  const created = await once(a, 'created');
  b.send(JSON.stringify({ t: 'join', code: created.code }));
  await once(b, 'joined');
  const opts = { mode: 'online' as const, fighters: ['corvin', 'lynx'] as [string, string], roundsToWin: 3 };
  const lag = (fn: () => void) => setTimeout(fn, DELAY + Math.random() * JITTER);
  // Ordered delivery with delay: queue per direction.
  const mkSend = (ws: WebSocket) => { let last = 0; return (m: NetMsg) => { const at = Math.max(last, Date.now() + DELAY + Math.random() * JITTER); last = at; setTimeout(() => ws.send(JSON.stringify(m)), at - Date.now()); }; };
  void lag;
  const sa = new RollbackSession(0, opts, mkSend(a));
  const sb = new RollbackSession(1, opts, mkSend(b));
  a.on('message', (d) => { const m = JSON.parse(d.toString()); if (['in', 'hash', 'ping', 'pong'].includes(m.t)) sa.receive(m); });
  b.on('message', (d) => { const m = JSON.parse(d.toString()); if (['in', 'hash', 'ping', 'pong'].includes(m.t)) sb.receive(m); });
  let ia = 0, ib = 0;
  const start = Date.now();
  let ticks = 0;
  while (Date.now() - start < SECONDS * 1000) {
    const due = Math.floor((Date.now() - start) / (1000 / 60));
    while (ticks < due) {
      if (Math.random() < 0.12) ia = Math.floor(Math.random() * 512);
      if (Math.random() < 0.12) ib = Math.floor(Math.random() * 512);
      sa.tick(ia); sb.tick(ib); ticks++;
      if (ticks % 60 === 0) { sa.ping(); sb.ping(); }
    }
    await wait(4);
  }
  await wait(DELAY * 3 + 300);
  for (let i = 0; i < 60; i++) { sa.tick(0); sb.tick(0); await wait(17); }
  const la = sa.confirmedInputs();
  const lb = sb.confirmedInputs();
  const n = Math.min(la.length, lb.length);
  let same = true;
  for (let i = 0; i < n; i++) if (la[i][0] !== lb[i][0] || la[i][1] !== lb[i][1]) { same = false; break; }
  const result = {
    seconds: SECONDS, extraDelayMs: DELAY, jitterMs: JITTER, ticks,
    a: sa.stats, b: sb.stats, confirmedFrames: n, inputLogsMatch: same,
    roundState: { round: sa.state.round, wins: sa.state.wins, phase: sa.state.phase },
  };
  console.log(JSON.stringify(result, null, 2));
  a.close(); b.close();
  process.exit(same && sa.stats.desync < 0 && sb.stats.desync < 0 ? 0 : 1);
}
void main();
