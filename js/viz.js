// =============================================================
// viz.js — Dibujos para enseñar y corregir (SVG/HTML).
// Todos usan variables de color del tema oscuro.
// =============================================================
import { M } from './expr.js';

const C = {
  pos: 'var(--green)', neg: 'var(--red)', acc: 'var(--acc)', blue: 'var(--blue)', amber: 'var(--amber)',
  ink: 'var(--ink)', mute: 'var(--mute)', line: 'var(--line)', card: 'var(--card2)',
};
const fmt = (n) => String(n).replace('-', '−');

// ---- Recta numérica con saltos (deudas y ganancias) ----
export function numberLine({ start, moves = [], from, to, title }) {
  const pts = [start]; moves.forEach((m) => pts.push(pts[pts.length - 1] + m));
  const lo = from ?? Math.min(...pts, 0) - 1, hi = to ?? Math.max(...pts, 0) + 1;
  const W = 340, pad = 18, H = 70 + moves.length * 0;
  const x = (v) => pad + ((v - lo) / (hi - lo)) * (W - 2 * pad);
  const step = hi - lo > 24 ? 5 : hi - lo > 12 ? 2 : 1;
  let s = `<svg viewBox="0 0 ${W} ${H + 26}" class="viz" role="img">`;
  s += `<line x1="${pad - 6}" y1="${H}" x2="${W - pad + 6}" y2="${H}" stroke="${C.mute}" stroke-width="2"/>`;
  for (let v = Math.ceil(lo); v <= hi; v++) {
    const big = v % step === 0;
    if (!big && hi - lo > 30) continue;
    s += `<line x1="${x(v)}" y1="${H - (big ? 6 : 3)}" x2="${x(v)}" y2="${H + (big ? 6 : 3)}" stroke="${v === 0 ? C.ink : C.mute}" stroke-width="${v === 0 ? 2 : 1}"/>`;
    if (big) s += `<text x="${x(v)}" y="${H + 20}" text-anchor="middle" font-size="11" fill="${v === 0 ? C.ink : C.mute}">${fmt(v)}</text>`;
  }
  // zonas
  s += `<text x="${pad}" y="12" font-size="10" fill="${C.neg}">← deuda</text><text x="${W - pad}" y="12" font-size="10" fill="${C.pos}" text-anchor="end">ganancia →</text>`;
  const lev = (k) => H - 14 - (k % 3) * 14;
  moves.forEach((m, k) => {
    const a = x(pts[k]), b = x(pts[k + 1]); const y = lev(k);
    const col = m >= 0 ? C.pos : C.neg;
    s += `<path d="M${a},${y} L${b},${y}" stroke="${col}" stroke-width="3" marker-end="url(#ar${m >= 0 ? 'p' : 'n'})"/>`;
    s += `<text x="${(a + b) / 2}" y="${y - 4}" text-anchor="middle" font-size="11" font-weight="700" fill="${col}">${m >= 0 ? '+' : '−'}${Math.abs(m)}</text>`;
  });
  s += `<circle cx="${x(start)}" cy="${H}" r="5" fill="${C.blue}"/>`;
  s += `<circle cx="${x(pts[pts.length - 1])}" cy="${H}" r="6" fill="${C.acc}" stroke="var(--bg)" stroke-width="2"/>`;
  s += `<defs><marker id="arp" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="${C.pos}"/></marker><marker id="arn" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="${C.neg}"/></marker></defs>`;
  s += '</svg>';
  return (title ? `<div class="viz-t">${title}</div>` : '') + s;
}

// ---- Regla de signos con fichas ----
export function signRule(a, b, op = '·') {
  const sg = (v) => (v >= 0 ? '+' : '−');
  const r = (a >= 0) === (b >= 0) ? '+' : '−';
  const chip = (s) => `<span class="chip ${s === '+' ? 'chip-p' : 'chip-n'}">${s}</span>`;
  return `<div class="signrule">${chip(sg(a))}<span>${op}</span>${chip(sg(b))}<span>=</span>${chip(r)}<div class="sr-note">${r === '+' ? 'Signos iguales → <b class="g">+</b>' : 'Signos distintos → <b class="r">−</b>'}</div></div>`;
}
export function signTable() {
  const chip = (s) => `<span class="chip ${s === '+' ? 'chip-p' : 'chip-n'}">${s}</span>`;
  const rows = [['+', '+', '+'], ['−', '−', '+'], ['+', '−', '−'], ['−', '+', '−']];
  return `<div class="signtable">${rows.map(([a, b, c]) => `<div>${chip(a)}·${chip(b)} = ${chip(c)}</div>`).join('')}</div>`;
}

// ---- Bloques de potencia: (a²)³ = a·a | a·a | a·a ----
export function powerBlocks(base, inner, outer) {
  const grp = Array.from({ length: outer }, (_, g) => `<span class="pgrp" style="--h:${(g * 47) % 360}">${Array.from({ length: inner }, () => `<i>${base}</i>`).join('<b>·</b>')}</span>`).join('<b class="pdot">·</b>');
  return `<div class="pblocks"><div class="prow">${grp}</div><div class="pcount">${outer} grupos × ${inner} = <b>${inner * outer}</b> factores <i>${base}</i></div></div>`;
}
export function expandPow(base, n, val) {
  const f = Array.from({ length: n }, () => `<span class="pf">${base}</span>`).join('<b>·</b>');
  return `<div class="pblocks"><div class="prow">${f}${val !== undefined ? `<span class="peq">= ${fmt(val)}</span>` : ''}</div></div>`;
}

// ---- Modelo de área: (x+3)(x+2) ----
export function areaModel(rows, cols, cells, title) {
  // rows/cols: etiquetas HTML; cells[i][j]: HTML
  const g = `grid-template-columns: auto ${cols.map(() => '1fr').join(' ')}`;
  let h = `<div class="area" style="${g}"><span></span>${cols.map((c) => `<span class="ah">${c}</span>`).join('')}`;
  rows.forEach((r, i) => {
    h += `<span class="ah">${r}</span>`;
    cols.forEach((_, j) => { h += `<span class="ac ac${(i + j) % 3}">${cells[i][j]}</span>`; });
  });
  h += '</div>';
  return (title ? `<div class="viz-t">${title}</div>` : '') + h;
}

// ---- Barras de fracciones ----
export function fracBar(n, d, color = C.acc, label = true) {
  const W = 300, H = 26; const w = W / d;
  let s = `<svg viewBox="0 0 ${W + 50} ${H + 4}" class="viz fbar">`;
  for (let i = 0; i < d; i++) s += `<rect x="${i * w + 1}" y="2" width="${w - 2}" height="${H}" rx="3" fill="${i < n ? color : 'transparent'}" stroke="${C.mute}" stroke-width="1"/>`;
  if (label) s += `<text x="${W + 10}" y="${H - 6}" font-size="14" fill="${C.ink}">${n}/${d}</text>`;
  return s + '</svg>';
}
export function fracAddViz(a, b, c, d, sub = false) {
  const lcm = (b * d) / gcdv(b, d);
  const A = a * (lcm / b), B = c * (lcm / d);
  return `<div class="fviz">
    <div class="viz-t">1) Cada fracción con sus partes</div>${fracBar(a, b, C.blue)}${fracBar(c, d, C.amber)}
    <div class="viz-t">2) Cortamos todo en partes iguales: ${lcm}</div>${fracBar(A, lcm, C.blue)}${fracBar(B, lcm, C.amber)}
    <div class="viz-t">3) Ahora sí se ${sub ? 'restan' : 'suman'} las partes: ${A} ${sub ? '−' : '+'} ${B} = ${sub ? A - B : A + B}</div>${fracBar(Math.max(0, sub ? A - B : A + B), lcm, C.acc)}
  </div>`.replace(/\n\s*/g, '');
}
function gcdv(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }

// ---- Multiplicar fracciones: rectángulo ----
export function fracMulViz(a, b, c, d) {
  const S = 180, cw = S / b, rh = S / d;
  let s = `<svg viewBox="0 0 ${S + 90} ${S + 30}" class="viz">`;
  for (let i = 0; i < b; i++) for (let j = 0; j < d; j++) {
    const inA = i < a, inC = j < c;
    const fill = inA && inC ? C.acc : inA ? 'color-mix(in srgb, var(--blue) 45%, transparent)' : inC ? 'color-mix(in srgb, var(--amber) 40%, transparent)' : 'transparent';
    s += `<rect x="${i * cw + 2}" y="${j * rh + 2}" width="${cw - 2}" height="${rh - 2}" fill="${fill}" stroke="${C.mute}" stroke-width="0.8"/>`;
  }
  s += `<text x="${S + 10}" y="20" font-size="12" fill="${C.blue}">${a}/${b} columnas</text>`;
  s += `<text x="${S + 10}" y="40" font-size="12" fill="${C.amber}">${c}/${d} filas</text>`;
  s += `<text x="${S + 10}" y="70" font-size="13" font-weight="700" fill="${C.acc}">${a * c}/${b * d}</text>`;
  s += `<text x="${S + 10}" y="86" font-size="10" fill="${C.mute}">cruce</text>`;
  return s + '</svg>';
}

// ---- Balanza (ecuaciones) ----
export function balance(left, right, note) {
  return `<div class="bal"><div class="bal-beam"><div class="bal-pan">${left}</div><div class="bal-mid">=</div><div class="bal-pan">${right}</div></div><svg viewBox="0 0 300 40" class="viz bal-svg"><line x1="20" y1="6" x2="280" y2="6" stroke="${C.mute}" stroke-width="3"/><path d="M150,6 L135,38 L165,38z" fill="${C.mute}"/></svg>${note ? `<div class="bal-note">${note}</div>` : ''}</div>`;
}

// ---- Barra de porcentaje ----
export function pctBar(pct, labelL, labelR) {
  const W = 320;
  let s = `<svg viewBox="0 0 ${W} 54" class="viz">`;
  s += `<rect x="2" y="16" width="${W - 4}" height="20" rx="6" fill="transparent" stroke="${C.mute}"/>`;
  s += `<rect x="2" y="16" width="${Math.max(0, Math.min(100, pct)) / 100 * (W - 4)}" height="20" rx="6" fill="${C.acc}"/>`;
  for (let k = 1; k < 4; k++) s += `<line x1="${2 + k * (W - 4) / 4}" y1="14" x2="${2 + k * (W - 4) / 4}" y2="38" stroke="${C.mute}" stroke-dasharray="2 2"/>`;
  if (labelL) s += `<text x="4" y="11" font-size="11" fill="${C.acc}">${labelL}</text>`;
  if (labelR) s += `<text x="${W - 4}" y="11" font-size="11" text-anchor="end" fill="${C.mute}">${labelR}</text>`;
  s += `<text x="4" y="50" font-size="10" fill="${C.mute}">0%</text><text x="${W / 2}" y="50" font-size="10" text-anchor="middle" fill="${C.mute}">50%</text><text x="${W - 4}" y="50" font-size="10" text-anchor="end" fill="${C.mute}">100%</text>`;
  return s + '</svg>';
}

// ---- Tabla de regla de tres con flechas ----
export function ruleOfThree(h1, h2, a1, b1, a2, b2, inverse) {
  const arL = '↓', arR = inverse ? '↑' : '↓';
  return `<div class="r3"><div class="r3h">${h1}</div><div></div><div class="r3h">${h2}</div>
    <div class="r3c">${a1}</div><div class="r3a" rowspan="2">${arL}</div><div class="r3c">${b1}</div>
    <div class="r3c">${a2}</div><div class="r3a">${arR}</div><div class="r3c">${b2}</div></div>
    <div class="r3n ${inverse ? 'r' : 'g'}">${inverse ? 'Si uno <b>sube</b>, el otro <b>baja</b> → INVERSA: se multiplica en línea recta' : 'Si uno sube, el otro también → DIRECTA: se multiplica en cruz'}</div>`.replace(/\n\s*/g, '');
}

// ---- Comparación "lo que hiciste" vs "lo correcto" ----
export function compare(wrong, right) {
  return `<div class="cmp"><div class="cmp-w"><div class="cmp-h">✗ Lo que hiciste</div>${wrong}</div><div class="cmp-r"><div class="cmp-h">✓ Lo correcto</div>${right}</div></div>`;
}

// ---- Cadena de pasos con resaltado ----
export function chain(items) {
  return `<div class="chain">${items.map((it, k) => `<div class="ch-step"><div class="ch-n">${k + 1}</div><div class="ch-body">${it.html ? `<div class="ch-ex">${it.html}</div>` : ''}${it.note ? `<div class="ch-note">${it.note}</div>` : ''}</div></div>`).join('')}</div>`;
}

// ---- Figuras geométricas ----
export function rectFig(w, h, lw, lh, opts = {}) {
  const W = 260, H = 160, s = Math.min((W - 60) / w, (H - 40) / h);
  const rw = w * s, rh = h * s, x0 = (W - rw) / 2, y0 = (H - rh) / 2 + 4;
  return `<svg viewBox="0 0 ${W} ${H}" class="viz geo"><rect x="${x0}" y="${y0}" width="${rw}" height="${rh}" fill="color-mix(in srgb, var(--acc) 18%, transparent)" stroke="${C.acc}" stroke-width="2"/>
  <text x="${x0 + rw / 2}" y="${y0 - 6}" text-anchor="middle" font-size="13" fill="${C.ink}">${lw}</text>
  <text x="${x0 + rw + 8}" y="${y0 + rh / 2 + 4}" font-size="13" fill="${C.ink}">${lh}</text>${opts.inner || ''}</svg>`;
}
// Figura en L (rectángulo con esquina recortada)
export function lShape(W0, H0, cw, ch) {
  const W = 280, H = 190, s = Math.min((W - 70) / W0, (H - 50) / H0);
  const x0 = 30, y0 = 22;
  const X = (v) => x0 + v * s, Y = (v) => y0 + v * s;
  const pts = [[0, 0], [W0 - cw, 0], [W0 - cw, ch], [W0, ch], [W0, H0], [0, H0]];
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0])},${Y(p[1])}`).join(' ') + 'Z';
  return `<svg viewBox="0 0 ${W} ${H}" class="viz geo"><path d="${d}" fill="color-mix(in srgb, var(--acc) 18%, transparent)" stroke="${C.acc}" stroke-width="2"/>
  <text x="${X(W0 / 2)}" y="${Y(H0) + 18}" text-anchor="middle" font-size="12" fill="${C.ink}">${W0}</text>
  <text x="${X(0) - 8}" y="${Y(H0 / 2)}" text-anchor="end" font-size="12" fill="${C.ink}">${H0}</text>
  <text x="${X((W0 - cw) / 2)}" y="${Y(0) - 6}" text-anchor="middle" font-size="12" fill="${C.ink}">${W0 - cw}</text>
  <text x="${X(W0) + 6}" y="${Y((ch + H0) / 2)}" font-size="12" fill="${C.ink}">${H0 - ch}</text></svg>`;
}
export function triangleAngles(a, b, c, unknown = 2) {
  const W = 280, H = 170; const P = [[30, 145], [250, 145], [110, 25]];
  const labels = [a, b, c].map((v, i) => (i === unknown ? '?' : `${v}°`));
  const off = [[18, -8], [-34, -8], [-6, 30]];
  return `<svg viewBox="0 0 ${W} ${H}" class="viz geo"><path d="M${P[0]} L${P[1]} L${P[2]}Z" fill="color-mix(in srgb, var(--blue) 15%, transparent)" stroke="${C.blue}" stroke-width="2"/>
  ${P.map((p, i) => `<text x="${p[0] + off[i][0]}" y="${p[1] + off[i][1]}" font-size="14" font-weight="700" fill="${i === unknown ? C.amber : C.ink}">${labels[i]}</text>`).join('')}</svg>`;
}
export function rightTriangle(a, b, c, unknown) {
  const W = 260, H = 170;
  const L = (v, k) => (k === unknown ? '?' : v);
  return `<svg viewBox="0 0 ${W} ${H}" class="viz geo"><path d="M40,140 L220,140 L40,30Z" fill="color-mix(in srgb, var(--acc) 15%, transparent)" stroke="${C.acc}" stroke-width="2"/>
  <rect x="40" y="128" width="12" height="12" fill="none" stroke="${C.ink}"/>
  <text x="130" y="160" text-anchor="middle" font-size="14" fill="${unknown === 'b' ? C.amber : C.ink}">${L(b, 'b')}</text>
  <text x="26" y="90" text-anchor="end" font-size="14" fill="${unknown === 'a' ? C.amber : C.ink}">${L(a, 'a')}</text>
  <text x="140" y="78" font-size="14" fill="${unknown === 'c' ? C.amber : C.ink}">${L(c, 'c')}</text></svg>`;
}
export function lineAngle(a) {
  return `<svg viewBox="0 0 280 120" class="viz geo"><line x1="20" y1="100" x2="260" y2="100" stroke="${C.ink}" stroke-width="2"/>
  <line x1="140" y1="100" x2="${140 + 110 * Math.cos(a * Math.PI / 180)}" y2="${100 - 110 * Math.sin(a * Math.PI / 180)}" stroke="${C.blue}" stroke-width="2"/>
  <text x="${140 + 30}" y="92" font-size="13" fill="${C.ink}">${a}°</text><text x="${140 - 50}" y="92" font-size="14" font-weight="700" fill="${C.amber}">?</text></svg>`;
}
// Cuadrícula con celdas sombreadas
export function shadedGrid(rows, cols, shaded) {
  const S = 22; let s = `<svg viewBox="0 0 ${cols * S + 4} ${rows * S + 4}" class="viz grid" style="max-width:${cols * S + 4}px">`;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const on = shaded.has(r * cols + c);
    s += `<rect x="${c * S + 2}" y="${r * S + 2}" width="${S - 2}" height="${S - 2}" rx="2" fill="${on ? C.acc : 'transparent'}" stroke="${C.mute}" stroke-width="0.8"/>`;
  }
  return s + '</svg>';
}
// Balanza con figuras (álgebra visual)
const SHAPES = {
  sq: (x, y, c) => `<rect x="${x - 10}" y="${y - 10}" width="20" height="20" rx="3" fill="${c}"/>`,
  ci: (x, y, c) => `<circle cx="${x}" cy="${y}" r="10" fill="${c}"/>`,
  tr: (x, y, c) => `<path d="M${x},${y - 11} L${x + 11},${y + 9} L${x - 11},${y + 9}Z" fill="${c}"/>`,
};
export const SHAPE_COL = { sq: 'var(--blue)', ci: 'var(--amber)', tr: 'var(--acc)' };
export function shapeIcon(k) { return `<svg viewBox="0 0 24 24" class="shp">${SHAPES[k](12, 12, SHAPE_COL[k])}</svg>`; }
export function shapeBalance(left, right) {
  // left: [['sq',2],['ci',1]], right: number
  const W = 300, H = 110;
  const items = []; left.forEach(([k, n]) => { for (let i = 0; i < n; i++) items.push(k); });
  let s = `<svg viewBox="0 0 ${W} ${H}" class="viz">`;
  s += `<line x1="20" y1="70" x2="280" y2="70" stroke="${C.mute}" stroke-width="3"/><path d="M150,70 L136,104 L164,104z" fill="${C.mute}"/>`;
  s += `<path d="M25,70 Q75,82 125,70" stroke="${C.mute}" fill="none"/><path d="M175,70 Q225,82 275,70" stroke="${C.mute}" fill="none"/>`;
  items.forEach((k, i) => { const col = i % 4, row = Math.floor(i / 4); s += SHAPES[k](40 + col * 26, 55 - row * 24, SHAPE_COL[k]); });
  s += `<rect x="198" y="34" width="54" height="30" rx="6" fill="var(--card2)" stroke="${C.mute}"/><text x="225" y="55" text-anchor="middle" font-size="16" font-weight="700" fill="${C.ink}">${right}</text>`;
  return s + '</svg>';
}
// Pirámide numérica (cada bloque = suma de los dos de abajo)
export function pyramid(levels) {
  // levels[0] = base (array), valores null => "?"
  return `<div class="pyr">${[...levels].reverse().map((lv) => `<div class="pyr-row">${lv.map((v) => `<span class="pyr-c ${v === null ? 'q' : ''}">${v === null ? '?' : fmt(v)}</span>`).join('')}</div>`).join('')}</div>`;
}
export function magicSquare(cells) {
  return `<div class="magic">${cells.map((v) => `<span class="${v === null ? 'q' : ''}">${v === null ? '?' : v}</span>`).join('')}</div>`;
}
// Figuras con palitos (patrones)
export function stickPattern(kind, counts) {
  // kind 'sq' (cuadrados en fila) o 'tri' (triángulos en fila); counts = [1,2,3]
  const figs = counts.map((n) => {
    const S = 18; let s = '';
    if (kind === 'sq') {
      const W = n * S + 6; s = `<svg viewBox="0 0 ${W} ${S + 6}" style="width:${W * 1.4}px">`;
      for (let i = 0; i <= n; i++) s += `<line x1="${3 + i * S}" y1="3" x2="${3 + i * S}" y2="${3 + S}" stroke="${C.amber}" stroke-width="2.5" stroke-linecap="round"/>`;
      for (let i = 0; i < n; i++) s += `<line x1="${3 + i * S}" y1="3" x2="${3 + (i + 1) * S}" y2="3" stroke="${C.amber}" stroke-width="2.5" stroke-linecap="round"/><line x1="${3 + i * S}" y1="${3 + S}" x2="${3 + (i + 1) * S}" y2="${3 + S}" stroke="${C.amber}" stroke-width="2.5" stroke-linecap="round"/>`;
    } else {
      const W = (n + 1) * S / 2 + 6; s = `<svg viewBox="0 0 ${W + 4} ${S + 6}" style="width:${(W + 4) * 1.4}px">`;
      for (let i = 0; i < n; i++) {
        const up = i % 2 === 0; const x = 3 + i * S / 2;
        const p = up ? [[x, 3 + S], [x + S / 2, 3], [x + S, 3 + S]] : [[x, 3], [x + S / 2, 3 + S], [x + S, 3]];
        s += `<path d="M${p[0]} L${p[1]} L${p[2]} Z" fill="none" stroke="${C.amber}" stroke-width="2.5" stroke-linejoin="round"/>`;
      }
    }
    return `<div class="stk">${s}</svg><span>Fig ${counts.indexOf(n) + 1}</span></div>`;
  });
  return `<div class="stks">${figs.join('')}</div>`;
}
export { M };
