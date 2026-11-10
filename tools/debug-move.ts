// Debug helper: play one move against a standing or crouching dummy and print what happened each tick.
// Usage: npx vite-node tools/debug-move.ts -- butcher "f+A" 600 crouch
import { ROSTER } from '../src/content/roster';
import { cmdBits, DOWN } from '../src/sim/input';
import { createState, step } from '../src/sim/sim';

const [fid, cmd, gapS, mode] = process.argv.slice(2).filter((a) => a !== '--');
const m = ROSTER[fid].moves[ROSTER[fid].cmd[cmd]];
const s = createState({ mode: 'training', fighters: [fid, 'corvin'], roundsToWin: 2 });
s.infiniteHp = false;
s.f[0].x = -1500;
s.f[1].x = -1500 + 900 + Number(gapS);
s.f[1].guard = false;
const dIn = mode === 'crouch' ? DOWN : 0;
for (let i = 0; i < 6; i++) step(s, [0, dIn]);
for (let i = 0; i < 40; i++) {
  step(s, [i < 3 ? cmdBits(cmd, 1) : 0, dIn]);
  const a = s.f[0];
  const seg = m.shapes && a.act === 'move' ? m.shapes[Math.min(a.t, m.shapes.length - 1)] : null;
  console.log(i, a.act, a.t, 'x', a.x, 'y', a.y, seg ? `tip(${seg[2]},${seg[3]})` : '', 'D:', s.f[1].act, 'hp', s.f[1].hp, s.events.map((e) => e.type).join(','));
}
