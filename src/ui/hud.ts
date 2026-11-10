import { ROSTER } from '../content/roster';
import { AMMO, METER_MAX } from '../sim/constants';
import { BTNS, relDir } from '../sim/input';
import type { GameState, SimEvent } from '../sim/types';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const ARROWS: Record<string, string> = { '': '·', f: '→', b: '←', u: '↑', d: '↓', uf: '↗', ub: '↖', df: '↘', db: '↙' };
const BTN_NAMES: [number, string][] = [[16, 'A'], [32, 'K'], [64, 'R'], [128, 'M'], [256, 'S']];

export class Hud {
  private side = [0, 1].map((i) => ({
    name: $(`.p${i + 1} .fname`), fill: $(`.p${i + 1} .fill`), ghost: $(`.p${i + 1} .ghost`), bar: $(`.p${i + 1} .bar`),
    meter: $(`.p${i + 1} .meter i`), meterBox: $(`.p${i + 1} .meter`), ammo: $(`.p${i + 1} .ammo`), sig: $(`.p${i + 1} .sig`), pips: $(`.p${i + 1} .pips`),
  }));
  private timer = $('#timer');
  private ann = $('#announce');
  private net = $('#netinfo');
  private combos = [$('#combo0'), $('#combo1')];
  private comboHide = [0, 0];
  private cols = [$('#fcol0'), $('#fcol1')];
  private advText = ['—', '—'];
  private advClass = ['', ''];
  private hist: { label: string; n: number }[][] = [[], []];
  private lastHp = [-1, -1];
  private cache: Record<string, string> = {};
  framesDirty = true;

  reset(s: GameState) {
    this.advText = ['—', '—']; this.advClass = ['', '']; this.hist = [[], []]; this.lastHp = [-1, -1]; this.cache = {};
    for (const c of this.combos) c.classList.remove('show');
    this.ann.classList.remove('show'); this.ann.textContent = '';
    for (let i = 0; i < 2; i++) this.side[i].name.textContent = ROSTER[s.f[i].fid].name;
    this.framesDirty = true;
  }

  announce(text: string, small = false) {
    const a = this.ann;
    a.textContent = text;
    a.classList.toggle('small', small);
    a.classList.remove('show');
    void a.offsetWidth;
    a.classList.add('show');
  }

  setNet(text: string) { this.net.textContent = text; this.net.classList.toggle('hidden', !text); }

  afterStep(s: GameState, events: SimEvent[]) {
    for (let i = 0; i < 2; i++) {
      const f = s.f[i];
      const btns = BTN_NAMES.filter(([b]) => f.curIn & BTNS & b).map(([, n]) => n).join('+');
      const label = ARROWS[relDir(f.curIn, f.facing)] + (btns ? ' ' + btns : '');
      const h = this.hist[i];
      if (h.length && h[0].label === label) h[0].n++;
      else { h.unshift({ label, n: 1 }); if (h.length > 10) h.pop(); this.framesDirty = true; }
    }
    for (const e of events) {
      const p = e.p;
      switch (e.type) {
        case 'round': this.announce(s.roundsToWin > 1 && s.wins[0] === s.roundsToWin - 1 && s.wins[1] === s.roundsToWin - 1 ? 'Final Round' : `Round ${e.value}`); break;
        case 'fight': this.announce('Fight'); break;
        case 'ko': this.announce('K.O.'); break;
        case 'timeup': this.announce('Time'); break;
        case 'hit': {
          const a = s.f[p];
          const c = this.combos[p];
          const tag = e.kind === 'crit' ? '<div class="tag crit">CRITICAL</div>' : e.kind === 'ch' ? '<div class="tag">COUNTER</div>' : e.loc === 0 && e.kind !== 'proj' ? '<div class="tag head">HEAD</div>' : '';
          if (a.combo >= 2 || tag) {
            c.innerHTML = `${a.combo >= 2 ? `<div class="hits">${a.combo} hits</div><div class="dmg">${a.comboDmg} damage</div>` : ''}${tag}`;
            c.classList.add('show');
            this.comboHide[p] = 90;
          }
          const d = s.f[1 - p];
          if (d.act === 'air' || d.act === 'kdGround' || d.act === 'splat') { this.advText[p] = d.act === 'splat' ? 'wall splat' : 'knockdown / launch'; this.advClass[p] = 'pos'; }
          this.framesDirty = true;
          break;
        }
        case 'wall': this.announce('Wall', true); break;
        case 'adv': {
          const v = e.value ?? 0;
          this.advText[p] = `${v > 0 ? '+' : ''}${v} on ${e.kind === 'block' ? 'block' : e.kind === 'ch' ? 'counter' : e.kind === 'crit' ? 'critical' : 'hit'}`;
          this.advClass[p] = v > 0 ? 'pos' : v < 0 ? 'neg' : '';
          this.framesDirty = true;
          break;
        }
        case 'throwBreak': this.advText[1 - p] = 'throw broken · 0'; this.advClass[1 - p] = ''; this.framesDirty = true; break;
      }
    }
    for (let i = 0; i < 2; i++) if (this.comboHide[i] > 0 && --this.comboHide[i] === 0) this.combos[i].classList.remove('show');
  }

  private set(key: string, el: HTMLElement, html: string) {
    if (this.cache[key] === html) return;
    this.cache[key] = html;
    el.innerHTML = html;
  }

  render(s: GameState, showFrames: boolean) {
    for (let i = 0; i < 2; i++) {
      const f = s.f[i];
      const ui = this.side[i];
      const pct = (f.hp / f.maxHp) * 100;
      ui.fill.style.width = pct + '%';
      if (f.hp !== this.lastHp[i]) { ui.ghost.style.width = pct + '%'; this.lastHp[i] = f.hp; }
      ui.bar.classList.toggle('low', f.hp < f.maxHp * 0.25);
      ui.meter.style.width = (f.meter / METER_MAX) * 100 + '%';
      ui.meterBox.classList.toggle('ready', f.meter >= 500);
      this.set(`ammo${i}`, ui.ammo, Array.from({ length: AMMO }, (_, k) => `<b class="${k < f.ammo ? 'on' : ''}"></b>`).join(''));
      const fd = ROSTER[f.fid];
      const sigMove = fd.cmd.S ? fd.moves[fd.cmd.S] : null;
      const sigText = sigMove ? (sigMove.cooldown ? (f.sigCd > 0 ? `${sigMove.name} ${Math.ceil(f.sigCd / 60)}s` : `${sigMove.name} ready`) : `${sigMove.name} · ${sigMove.cost} meter`) : '';
      this.set(`sig${i}`, ui.sig, sigText);
      const pips = s.mode === 'training' ? '' : Array.from({ length: s.roundsToWin }, (_, k) => `<div class="pip ${k < s.wins[i] ? 'on' : ''}"></div>`).join('');
      this.set(`pips${i}`, ui.pips, pips);
    }
    this.timer.textContent = s.mode === 'training' ? '∞' : String(Math.ceil(s.timer / 60));
    if (showFrames && this.framesDirty) {
      this.framesDirty = false;
      for (let i = 0; i < 2; i++) {
        const f = s.f[i];
        const m = s.lastMove[i] ? ROSTER[f.fid].moves[s.lastMove[i]] : null;
        const hist = this.hist[i].map((h) => `<div><span class="n">${h.n > 99 ? '99+' : h.n}</span><span>${h.label}</span></div>`).join('');
        this.cols[i].innerHTML = `
          <h4 style="color:${i === 0 ? 'var(--p1)' : 'var(--p2)'}">P${i + 1} · ${ROSTER[f.fid].name}</h4>
          <div class="row"><span>Move</span><b>${m ? `${m.name} <span style="color:var(--dim)">${m.cmd}</span>` : '—'}</b></div>
          <div class="row"><span>Frames</span><b>${m ? `i${m.startup} / ${m.active} / ${m.recovery} · ${m.level === 'T' ? 'throw' : { H: 'high', M: 'mid', L: 'low' }[m.level]}` : '—'}</b></div>
          <div class="row"><span>Damage</span><b>${m ? m.damage : '—'}${f.combo > 1 ? ` · combo ${f.comboDmg}` : ''}</b></div>
          <div class="row"><span>Result</span><b class="${this.advClass[i]}">${this.advText[i]}</b></div>
          <div class="hist">${hist}</div>`;
      }
    }
  }

  moveListHtml(fid: string): string {
    const fd = ROSTER[fid];
    const rows = fd.list.map((m) => {
      const hit = m.onHit === 'kd' ? 'KND' : m.onHit === 'launch' ? 'LAUNCH' : (m.onHit > 0 ? '+' : '') + m.onHit;
      const blk = m.level === 'T' || m.projectile || m.smoke ? '—' : (m.onBlock > 0 ? '+' : '') + m.onBlock;
      const extra = [m.precision ? 'crit on punish' : '', m.wall ? 'wall' : '', m.cost ? `${m.cost} meter` : '', m.ammo ? 'ammo' : '', m.armor ? 'armor' : '', m.cooldown ? `${m.cooldown / 60}s cd` : ''].filter(Boolean).join(', ');
      return `<tr><td>${m.cmd}</td><td>${m.name}${extra ? `<div class="sub">${extra}</div>` : ''}</td><td>${m.level}</td><td>i${m.startup}</td><td>${blk}</td><td>${hit}</td><td>${m.projectile ? m.projectile.damage : m.damage}</td></tr>`;
    }).join('');
    return `<div class="ptitle">${fd.name} · ${fd.def.weaponName}</div><div class="sub">${fd.def.style}</div><table><tr><th>Cmd</th><th>Move</th><th>Lvl</th><th>Start</th><th>Block</th><th>Hit</th><th>Dmg</th></tr>${rows}</table>`;
  }
}
