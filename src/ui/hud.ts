import { ROSTER } from '../data/roster';
import { HP_MAX } from '../sim/constants';
import { BTNS, relDir } from '../sim/input';
import type { GameState } from '../sim/types';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const ARROWS: Record<string, string> = { '': '·', f: '→', b: '←', u: '↑', d: '↓', uf: '↗', ub: '↖', df: '↘', db: '↙' };

interface Hist { label: string; n: number }

export class Hud {
  private fills = [$('.p1 .fill'), $('.p2 .fill')];
  private ghosts = [$('.p1 .ghost'), $('.p2 .ghost')];
  private bars = [$('.p1 .bar'), $('.p2 .bar')];
  private pips = [$('.p1 .pips'), $('.p2 .pips')];
  private timer = $('#timer');
  private ann = $('#announce');
  private combos = [$('#combo0'), $('#combo1')];
  private comboHide = [0, 0];
  private cols = [$('#fcol0'), $('#fcol1')];
  private advText = ['—', '—'];
  private advClass = ['', ''];
  private hist: Hist[][] = [[], []];
  private lastHp = [HP_MAX, HP_MAX];
  private framesDirty = true;

  reset() {
    this.advText = ['—', '—'];
    this.advClass = ['', ''];
    this.hist = [[], []];
    this.lastHp = [HP_MAX, HP_MAX];
    for (const c of this.combos) c.classList.remove('show');
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

  /** Called once per simulation frame. */
  afterStep(s: GameState) {
    for (let i = 0; i < 2; i++) {
      const f = s.f[i];
      const dir = relDir(f.curIn, f.facing);
      const btns = [1, 2, 3, 4].filter((b) => f.curIn & (BTNS & (8 << b))).join('+');
      const label = ARROWS[dir] + (btns ? ' ' + btns : '');
      const h = this.hist[i];
      if (h.length && h[0].label === label) h[0].n++;
      else { h.unshift({ label, n: 1 }); if (h.length > 10) h.pop(); this.framesDirty = true; }
    }
    for (const e of s.events) {
      const p = e.p;
      switch (e.type) {
        case 'round': this.announce(`Round ${e.value}`); break;
        case 'fight': this.announce('Fight'); break;
        case 'ko': this.announce('K.O.'); break;
        case 'timeup': this.announce('Time'); break;
        case 'hit':
        case 'ch': {
          const a = s.f[p];
          const c = this.combos[p];
          if (a.combo >= 2 || e.type === 'ch') {
            c.innerHTML = `${a.combo >= 2 ? `<div class="hits">${a.combo} hits</div><div class="dmg">${a.comboDmg} damage</div>` : ''}${e.type === 'ch' ? '<div class="ch">COUNTER</div>' : ''}`;
            c.classList.add('show');
            this.comboHide[p] = 90;
          }
          if (s.f[1 - p].act === 'kdAir' || s.f[1 - p].act === 'kdGround') { this.advText[p] = 'knockdown'; this.advClass[p] = 'pos'; }
          this.framesDirty = true;
          break;
        }
        case 'adv': {
          const v = e.value ?? 0;
          this.advText[p] = `${v > 0 ? '+' : ''}${v} on ${e.kind === 'block' ? 'block' : e.kind === 'ch' ? 'counter hit' : 'hit'}`;
          this.advClass[p] = v > 0 ? 'pos' : v < 0 ? 'neg' : '';
          this.framesDirty = true;
          break;
        }
        case 'throwBreak': this.advText[1 - p] = 'throw broken · 0'; this.advClass[1 - p] = ''; this.framesDirty = true; break;
      }
    }
    for (let i = 0; i < 2; i++) {
      if (this.comboHide[i] > 0 && --this.comboHide[i] === 0) this.combos[i].classList.remove('show');
    }
  }

  render(s: GameState, showFrames: boolean) {
    for (let i = 0; i < 2; i++) {
      const hp = s.f[i].hp;
      const pct = (hp / HP_MAX) * 100;
      this.fills[i].style.width = pct + '%';
      if (hp !== this.lastHp[i]) { this.ghosts[i].style.width = pct + '%'; this.lastHp[i] = hp; }
      this.bars[i].classList.toggle('low', hp < HP_MAX * 0.25);
      if (this.pips[i].dataset.w !== String(s.wins[i]) || this.pips[i].dataset.m !== s.mode) {
        this.pips[i].dataset.w = String(s.wins[i]);
        this.pips[i].dataset.m = s.mode;
        this.pips[i].innerHTML = s.mode === 'training' ? '' : [0, 1].map((k) => `<div class="pip ${k < s.wins[i] ? 'on' : ''}"></div>`).join('');
      }
    }
    this.timer.textContent = s.mode === 'training' ? '∞' : String(Math.ceil(s.timer / 60));
    if (showFrames && this.framesDirty) {
      this.framesDirty = false;
      for (let i = 0; i < 2; i++) {
        const f = s.f[i];
        const m = s.lastMove[i] ? ROSTER[f.fid].moves[s.lastMove[i]] : null;
        const hist = this.hist[i].map((h) => `<div><span class="n">${h.n > 99 ? '99+' : h.n}</span><span>${h.label}</span></div>`).join('');
        this.cols[i].innerHTML = `
          <h4 style="color:${i === 0 ? 'var(--p1)' : 'var(--p2)'}">P${i + 1}</h4>
          <div class="row"><span>Move</span><b>${m ? `${m.name} <span style="color:var(--dim)">${m.cmd}</span>` : '—'}</b></div>
          <div class="row"><span>Startup</span><b>${m ? `i${m.startup} · ${m.level === 'T' ? 'throw' : { H: 'high', M: 'mid', L: 'low' }[m.level]}` : '—'}</b></div>
          <div class="row"><span>Result</span><b class="${this.advClass[i]}">${this.advText[i]}</b></div>
          <div class="hist">${hist}</div>`;
      }
    }
  }

  moveListHtml(fid: string): string {
    const fd = ROSTER[fid];
    const rows = fd.list
      .map((m) => {
        const hit = m.onHit === 'kd' ? 'KND' : (m.onHit > 0 ? '+' : '') + m.onHit;
        const blk = m.level === 'T' ? '—' : (m.onBlock > 0 ? '+' : '') + m.onBlock;
        return `<tr><td>${m.cmd}</td><td>${m.name}</td><td>${m.level}</td><td>i${m.startup}</td><td>${blk}</td><td>${hit}</td><td>${m.damage}</td></tr>`;
      })
      .join('');
    return `<div class="ptitle">${fd.name} · ${fd.weapon}</div><table><tr><th>Cmd</th><th>Move</th><th>Lvl</th><th>Start</th><th>Block</th><th>Hit</th><th>Dmg</th></tr>${rows}</table>`;
  }
}
