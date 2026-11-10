import { AudioEngine } from './audio/audio';
import { Bot, DIFFICULTIES, DUMMY_LABELS, type Difficulty, type DummyMode } from './ai/bot';
import { FIGHTER_IDS, ROSTER } from './content/roster';
import { BUILD_HASH, RoomClient, type LobbyMsg } from './net/client';
import { RollbackSession, type NetMsg } from './net/rollback';
import { Renderer } from './render/renderer';
import { createState, resetPositions, step } from './sim/sim';
import type { GameState, MatchOpts, SimEvent } from './sim/types';
import { installKeyboard, installTouch, readLocalVersus, readSolo } from './ui/controls';
import { Hud } from './ui/hud';
import { startInspector } from './ui/inspector';

const STEP_MS = 1000 / 60;
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
type Mode = 'local' | 'bot' | 'training' | 'online';
type Screen = 'menu' | 'select' | 'online' | 'game' | 'pause' | 'end';

const renderer = new Renderer();
const audio = new AudioEngine();
const hud = new Hud();
let state: GameState = createState({ mode: 'versus', fighters: ['corvin', 'lynx'], roundsToWin: 2 });
let screen: Screen = 'menu';
let mode: Mode = 'local';
let acc = 0;
let picks: [string, string] = ['corvin', 'lynx'];
let locked = [false, false];
let rounds = 2;
let botLevel: Difficulty = 'normal';
let bot = new Bot(1, botLevel, 7);
let dummyMode: DummyMode = 'guard';
let breakThrows = false;
let showBoxes = false;
let showFrames = true;
let slowmo = false;
let frozen = false;
let stepOnce = false;
let controlsReturn: Screen = 'menu';
const attract = [new Bot(0, 'hard', 3), new Bot(1, 'hard', 9)];

// Online
let room: RoomClient | null = null;
let session: RollbackSession | null = null;
let onlinePick = 'corvin';
let peerPick = '';
let peerReady = false;
let meReady = false;
let peerOk = false;
let matchId = 0;
let wantRematch = [false, false];
let hiddenSince = 0;
let pingTimer = 0;

const show = (id: string, on: boolean) => $(id).classList.toggle('hidden', !on);

function setScreen(s: Screen) {
  screen = s;
  for (const id of ['menu', 'select', 'online', 'pause', 'end']) show('#' + id, s === id);
  show('#controls', false);
  show('#hud', s === 'game' || s === 'pause' || s === 'end');
  const training = mode === 'training' && (s === 'game' || s === 'pause');
  show('#trainingPanel', training);
  show('#frames', training && showFrames);
  if (s === 'menu' || s === 'select') show('#movelist', false);
}

// ---------- matches ----------
function matchOpts(): MatchOpts {
  return { mode: mode === 'training' ? 'training' : mode === 'online' ? 'online' : 'versus', fighters: picks, roundsToWin: mode === 'training' ? 1 : rounds };
}

function startMatch() {
  audio.start();
  renderer.setArena(arenaForMatch());
  session = null;
  state = createState(matchOpts());
  bot = new Bot(1, botLevel, (Date.now() & 0xffff) || 7);
  if (mode === 'training') applyTraining();
  hud.reset(state);
  hud.setNet('');
  renderer.snapshot(state);
  acc = 0;
  $('#movelist').innerHTML = hud.moveListHtml(picks[0]);
  setScreen('game');
}

function applyTraining() {
  state.infiniteHp = ($('#infHp') as HTMLInputElement).checked;
  state.refillMeter = ($('#refill') as HTMLInputElement).checked;
}

function gatherInputs(): [number, number] {
  if (screen === 'menu' || screen === 'select' || screen === 'online') return [attract[0].input(state), attract[1].input(state)];
  if (mode === 'local') return readLocalVersus();
  const me = readSolo();
  if (mode === 'training') return [me, bot.dummy(state, dummyMode, breakThrows)];
  return [me, bot.input(state)];
}

function present(events: SimEvent[]) {
  const fake = { ...state, events };
  renderer.onEvents(fake as GameState);
  if (screen !== 'menu' && screen !== 'select' && screen !== 'online') { audio.onEvents(fake as GameState); hud.afterStep(state, events); }
}

function tick(dtMs: number) {
  const dt = Math.min(dtMs, 100) / 1000;
  const running = screen === 'game' || screen === 'menu' || screen === 'select' || screen === 'online' || (screen === 'pause' && mode === 'online') || (screen === 'end' && mode === 'online');
  if (running && !(frozen && !stepOnce && mode === 'training')) {
    const scale = renderer.vfx.timeScale() * (slowmo && mode === 'training' ? 0.25 : 1);
    acc += Math.min(dtMs, 100) * scale;
    if (frozen && stepOnce) { acc = STEP_MS; stepOnce = false; }
    let steps = 0;
    while (acc >= STEP_MS && steps < 5) {
      renderer.snapshot(state);
      if (session) {
        const evs = session.tick(screen === 'game' ? readSolo() : 0);
        state = session.state;
        present(evs);
      } else {
        step(state, gatherInputs());
        present(state.events);
      }
      acc -= STEP_MS;
      steps++;
      if (state.phase === 'end' && screen === 'game' && state.phaseT > 110) { showEnd(); break; }
      if ((screen === 'menu' || screen === 'select' || screen === 'online') && state.phase === 'end') state = createState({ mode: 'versus', fighters: [FIGHTER_IDS[Math.floor(Math.random() * 2)], FIGHTER_IDS[Math.floor(Math.random() * 2)]], roundsToWin: 2 });
    }
  }
  if (session && screen !== 'menu') {
    const st = session.stats;
    hud.setNet(`ping ${st.rtt} ms · rollback ${st.maxRollback}f max · ${st.frame - st.confirmed > 3 ? 'waiting for opponent…' : 'synced'}${st.desync >= 0 ? ' · DESYNC at ' + st.desync : ''}`);
    if (performance.now() - pingTimer > 1000) { pingTimer = performance.now(); session.ping(); }
  }
  renderer.render(state, Math.min(1, acc / STEP_MS), dt, { hitboxes: showBoxes && screen !== 'menu' });
  if (screen === 'game' || screen === 'pause' || screen === 'end') hud.render(state, showFrames && mode === 'training');
}

function showEnd(note = '') {
  const w0 = state.wins[0] >= state.roundsToWin;
  const w1 = state.wins[1] >= state.roundsToWin;
  const n0 = ROSTER[state.f[0].fid].name;
  const n1 = ROSTER[state.f[1].fid].name;
  $('#endText').textContent = note ? 'Match ended' : w0 && w1 ? 'Draw' : w0 ? `${n0} wins` : `${n1} wins`;
  $('#endSub').textContent = note || `${state.wins[0]} – ${state.wins[1]}`;
  wantRematch = [false, false];
  ($('#rematchBtn') as HTMLButtonElement).disabled = !!note;
  setScreen('end');
}

// ---------- select screen ----------
function cardHtml(fid: string): string {
  const d = ROSTER[fid].def;
  return `<button class="card" data-fid="${fid}"><h3>${d.name}</h3><div class="t">${d.title}</div><div class="w">${d.weaponName} · ${d.family}</div><div class="d">${d.style}</div><div class="st">Health ${d.maxHp} · Difficulty ${'◆'.repeat(d.difficulty)}${'◇'.repeat(3 - d.difficulty)}</div></button>`;
}

const portraits: Record<string, string[]> = {};
const ARENA_IDS = ['sunset', 'bamboo', 'ferry', 'random'];
const ARENA_NAMES: Record<string, string> = { sunset: 'Sunset Gate', bamboo: 'Bamboo Grove', ferry: 'Ashen Ferry', random: 'Random' };
let arenaIdx = 0;
const GRID_COLS = 4;

async function makePortraits() {
  for (const fid of FIGHTER_IDS) portraits[fid] = [await renderer.portrait(fid, 0x9fe3ff), await renderer.portrait(fid, 0xff8a5c)];
}

function openSelect(m: Mode) {
  mode = m;
  locked = [false, false];
  $('#selectTitle').textContent = m === 'local' ? 'Local Versus' : m === 'bot' ? 'Versus Bot' : 'Training';
  document.querySelector('.p2s .tk-who')!.textContent = m === 'local' ? 'Player 2' : m === 'bot' ? 'Bot' : 'Dummy';
  $('.tk-grid').innerHTML = FIGHTER_IDS.map((fid) => `<button class="tk-tile" data-fid="${fid}"><img src="${portraits[fid]?.[0] ?? ''}" alt="" /><span>${ROSTER[fid].name}</span></button>`).join('');
  show('#roundsOpt', m !== 'training');
  show('#levelOpt', m === 'bot');
  refreshCards();
  setScreen('select');
}

function refreshCards() {
  for (const t of document.querySelectorAll<HTMLElement>('.tk-tile')) {
    t.classList.toggle('c1', t.dataset.fid === picks[0]);
    t.classList.toggle('c2', t.dataset.fid === picks[1]);
    t.classList.toggle('l1', t.dataset.fid === picks[0] && locked[0]);
    t.classList.toggle('l2', t.dataset.fid === picks[1] && locked[1]);
  }
  for (const side of document.querySelectorAll<HTMLElement>('.tk-side')) {
    const p = Number(side.dataset.player);
    const d = ROSTER[picks[p]].def;
    (side.querySelector('.tk-port') as HTMLImageElement).src = portraits[picks[p]]?.[p] ?? '';
    side.classList.toggle('locked', locked[p]);
    side.querySelector('.tk-info')!.innerHTML = `<h2>${d.name}</h2><div class="t">${d.title}</div><div class="w">${d.weaponName} · ${d.family}</div><div class="d">${d.style}</div><div class="st">Health ${d.maxHp} · ${'◆'.repeat(d.difficulty)}${'◇'.repeat(3 - d.difficulty)}${d.kit ? ' · ' + ROSTER[d.kit].name + ' kit' : ''}</div>`;
  }
  $('#arenaName').textContent = ARENA_NAMES[ARENA_IDS[arenaIdx]];
}

function cyclePick(p: number, dir: number) {
  if (locked[p]) return;
  const i = FIGHTER_IDS.indexOf(picks[p]);
  picks[p] = FIGHTER_IDS[(i + dir + FIGHTER_IDS.length) % FIGHTER_IDS.length];
  refreshCards();
}

function lockPick(p: number) {
  locked[p] = true;
  refreshCards();
  if (mode !== 'local' || (locked[0] && locked[1])) setTimeout(() => { if (screen === 'select') startMatch(); }, 350);
}

function arenaForMatch(): string {
  const id = ARENA_IDS[arenaIdx];
  return id === 'random' ? ARENA_IDS[Math.floor(Math.random() * 3)] : id;
}

// ---------- online ----------
function onlineStatus(t: string) { $('#onlStatus').textContent = t; }

async function onlineConnect(): Promise<RoomClient | null> {
  room?.close();
  const r = new RoomClient();
  r.onMessage = onRoomMessage;
  r.onClose = (why) => {
    if (screen === 'game' || screen === 'pause') { session = null; showEnd('Connection lost: ' + why); }
    else onlineStatus(why);
  };
  try { await r.connect(); } catch (e) { onlineStatus((e as Error).message + '. Start it with: npm run server'); return null; }
  room = r;
  return r;
}

function renderOnlinePick() {
  show('#onlPick', true);
  const cards = $('#onlPick .cards');
  cards.innerHTML = FIGHTER_IDS.map(cardHtml).join('');
  for (const c of cards.querySelectorAll<HTMLElement>('.card')) c.classList.toggle('sel', c.dataset.fid === onlinePick);
  $('#onlPeer').textContent = !peerOk ? 'Checking versions…' : peerPick ? `Opponent: ${ROSTER[peerPick]?.name ?? '?'}${peerReady ? ' · ready' : ''}` : 'Opponent is choosing…';
  ($('#readyBtn') as HTMLButtonElement).textContent = meReady ? 'Waiting…' : 'Ready';
}

function sendPick() { room?.send({ t: 'pick', fighter: onlinePick, ready: meReady }); }

function maybeHostStart() {
  if (!room || room.seat !== 0 || !meReady || !peerReady || !peerOk) return;
  matchId++;
  const msg: LobbyMsg = { t: 'start', fighters: [onlinePick, peerPick], rounds: 2, id: matchId };
  room.send(msg);
  beginOnline(msg.fighters, 2);
}

function beginOnline(fighters: [string, string], r: number) {
  audio.start();
  renderer.setArena('sunset');
  mode = 'online';
  picks = fighters;
  rounds = r;
  meReady = false; peerReady = false;
  session = new RollbackSession(room!.seat, { mode: 'online', fighters, roundsToWin: r }, (m: NetMsg) => room?.send(m as LobbyMsg), 2);
  state = session.state;
  hud.reset(state);
  renderer.snapshot(state);
  acc = 0;
  $('#movelist').innerHTML = hud.moveListHtml(fighters[room!.seat]);
  setScreen('game');
}

function onRoomMessage(m: LobbyMsg) {
  switch (m.t) {
    case 'created': {
      const link = `${location.origin}${location.pathname}?room=${m.code}`;
      onlineStatus(`Room ${m.code} created. Waiting for an opponent…`);
      $('#onlLink').innerHTML = `${link} <button id="copyLink">Copy</button>`;
      show('#onlLink', true);
      $('#copyLink').onclick = () => navigator.clipboard?.writeText(link);
      break;
    }
    case 'joined':
      onlineStatus(`Joined room ${m.code}.`);
      room?.send({ t: 'hello', build: BUILD_HASH, protocol: 1 });
      renderOnlinePick();
      break;
    case 'peerJoined':
      onlineStatus('Opponent joined.');
      room?.send({ t: 'hello', build: BUILD_HASH, protocol: 1 });
      renderOnlinePick();
      break;
    case 'hello':
      if (m.build !== BUILD_HASH) { onlineStatus('Version mismatch: both players must reload the same build.'); peerOk = false; }
      else { peerOk = true; sendPick(); }
      renderOnlinePick();
      break;
    case 'pick':
      peerPick = m.fighter; peerReady = m.ready;
      renderOnlinePick();
      maybeHostStart();
      break;
    case 'start':
      beginOnline(m.fighters, m.rounds);
      break;
    case 'rematch':
      wantRematch[1] = true;
      $('#endSub').textContent = 'Opponent wants a rematch';
      if (wantRematch[0] && room?.seat === 0) { matchId++; const msg: LobbyMsg = { t: 'start', fighters: picks, rounds, id: matchId }; room.send(msg); beginOnline(picks, rounds); }
      break;
    case 'peerLeft':
    case 'leave':
      if (screen === 'game' || screen === 'pause' || screen === 'end') { session = null; showEnd('Opponent disconnected'); }
      else { onlineStatus('Opponent left the room.'); peerPick = ''; peerReady = false; peerOk = false; show('#onlPick', false); }
      break;
    case 'error':
      onlineStatus(m.reason);
      break;
    case 'in': case 'hash': case 'ping': case 'pong':
      session?.receive(m);
      break;
  }
}

function leaveOnline() {
  room?.send({ t: 'leave' });
  room?.close();
  room = null; session = null; peerOk = false; peerPick = ''; peerReady = false; meReady = false;
}

// ---------- actions ----------
function onAction(action: string) {
  switch (action) {
    case 'local': openSelect('local'); break;
    case 'bot': openSelect('bot'); break;
    case 'training': openSelect('training'); break;
    case 'online':
      mode = 'online'; show('#onlPick', false); show('#onlLink', false);
      onlineStatus('Create a room and send the link, or enter a code.'); setScreen('online'); break;
    case 'create': void onlineConnect().then((r) => r?.create()); break;
    case 'join': {
      const code = ($('#joinCode') as HTMLInputElement).value.trim().toUpperCase();
      if (code.length < 4) { onlineStatus('Enter the room code.'); break; }
      void onlineConnect().then((r) => r?.join(code));
      break;
    }
    case 'ready': meReady = !meReady; sendPick(); renderOnlinePick(); maybeHostStart(); break;
    case 'leave': leaveOnline(); toMenu(); break;
    case 'fight': startMatch(); break;
    case 'controls': controlsReturn = screen; for (const id of ['#menu', '#pause', '#select']) show(id, false); show('#controls', true); break;
    case 'back': show('#controls', false); show('#' + controlsReturn, true); break;
    case 'resume': setScreen('game'); break;
    case 'menu': if (mode === 'online') leaveOnline(); toMenu(); break;
    case 'rematch':
      if (mode === 'online') {
        wantRematch[0] = true; room?.send({ t: 'rematch' });
        $('#endSub').textContent = 'Waiting for opponent…';
        if (wantRematch[1] && room?.seat === 0) { matchId++; const msg: LobbyMsg = { t: 'start', fighters: picks, rounds, id: matchId }; room.send(msg); beginOnline(picks, rounds); }
      } else startMatch();
      break;
    case 'change': if (mode === 'online') { setScreen('online'); renderOnlinePick(); } else openSelect(mode); break;
  }
}

function toMenu() {
  session = null;
  state = createState({ mode: 'versus', fighters: ['corvin', 'lynx'], roundsToWin: 2 });
  setScreen('menu');
}

function wireUi() {
  document.body.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const tile = t.closest<HTMLElement>('.tk-tile');
    if (tile) { const p = (e as MouseEvent).shiftKey ? 1 : 0; picks[p] = tile.dataset.fid!; locked[p] = false; refreshCards(); return; }
    const arrow = t.closest<HTMLElement>('[data-arena]');
    if (arrow) { arenaIdx = (arenaIdx + Number(arrow.dataset.arena) + ARENA_IDS.length) % ARENA_IDS.length; refreshCards(); return; }
    const card = t.closest<HTMLElement>('.card');
    if (card) {
      if (card.closest('#onlPick')) { onlinePick = card.dataset.fid!; meReady = false; sendPick(); renderOnlinePick(); }
      return;
    }
    const b = t.closest<HTMLElement>('button[data-action]');
    if (b) { audio.start(); onAction(b.dataset.action!); }
    const r = t.closest<HTMLElement>('button[data-reset]');
    if (r) { resetPositions(state, r.dataset.reset as 'center'); applyTraining(); r.blur(); }
  });
  const fill = (sel: string, opts: [string, string][], val: string, on: (v: string) => void) => {
    const el = $(sel) as HTMLSelectElement;
    el.innerHTML = opts.map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    el.value = val;
    el.addEventListener('change', () => { on(el.value); el.blur(); });
  };
  const levels = DIFFICULTIES.map((d) => [d, d[0].toUpperCase() + d.slice(1)] as [string, string]);
  fill('#dummyMode', Object.entries(DUMMY_LABELS), dummyMode, (v) => { dummyMode = v as DummyMode; });
  fill('#botLevel', levels, botLevel, (v) => { botLevel = v as Difficulty; bot = new Bot(1, botLevel, 11); });
  fill('#selBotLevel', levels, botLevel, (v) => { botLevel = v as Difficulty; ($('#botLevel') as HTMLSelectElement).value = v; });
  ($('#rounds') as HTMLSelectElement).addEventListener('change', (e) => { rounds = Number((e.target as HTMLSelectElement).value); });
  const chk = (id: string, on: (v: boolean) => void) => { const el = $(id) as HTMLInputElement; el.addEventListener('change', () => { on(el.checked); el.blur(); }); return el; };
  chk('#breakThrows', (v) => { breakThrows = v; });
  chk('#infHp', () => applyTraining());
  chk('#refill', () => applyTraining());
  const boxes = chk('#showBoxes', (v) => { showBoxes = v; });
  const frames = chk('#showFrames', (v) => { showFrames = v; show('#frames', v && mode === 'training'); });
  const slow = chk('#slowmo', (v) => { slowmo = v; });

  installKeyboard((code) => {
    if (screen === 'select') {
      if (code === 'KeyA') cyclePick(0, -1);
      if (code === 'KeyD') cyclePick(0, 1);
      if (code === 'KeyW') cyclePick(0, -GRID_COLS);
      if (code === 'KeyS') cyclePick(0, GRID_COLS);
      if (code === 'ArrowUp') cyclePick(1, -GRID_COLS);
      if (code === 'ArrowDown') cyclePick(1, GRID_COLS);
      if (code === 'KeyJ') lockPick(0);
      if (mode === 'local') {
        if (code === 'ArrowLeft') cyclePick(1, -1);
        if (code === 'ArrowRight') cyclePick(1, 1);
        if (code === 'Numpad1' || code === 'Period') lockPick(1);
      } else {
        if (code === 'ArrowLeft') cyclePick(1, -1);
        if (code === 'ArrowRight') cyclePick(1, 1);
      }
      if (code === 'Enter') startMatch();
      if (code === 'Escape') toMenu();
      return;
    }
    if (code === 'Escape') {
      if (screen === 'game') setScreen('pause');
      else if (screen === 'pause') setScreen('game');
    }
    if (code === 'KeyH' && (screen === 'game' || screen === 'pause')) $('#movelist').classList.toggle('hidden');
    if (code === 'KeyM' && screen !== 'online') audio.setMuted(!audio.muted);
    if (mode === 'training' && screen === 'game') {
      if (code === 'KeyR' || code === 'Backspace') { resetPositions(state); applyTraining(); }
      if (code === 'F1') { showFrames = !showFrames; frames.checked = showFrames; show('#frames', showFrames); }
      if (code === 'F2') { showBoxes = !showBoxes; boxes.checked = showBoxes; }
      if (code === 'F3') { slowmo = !slowmo; slow.checked = slowmo; }
      if (code === 'F4') frozen = !frozen;
      if (code === 'F5') { frozen = true; stepOnce = true; }
    }
  });
  window.addEventListener('keydown', (e) => { if (/^F[1-5]$/.test(e.code)) e.preventDefault(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenSince = performance.now();
      if (screen === 'game' && mode !== 'online') setScreen('pause');
    } else if (mode === 'online' && session && performance.now() - hiddenSince > 10000) {
      // Declared policy: a tab hidden for more than 10 s during an online match forfeits the connection.
      leaveOnline(); showEnd('You left the tab for too long');
    }
  });
  installTouch($('#touch'));
}

async function boot() {
  await renderer.init($('#game'));
  if (new URLSearchParams(location.search).has('anim')) {
    renderer.showAllShapes = true;
    renderer.setArena('sunset');
    startInspector(renderer);
    return;
  }
  await makePortraits();
  wireUi();
  setScreen('menu');
  renderer.app.ticker.add((t) => tick(t.deltaMS));
  const code = new URLSearchParams(location.search).get('room');
  if (code) { onAction('online'); ($('#joinCode') as HTMLInputElement).value = code; onAction('join'); }
  (window as unknown as { umbra: unknown }).umbra = {
    get state() { return state; }, get screen() { return screen; }, get mode() { return mode; }, get session() { return session; }, get room() { return room; },
    frames(n: number) { for (let i = 0; i < n; i++) tick(1000 / 60); renderer.app.render(); },
    onAction, cyclePick, lockPick,
    /** Test/debug: choose both fighters directly. */
    setPicks(a: string, b: string) { picks = [a, b]; refreshCards(); },
    get renderer() { return renderer; },
  };
}

void boot();
