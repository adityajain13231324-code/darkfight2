import { AudioEngine } from './audio/audio';
import { DUMMY_LABELS, dummyGuards, dummyInput, type DummyMode } from './ai/dummy';
import { Renderer } from './render/renderer';
import { createState, resetPositions, step } from './sim/sim';
import type { GameState } from './sim/types';
import { installKeyboard, readInputs } from './ui/controls';
import { Hud } from './ui/hud';

const STEP_MS = 1000 / 60;
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;

type Screen = 'menu' | 'game' | 'pause' | 'end';

const renderer = new Renderer();
const audio = new AudioEngine();
const hud = new Hud();

let state: GameState = createState('training', ['corvin', 'corvin']);
let screen: Screen = 'menu';
let controlsReturn: Screen = 'menu';
let acc = 0;
let dummyMode: DummyMode = 'spar';
let breakThrows = false;
let showBoxes = false;
let showFrames = true;

function show(id: string, on: boolean) { $(id).classList.toggle('hidden', !on); }

function setScreen(s: Screen) {
  screen = s;
  show('#menu', s === 'menu');
  show('#pause', s === 'pause');
  show('#end', s === 'end');
  show('#controls', false);
  show('#hud', s !== 'menu');
  const training = state.mode === 'training' && s !== 'menu';
  show('#trainingPanel', training);
  show('#frames', training && showFrames);
  if (s === 'menu') show('#movelist', false);
}

function startMatch(mode: 'versus' | 'training') {
  audio.start();
  state = createState(mode, ['corvin', 'corvin']);
  if (mode === 'training') applyTraining();
  hud.reset();
  renderer.snapshot(state);
  acc = 0;
  setScreen('game');
}

function applyTraining() {
  state.f[1].guard = dummyGuards(dummyMode);
  state.infiniteHp = ($('#infHp') as HTMLInputElement).checked;
}

// Attract mode behind the menu: the sparring bot fights itself.
function menuInputs(): [number, number] {
  return [dummyInput(state, 0, 'spar', true), dummyInput(state, 1, 'spar', true)];
}

function gatherInputs(): [number, number] {
  if (screen === 'menu') return menuInputs();
  const [p1, p2] = readInputs();
  if (state.mode === 'training') return [p1, dummyInput(state, 1, dummyMode, breakThrows)];
  return [p1, p2];
}

function tick(dtMs: number) {
  const dt = Math.min(dtMs, 100) / 1000;
  if (screen === 'game' || screen === 'menu') {
    acc += Math.min(dtMs, 100) * renderer.vfx.timeScale();
    let steps = 0;
    while (acc >= STEP_MS && steps < 5) {
      renderer.snapshot(state);
      step(state, gatherInputs());
      renderer.onEvents(state);
      if (screen === 'game') { audio.onEvents(state); hud.afterStep(state); }
      acc -= STEP_MS;
      steps++;
      if (state.phase === 'end' && screen === 'game' && state.phaseT > 120) { showEnd(); break; }
      if (screen === 'menu' && state.phase === 'end') { state = createState('versus', ['corvin', 'corvin']); }
    }
    if (screen === 'menu' && state.mode !== 'versus') { state = createState('versus', ['corvin', 'corvin']); }
  }
  renderer.render(state, Math.min(1, acc / STEP_MS), dt, { hitboxes: showBoxes && screen !== 'menu' });
  if (screen !== 'menu') hud.render(state, showFrames && state.mode === 'training');
}

function showEnd() {
  const w0 = state.wins[0] >= 2;
  const w1 = state.wins[1] >= 2;
  $('#endText').textContent = w0 && w1 ? 'Draw' : w0 ? 'Player 1 wins' : 'Player 2 wins';
  setScreen('end');
}

function onAction(action: string, from: Screen) {
  switch (action) {
    case 'versus': startMatch('versus'); break;
    case 'training': startMatch('training'); break;
    case 'controls': controlsReturn = from; show('#menu', false); show('#pause', false); show('#controls', true); break;
    case 'back': show('#controls', false); if (controlsReturn === 'menu') show('#menu', true); else show('#pause', true); break;
    case 'resume': setScreen('game'); break;
    case 'menu': state = createState('versus', ['corvin', 'corvin']); hud.reset(); setScreen('menu'); break;
    case 'rematch': startMatch(state.mode); break;
  }
}

function wireUi() {
  for (const id of ['#menu', '#pause', '#end', '#controls']) {
    $(id).addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button');
      if (b?.dataset.action) onAction(b.dataset.action, screen);
    });
  }
  const sel = $('#dummyMode') as HTMLSelectElement;
  sel.innerHTML = Object.entries(DUMMY_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  sel.value = dummyMode;
  sel.addEventListener('change', () => { dummyMode = sel.value as DummyMode; applyTraining(); sel.blur(); });
  const bt = $('#breakThrows') as HTMLInputElement;
  bt.addEventListener('change', () => { breakThrows = bt.checked; bt.blur(); });
  const inf = $('#infHp') as HTMLInputElement;
  inf.addEventListener('change', () => { applyTraining(); inf.blur(); });
  const boxes = $('#showBoxes') as HTMLInputElement;
  boxes.addEventListener('change', () => { showBoxes = boxes.checked; boxes.blur(); });
  const frames = $('#showFrames') as HTMLInputElement;
  frames.addEventListener('change', () => { showFrames = frames.checked; show('#frames', showFrames); frames.blur(); });
  $('#resetPos').addEventListener('click', (e) => { resetPositions(state); applyTraining(); (e.currentTarget as HTMLElement).blur(); });
  $('#movelist').innerHTML = hud.moveListHtml('corvin');

  installKeyboard((code) => {
    if (code === 'Escape') {
      if (screen === 'game') setScreen('pause');
      else if (screen === 'pause') setScreen('game');
    }
    if (code === 'KeyH' && screen !== 'menu') $('#movelist').classList.toggle('hidden');
    if (code === 'KeyM') audio.setMuted(!audio.muted);
    if (state.mode === 'training' && screen === 'game') {
      if (code === 'KeyR' || code === 'Backspace') { resetPositions(state); applyTraining(); }
      if (code === 'F1') { showFrames = !showFrames; frames.checked = showFrames; show('#frames', showFrames); }
      if (code === 'F2') { showBoxes = !showBoxes; boxes.checked = showBoxes; }
    }
  });
  window.addEventListener('keydown', (e) => { if (e.code === 'F1' || e.code === 'F2') e.preventDefault(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && screen === 'game') setScreen('pause'); });
}

async function boot() {
  await renderer.init($('#game'));
  state = createState('versus', ['corvin', 'corvin']);
  wireUi();
  setScreen('menu');
  renderer.app.ticker.add((t) => tick(t.deltaMS));
  // debug handle for automated playtests
  (window as unknown as { umbra: unknown }).umbra = {
    get state() { return state; },
    get screen() { return screen; },
    /** Advance n display frames even when the tab is in the background. */
    frames(n: number) { for (let i = 0; i < n; i++) tick(1000 / 60); renderer.app.render(); },
  };
}

void boot();
