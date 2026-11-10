// Development animation inspector (open the game with ?anim=1).
// Pick a fighter and move, play / pause / step / scrub by tick, and overlay joints, the baked attack
// edge and hurtboxes. The simulation does not run; this only poses the real renderer from a tick.
import { FIGHTER_IDS, ROSTER } from '../content/roster';
import type { Renderer } from '../render/renderer';
import { createState } from '../sim/sim';
import type { GameState } from '../sim/types';

export function startInspector(renderer: Renderer): void {
  document.querySelectorAll('.screen, #hud, #touch').forEach((el) => el.classList.add('hidden'));
  const panel = document.createElement('div');
  panel.id = 'inspector';
  panel.innerHTML = `
    <div class="ptitle">Animation inspector</div>
    <label>Fighter <select id="ifighter"></select></label>
    <label>Opponent <select id="iopp"></select></label>
    <label>Move <select id="imove"></select></label>
    <label>Tick <input id="itick" type="range" min="0" max="40" step="0.05" value="0" /></label>
    <div id="iinfo"></div>
    <div class="btnrow"><button id="iplay">Play</button><button id="iprev">◀ 1</button><button id="inext">1 ▶</button></div>
    <label>Speed <select id="ispeed"><option value="1">1x</option><option value="0.5" selected>0.5x</option><option value="0.25">0.25x</option></select></label>
    <label class="chk"><input type="checkbox" id="ijoints" checked /> Joints</label>
    <label class="chk"><input type="checkbox" id="ishape" checked /> Baked attack edge</label>
    <label class="chk"><input type="checkbox" id="ihurt" checked /> Hurtboxes</label>
    <label class="chk"><input type="checkbox" id="ifaceR" /> Mirror (face left)</label>
    <div class="hint">Space play/pause · ← → step · pose is sampled at fractional ticks, exactly as in play</div>`;
  document.body.appendChild(panel);
  const $ = <T extends HTMLElement>(id: string) => panel.querySelector('#' + id) as T;
  const selF = $<HTMLSelectElement>('ifighter');
  const selO = $<HTMLSelectElement>('iopp');
  const selM = $<HTMLSelectElement>('imove');
  const slider = $<HTMLInputElement>('itick');
  const info = $('iinfo');
  const opts = FIGHTER_IDS.map((id) => `<option value="${id}">${ROSTER[id].name}</option>`).join('');
  selF.innerHTML = opts;
  selO.innerHTML = opts;
  selO.value = 'titan';

  let state: GameState;
  let tick = 0;
  let playing = true;
  let total = 20;

  function setup() {
    state = createState({ mode: 'training', fighters: [selF.value, selO.value], roundsToWin: 1 });
    state.f[0].x = -1200;
    state.f[1].x = 1500;
    state.phase = 'fight';
    const fd = ROSTER[selF.value];
    selM.innerHTML = ['<option value="">(stance / idle)</option>', ...fd.list.map((m) => `<option value="${m.id}">${m.cmd} · ${m.name}</option>`)].join('');
    selM.value = 'cut' in fd.moves ? 'cut' : fd.list[0].id;
    setMove();
  }
  function setMove() {
    const m = selM.value ? ROSTER[selF.value].moves[selM.value] : null;
    total = m ? m.total : 40;
    slider.max = String(total);
    tick = 0;
  }
  selF.onchange = setup;
  selO.onchange = setup;
  selM.onchange = setMove;
  slider.oninput = () => { tick = Number(slider.value); playing = false; ($('iplay') as HTMLButtonElement).textContent = 'Play'; };
  $('iplay').onclick = () => { playing = !playing; ($('iplay') as HTMLButtonElement).textContent = playing ? 'Pause' : 'Play'; };
  $('iprev').onclick = () => { playing = false; tick = Math.max(0, Math.floor(tick) - 1); };
  $('inext').onclick = () => { playing = false; tick = Math.min(total, Math.floor(tick) + 1); };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { playing = !playing; e.preventDefault(); }
    if (e.code === 'ArrowLeft') { playing = false; tick = Math.max(0, Math.floor(tick) - 1); }
    if (e.code === 'ArrowRight') { playing = false; tick = Math.min(total, Math.floor(tick) + 1); }
  });
  setup();

  renderer.app.ticker.add((t) => {
    const dt = Math.min(t.deltaMS, 100) / 1000;
    const speed = Number($<HTMLSelectElement>('ispeed').value);
    if (playing) { tick += dt * 60 * speed; if (tick > total) tick = 0; }
    slider.value = String(tick);
    const f = state.f[0];
    const mid = selM.value;
    const m = mid ? ROSTER[selF.value].moves[mid] : null;
    const whole = Math.floor(tick);
    f.act = m ? 'move' : 'idle';
    f.move = mid;
    f.t = m ? Math.max(1, whole) : whole;
    f.airMove = !!m?.air;
    f.facing = $<HTMLInputElement>('ifaceR').checked ? -1 : 1;
    state.f[1].act = 'idle';
    state.hitstop = 0;
    if (m) {
      const phase = whole < m.startup ? 'startup' : whole < m.startup + m.active ? 'ACTIVE' : 'recovery';
      info.innerHTML = `<b>${m.name}</b> ${m.cmd} · ${m.level}<br>tick ${tick.toFixed(2)} / ${total} · <span class="ph ${phase}">${phase}</span><br>i${m.startup} · ${m.active} active · ${m.recovery} recovery · dmg ${m.damage}`;
    } else info.textContent = `Stance · tick ${tick.toFixed(2)}`;
    renderer.render(state, tick - whole, dt, {
      hitboxes: $<HTMLInputElement>('ihurt').checked,
      joints: $<HTMLInputElement>('ijoints').checked,
      shapes: $<HTMLInputElement>('ishape').checked,
    });
  });
}
