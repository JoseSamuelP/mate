// =============================================================
// mathinput.js — Editor matemático tipo "Photomath":
// fracciones apiladas, exponentes, raíces, y teclado propio.
// =============================================================
import { tokenizeString, parseTokens } from './expr.js';

// Modelo: una "fila" es un arreglo de elementos:
//  {t:'ch', v:'3'} | {t:'frac', n:[], d:[]} | {t:'pow', e:[]} | {t:'sqrt', b:[]}
const SLOTS = { frac: ['n', 'd'], pow: ['e'], sqrt: ['b'] };

export class MathField {
  constructor(el, opts = {}) {
    this.el = el;
    this.root = [];
    this.path = []; // [[índiceElemento, ranura], ...]
    this.i = 0;
    this.onChange = opts.onChange || (() => {});
    this.placeholder = opts.placeholder || 'Escribe aquí';
    this.el.classList.add('mf');
    this.el.addEventListener('click', (e) => this._click(e));
    this.render();
  }
  // ---- navegación interna ----
  row(path = this.path) {
    let r = this.root;
    for (const [idx, slot] of path) r = r[idx][slot];
    return r;
  }
  clear() { this.root = []; this.path = []; this.i = 0; this.render(); this.onChange(); }
  isEmpty() { return this.root.length === 0; }
  set(json) { this.root = JSON.parse(JSON.stringify(json)); this.path = []; this.i = this.root.length; this.render(); }
  get() { return JSON.parse(JSON.stringify(this.root)); }

  insert(v) {
    const r = this.row();
    if (v === 'frac') return this.insertFrac();
    if (v === 'pow') return this.insertStruct({ t: 'pow', e: [] }, 'e');
    if (v === 'sq') { r.splice(this.i, 0, { t: 'pow', e: [{ t: 'ch', v: '2' }] }); this.i++; return this.changed(); }
    if (v === 'cube') { r.splice(this.i, 0, { t: 'pow', e: [{ t: 'ch', v: '3' }] }); this.i++; return this.changed(); }
    if (v === 'sqrt') return this.insertStruct({ t: 'sqrt', b: [] }, 'b');
    if (v === 'parens') { r.splice(this.i, 0, { t: 'ch', v: '(' }, { t: 'ch', v: ')' }); this.i++; return this.changed(); }
    r.splice(this.i, 0, { t: 'ch', v }); this.i++;
    this.changed();
  }
  insertStruct(node, slot) {
    const r = this.row();
    r.splice(this.i, 0, node);
    this.path = [...this.path, [this.i, slot]];
    this.i = 0;
    this.changed();
  }
  insertFrac() {
    const r = this.row();
    // Toma como numerador lo escrito justo antes (número, letras, potencias, paréntesis)
    let j = this.i;
    const isOperand = (it) => it.t === 'pow' || it.t === 'sqrt' || (it.t === 'ch' && /[0-9a-zA-Z,.π]/.test(it.v));
    if (j > 0 && r[j - 1].t === 'ch' && r[j - 1].v === ')') {
      let depth = 0;
      for (let k = j - 1; k >= 0; k--) {
        if (r[k].t === 'ch' && r[k].v === ')') depth++;
        if (r[k].t === 'ch' && r[k].v === '(') { depth--; if (depth === 0) { j = k; break; } }
      }
    } else {
      while (j > 0 && isOperand(r[j - 1])) j--;
    }
    const num = r.splice(j, this.i - j);
    const node = { t: 'frac', n: num, d: [] };
    r.splice(j, 0, node);
    this.path = [...this.path, [j, num.length ? 'd' : 'n']];
    this.i = 0;
    this.changed();
  }
  back() {
    const r = this.row();
    if (this.i > 0) {
      const prev = r[this.i - 1];
      if (prev.t === 'ch') { r.splice(this.i - 1, 1); this.i--; return this.changed(); }
      const slots = SLOTS[prev.t];
      const empty = slots.every((s) => prev[s].length === 0);
      if (empty) { r.splice(this.i - 1, 1); this.i--; return this.changed(); }
      // entrar a la última ranura
      const last = slots[slots.length - 1];
      this.path = [...this.path, [this.i - 1, last]];
      this.i = prev[last].length;
      return this.render();
    }
    if (!this.path.length) return;
    // al inicio de una ranura
    const [idx, slot] = this.path[this.path.length - 1];
    const parentPath = this.path.slice(0, -1);
    const pr = this.row(parentPath);
    const node = pr[idx];
    const slots = SLOTS[node.t];
    const si = slots.indexOf(slot);
    if (si > 0) { this.path = [...parentPath, [idx, slots[si - 1]]]; this.i = node[slots[si - 1]].length; return this.render(); }
    // desarmar la estructura: su contenido vuelve a la fila
    const content = slots.flatMap((s) => node[s]);
    pr.splice(idx, 1, ...content);
    this.path = parentPath; this.i = idx;
    this.changed();
  }
  left() {
    const r = this.row();
    if (this.i > 0) {
      const prev = r[this.i - 1];
      if (prev.t === 'ch') { this.i--; return this.render(); }
      const slots = SLOTS[prev.t]; const last = slots[slots.length - 1];
      this.path = [...this.path, [this.i - 1, last]]; this.i = prev[last].length; return this.render();
    }
    if (!this.path.length) return;
    const [idx, slot] = this.path[this.path.length - 1];
    const parentPath = this.path.slice(0, -1);
    const node = this.row(parentPath)[idx];
    const slots = SLOTS[node.t]; const si = slots.indexOf(slot);
    if (si > 0) { this.path = [...parentPath, [idx, slots[si - 1]]]; this.i = node[slots[si - 1]].length; }
    else { this.path = parentPath; this.i = idx; }
    this.render();
  }
  right() {
    const r = this.row();
    if (this.i < r.length) {
      const nx = r[this.i];
      if (nx.t === 'ch') { this.i++; return this.render(); }
      this.path = [...this.path, [this.i, SLOTS[nx.t][0]]]; this.i = 0; return this.render();
    }
    if (!this.path.length) return;
    const [idx, slot] = this.path[this.path.length - 1];
    const parentPath = this.path.slice(0, -1);
    const node = this.row(parentPath)[idx];
    const slots = SLOTS[node.t]; const si = slots.indexOf(slot);
    if (si < slots.length - 1) { this.path = [...parentPath, [idx, slots[si + 1]]]; this.i = 0; }
    else { this.path = parentPath; this.i = idx + 1; }
    this.render();
  }
  changed() { this.render(); this.onChange(); }

  // ---- dibujo ----
  render() {
    this._map = [];
    const html = this._renderRow(this.root, []);
    this.el.innerHTML = this.root.length === 0 && !this.path.length
      ? `<span class="mf-cur"></span><span class="mf-ph-text">${this.placeholder}</span>`
      : html;
    const cur = this.el.querySelector('.mf-cur');
    if (cur && cur.scrollIntoView) { try { cur.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* */ } }
  }
  _same(p) { return p.length === this.path.length && p.every((x, k) => x[0] === this.path[k][0] && x[1] === this.path[k][1]); }
  _pos(path, i) { this._map.push({ path, i }); return this._map.length - 1; }
  _renderRow(row, path) {
    const here = this._same(path);
    let h = '';
    if (row.length === 0) {
      const id = this._pos(path, 0);
      return here ? `<span class="mf-slot mf-active" data-p="${id}"><span class="mf-cur"></span></span>` : `<span class="mf-slot" data-p="${id}"></span>`;
    }
    row.forEach((it, k) => {
      if (here && this.i === k) h += '<span class="mf-cur"></span>';
      if (it.t === 'ch') {
        const id = this._pos(path, k + 1); const idL = this._pos(path, k);
        const v = it.v;
        const cls = /[+\-−×÷·=<>≤≥;]/.test(v) ? 'mf-ch mf-op' : /[a-zπ]/i.test(v) ? 'mf-ch mf-var' : 'mf-ch';
        const disp = { '-': '−', '*': '·' }[v] || v;
        h += `<span class="${cls}" data-p="${id}" data-pl="${idL}">${disp}</span>`;
      } else if (it.t === 'frac') {
        h += `<span class="fr mf-fr"><span class="nu">${this._renderRow(it.n, [...path, [k, 'n']])}</span><span class="de">${this._renderRow(it.d, [...path, [k, 'd']])}</span></span>`;
      } else if (it.t === 'pow') {
        h += `<sup class="mf-sup">${this._renderRow(it.e, [...path, [k, 'e']])}</sup>`;
      } else if (it.t === 'sqrt') {
        h += `<span class="sq">√<span class="sqb">${this._renderRow(it.b, [...path, [k, 'b']])}</span></span>`;
      }
    });
    if (here && this.i === row.length) h += '<span class="mf-cur"></span>';
    return h;
  }
  _click(e) {
    const t = e.target.closest('[data-p]');
    if (!t || !this.el.contains(t)) { this.path = []; this.i = this.root.length; return this.render(); }
    let id = +t.dataset.p;
    if (t.dataset.pl !== undefined) {
      const r = t.getBoundingClientRect();
      if (e.clientX < r.left + r.width / 2) id = +t.dataset.pl;
    }
    const m = this._map[id];
    if (m) { this.path = m.path; this.i = m.i; this.render(); }
  }

  // ---- conversión a expresión ----
  toAST() { return parseTokens(rowTokens(this.root)); }
}

export function rowTokens(row) {
  const toks = []; let buf = '';
  const flush = () => { if (buf) { toks.push(...tokenizeString(buf)); buf = ''; } };
  for (const it of row) {
    if (it.t === 'ch') { buf += it.v; continue; }
    flush();
    if (it.t === 'frac') {
      if (!it.n.length || !it.d.length) throw new SyntaxError('Completa la fracción (arriba y abajo)');
      toks.push({ k: 'group', ast: { t: 'frac', a: parseTokens(rowTokens(it.n)), b: parseTokens(rowTokens(it.d)) } });
    } else if (it.t === 'pow') {
      if (!it.e.length) throw new SyntaxError('Completa el exponente');
      toks.push({ k: 'sup', ast: parseTokens(rowTokens(it.e)) });
    } else if (it.t === 'sqrt') {
      if (!it.b.length) throw new SyntaxError('Completa la raíz');
      toks.push({ k: 'group', ast: { t: 'sqrt', a: parseTokens(rowTokens(it.b)) } });
    }
  }
  flush();
  return toks;
}

// ---------- Teclado ----------
const LAYOUTS = {
  num: [
    ['7', '8', '9', ['÷', '÷'], ['(', '('], [')', ')']],
    ['4', '5', '6', ['×', '·'], ['frac', 'frac'], ['pow', 'pow']],
    ['1', '2', '3', ['−', '-'], ['sq', 'sq'], ['sqrt', 'sqrt']],
    ['0', [',', ','], ['%', '%'], ['+', '+'], ['=', '='], ['x', 'x']],
    [['abc', 'tab:alg'], [';', ';'], ['←', 'left'], ['→', 'right'], ['⌫', 'back'], ['ok', 'ok']],
  ],
  alg: [
    ['x', 'y', 'a', 'b', 'c', 'n'],
    ['m', 'p', 'k', 't', 'z', ['π', 'π']],
    [['<', '<'], ['>', '>'], ['≤', '≤'], ['≥', '≥'], ['[', '['], [']', ']']],
    [['cube', 'cube'], ['pow', 'pow'], ['frac', 'frac'], ['×', '·'], ['−', '-'], ['+', '+']],
    [['123', 'tab:num'], ['=', '='], ['←', 'left'], ['→', 'right'], ['⌫', 'back'], ['ok', 'ok']],
  ],
};
const LABEL = {
  frac: '<span class="k-fr"><span>□</span><span>□</span></span>',
  pow: '<span>□<sup>□</sup></span>', sq: '<span><i>x</i><sup>2</sup></span>', cube: '<span><i>x</i><sup>3</sup></span>', sqrt: '<span>√□</span>',
  ok: '✓',
};

export class Keyboard {
  constructor(el, opts = {}) {
    this.el = el; this.field = null; this.tab = 'num';
    this.onOk = opts.onOk || (() => {});
    this.el.classList.add('kb');
    this.el.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('button[data-k]'); if (!b) return;
      e.preventDefault();
      this.press(b.dataset.k);
      b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 120);
      if (navigator.vibrate) { try { navigator.vibrate(6); } catch { /* */ } }
    });
    this.render();
  }
  attach(field) { this.field = field; }
  press(k) {
    if (k.startsWith('tab:')) { this.tab = k.slice(4); return this.render(); }
    if (k === 'ok') return this.onOk();
    const f = this.field; if (!f) return;
    if (k === 'back') return f.back();
    if (k === 'left') return f.left();
    if (k === 'right') return f.right();
    f.insert(k);
  }
  render() {
    const rows = LAYOUTS[this.tab];
    this.el.innerHTML = rows.map((r) => `<div class="kb-row">${r.map((key) => {
      const [label, k] = Array.isArray(key) ? key : [key, key];
      const cls = k === 'ok' ? 'kb-ok' : k === 'back' ? 'kb-fn kb-back' : (k.startsWith('tab:') || k === 'left' || k === 'right') ? 'kb-fn'
        : /^[0-9]$/.test(k) ? 'kb-num' : /^[a-zπ]$/.test(k) ? 'kb-var' : 'kb-sym';
      return `<button type="button" class="${cls}" data-k="${k}">${LABEL[k] || label}</button>`;
    }).join('')}</div>`).join('');
  }
}

// Teclado físico (laptop)
export function bindPhysical(getField, onOk) {
  window.addEventListener('keydown', (e) => {
    const f = getField(); if (!f) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const k = e.key;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    let handled = true;
    if (/^[0-9a-zA-Z]$/.test(k)) f.insert(k.toLowerCase());
    else if (k === 'Backspace') f.back();
    else if (k === 'ArrowLeft') f.left();
    else if (k === 'ArrowRight') f.right();
    else if (k === 'Enter') onOk();
    else if (k === '/') f.insert('frac');
    else if (k === '^') f.insert('pow');
    else if (k === '*') f.insert('·');
    else if ('+-=(),.;%<>[]'.includes(k)) f.insert(k === '.' ? ',' : k);
    else handled = false;
    if (handled) e.preventDefault();
  });
}
