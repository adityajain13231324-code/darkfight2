// Keyboard, gamepad and touch -> absolute input bits. Devices are explicitly assigned per player.
import { A, DOWN, K, LEFT, M, R, RIGHT, S, UP } from '../sim/input';

type Map = Record<string, number>;
export const P1_KEYS: Map = {
  KeyW: UP, KeyS: DOWN, KeyA: LEFT, KeyD: RIGHT,
  KeyJ: A, KeyK: K, KeyL: R, KeyU: M, KeyI: S, KeyO: A | K,
};
export const P2_KEYS: Map = {
  ArrowUp: UP, ArrowDown: DOWN, ArrowLeft: LEFT, ArrowRight: RIGHT,
  Numpad1: A, Numpad2: K, Numpad3: R, Numpad4: M, Numpad5: S, Numpad0: A | K,
  Period: A, Slash: K, Quote: R, Semicolon: M, BracketRight: S, BracketLeft: A | K,
};

const held = new Set<string>();
const GAME_KEYS = new Set([...Object.keys(P1_KEYS), ...Object.keys(P2_KEYS), 'Space']);
let touchBits = 0;

export function installKeyboard(onKey: (code: string) => void): void {
  window.addEventListener('keydown', (e) => {
    const typing = (e.target as HTMLElement)?.tagName === 'INPUT';
    if (typing) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (!e.repeat) onKey(e.code);
    held.add(e.code);
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => { held.clear(); touchBits = 0; });
  window.addEventListener('gamepaddisconnected', () => held.clear());
}

function fromKeys(map: Map): number {
  let bits = 0;
  for (const code of held) if (map[code]) bits |= map[code];
  return bits;
}

function fromPad(index: number): number {
  const p = (navigator.getGamepads?.() ?? [])[index];
  if (!p) return 0;
  const b = (i: number) => !!p.buttons[i]?.pressed;
  const ax = p.axes[0] ?? 0;
  const ay = p.axes[1] ?? 0;
  let bits = 0;
  if (b(12) || ay < -0.5) bits |= UP;
  if (b(13) || ay > 0.5) bits |= DOWN;
  if (b(14) || ax < -0.5) bits |= LEFT;
  if (b(15) || ax > 0.5) bits |= RIGHT;
  if (b(2)) bits |= A; // West
  if (b(0)) bits |= K; // South
  if (b(1)) bits |= R; // East
  if (b(3)) bits |= M; // North
  if (b(5)) bits |= S; // RB
  if (b(4)) bits |= A | K; // LB = throw
  return bits;
}

/** Local versus: P1 = WASD set + pad 0, P2 = arrows/numpad set + pad 1. */
export function readLocalVersus(): [number, number] {
  return [fromKeys(P1_KEYS) | fromPad(0) | touchBits, fromKeys(P2_KEYS) | fromPad(1)];
}
/** Single local player (bots, training, online): any keyboard set, pad 0, touch. */
export function readSolo(): number {
  return fromKeys(P1_KEYS) | fromKeys(P2_KEYS) | fromPad(0) | touchBits;
}

export function anyPadConnected(): number {
  return (navigator.getGamepads?.() ?? []).filter(Boolean).length;
}

/** On-screen controls for touch devices: a virtual stick plus five action buttons. */
export function installTouch(root: HTMLElement): void {
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!isTouch) return;
  root.classList.remove('hidden');
  const stick = root.querySelector('.stick') as HTMLElement;
  const knob = root.querySelector('.knob') as HTMLElement;
  let stickBits = 0;
  let btnBits = 0;
  let sid = -1;
  const update = () => { touchBits = stickBits | btnBits; };
  stick.addEventListener('pointerdown', (e) => { sid = e.pointerId; stick.setPointerCapture(sid); move(e); });
  const move = (e: PointerEvent) => {
    if (e.pointerId !== sid) return;
    const r = stick.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    knob.style.transform = `translate(${Math.max(-1, Math.min(1, dx)) * 28}px, ${Math.max(-1, Math.min(1, dy)) * 28}px)`;
    stickBits = (dx < -0.4 ? LEFT : 0) | (dx > 0.4 ? RIGHT : 0) | (dy < -0.5 ? UP : 0) | (dy > 0.5 ? DOWN : 0);
    update();
  };
  stick.addEventListener('pointermove', move);
  const end = (e: PointerEvent) => { if (e.pointerId !== sid) return; sid = -1; stickBits = 0; knob.style.transform = ''; update(); };
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);
  for (const el of root.querySelectorAll<HTMLElement>('[data-bit]')) {
    const bit = Number(el.dataset.bit);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); btnBits |= bit; el.classList.add('on'); update(); });
    const up = () => { btnBits &= ~bit; el.classList.remove('on'); update(); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }
}
