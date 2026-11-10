// UMBRA room relay: room codes, two seats, message forwarding, liveness. No game logic.
// Run: node server/relay.mjs   (PORT env, default 8787; CLIENT_ORIGIN optional allow-list)
import http from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 8787);
const ORIGINS = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
const ROOM_TTL_MS = 30 * 60 * 1000;
const MAX_MSG_PER_SEC = 240;
const rooms = new Map(); // code -> { seats: [ws|null, ws|null], touched }

const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, rooms: rooms.size })); return; }
  res.writeHead(404); res.end();
});
const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });

const code = () => Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };

wss.on('connection', (ws, req) => {
  if (ORIGINS.length && !ORIGINS.includes(req.headers.origin)) { ws.close(1008, 'origin'); return; }
  ws.room = null; ws.seat = -1; ws.count = 0; ws.windowStart = Date.now(); ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', (data) => {
    const now = Date.now();
    if (now - ws.windowStart > 1000) { ws.windowStart = now; ws.count = 0; }
    if (++ws.count > MAX_MSG_PER_SEC) return; // rate limit
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }
    if (!msg || typeof msg.t !== 'string') return;
    if (msg.t === 'create') {
      let c = code();
      while (rooms.has(c)) c = code();
      rooms.set(c, { seats: [ws, null], touched: now });
      ws.room = c; ws.seat = 0;
      send(ws, { t: 'created', code: c, seat: 0 });
      return;
    }
    if (msg.t === 'join') {
      const c = String(msg.code || '').toUpperCase();
      const room = rooms.get(c);
      if (!room) { send(ws, { t: 'error', reason: 'Room not found or expired' }); return; }
      if (room.seats[1] && room.seats[1] !== ws) { send(ws, { t: 'error', reason: 'Room is full' }); return; }
      room.seats[1] = ws; room.touched = now;
      ws.room = c; ws.seat = 1;
      send(ws, { t: 'joined', code: c, seat: 1 });
      send(room.seats[0], { t: 'peerJoined' });
      return;
    }
    // Everything else is relayed to the other seat.
    const room = ws.room && rooms.get(ws.room);
    if (!room) return;
    room.touched = now;
    send(room.seats[1 - ws.seat], msg);
  });
  ws.on('close', () => {
    const room = ws.room && rooms.get(ws.room);
    if (!room) return;
    room.seats[ws.seat] = null;
    send(room.seats[1 - ws.seat], { t: 'peerLeft' });
    if (!room.seats[0] && !room.seats[1]) rooms.delete(ws.room);
  });
});

setInterval(() => {
  for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
  const now = Date.now();
  for (const [c, r] of rooms) if (now - r.touched > ROOM_TTL_MS) rooms.delete(c);
}, 10000);

server.listen(PORT, () => console.log(`UMBRA relay on :${PORT}`));
