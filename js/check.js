// =============================================================
// check.js — Revisa la respuesta: correcta, "casi" (le falta
// simplificar/terminar, sin castigo) o incorrecta (con el error típico).
// =============================================================
import { Q, parse, evalQ, evalF, tryQ, varsOf, equiv, isFinalNumber, isReducedFrac, isExpanded, topTerms, hasRepeatedVar, hasNegExp, isFactored, countNodes, toHTML, solveLinear } from './expr.js';

const ok = (msg) => ({ status: 'ok', msg });
const almost = (msg) => ({ status: 'almost', msg });
const bad = (msg, trap) => ({ status: 'bad', msg, trap });

function unwrapEq(ast, v) {
  if (ast.t === 'rel' && ast.op === '=' && ast.a.t === 'var' && (!v || ast.a.n === v) && varsOf(ast.b).size === 0) return ast.b;
  return ast;
}
function qOfTrap(v) { try { return v == null || Array.isArray(v) || typeof v === 'string' && /[a-z]/i.test(v) ? null : Q.of(v); } catch { return null; } }

function hasDecimal(n) { if (!n || typeof n !== 'object') return false; if (n.t === 'num' && n.raw && n.raw.includes(',')) return true; return hasDecimal(n.a) || hasDecimal(n.b); }

function numberCheck(prob, ast) {
  const A = prob.ans; const exp = Q.of(A.v);
  let node = unwrapEq(ast, A.var);
  if (node.t === 'rel') return almost(A.type === 'sol' ? 'Sigue despejando hasta llegar a <b>' + (A.var || 'x') + ' = número</b>.' : 'Escribe solo el número final.');
  if (node.t === 'list') return almost('Escribe una sola respuesta.');
  if (varsOf(node).size) return almost('Tu respuesta debe ser un <b>número</b> (sin letras).');
  if (A.pct && node.t === 'pct') node = node.a;
  const val = tryQ(node);
  if (!val) {
    let f; try { f = evalF(node); } catch { f = NaN; }
    if (isFinite(f) && Math.abs(f - exp.num()) < 0.01 * Math.max(1, Math.abs(exp.num()))) return almost('Casi: usa la <b>fracción exacta</b> en lugar del decimal aproximado.');
    return bad('Esa respuesta no es correcta.');
  }
  if (val.eq(exp)) {
    if (!isFinalNumber(node)) return almost('El valor es correcto, pero <b>termina de calcular</b>: escribe un solo número.');
    if (!isReducedFrac(node)) return almost(`¡Bien! Pero <b>simplifica</b> la fracción: ${toHTML(node)} = ${toHTML({ t: 'num', v: exp })}`);
    return ok();
  }
  // decimal aproximado de una fracción no exacta
  const typedDec = hasDecimal(node);
  if (typedDec && !exp.isTerminating() && Math.abs(val.num() - exp.num()) < 0.006) return almost('Casi: usa la <b>fracción exacta</b> en lugar del decimal.');
  for (const t of prob.traps || []) {
    const tq = qOfTrap(t.v);
    if (tq && !tq.eq(exp) && tq.eq(val)) return bad(t.msg, t);
  }
  if (val.eq(exp.neg())) return bad('El número está bien, pero el <b>signo</b> no. Revisa la regla de signos.', { err: prob.signErr || null });
  return bad('No es la respuesta correcta.');
}

function gcfCheck(prob, ast) {
  const { g, k } = prob.ans.gcf; const vname = 'x';
  let n = ast; if (n.t === 'neg') n = n.a;
  const fs = []; (function sp(m) { if (m.t === 'mul') { sp(m.a); sp(m.b); } else fs.push(m); })(n);
  const mono = fs.filter((f) => f.t !== 'paren');
  let m1 = 1, m2 = 2 ** 0;
  if (mono.length) {
    const prod = mono.reduce((a, b) => ({ t: 'mul', a, b }));
    m1 = Math.abs(evalF(prod, { [vname]: 1 })); m2 = Math.abs(evalF(prod, { [vname]: 2 }));
  }
  const kk = Math.round(Math.log2(m2 / m1));
  if (Math.round(m1) < g || kk < k) return almost('Factorizaste, pero <b>aún queda algo en común</b> dentro del paréntesis. Saca el factor común <b>más grande</b>.');
  return null;
}

function exprCheck(prob, ast) {
  const A = prob.ans; const exp = parse(A.v);
  if (ast.t === 'rel' || ast.t === 'list') return almost('Escribe solo la expresión final (sin "=").');
  if (equiv(ast, exp)) {
    const f = A.form || [];
    if (f.includes('factored') && !isFactored(ast)) return almost('Es equivalente, pero debe quedar <b>factorizado</b> (como multiplicación de paréntesis).');
    if (f.includes('gcf')) { const r = gcfCheck(prob, ast); if (r) return r; }
    if (f.includes('expanded') && !isExpanded(ast)) return almost('Es equivalente, pero falta <b>desarrollar</b>: quita los paréntesis multiplicando.');
    if (f.includes('reduced') && topTerms(ast) > topTerms(exp)) return almost('Casi: <b>junta los términos semejantes</b>.');
    if (f.includes('simplePow') && (hasRepeatedVar(ast) || countNodes(ast, 'pow') > countNodes(exp, 'pow') || countNodes(ast, 'paren') > 0)) return almost('Es equivalente, pero <b>simplifica</b>: una sola potencia por letra.');
    if (f.includes('posExp') && hasNegExp(ast)) return almost('Escríbelo con <b>exponente positivo</b> (usa fracción).');
    return ok();
  }
  for (const t of prob.traps || []) {
    if (typeof t.v !== 'string') continue;
    try { const ta = parse(t.v); if (!equiv(ta, exp) && equiv(ta, ast)) return bad(t.msg, t); } catch { /* */ }
  }
  return bad('No es equivalente a la respuesta correcta.');
}

function listItems(ast) { return ast.t === 'list' ? ast.items : [ast]; }

function setCheck(prob, ast) {
  const exp = prob.ans.v;
  const vals = [];
  for (const it of listItems(ast)) {
    const n = unwrapEq(it);
    if (varsOf(n).size) return almost('Escribe cada solución como número, separadas con <b>;</b>  (ej.: 2; −3)');
    const q = tryQ(n); if (!q) return bad('Revisa tus soluciones.');
    if (!vals.some((v) => v.eq(q))) vals.push(q);
  }
  const same = (A, B) => A.length === B.length && A.every((a) => B.some((b) => Q.of(b).eq(a)));
  if (same(vals, exp)) return ok();
  if (vals.length < exp.length && vals.every((v) => exp.some((e) => e.eq(v)))) {
    const t = (prob.traps || []).find((t) => Array.isArray(t.v) && t.v.length === vals.length);
    return bad(t ? t.msg : 'Te falta una solución: hay <b>' + exp.length + '</b>.', t || { err: 'cuad' });
  }
  for (const t of prob.traps || []) if (Array.isArray(t.v) && same(vals, t.v.map((x) => Q.of(x)))) return bad(t.msg, t);
  return bad('Esas no son las soluciones. Comprueba reemplazando en la ecuación.');
}

function sysCheck(prob, ast) {
  const exp = prob.ans.v; const items = listItems(ast);
  if (items.length !== 2) return almost('Escribe las dos respuestas así: <b>x=3; y=2</b>');
  const got = {};
  items.forEach((it, i) => {
    if (it.t === 'rel' && it.a.t === 'var') got[it.a.n] = tryQ(it.b);
    else got[i === 0 ? 'x' : 'y'] = tryQ(it);
  });
  if (!got.x || !got.y) return almost('Escribe las dos respuestas así: <b>x=3; y=2</b>');
  if (got.x.eq(exp.x) && got.y.eq(exp.y)) return ok();
  if (got.x.eq(exp.y) && got.y.eq(exp.x)) return bad('Están al revés: revisa cuál es x y cuál es y.');
  if (got.x.eq(exp.x) || got.y.eq(exp.y)) return bad('Una está bien y la otra no. Reemplaza en ambas ecuaciones para comprobar.', { err: 'sistema' });
  return bad('No es la solución. Comprueba reemplazando en las dos ecuaciones.', { err: 'sistema' });
}

export function check(prob, ast) {
  try {
    switch (prob.ans.type) {
      case 'num': case 'sol': return numberCheck(prob, ast);
      case 'expr': return exprCheck(prob, ast);
      case 'set': return setCheck(prob, ast);
      case 'sys': return sysCheck(prob, ast);
      default: return bad('Tipo de respuesta desconocido');
    }
  } catch (e) {
    return almost('No pude leer tu respuesta: ' + (e.message || 'revísala'));
  }
}

// Texto HTML de la respuesta correcta
export function answerHTML(prob) {
  const A = prob.ans;
  const qh = (q, dec) => toHTML({ t: 'num', v: Q.of(q) }, { dec });
  switch (A.type) {
    case 'num': return `<span class="m">${qh(A.v, A.dec)}${A.pct ? '%' : ''}</span>`;
    case 'sol': return `<span class="m"><i>${A.var || 'x'}</i> = ${qh(A.v, A.dec)}</span>`;
    case 'expr': return `<span class="m">${toHTML(parse(A.v))}</span>`;
    case 'set': return `<span class="m">${A.v.map((v) => `<i>x</i> = ${qh(v)}`).join(' ; ')}</span>`;
    case 'sys': return `<span class="m"><i>x</i> = ${qh(A.v.x)} ; <i>y</i> = ${qh(A.v.y)}</span>`;
    case 'choice': return A.opts[A.correct];
    default: return '';
  }
}

// Revisión de una línea de la libreta respecto a la anterior
export function lineRelation(prevAst, ast) {
  if (!prevAst || !ast) return null;
  const isEq = (a) => a.t === 'rel' && a.op === '=';
  if (isEq(prevAst) && isEq(ast)) {
    const s1 = solveLinear(prevAst), s2 = solveLinear(ast);
    if (s1 && s2 && s1.x && s2.x) return s1.x.eq(s2.x) ? 'ok' : 'bad';
    if (s1 && s1.x && varsOf(ast).size === 1) {
      const v = [...varsOf(ast)][0];
      try { const l = evalQ(ast.a, { [v]: s1.x }), r = evalQ(ast.b, { [v]: s1.x }); return l.eq(r) ? 'ok' : 'bad'; } catch { return null; }
    }
    return null;
  }
  if (!isEq(prevAst) && !isEq(ast) && prevAst.t !== 'list' && ast.t !== 'list') return equiv(prevAst, ast) ? 'ok' : 'bad';
  return null;
}
