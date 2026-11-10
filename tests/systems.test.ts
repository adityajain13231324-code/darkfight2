import { expect, test } from 'vitest';
import { step } from '../src/sim/sim';
import { A, DOWN, K, M, R, RIGHT, S, cmdBits, run, training } from './helpers';

function close(f0 = 'corvin', f1 = 'corvin', gap = 200) {
  const s = training(f0, f1);
  s.f[0].x = -1000;
  s.f[1].x = -1000 + 900 + gap;
  run(s, 4);
  return s;
}

test('A+K throws a standing opponent; A+K in the window breaks it', () => {
  const s = close();
  run(s, 2, A | K); run(s, 100);
  expect(s.f[1].hp).toBe(1000 - 90);
  const t = close();
  run(t, 2, A | K);
  let broke = false;
  for (let i = 0; i < 60; i++) {
    const p2 = t.f[1].act === 'thrownClinch' && t.f[1].t >= 5 && t.f[1].t <= 6 ? A | K : 0;
    step(t, [0, p2]);
    if (t.events.some((e) => e.type === 'throwBreak')) broke = true;
  }
  expect(broke).toBe(true);
  expect(t.f[1].hp).toBe(1000);
});

test('throws whiff against crouching opponents', () => {
  const s = close();
  run(s, 3, 0, DOWN);
  run(s, 2, A | K, DOWN); run(s, 60, 0, DOWN);
  expect(s.f[1].hp).toBe(1000);
});

test('launcher juggle: extra hits land, combo damage stays under the cap', () => {
  const s = close('corvin', 'corvin', 300);
  s.f[1].guard = false;
  run(s, 3, cmdBits('df+A', 1)); run(s, 1);
  for (let i = 0; i < 200; i++) step(s, [i % 8 < 2 ? A : 0, 0]);
  const dealt = 1000 - s.f[1].hp;
  expect(dealt).toBeGreaterThan(70);
  expect(dealt).toBeLessThanOrEqual(350);
});

test('ranged uses ammo (3 per round) and magic needs meter', () => {
  const s = training();
  s.f[1].guard = false;
  for (let k = 0; k < 5; k++) { run(s, 1, R); run(s, 40); }
  expect(s.f[0].ammo).toBe(0);
  s.f[0].meter = 0;
  run(s, 1, M); run(s, 30);
  expect(s.lastMove[0]).not.toBe('wave');
  s.f[0].meter = 1000;
  run(s, 1, M); run(s, 5);
  expect(s.f[0].move).toBe('wave');
  expect(s.f[0].meter).toBe(500);
});

test('Lynx smoke veil conceals until she attacks, with a cooldown', () => {
  const s = training('lynx', 'corvin');
  run(s, 1, S); run(s, 30);
  expect(s.f[0].smoke).toBeGreaterThan(0);
  run(s, 3, A); run(s, 10);
  expect(s.f[0].smoke).toBe(0);
  expect(s.f[0].sigCd).toBeGreaterThan(0);
});

test('knockdown wake-up: back roll moves away from the attacker', () => {
  const s = close('corvin', 'corvin', 300);
  s.f[1].guard = false;
  run(s, 3, cmdBits('db+A', 1));
  for (let i = 0; i < 120 && s.f[1].act !== 'kdGround'; i++) run(s, 1);
  expect(s.f[1].act).toBe('kdGround');
  run(s, 18);
  const x = s.f[1].x;
  run(s, 30, 0, RIGHT); // P2 faces left, so RIGHT is back
  expect(s.f[1].x).toBeGreaterThan(x + 800);
});
