// =============================================================
// expr.js — Motor matemático: fracciones exactas, analizador de
// expresiones, evaluación, comparación de respuestas y dibujo
// (HTML) de expresiones con fracciones apiladas y exponentes.
// =============================================================

export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
const BIG = 2 ** 52;

// ---------- Número racional exacto ----------
export class Q {
  constructor(n, d = 1) {
    if (d === 0) throw new Error('div0');
    if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error('nonint');
    if (Math.abs(n) > BIG || Math.abs(d) > BIG) throw new Error('big');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    this.n = n / g + 0; this.d = d / g;
  }
  static of(x) {
    if (x instanceof Q) return x;
    if (typeof x === 'number') {
      if (Number.isInteger(x)) return new Q(x, 1);
      return Q.dec(String(x));
    }
    if (typeof x === 'string') {
      if (x.includes('/')) { const [a, b] = x.split('/'); return new Q(parseInt(a), parseInt(b)); }
      return Q.dec(x);
    }
    throw new Error('bad Q');
  }
  static dec(s) {
    s = s.replace(',', '.');
    let neg = s.startsWith('-'); if (neg) s = s.slice(1);
    const [i, f = ''] = s.split('.');
    const d = 10 ** f.length;
    const q = new Q(parseInt(i || '0') * d + parseInt(f || '0'), d);
    return neg ? q.neg() : q;
  }
  add(o) { o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Q.of(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o) { o = Q.of(o); if (o.n === 0) throw new Error('div0'); return new Q(this.n * o.d, this.d * o.n); }
  neg() { return new Q(-this.n, this.d); }
  pow(k) {
    if (!(k instanceof Q)) k = Q.of(k);
    if (k.d !== 1) {
      if (k.d === 2) { const r = this.sqrt(); return r.pow(new Q(k.n, 1)); }
      throw new Error('irr');
    }
    let e = k.n;
    if (e === 0) { if (this.n === 0) throw new Error('0^0'); return new Q(1); }
    let base = e < 0 ? new Q(this.d, this.n) : this; e = Math.abs(e);
    if (e > 64) throw new Error('big');
    let r = new Q(1);
    for (let i = 0; i < e; i++) r = r.mul(base);
    return r;
  }
  sqrt() {
    if (this.n < 0) throw new Error('irr');
    const a = Math.round(Math.sqrt(this.n)), b = Math.round(Math.sqrt(this.d));
    if (a * a !== this.n || b * b !== this.d) throw new Error('irr');
    return new Q(a, b);
  }
  eq(o) { o = Q.of(o); return this.n === o.n && this.d === o.d; }
  cmp(o) { o = Q.of(o); return this.n * o.d - o.n * this.d; }
  isInt() { return this.d === 1; }
  num() { return this.n / this.d; }
  abs() { return new Q(Math.abs(this.n), this.d); }
  isTerminating() { let d = this.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; }
  toString() { return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`; }
  // Texto decimal con coma (solo si es exacto)
  toDec() {
    if (this.d === 1) return `${this.n}`.replace('-', '−');
    if (!this.isTerminating()) return null;
    let s = (this.n / this.d).toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('.', ',').replace('-', '−');
  }
}

// ---------- Tokenizador de texto ----------
// Sintaxis de texto (para los generadores): 2x^2-3/4+(x+1)(x-2), sqrt(9), 25%
// '/' produce fracción apilada; ':' o '÷' división en línea; '*' '·' '×' multiplicación.
const OPMAP = { '+': '+', '-': '-', '−': '-', '–': '-', '*': '*', '·': '*', '×': '*', '/': '/', ':': ':', '÷': ':', '^': '^', '%': '%' };
export function tokenizeString(s) {
  const toks = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === ' ') { i++; continue; }
    if (/[0-9]/.test(c) || ((c === ',' || c === '.') && /[0-9]/.test(s[i + 1] || ''))) {
      let j = i; let seenDec = false;
      while (j < s.length) {
        const ch = s[j];
        if (/[0-9]/.test(ch)) { j++; continue; }
        if ((ch === ',' || ch === '.') && !seenDec && /[0-9]/.test(s[j + 1] || '')) { seenDec = true; j++; continue; }
        break;
      }
      const raw = s.slice(i, j);
      toks.push({ k: 'num', v: Q.dec(raw), raw: raw.replace('.', ',') });
      i = j; continue;
    }
    if (s.startsWith('sqrt', i) || c === '√') {
      i += c === '√' ? 1 : 4;
      toks.push({ k: 'fn', v: 'sqrt' }); continue;
    }
    if (s.startsWith('<=', i) || c === '≤') { toks.push({ k: 'rel', v: '≤' }); i += c === '≤' ? 1 : 2; continue; }
    if (s.startsWith('>=', i) || c === '≥') { toks.push({ k: 'rel', v: '≥' }); i += c === '≥' ? 1 : 2; continue; }
    if (c === '=' || c === '<' || c === '>') { toks.push({ k: 'rel', v: c }); i++; continue; }
    if (c === ';') { toks.push({ k: 'sep' }); i++; continue; }
    if (c === '(' || c === '[' || c === '{') { toks.push({ k: 'lp', v: c }); i++; continue; }
    if (c === ')' || c === ']' || c === '}') { toks.push({ k: 'rp', v: c }); i++; continue; }
    if (c === 'π') { toks.push({ k: 'var', v: 'π' }); i++; continue; }
    if (/[a-zA-Z]/.test(c)) { toks.push({ k: 'var', v: c }); i++; continue; }
    if (c === '²' || c === '³') { toks.push({ k: 'sup', ast: { t: 'num', v: new Q(c === '²' ? 2 : 3) } }); i++; continue; }
    if (OPMAP[c]) { toks.push({ k: 'op', v: OPMAP[c] }); i++; continue; }
    if (c === ',') { toks.push({ k: 'sep' }); i++; continue; } // coma suelta = separador
    throw new SyntaxError(`Símbolo no reconocido: ${c}`);
  }
  return toks;
}

// ---------- Analizador (descenso recursivo) ----------
export function parseTokens(toks) {
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const isOp = (v) => peek() && peek().k === 'op' && peek().v === v;
  const startsAtom = (t) => t && (t.k === 'num' || t.k === 'var' || t.k === 'lp' || t.k === 'group' || t.k === 'fn');

  function list() {
    const items = [rel()];
    while (peek() && peek().k === 'sep') { next(); if (peek()) items.push(rel()); }
    return items.length === 1 ? items[0] : { t: 'list', items };
  }
  function rel() {
    const a = expr();
    if (peek() && peek().k === 'rel') { const op = next().v; const b = expr(); return { t: 'rel', op, a, b }; }
    return a;
  }
  function expr() {
    let a = term();
    while (isOp('+') || isOp('-')) {
      const op = next().v; const b = term();
      a = { t: op === '+' ? 'add' : 'sub', a, b };
    }
    return a;
  }
  function term() {
    let a = unary();
    for (;;) {
      if (isOp('*')) { next(); a = { t: 'mul', a, b: unary() }; continue; }
      if (isOp(':')) { next(); a = { t: 'div', a, b: unary() }; continue; }
      if (isOp('/')) { next(); a = { t: 'frac', a, b: unary() }; continue; }
      if (startsAtom(peek())) { a = { t: 'mul', a, b: power(), imp: true }; continue; }
      return a;
    }
  }
  function unary() {
    if (isOp('-')) { next(); return { t: 'neg', a: unary() }; }
    if (isOp('+')) { next(); return unary(); }
    return power();
  }
  function power() {
    let base = postfix();
    for (;;) {
      if (peek() && peek().k === 'sup') { base = { t: 'pow', a: base, b: next().ast }; continue; }
      if (isOp('^')) { next(); const e = unary(); base = { t: 'pow', a: base, b: e }; continue; }
      break;
    }
    if (isOp('%')) { next(); base = { t: 'pct', a: base }; }
    return base;
  }
  function postfix() { return atom(); }
  function atom() {
    const t = next();
    if (!t) throw new SyntaxError('Falta un número o expresión');
    if (t.k === 'num') return { t: 'num', v: t.v, raw: t.raw };
    if (t.k === 'var') return { t: 'var', n: t.v };
    if (t.k === 'group') return t.ast;
    if (t.k === 'fn') {
      const arg = (peek() && peek().k === 'lp') ? atom() : power();
      return { t: 'sqrt', a: arg.t === 'paren' ? arg.a : arg };
    }
    if (t.k === 'lp') {
      const e = expr();
      const r = next();
      if (!r || r.k !== 'rp') throw new SyntaxError('Falta cerrar un paréntesis');
      return { t: 'paren', a: e, br: t.v };
    }
    if (t.k === 'sup') throw new SyntaxError('Exponente sin base');
    throw new SyntaxError('Expresión incompleta');
  }
  if (!toks.length) throw new SyntaxError('Escribe tu respuesta');
  const r = list();
  if (p < toks.length) throw new SyntaxError('Revisa la expresión: algo sobra o falta');
  return r;
}

export const parse = (s) => parseTokens(tokenizeString(s));

// ---------- Evaluación ----------
export function evalQ(n, env = {}) {
  switch (n.t) {
    case 'num': return n.v;
    case 'var': if (n.n in env) return Q.of(env[n.n]); throw new Error('var');
    case 'add': return evalQ(n.a, env).add(evalQ(n.b, env));
    case 'sub': return evalQ(n.a, env).sub(evalQ(n.b, env));
    case 'mul': return evalQ(n.a, env).mul(evalQ(n.b, env));
    case 'div': case 'frac': return evalQ(n.a, env).div(evalQ(n.b, env));
    case 'neg': return evalQ(n.a, env).neg();
    case 'paren': return evalQ(n.a, env);
    case 'pow': return evalQ(n.a, env).pow(evalQ(n.b, env));
    case 'sqrt': return evalQ(n.a, env).sqrt();
    case 'pct': return evalQ(n.a, env).div(100);
    default: throw new Error('noeval');
  }
}
export function evalF(n, env = {}) {
  switch (n.t) {
    case 'num': return n.v.num();
    case 'var': if (n.n === 'π' && !('π' in env)) return Math.PI; if (n.n in env) return env[n.n]; throw new Error('var');
    case 'add': return evalF(n.a, env) + evalF(n.b, env);
    case 'sub': return evalF(n.a, env) - evalF(n.b, env);
    case 'mul': return evalF(n.a, env) * evalF(n.b, env);
    case 'div': case 'frac': return evalF(n.a, env) / evalF(n.b, env);
    case 'neg': return -evalF(n.a, env);
    case 'paren': return evalF(n.a, env);
    case 'pow': return Math.pow(evalF(n.a, env), evalF(n.b, env));
    case 'sqrt': return Math.sqrt(evalF(n.a, env));
    case 'pct': return evalF(n.a, env) / 100;
    default: throw new Error('noeval');
  }
}
export function varsOf(n, s = new Set()) {
  if (!n || typeof n !== 'object') return s;
  if (n.t === 'var' && n.n !== 'π') s.add(n.n);
  for (const k of ['a', 'b']) if (n[k]) varsOf(n[k], s);
  if (n.items) n.items.forEach((i) => varsOf(i, s));
  return s;
}
export function tryQ(n, env) { try { return evalQ(n, env); } catch { return null; } }

const SAMPLE = [1.37, -2.21, 0.53, 3.11, -0.77, 2.63, -1.49, 4.07];
// ¿Dos expresiones son equivalentes? (prueba en varios puntos)
export function equiv(a, b) {
  const vs = [...new Set([...varsOf(a), ...varsOf(b)])];
  let ok = 0;
  for (let k = 0; k < SAMPLE.length; k++) {
    const env = {}; vs.forEach((v, i) => { env[v] = SAMPLE[(k + i * 3) % SAMPLE.length] + i * 0.31; });
    let x, y;
    try { x = evalF(a, env); y = evalF(b, env); } catch { return false; }
    if (!isFinite(x) || !isFinite(y)) continue;
    if (Math.abs(x - y) > 1e-7 * Math.max(1, Math.abs(x), Math.abs(y))) return false;
    ok++;
  }
  return ok >= 3;
}

// Solución de una ecuación lineal en una variable (o null)
export function solveLinear(rel) {
  if (!rel || rel.t !== 'rel' || rel.op !== '=') return null;
  const vs = [...varsOf(rel)];
  if (vs.length !== 1) return null;
  const v = vs[0];
  const f = (x) => evalQ({ t: 'sub', a: rel.a, b: rel.b }, { [v]: x });
  try {
    const f0 = f(new Q(0)), f1 = f(new Q(1)), f3 = f(new Q(3));
    const m = f1.sub(f0);
    if (!f3.sub(f0).eq(m.mul(3))) return { v, nonlinear: true };
    if (m.n === 0) return { v, identity: f0.n === 0, none: f0.n !== 0 };
    return { v, x: f0.neg().div(m) };
  } catch { return null; }
}

// ---------- Formas (para exigir respuesta final) ----------
const lit = (n) => n.t === 'num' || (n.t === 'neg' && n.a.t === 'num');
export function isFinalNumber(n) {
  if (n.t === 'paren') return isFinalNumber(n.a);
  if (lit(n)) return true;
  if (n.t === 'pct') return lit(n.a);
  if (n.t === 'neg') return isFinalNumber(n.a) && n.a.t !== 'neg';
  if (n.t === 'frac') {
    const a = n.a.t === 'neg' ? n.a.a : n.a;
    return a.t === 'num' && n.b.t === 'num' && a.v.isInt() && n.b.v.isInt();
  }
  return false;
}
export function isReducedFrac(n) {
  if (n.t === 'neg' || n.t === 'paren') return isReducedFrac(n.a);
  if (n.t !== 'frac') return true;
  const a = n.a.t === 'neg' ? n.a.a : n.a;
  return gcd(a.v.n, n.b.v.n) === 1 && n.b.v.n !== 1;
}
export function countNodes(n, t) {
  if (!n || typeof n !== 'object') return 0;
  return (n.t === t ? 1 : 0) + countNodes(n.a, t) + countNodes(n.b, t) + (n.items ? n.items.reduce((s, i) => s + countNodes(i, t), 0) : 0);
}
// términos aditivos de primer nivel
export function topTerms(n) {
  if (n.t === 'add' || n.t === 'sub') return topTerms(n.a) + topTerms(n.b);
  return 1;
}
// ¿hay potencias con base compuesta, paréntesis o productos de sumas? -> no desarrollado
export function isExpanded(n) {
  if (!n || typeof n !== 'object') return true;
  if (n.t === 'paren') return false;
  if (n.t === 'pow' && !(n.a.t === 'var' || n.a.t === 'num')) return false;
  return isExpanded(n.a) && isExpanded(n.b);
}
// variable repetida en un mismo término (x·x) o potencia de potencia sin reducir
export function hasRepeatedVar(n) {
  const terms = [];
  (function split(m) { if (m.t === 'add' || m.t === 'sub') { split(m.a); split(m.b); } else terms.push(m); })(n);
  return terms.some((t) => {
    const seen = {}; let rep = false;
    (function walk(m) {
      if (!m) return;
      if (m.t === 'var') { if (seen[m.n]) rep = true; seen[m.n] = 1; }
      if (m.t === 'pow' && m.a.t === 'pow') rep = true;
      walk(m.a); walk(m.b);
    })(t);
    return rep;
  });
}
export function hasNegExp(n) {
  if (!n || typeof n !== 'object') return false;
  if (n.t === 'pow') { const e = tryQ(n.b); if (e && e.n < 0) return true; }
  return hasNegExp(n.a) || hasNegExp(n.b);
}
export function isFactored(n) {
  if (n.t === 'neg') return isFactored(n.a);
  if (n.t === 'mul') {
    const f = []; (function sp(m) { if (m.t === 'mul') { sp(m.a); sp(m.b); } else f.push(m); })(n);
    return f.some((x) => x.t === 'paren' || (x.t === 'pow' && x.a.t === 'paren'));
  }
  if (n.t === 'pow' && n.a.t === 'paren') return true;
  return false;
}

// ---------- Dibujo (HTML) ----------
const PREC = { add: 1, sub: 1, neg: 2, mul: 3, div: 3, frac: 5, pow: 6, pct: 6, sqrt: 7, num: 7, var: 7, paren: 7 };
const isNegLit = (n) => (n.t === 'num' && n.v.n < 0) || n.t === 'neg';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function numHTML(q, raw, opts) {
  if (raw && !raw.startsWith('-')) return esc(raw);
  const neg = q.n < 0; const a = q.abs();
  let body;
  if (a.d === 1) body = `${a.n}`;
  else if (opts.dec && a.isTerminating()) body = a.toDec();
  else body = `<span class="fr"><span class="nu">${a.n}</span><span class="de">${a.d}</span></span>`;
  return (neg ? '−' : '') + body;
}
const startsNeg = (m) => { while (m && (m.t === 'mul' || m.t === 'div' || m.t === 'pow')) m = m.a; return m && isNegLit(m); };
const wrap = (h) => `<span class="pa">(</span>${h}<span class="pa">)</span>`;
export function toHTML(n, opts = {}) {
  const H = (m) => toHTML(m, opts);
  const hl = (m, h) => (opts.hl && opts.hl === m ? `<span class="${opts.hlClass || 'hl'}">${h}</span>` : h);
  let out;
  switch (n.t) {
    case 'num': out = numHTML(n.v, n.raw, opts); break;
    case 'var': out = `<i>${esc(n.n)}</i>`; break;
    case 'paren': {
      const [l, r] = n.br === '[' ? ['[', ']'] : n.br === '{' ? ['{', '}'] : ['(', ')'];
      out = `<span class="pa">${l}</span>${H(n.a)}<span class="pa">${r}</span>`; break;
    }
    case 'add': case 'sub': {
      let b = H(n.b);
      if (isNegLit(n.b) || PREC[n.b.t] <= 1 || startsNeg(n.b)) b = wrap(b);
      out = `${H(n.a)}<span class="op">${n.t === 'add' ? '+' : '−'}</span>${b}`; break;
    }
    case 'neg': {
      let a = H(n.a); if (PREC[n.a.t] <= 2 || isNegLit(n.a)) a = wrap(a);
      out = `−${a}`; break;
    }
    case 'mul': case 'div': {
      let a = H(n.a), b = H(n.b);
      if (PREC[n.a.t] < 3 && !(n.a.t === 'neg' && PREC[n.a.a.t] > 2)) a = wrap(a);
      if (PREC[n.b.t] <= 3 || isNegLit(n.b)) b = wrap(b);
      const startsNum = (m) => m.t === 'num' || (m.t === 'pow' && m.a.t === 'num') || m.t === 'frac';
      const implicit = n.t === 'mul' && n.imp && !startsNum(n.b) && !isNegLit(n.b);
      out = implicit ? `${a}${b}` : `${a}<span class="op">${n.t === 'mul' ? '·' : '÷'}</span>${b}`;
      break;
    }
    case 'frac': {
      const strip = (m) => (m.t === 'paren' ? m.a : m);
      out = `<span class="fr"><span class="nu">${H(strip(n.a))}</span><span class="de">${H(strip(n.b))}</span></span>`; break;
    }
    case 'pow': {
      let a = H(n.a);
      if (PREC[n.a.t] < 7 || isNegLit(n.a)) a = wrap(a);
      out = `${a}<sup>${H(n.b)}</sup>`; break;
    }
    case 'sqrt': out = `<span class="sq">√<span class="sqb">${H(n.a)}</span></span>`; break;
    case 'pct': out = `${H(n.a)}%`; break;
    case 'rel': out = `${H(n.a)}<span class="op">${n.op}</span>${H(n.b)}`; break;
    case 'list': out = n.items.map(H).join('<span class="op">;</span>'); break;
    default: out = '?';
  }
  return hl(n, out);
}
// Atajo: texto -> HTML matemático
export function M(s, opts) {
  try { return `<span class="m">${toHTML(parse(s), opts)}</span>`; } catch (e) { return `<span class="m">${esc(s)}</span>`; }
}
export function qHTML(q, opts = {}) { return `<span class="m">${numHTML(Q.of(q), null, opts)}</span>`; }

// ---------- Evaluación paso a paso (jerarquía de operaciones) ----------
const isLit = (n) => n.t === 'num' || (n.t === 'neg' && n.a.t === 'num') || (n.t === 'paren' && isLit(n.a));
const litQ = (n) => (n.t === 'num' ? n.v : n.t === 'neg' ? n.a.v.neg() : litQ(n.a));
function normalize(n) {
  if (!n || typeof n !== 'object' || n.t === 'num') return n;
  if (n.t === 'neg' && n.a.t === 'num') return { t: 'num', v: n.a.v.neg() };
  const m = { ...n };
  if (m.a) m.a = normalize(m.a);
  if (m.b) m.b = normalize(m.b);
  if (m.t === 'paren' && m.a.t === 'num') return m.a;
  if (m.t === 'neg' && m.a.t === 'num') return { t: 'num', v: m.a.v.neg() };
  return m;
}
function findTarget(n) {
  if (!n || typeof n !== 'object' || n.t === 'num' || n.t === 'var') return null;
  for (const k of ['a', 'b']) { if (n[k]) { const r = findTarget(n[k]); if (r) return r; } }
  const kids = ['a', 'b'].filter((k) => n[k]).map((k) => n[k]);
  if (kids.every((c) => c.t === 'num')) return n;
  return null;
}
function replaceNode(n, target, rep) {
  if (n === target) return rep;
  if (!n || typeof n !== 'object') return n;
  const m = { ...n };
  if (m.a) m.a = replaceNode(m.a, target, rep);
  if (m.b) m.b = replaceNode(m.b, target, rep);
  return m;
}
const OPNAME = { add: 'suma', sub: 'resta', mul: 'multiplicación', div: 'división', frac: 'división', pow: 'potencia', sqrt: 'raíz', pct: 'porcentaje', neg: 'signo' };
export function evalSteps(ast, max = 30) {
  let cur = normalize(ast);
  const steps = [];
  for (let i = 0; i < max; i++) {
    const t = findTarget(cur);
    if (!t) break;
    let v;
    try { v = evalQ(t); } catch (e) { steps.push({ html: toHTML(cur), err: e.message }); return steps; }
    const before = toHTML(cur, { hl: t });
    const rep = { t: 'num', v };
    steps.push({ html: before, op: t.t, piece: toHTML(t), res: numHTML(v, null, {}), resQ: v, node: t });
    cur = normalize(replaceNode(cur, t, rep));
  }
  steps.push({ html: toHTML(cur), final: true });
  return steps;
}
export { OPNAME, isLit, litQ };
