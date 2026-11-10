// Keyboard + gamepad -> absolute input bits for each player.
import { B1, B2, B3, B4, DOWN, LEFT, RIGHT, UP } from '../sim/input';

type Map = Record<string, number>;

export const P1_KEYS: Map = {
  KeyW: UP, KeyS: DOWN, KeyA: LEFT, KeyD: RIGHT,
  KeyU: B1, KeyI: B2, KeyJ: B3, KeyK: B4,
  KeyO: B1 | B3, KeyL: B2 | B4,
};
export const P2_KEYS: Map = {
  ArrowUp: UP, ArrowDown: DOWN, ArrowLeft: LEFT, ArrowRight: RIGHT,
  Numpad7: B1, Numpad8: B2, Numpad4: B3, Numpad5: B4,
  BracketLeft: B1, BracketRight: B2, Semicolon: B3, Quote: B4,
  Numpad9: B1 | B3, Numpad6: B2 | B4,
};

const held = new Set<string>();
const GAME_KEYS = new Set([...Object.keys(P1_KEYS), ...Object.keys(P2_KEYS)]);

export function installKeyboard(onKey: (code: string) => void): void {
  window.addEventListener('keydown', (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (!e.repeat) onKey(e.code);
    held.add(e.code);
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
}

function fromKeys(map: Map): number {
  let bits = 0;
  for (const code of held) if (map[code]) bits |= map[code];
  return bits;
}

function fromPad(index: number): number {
  const pads = navigator.getGamepads?.() ?? [];
  const p = pads[index];
  if (!p) return 0;
  const b = (i: number) => !!p.buttons[i]?.pressed;
  let bits = 0;
  const ax = p.axes[0] ?? 0;
  const ay = p.axes[1] ?? 0;
  if (b(12) || ay < -0.5) bits |= UP;
  if (b(13) || ay > 0.5) bits |= DOWN;
  if (b(14) || ax < -0.5) bits |= LEFT;
  if (b(15) || ax > 0.5) bits |= RIGHT;
  if (b(2)) bits |= B1; // West
  if (b(3)) bits |= B2; // North
  if (b(0)) bits |= B3; // South
  if (b(1)) bits |= B4; // East
  if (b(4)) bits |= B1 | B3;
  if (b(5)) bits |= B2 | B4;
  return bits;
}

export function readInputs(): [number, number] {
  return [fromKeys(P1_KEYS) | fromPad(0), fromKeys(P2_KEYS) | fromPad(1)];
}
