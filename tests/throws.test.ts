import { expect, test } from 'vitest';
import { step } from '../src/sim/sim';
import { B1, B2, B3, run, trainingState } from './helpers';
import { DOWN } from '../src/sim/input';

function setup() {
  const s = trainingState();
  s.f[0].x = -1000;
  s.f[1].x = -1000 + 900 + 200;
  run(s, 4);
  return s;
}

test('left throw lands on a standing opponent', () => {
  const s = setup();
  step(s, [B1 | B3, 0]);
  run(s, 120);
  expect(s.f[1].hp).toBe(200 - 30);
});

test('pressing 1 breaks a left throw (0 frames, no damage)', () => {
  const s = setup();
  step(s, [B1 | B3, 0]);
  let broke = false;
  for (let i = 0; i < 40; i++) {
    const p2 = s.f[1].act === 'thrownClinch' && s.f[1].t === 6 ? B1 : 0;
    step(s, [0, p2]);
    if (s.events.some((e) => e.type === 'throwBreak')) broke = true;
  }
  run(s, 60);
  expect(broke).toBe(true);
  expect(s.f[1].hp).toBe(200);
});

test('wrong break button locks the break out', () => {
  const s = setup();
  step(s, [B1 | B3, 0]);
  for (let i = 0; i < 40; i++) {
    const t = s.f[1].t;
    const p2 = s.f[1].act === 'thrownClinch' ? (t === 4 ? B2 : t === 8 ? B1 : 0) : 0;
    step(s, [0, p2]);
  }
  run(s, 80);
  expect(s.f[1].hp).toBe(200 - 30);
});

test('throws whiff against a crouching opponent', () => {
  const s = setup();
  run(s, 3, 0, DOWN);
  step(s, [B2 | 128, DOWN]);
  run(s, 80, 0, DOWN);
  expect(s.f[1].hp).toBe(200);
});

test('1 then 3 one frame later still throws (chord leniency)', () => {
  const s = setup();
  step(s, [B1, 0]);
  step(s, [B1 | B3, 0]);
  run(s, 120);
  expect(s.f[1].hp).toBe(200 - 30);
});

void B2;
