// Animation quality tests: clip semantics, continuity, rotation, ground contact, and render/baked agreement.
import { describe, expect, test } from 'vitest';
import baked from '../src/content/baked.json';
import { rootHeight } from '../src/content/bake';
import { resolveKeys, sampleKeys } from '../src/content/clips';
import { GRIP_OFFSET, lerpPose, POSE_KEYS, shapeSegment, solve, wrapDeg, type Pose, type V } from '../src/content/rig';
import { ROSTER } from '../src/content/roster';
import { groundFor, poseFor } from '../src/render/posing';
import * as C from '../src/sim/constants';
import { newFighter } from '../src/sim/sim';

const B = baked as Record<string, Record<string, number[][]>>;
const CTX = { walkPhase: 0, intro: 0 };

describe('clip key semantics', () => {
  for (const fd of Object.values(ROSTER)) {
    test(`${fd.name}: omitted channels hold; the last key resets to the stance`, () => {
      for (const m of fd.def.moves) {
        const rk = resolveKeys(m.keys, fd.def.stance);
        for (let i = 1; i < m.keys.length; i++) {
          for (const ch of POSE_KEYS) {
            if (m.keys[i].p[ch] !== undefined) continue;
            const expected = i === m.keys.length - 1 ? fd.def.stance[ch] : rk[i - 1].pose[ch];
            expect(rk[i].pose[ch], `${m.id} key ${i} channel ${ch}`).toBe(expected);
          }
        }
      }
    });

    test(`${fd.name}: no angular snaps inside any clip (0.25-tick sampling)`, () => {
      for (const m of fd.def.moves) {
        const total = m.keys[m.keys.length - 1].t;
        let prev = sampleKeys(m.keys, fd.def.stance, 0);
        for (let t = 0.25; t <= total; t += 0.25) {
          const cur = sampleKeys(m.keys, fd.def.stance, t);
          for (const ch of POSE_KEYS) {
            if (ch === 'px') continue;
            expect(Math.abs(cur[ch] - prev[ch]), `${m.id} ${ch} at t=${t}`).toBeLessThan(45);
          }
          prev = cur;
        }
      }
    });
  }
});

describe('rotation continuity', () => {
  test('blending 359 -> 0 degrees takes the short way (no reverse spin)', () => {
    const a = { ...ROSTER.corvin.def.stance, rot: 359 } as Pose;
    const b = { ...ROSTER.corvin.def.stance, rot: 0 } as Pose;
    expect(wrapDeg(lerpPose(a, b, 0.5).rot - 359.5)).toBeCloseTo(0, 6);
    expect(wrapDeg(lerpPose(a, b, 1).rot)).toBeCloseTo(0, 6);
    expect(wrapDeg(-360)).toBeCloseTo(0, 9);
  });

  for (const act of ['rollF', 'rollB'] as const) {
    test(`${act}: somersault is continuous and ends on a full turn`, () => {
      const f = newFighter('corvin', 0);
      f.act = act;
      const T = act === 'rollF' ? C.ROLLF_T : C.ROLLB_T;
      let prev = NaN;
      for (let tick = 1; tick <= T + 1; tick++) {
        for (const a of [0, 0.25, 0.5, 0.75]) {
          f.t = tick;
          const rot = poseFor(f, a, 0, CTX).rot;
          if (!Number.isNaN(prev)) expect(Math.abs(wrapDeg(rot - prev)), `${act} t=${tick}+${a}`).toBeLessThan(45);
          prev = rot;
        }
      }
      f.t = T;
      expect(Math.abs(wrapDeg(poseFor(f, 0.99, 0, CTX).rot))).toBeLessThan(2);
    });
  }

  test('flip jumps finish on a full turn so landing never snaps', () => {
    const f = newFighter('corvin', 0);
    f.act = 'jump';
    f.jumpDir = 1;
    const air = (2 * C.JUMP_V) / C.GRAVITY;
    f.t = Math.round(C.JUMP_PRE + air);
    expect(Math.abs(wrapDeg(poseFor(f, 0, 0, CTX).rot))).toBeLessThan(2);
  });
});

describe('ground contact', () => {
  for (const fd of Object.values(ROSTER)) {
    test(`${fd.name}: a supporting foot stays planted while walking`, () => {
      const rig = fd.def.rig;
      const stride = 0.95 * rig.scale;
      const f = newFighter(fd.id, 0);
      f.act = 'walkF';
      // Facing right: body x = phase * stride. Track each foot's world x while it is the support foot.
      let worst = 0;
      for (const [offset, key] of [[0, 'fFoot'], [0.5, 'rFoot']] as const) {
        const worlds: number[] = [];
        for (let ph = 0; ph < 3; ph += 0.01) {
          const q = (((ph + offset) % 1) + 1) % 1;
          if (q >= 0.04 && q < 0.46) {
            const ctx = { walkPhase: ph, intro: 0 };
            const j = solve(poseFor(f, 0, 0, ctx), rig);
            worlds.push(ph * stride + (j[key] as V)[0]);
          } else if (worlds.length > 1) {
            worst = Math.max(worst, Math.max(...worlds) - Math.min(...worlds));
            worlds.length = 0;
          }
        }
      }
      expect(worst, 'support foot world drift (units)').toBeLessThan(0.06);
    });

    test(`${fd.name}: standing and walking keep a foot on the floor`, () => {
      const f = newFighter(fd.id, 0);
      for (const act of ['idle', 'crouch', 'blockstun', 'land'] as const) {
        f.act = act; f.t = 3; f.stun = 10;
        const j = solve(poseFor(f, 0, 1.2, CTX), fd.def.rig);
        const low = Math.min(j.fKnee[1], j.fFoot[1], j.rKnee[1], j.rFoot[1], j.fToe[1], j.rToe[1]);
        expect(Math.abs(low - 0.04), act).toBeLessThan(1e-6);
      }
    });
  }

  test('jumps use a free root: pelvis rides the sim root path while legs tuck', () => {
    const fd = ROSTER.corvin;
    const f = newFighter('corvin', 0);
    f.act = 'jump';
    f.jumpDir = 0;
    const gm = (t: number) => { f.t = t; return groundFor(f); };
    const rootH = rootHeight(fd.def);
    const air = (2 * C.JUMP_V) / C.GRAVITY;
    const apex = Math.round(C.JUMP_PRE + air / 2);
    expect(gm(apex).mode).toBe('free');
    f.t = apex;
    const j = solve(poseFor(f, 0, 0, CTX), fd.def.rig, 'free', rootH, 1);
    expect(j.pelvis[1]).toBeCloseTo(rootH, 6);
    const stand = solve(fd.def.stance, fd.def.rig, 'free', rootH, 1);
    expect(Math.min(j.fFoot[1], j.rFoot[1])).toBeGreaterThan(Math.min(stand.fFoot[1], stand.rFoot[1]) + 0.1); // tucked feet are higher
  });
});

describe('render pose agrees with baked attack geometry', () => {
  for (const fd of Object.values(ROSTER)) {
    test(`${fd.name}: pose at the first active tick equals the baked attack edge`, () => {
      for (const m of fd.def.moves) {
        if (!m.shape) continue;
        const f = newFighter(fd.id, 0);
        f.act = 'move'; f.move = m.id; f.t = m.startup; f.airMove = !!m.air;
        const gm = groundFor(f);
        const j = solve(poseFor(f, 0, 0, CTX), fd.def.rig, gm.mode, rootHeight(fd.def), gm.blend);
        const seg = shapeSegment(j, m.shape).map((v) => Math.round(v * 1000) || 0);
        const b = B[fd.id][m.id][m.startup];
        for (let i = 0; i < 4; i++) expect(Math.abs(seg[i] - b[i]), `${m.id} coord ${i}`).toBeLessThanOrEqual(1);
      }
    });
  }
});

describe('two-hand and paired weapons', () => {
  test('Titan: front hand is on the handle at contact; wind-up drift is bounded (known gap)', () => {
    const fd = ROSTER.titan;
    for (const m of fd.def.moves) {
      if (m.shape !== 'weapon') continue;
      for (let t = 0; t <= m.startup + m.active; t += 2) {
        const f = newFighter('titan', 0);
        f.act = 'move'; f.move = m.id; f.t = t;
        const j = solve(poseFor(f, 0, 0, CTX), fd.def.rig);
        const k = fd.def.rig.scale;
        const wd = Math.hypot(j.tip[0] - j.rHand[0], j.tip[1] - j.rHand[1]) || 1;
        const grip: V = [j.rHand[0] + ((j.tip[0] - j.rHand[0]) / wd) * GRIP_OFFSET * k, j.rHand[1] + ((j.tip[1] - j.rHand[1]) / wd) * GRIP_OFFSET * k];
        // Strict from the first active tick; during an extreme overhead wind-up the arms physically cannot reach.
        const tol = t >= m.startup ? 0.06 : 0.3;
        expect(Math.hypot(j.fHand[0] - grip[0], j.fHand[1] - grip[1]), `${m.id} t=${t}`).toBeLessThan(tol);
      }
    }
  });

  test('paired fighters: the second weapon moves during strikes (not held still)', () => {
    for (const id of ['hermit', 'shogun', 'butcher']) {
      const fd = ROSTER[id];
      const m = fd.def.moves.find((x) => x.id === 'cut')!;
      const tips: V[] = [];
      for (let t = 0; t <= m.startup + 4; t += 2) {
        const f = newFighter(id, 0);
        f.act = 'move'; f.move = m.id; f.t = t;
        tips.push(solve(poseFor(f, 0, 0, CTX), fd.def.rig).fTip);
      }
      const travel = tips.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - tips[i][0], p[1] - tips[i][1]), 0);
      expect(travel, id).toBeGreaterThan(0.8);
    }
  });
});
