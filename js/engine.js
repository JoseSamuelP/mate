// =============================================================
// engine.js — Progreso, aprobación de temas, meta diaria,
// elección adaptativa de ejercicios y análisis del estudiante.
// =============================================================
import { TOPICS_A } from './topics_a.js';
import { TOPICS_B } from './topics_b.js';
import { REASONING } from './reasoning.js';

export const TOPICS = [...TOPICS_A, ...TOPICS_B];
export const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

// Ruta: orden de prioridad (CLAUDE.md §5 + sílabo)
export const PATH = ['signos_suma', 'signos_mult', 'jerarquia', 'pot_significado', 'pot_leyes', 'pot_potencia', 'valor_numerico',
  'poli_suma', 'poli_mult', 'prod_notables', 'factor_comun', 'aspa_simple', 'frac_suma', 'frac_mult', 'frac_comb',
  'ec_lineales', 'ec_fracciones', 'modelamiento', 'regla_tres', 'porcentajes', 'sistemas', 'cuadraticas'];

export const ERR = {
  signo_suma: 'Sumar/restar con signos distintos', resta_neg: 'Restar un negativo', paren_mult: 'Creer que el paréntesis es multiplicar',
  signo_mult: 'Regla de signos (× ÷)', jerarquia: 'Orden de operaciones', pot_base: 'Confundir potencia con multiplicar (2³≠6)',
  neg_base: '(−3)² vs −3²', exp_cero: 'Exponente cero', exp_neg: 'Exponentes negativos', prod_pot: 'Producto de potencias (se suman)',
  div_pot: 'Cociente de potencias (se restan)', pot_pot: 'Potencia de potencia (se multiplican)', pot_coef: 'Olvidar elevar el número',
  valor_num: 'Valor numérico', semejantes: 'Términos semejantes', menos_paren: 'Signo − delante de paréntesis', prod_suma: 'Sumar en vez de multiplicar polinomios',
  dist_inc: 'Distributiva incompleta', binomio2: '(a+b)² ≠ a²+b²', dif_cuad: 'Diferencia de cuadrados', fac_comun: 'Factor común', aspa: 'Aspa simple',
  frac_suma: 'Sumar fracciones (receta equivocada)', frac_mult: 'Multiplicar fracciones', frac_div: 'Dividir fracciones', frac_simpl: 'Partes de una fracción',
  transpos: 'Transponer sin cambiar el signo', despeje_div: 'Despejar lo que multiplica/divide', ec_frac: 'Ecuaciones con fracciones',
  r3_inversa: 'Regla de tres inversa', pct_que: '¿Qué % es? / % de un número', pct_suc: 'Porcentajes sucesivos', pct_var: 'Variación porcentual',
  modelo: 'Plantear el problema', sistema: 'Sistemas de ecuaciones', cuad: 'Ecuaciones cuadráticas', razon: 'Razonamiento',
};
// Errores detectados en el diagnóstico del 16 nov (punto de partida)
export const DIAG_ERRS = { signo_mult: 1, paren_mult: 1, jerarquia: 1, frac_suma: 2, frac_mult: 1, frac_div: 1, pot_pot: 2, neg_base: 1, exp_cero: 1, exp_neg: 1, div_pot: 1, prod_suma: 1, binomio2: 1, valor_num: 1, transpos: 1, despeje_div: 1, r3_inversa: 1, pct_que: 1 };
export const DIAG = [['Números con signo', 3, 6], ['Fracciones', 1, 6], ['Potencias', 2, 7], ['Expresiones algebraicas', 3, 6], ['Ecuaciones', 4, 6], ['Regla de tres y %', 4, 6]];

export const EXAMS = [
  { id: 'c1', name: 'Control 1', date: '2026-11-20', topics: ['signos_mult', 'jerarquia', 'pot_significado', 'pot_leyes', 'pot_potencia', 'valor_numerico', 'poli_suma', 'poli_mult', 'prod_notables', 'factor_comun', 'aspa_simple'] },
  { id: 'pc1', name: 'Práctica Calificada 1', date: '2026-11-24', topics: ['pot_potencia', 'prod_notables', 'aspa_simple', 'frac_comb', 'ec_lineales', 'ec_fracciones', 'modelamiento', 'sistemas', 'porcentajes', 'regla_tres'] },
  { id: 'par', name: 'Examen Parcial', date: '2026-12-01', topics: ['pot_potencia', 'prod_notables', 'factor_comun', 'aspa_simple', 'ec_lineales', 'ec_fracciones', 'modelamiento', 'sistemas', 'porcentajes', 'regla_tres'] },
  { id: 'c2', name: 'Control 2', date: '2026-12-04', topics: ['sistemas', 'cuadraticas', 'modelamiento'] },
  { id: 'pc2', name: 'Práctica Calificada 2', date: '2026-12-11', topics: ['cuadraticas', 'ec_lineales', 'frac_comb'] },
  { id: 'fin', name: 'Examen Final', date: '2026-12-16', topics: PATH },
];

// ---------------- Estado ----------------
const KEY = 'mate-pre-esan-v1';
const blank = () => ({
  v: 1, created: Date.now(), settings: { goal: 30, tren: false },
  topics: {}, reason: { level: 1, hist: [] }, log: [], days: {}, streakDays: 0, lastDay: null, best: 0,
});
let S = null;
export function load() {
  if (S) return S;
  try { const raw = localStorage.getItem(KEY); S = raw ? { ...blank(), ...JSON.parse(raw) } : blank(); } catch { S = blank(); }
  return S;
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch { return false; } }
export function resetAll() { S = blank(); save(); }
export function exportData() { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
export function importData(code) { const d = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if (!d || d.v !== 1) throw new Error('Código no válido'); S = { ...blank(), ...d }; save(); }

export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export function day(k = today()) {
  const st = load();
  if (!st.days[k]) st.days[k] = { n: 0, ok: 0, approved: [], ms: 0, blocks: [] };
  return st.days[k];
}
export function tstate(id) {
  const st = load();
  if (!st.topics[id]) st.topics[id] = { hist: [], n: 0, ok: 0, approved: false, lesson: false };
  return st.topics[id];
}

// ---------------- Dominio ----------------
export const APPROVE_N = 10, APPROVE_SCORE = 8;
export function mastery(id) {
  const t = tstate(id); const h = t.hist.slice(-APPROVE_N);
  const sc = h.reduce((a, b) => a + b, 0);
  return { score: sc, n: h.length, pct: Math.min(1, sc / APPROVE_SCORE) * Math.min(1, (h.length + 2) / (APPROVE_N + 2)), approved: t.approved };
}
export function currentTopic() { return PATH.find((id) => !tstate(id).approved) || null; }
export function isUnlocked(id) { const i = PATH.indexOf(id); return i <= 0 || PATH.slice(0, i).every((p) => tstate(p).approved) || tstate(id).approved || tstate(id).n > 0; }

// ---------------- Registrar intento ----------------
export function record(p, res) {
  // res: {ok, conf:'seguro'|'dudo'|'nose'|null, hints, ms, err}
  const st = load(); const d = day();
  const score = res.ok ? (res.hints > 0 ? 0.5 : 1) : 0;
  const ev = { t: Date.now(), topic: p.topic, v: p.variant, ok: !!res.ok, conf: res.conf, hints: res.hints, ms: res.ms, err: res.err || null, mode: p.mode, ctx: !!p.ctx, reason: !!p.isReason };
  st.log.push(ev); if (st.log.length > 1500) st.log.splice(0, st.log.length - 1500);
  d.n++; if (res.ok) d.ok++; d.ms += Math.min(res.ms || 0, 300000);
  const bi = Math.floor((d.n - 1) / 10); d.blocks[bi] = (d.blocks[bi] || 0) + (res.ok ? 1 : 0);
  let approvedNow = null;
  if (p.isReason) {
    st.reason.hist.push(score); if (st.reason.hist.length > 20) st.reason.hist.shift();
    const h = st.reason.hist.slice(-10);
    if (h.length >= 8 && h.reduce((a, b) => a + b, 0) >= 7 && st.reason.level < 6) { st.reason.level++; st.reason.hist = []; approvedNow = { reasonLevel: st.reason.level }; }
    else if (h.length >= 8 && h.reduce((a, b) => a + b, 0) <= 3 && st.reason.level > 1) { st.reason.level--; st.reason.hist = []; }
  } else {
    const t = tstate(p.topic); t.n++; if (res.ok) t.ok++;
    t.hist.push(score); if (t.hist.length > 30) t.hist.shift();
    const m = mastery(p.topic);
    if (!t.approved && m.n >= APPROVE_N && m.score >= APPROVE_SCORE && score > 0) { t.approved = true; t.approvedAt = Date.now(); d.approved.push(p.topic); approvedNow = { topic: p.topic }; }
  }
  // racha de días
  const k = today();
  if (st.lastDay !== k) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yk = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    st.streakDays = st.lastDay === yk ? st.streakDays + 1 : 1; st.lastDay = k;
  }
  save();
  return approvedNow;
}

// ---------------- Pesos por errores (adaptativo) ----------------
export function errorCounts(lastN = 120) {
  const st = load(); const c = {};
  st.log.slice(-lastN).forEach((e) => { if (e.err) c[e.err] = (c[e.err] || 0) + 1; });
  // el diagnóstico pesa al inicio y se va diluyendo
  const w = Math.max(0, 1 - st.log.length / 150);
  Object.entries(DIAG_ERRS).forEach(([k, v]) => { c[k] = (c[k] || 0) + v * w; });
  return c;
}
function wpick(items, wf) {
  const ws = items.map(wf); const tot = ws.reduce((a, b) => a + b, 0);
  let r = Math.random() * tot;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
const isMental = (topic, v) => (v.mode || topic.mode) === 'mental';

export function makeProblem(topicId, opts = {}) {
  const topic = TOPIC[topicId]; const ec = errorCounts();
  let vars = topic.variants;
  if (opts.tren) { const m = vars.filter((v) => isMental(topic, v)); if (m.length) vars = m; }
  if (opts.variant) { const f = vars.find((v) => v.id === opts.variant); if (f) vars = [f]; }
  const v = wpick(vars, (x) => x.w * (1 + 0.5 * (x.errs || []).reduce((s, e) => s + (ec[e] || 0), 0)));
  const p = v.gen();
  return { ...p, topic: topicId, variant: v.id, mode: v.mode || topic.mode, ctx: !!(v.ctx || p.ctx), topicName: topic.name };
}
export function makeReason(opts = {}) {
  const L = load().reason.level;
  const r = wpick(REASONING, (x) => x.w);
  const p = r.gen(L);
  return { ...p, topic: 'razon', variant: r.id, mode: 'mental', ctx: true, isReason: true, topicName: `Razonamiento · ${r.name}`, level: L, ...(opts.x || {}) };
}

// Elige el siguiente ejercicio según el modo de la sesión
export function nextProblem(session) {
  const st = load(); const tren = session.tren;
  for (let tries = 0; tries < 15; tries++) {
    let p;
    if (session.kind === 'topic') p = makeProblem(session.topic, { tren, variant: session.variant });
    else if (session.kind === 'reason') p = makeReason();
    else if (session.kind === 'exam') {
      const ex = EXAMS.find((e) => e.id === session.exam);
      const ids = ex.topics.filter((id) => !tren || TOPIC[id].variants.some((v) => isMental(TOPIC[id], v)));
      const id = wpick(ids, (id) => 1.5 - mastery(id).pct);
      p = makeProblem(id, { tren });
    } else {
      // Entrenamiento diario
      const cur = currentTopic();
      const approved = PATH.filter((id) => tstate(id).approved);
      const r = Math.random();
      const curOk = cur && (!tren || TOPIC[cur].variants.some((v) => isMental(TOPIC[cur], v)));
      if (r < 0.25) p = makeReason();
      else if (r < 0.45 && approved.length) {
        const pool = tren ? approved.filter((id) => TOPIC[id].variants.some((v) => isMental(TOPIC[id], v))) : approved;
        p = pool.length ? makeProblem(wpick(pool, (id) => 0.3 + (1 - mastery(id).pct) + recentErrRate(id)), { tren }) : makeReason();
      } else if (curOk) p = makeProblem(cur, { tren });
      else {
        // en modo tren y el tema actual es de lápiz: repasa temas mentales ya vistos o razonamiento
        const pool = PATH.filter((id) => isUnlocked(id) && TOPIC[id].variants.some((v) => isMental(TOPIC[id], v)));
        p = pool.length && Math.random() < 0.6 ? makeProblem(wpick(pool, () => 1), { tren: true }) : makeReason();
      }
    }
    const key = p.q + (p.ill || '');
    if (session.seen.has(key)) continue;
    session.seen.add(key);
    void st;
    return p;
  }
  return session.kind === 'reason' ? makeReason() : makeProblem(session.topic || currentTopic() || 'signos_suma');
}
function recentErrRate(id) {
  const h = tstate(id).hist.slice(-6); if (!h.length) return 0.5;
  return 1 - h.reduce((a, b) => a + b, 0) / h.length;
}

// ---------------- Análisis ----------------
export function analysis() {
  const st = load(); const L = st.log;
  const acc = (arr) => (arr.length ? arr.filter((e) => e.ok).length / arr.length : null);
  const byTopic = PATH.map((id) => { const t = tstate(id); return { id, name: TOPIC[id].name, n: t.n, acc: t.n ? t.ok / t.n : null, m: mastery(id) }; });
  const seen = byTopic.filter((t) => t.n >= 5);
  const strengths = seen.filter((t) => t.acc >= 0.8).sort((a, b) => b.acc - a.acc).slice(0, 4);
  const weak = seen.filter((t) => t.acc < 0.7).sort((a, b) => a.acc - b.acc).slice(0, 4);
  const ec = {}; L.slice(-300).forEach((e) => { if (e.err) ec[e.err] = (ec[e.err] || 0) + 1; });
  const topErr = Object.entries(ec).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const seg = L.filter((e) => e.conf === 'seguro');
  const falsa = seg.filter((e) => !e.ok).length;
  const dude = L.filter((e) => e.conf === 'dudo');
  const R = {
    total: L.length, acc: acc(L), byTopic, strengths, weak, topErr,
    seguro: { n: seg.length, wrong: falsa, rate: seg.length ? falsa / seg.length : null },
    dudo: { n: dude.length, acc: acc(dude) },
    mental: acc(L.filter((e) => e.mode === 'mental' && !e.reason)), lapiz: acc(L.filter((e) => e.mode === 'lapiz')),
    ctx: acc(L.filter((e) => e.ctx && !e.reason)), abs: acc(L.filter((e) => !e.ctx && !e.reason)),
    reason: acc(L.filter((e) => e.reason)), reasonLevel: st.reason.level,
    withHint: acc(L.filter((e) => e.hints > 0)), noHint: acc(L.filter((e) => !e.hints)),
    msMental: avg(L.filter((e) => e.mode === 'mental' && e.ok).map((e) => e.ms)), msLapiz: avg(L.filter((e) => e.mode === 'lapiz' && e.ok).map((e) => e.ms)),
    days: Object.keys(st.days).length, streakDays: st.streakDays,
  };
  R.insights = insights(R);
  return R;
}
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const pc = (x) => `${Math.round(x * 100)}%`;
function insights(R) {
  const out = [];
  if (R.total < 15) {
    out.push({ ic: '🧭', t: 'Todavía estoy conociéndote', d: 'Con unos 15 ejercicios ya puedo decirte cómo aprendes mejor. Mientras tanto uso tu diagnóstico (17/37): <b>fracciones</b> y <b>potencias</b> eran lo más débil; <b>regla de tres y porcentajes</b>, tu fortaleza.' });
    return out;
  }
  if (R.ctx != null && R.abs != null && Math.abs(R.ctx - R.abs) >= 0.1) {
    out.push(R.ctx > R.abs
      ? { ic: '💸', t: 'Aprendes mejor con situaciones reales', d: `Aciertas ${pc(R.ctx)} cuando hay dinero o contexto, y ${pc(R.abs)} con reglas sueltas. Truco: cuando veas algo abstracto, <b>tradúcelo a soles o deudas</b>.` }
      : { ic: '🔣', t: 'Te va mejor con las reglas que con los enunciados', d: `Aciertas ${pc(R.abs)} en ejercicios directos y ${pc(R.ctx)} en problemas con texto. Practica <b>subrayar los datos</b> y escribir la ecuación antes de calcular.` });
  }
  if (R.seguro.n >= 5) {
    if (R.seguro.rate >= 0.2) out.push({ ic: '⚠️', t: 'Cuidado con la falsa seguridad', d: `De tus respuestas marcadas como "seguro", fallaste el <b>${pc(R.seguro.rate)}</b>. Antes de marcar "seguro", <b>comprueba</b> (reemplaza o haz la operación inversa).` });
    else out.push({ ic: '🎯', t: 'Tu seguridad es confiable', d: `Cuando dices "seguro", aciertas el ${pc(1 - R.seguro.rate)}. Bien calibrado.` });
  }
  if (R.mental != null && R.lapiz != null && Math.abs(R.mental - R.lapiz) >= 0.12) {
    out.push(R.mental > R.lapiz
      ? { ic: '✏️', t: 'Pierdes puntos en los ejercicios largos', d: `Mental: ${pc(R.mental)}, con lápiz: ${pc(R.lapiz)}. Escribe <b>cada paso en una línea</b> (usa la libreta ✎): los errores aparecen en los pasos intermedios.` }
      : { ic: '🧠', t: 'Calculas mejor cuando escribes', d: `Con lápiz: ${pc(R.lapiz)}, mental: ${pc(R.mental)}. En el tren tómate unos segundos más antes de responder.` });
  }
  if (R.withHint != null && R.noHint != null && R.withHint > R.noHint + 0.1) out.push({ ic: '💡', t: 'Las pistas te funcionan', d: `Con pista aciertas ${pc(R.withHint)}. Úsalas para aprender, pero intenta primero 1 minuto solo: así se aprueba el tema más rápido.` });
  if (R.topErr.length) out.push({ ic: '🔁', t: 'Tu error más repetido', d: `<b>${ERR[R.topErr[0][0]] || R.topErr[0][0]}</b> (${R.topErr[0][1]} veces). Te pondré más ejercicios de este tipo hasta que desaparezca.` });
  if (R.reason != null) out.push({ ic: '🧩', t: `Razonamiento: nivel ${R.reasonLevel} de 6`, d: R.reason >= 0.75 ? 'Tu lógica va muy bien: los retos suben de nivel solos.' : 'Tómate tu tiempo en los retos: dibuja mentalmente y prueba con números pequeños.' });
  if (R.msMental) out.push({ ic: '⏱️', t: 'Tu ritmo', d: `Unos <b>${Math.round(R.msMental / 1000)} s</b> por ejercicio mental${R.msLapiz ? ` y <b>${Math.round(R.msLapiz / 1000)} s</b> por ejercicio con lápiz` : ''}.` });
  return out;
}
export function examReadiness(ex) {
  const ms = ex.topics.map((id) => mastery(id).approved ? 1 : mastery(id).pct);
  return ms.reduce((a, b) => a + b, 0) / ms.length;
}
export function daysUntil(dateStr) {
  const d = new Date(dateStr + 'T08:00:00'); const n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.round((d - n) / 86400000);
}
export { REASONING };
