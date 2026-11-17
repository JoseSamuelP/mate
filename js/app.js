// =============================================================
// app.js — Interfaz: Hoy, Ruta, Libreta, Yo, y la práctica.
// =============================================================
import * as E from './engine.js';
import { MathField, Keyboard, bindPhysical } from './mathinput.js';
import { check, answerHTML, lineRelation } from './check.js';
import { evalSteps, tryQ, varsOf, solveLinear, toHTML, Q } from './expr.js';
import * as V from './viz.js';

const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const nav = $('#nav');
let activeField = null;
let deferredInstall = null;
const ESC = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// ---------- utilidades de interfaz ----------
function toast(html, ms = 2600) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html;
  document.body.appendChild(t); setTimeout(() => t.remove(), ms);
}
function modal(html, { onClose } = {}) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="sheet"><div class="grab"></div>${html}</div>`;
  const close = () => { m.remove(); onClose && onClose(); };
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) close(); });
  document.body.appendChild(m);
  return { el: m, close };
}
const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`);
const bar = (p, cls = '') => `<div class="bar ${cls}"><i style="width:${Math.round(Math.max(0, Math.min(1, p)) * 100)}%"></i></div>`;
function fmtDate(s) { const d = new Date(s + 'T12:00:00'); return d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' }); }

// ---------- navegación ----------
const TABS = [['home', '🏠', 'Hoy'], ['bank', '📝', 'Examen'], ['path', '🗺️', 'Ruta'], ['notebook', '✎', 'Libreta'], ['me', '📊', 'Yo']];
let tab = 'home';
function renderNav() {
  nav.innerHTML = `<div class="nav-in">${TABS.map(([id, ic, l]) => `<button data-tab="${id}" class="${tab === id ? 'on' : ''}"><span class="ic">${ic}</span>${l}</button>`).join('')}</div>`;
}
nav.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) go(b.dataset.tab); });
function go(t) {
  tab = t; activeField = null; nav.style.display = t === 'notebook' ? 'none' : '';
  renderNav();
  ({ home: renderHome, bank: renderBank, path: renderPath, notebook: renderNotebook, me: renderMe })[t]();
  window.scrollTo(0, 0);
}

// =============================================================
// HOY
// =============================================================
function dailyBlock() {
  const st = E.load(); const d = E.day(); const goal = st.settings.goal;
  const nSeg = Math.round(goal / 10);
  const segs = Array.from({ length: nSeg }, (_, i) => {
    const inSeg = Math.max(0, Math.min(10, d.n - i * 10));
    const star = inSeg === 10 && (d.blocks[i] || 0) >= 7;
    return `<div class="seg ${star ? 'star' : ''}"><i style="width:${inSeg * 10}%"></i></div>`;
  }).join('');
  const cur = E.currentTopic();
  const approvedToday = d.approved.length > 0;
  const m = cur ? E.mastery(cur) : null;
  const done = d.n >= goal && approvedToday;
  return `
    <div class="row between"><h2>Meta de hoy</h2><span class="chip-tag acc">${d.n}/${goal}${d.n > goal ? ' +' : ''}</span></div>
    <div class="segbar" style="grid-template-columns:repeat(${nSeg},1fr)">${segs}</div>
    <div class="mute small" style="margin-top:6px">Cada barra = 10 ejercicios. ★ si aciertas 7 o más de esos 10.</div>
    <div class="goal-flag ${approvedToday ? 'done' : ''}">${approvedToday ? '✅' : '🎯'} <div style="flex:1">${approvedToday
      ? `Aprobaste hoy: <b>${d.approved.map((id) => E.TOPIC[id].name).join(', ')}</b>`
      : cur ? `Aprueba 1 tema: <b>${E.TOPIC[cur].name}</b><div style="margin-top:6px">${bar(m.pct, 'amber')}</div><div class="mute small">${m.score.toFixed(1).replace('.0', '')} de 8 puntos en tus últimos ${m.n}/10</div>` : '¡Completaste toda la ruta! 🎓'}</div></div>
    ${done ? '<div class="goal-flag done">🏆 <b>¡Meta del día cumplida!</b> Puedes seguir para adelantar.</div>' : d.n >= goal ? '<div class="goal-flag">⏳ Ya hiciste los ejercicios, pero <b>falta aprobar el tema</b>: sigue hasta lograrlo.</div>' : ''}`;
}
function renderHome() {
  const st = E.load(); const cur = E.currentTopic(); const d = E.day();
  const acc = d.n ? d.ok / d.n : null;
  const exams = E.EXAMS.filter((x) => E.daysUntil(x.date) >= 0).slice(0, 3);
  app.innerHTML = `<div class="view">
    <div class="row between" style="margin-bottom:12px">
      <div><h1>¡Hola! 👋</h1><div class="mute small">${new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
      <div style="text-align:right"><div style="font-size:22px">🔥 ${st.streakDays || 0}</div><div class="mute small">días seguidos</div></div>
    </div>
    <div class="card hero">${dailyBlock()}
      <button class="btn pri block" id="go-train" style="margin-top:14px;font-size:1.1rem">▶ ${d.n ? 'Seguir entrenando' : 'Empezar entrenamiento'}</button>
      <label class="row between" style="margin-top:12px"><div><b>🚆 Modo tren</b><div class="mute small">Solo ejercicios para resolver de cabeza</div></div><span class="switch"><input type="checkbox" id="tren" ${st.settings.tren ? 'checked' : ''}><span></span></span></label>
      ${acc != null ? `<div class="mute small" style="margin-top:8px">Hoy: ${d.ok} correctas de ${d.n} (${pct(acc)}) · ${Math.round(d.ms / 60000)} min</div>` : ''}
    </div>
    ${cur ? `<div class="card"><div class="row between"><div><div class="mute small">Tema actual</div><h3>${E.TOPIC[cur].name}</h3></div><span class="chip-tag">${E.TOPIC[cur].mode === 'mental' ? '🧠 mental' : '✏️ lápiz'}</span></div>
      ${bar(E.mastery(cur).pct)}<div class="row" style="margin-top:10px;gap:8px"><button class="btn sm" data-lesson="${cur}">📖 Lección</button><button class="btn sm" data-topic="${cur}">Practicar solo este tema</button></div></div>` : ''}
    <div class="card"><h3>📅 Próximas evaluaciones</h3>
      ${exams.map((x) => { const r = E.examReadiness(x); const dl = E.daysUntil(x.date); return `<div style="margin:12px 0 4px"><div class="row between"><b>${x.name}</b><span class="mute small">${dl === 0 ? '¡HOY!' : dl === 1 ? 'mañana' : `en ${dl} días`} · ${fmtDate(x.date)}</span></div>
        <div class="row" style="margin-top:6px"><div style="flex:1">${bar(r, 'blue')}</div><span class="small">${pct(r)}</span><button class="btn sm" data-exam="${x.id}">Repasar</button></div></div>`; }).join('')}
      <div class="mute small" style="margin-top:8px">La barra muestra qué tan listo estás según los temas de cada evaluación.</div>
    </div>
    ${(() => { const b = E.bankStats(); return `<div class="card"><div class="row between"><div><h3>📝 Aprender el examen</h3><div class="mute small">${E.CURSO.filter((t) => E.cstate(t.tema).done).length}/35 temas dominados · ${b.errors} preguntas por repasar</div></div><button class="btn sm pri" id="go-bank">Abrir</button></div>${bar(E.CURSO.filter((t) => E.cstate(t.tema).done).length / 35, 'blue')}</div>`; })()}
    <div class="card"><div class="row between"><div><h3>🧩 Retos de lógica</h3><div class="mute small">Nivel ${st.reason.level} de 6 · series, figuras, balanzas, geometría…</div></div><button class="btn sm pri" id="go-reason">Jugar</button></div></div>
    <div class="card install" id="install"><div class="row between" style="width:100%"><div><b>📲 Instalar la app</b><div class="mute small">Ábrela como app y úsala sin internet</div></div><button class="btn sm pri" id="do-install">Instalar</button></div></div>
  </div>`;
  if (deferredInstall) $('#install').classList.add('show');
  $('#go-train').onclick = () => startSession({ kind: 'daily' });
  $('#go-reason').onclick = () => startSession({ kind: 'reason' });
  $('#go-bank').onclick = () => go('bank');
  $('#tren').onchange = (e) => { st.settings.tren = e.target.checked; E.save(); toast(e.target.checked ? '🚆 Modo tren: solo ejercicios mentales' : '✏️ Modo normal: incluye ejercicios con lápiz'); };
  app.querySelectorAll('[data-exam]').forEach((b) => (b.onclick = () => startSession({ kind: 'exam', exam: b.dataset.exam })));
  app.querySelectorAll('[data-topic]').forEach((b) => (b.onclick = () => startSession({ kind: 'topic', topic: b.dataset.topic })));
  app.querySelectorAll('[data-lesson]').forEach((b) => (b.onclick = () => showLesson(b.dataset.lesson)));
  const ib = $('#do-install'); if (ib) ib.onclick = async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('#install').classList.remove('show'); };
}

// =============================================================
// RUTA
// =============================================================
const UNIT = { base: 'Bases', C1: 'Control 1 · semana 1', PC1: 'Práctica Calificada 1 · semana 2', PAR: 'Parcial y Control 2 · semana 3' };
function renderPath() {
  const cur = E.currentTopic(); let lastUnit = null;
  const approvedN = E.PATH.filter((id) => E.tstate(id).approved).length;
  const items = E.PATH.map((id, i) => {
    const t = E.TOPIC[id]; const ts = E.tstate(id); const m = E.mastery(id); const un = E.isUnlocked(id);
    const cls = ts.approved ? 'done' : id === cur ? 'cur' : !un ? 'lock' : '';
    const head = t.unit !== lastUnit ? `<div class="unit-h">${UNIT[t.unit] || t.unit}</div>` : ''; lastUnit = t.unit;
    return `${head}<button class="tnode ${cls}" data-t="${id}"><span class="ti">${ts.approved ? '✓' : !un ? '🔒' : i + 1}</span><span class="tb"><div class="tn">${t.name}</div>
      <div class="mute small">${ts.approved ? 'Aprobado' : id === cur ? 'Tema actual' : !un ? 'Aprueba el anterior para abrirlo' : 'Disponible'} · ${t.mode === 'mental' ? '🧠' : '✏️'}</div>
      ${un && !ts.approved ? `<div style="margin-top:6px">${bar(m.pct, 'thin')}</div>` : ''}</span></button>`;
  }).join('');
  app.innerHTML = `<div class="view"><h1>Tu ruta</h1><p class="mute">Ordenada por lo más urgente para ti. Un tema se aprueba con <b>8 de tus últimas 10</b> correctas (con pista cuenta medio punto).</p>
    <div class="card"><div class="row between"><b>Avance total</b><span>${approvedN}/${E.PATH.length} temas</span></div>${bar(approvedN / E.PATH.length)}</div>
    <div class="path">${items}</div>
    <div class="unit-h">Próximamente (según el sílabo)</div>
    <div class="card mute small">Fracciones algebraicas · Intervalos · Inecuaciones · Distancia y punto medio · La recta. Se agregarán en las próximas actualizaciones.</div></div>`;
  app.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => topicSheet(b.dataset.t)));
}
function topicSheet(id) {
  const t = E.TOPIC[id]; const ts = E.tstate(id); const m = E.mastery(id); const un = E.isUnlocked(id);
  const mm = modal(`<h2>${t.name}</h2>
    <div class="row" style="gap:6px;margin-bottom:10px"><span class="chip-tag">${t.mode === 'mental' ? '🧠 mental' : '✏️ con lápiz'}</span>${ts.approved ? '<span class="chip-tag acc">✓ aprobado</span>' : ''}<span class="chip-tag">${ts.n} intentos · ${ts.n ? pct(ts.ok / ts.n) : '—'}</span></div>
    ${!ts.approved ? `<div style="margin-bottom:12px">${bar(m.pct, 'amber')}<div class="mute small">${m.score} de 8 puntos en tus últimas ${m.n}/10</div></div>` : ''}
    <div class="lesson card">${t.lesson()}</div>
    ${un ? '<button class="btn pri block" id="ts-go">Practicar este tema</button>' : '<div class="mute">🔒 Aprueba los temas anteriores para desbloquearlo. Puedes practicarlo igual desde "Repasar" en una evaluación.</div>'}
    <button class="btn block ghost" data-close style="margin-top:6px">Cerrar</button>`);
  const g = $('#ts-go', mm.el); if (g) g.onclick = () => { mm.close(); startSession({ kind: 'topic', topic: id }); };
}
function showLesson(id, then) {
  const t = E.TOPIC[id];
  const mm = modal(`<div class="mute small">Lección rápida</div><h2>${t.name}</h2><div class="lesson">${t.lesson()}</div>
    <button class="btn pri block" data-close style="margin-top:12px">${then ? '¡Entendido, a practicar! →' : 'Cerrar'}</button>`, { onClose: then });
  E.tstate(id).lesson = true; E.save();
  return mm;
}

// =============================================================
// PRÁCTICA
// =============================================================
let P = null;
function startSession(opts) {
  const st = E.load();
  P = { session: { ...opts, tren: st.settings.tren && opts.kind !== 'topic' ? true : opts.kind === 'reason' ? false : st.settings.tren, seen: new Set() }, count: 0, ok: 0, streak: 0, startN: E.day().n, startOk: E.day().ok, errs: {} };
  if (opts.kind === 'topic') P.session.tren = false;
  if (opts.kind === 'bank') {
    P.session.queue = E.bankQueue(opts.mode, opts.tema); P.session.total = P.session.queue.length; P.session.sim = opts.mode === 'sim';
    P.simRes = []; P.t0Session = Date.now();
    if (!P.session.total) { toast('No hay preguntas en esta lista'); P = null; go('bank'); return; }
  }
  nav.style.display = 'none';
  if (opts.kind === 'curso') { renderPracticeShell(); if (!E.cstate(opts.tema).lesson) showCursoLesson(opts.tema, () => nextQ()); else nextQ(); return; }
  const firstTopic = opts.kind === 'topic' ? opts.topic : opts.kind === 'daily' ? E.currentTopic() : null;
  if (firstTopic && !E.tstate(firstTopic).lesson) { renderPracticeShell(); showLesson(firstTopic, () => nextQ()); }
  else { renderPracticeShell(); nextQ(); }
}
function endSession() {
  if (P && P.session.sim) return simSummary();
  const back = P && (P.session.kind === 'bank' || P.session.kind === 'curso') ? 'bank' : 'home';
  const d = E.day(); const n = d.n - P.startN, ok = d.ok - P.startOk;
  if (P.timer) clearInterval(P.timer);
  P = null; activeField = null;
  if (n > 0) {
    const errs = summaryErrs(n);
    modal(`<div class="celebrate"><div class="em">${ok / n >= 0.8 ? '🌟' : ok / n >= 0.6 ? '💪' : '🧠'}</div><h2>Sesión terminada</h2></div>
      <div class="grid2"><div class="stat"><div class="v">${ok}/${n}</div><div class="l">correctas</div></div><div class="stat"><div class="v">${pct(ok / n)}</div><div class="l">precisión</div></div></div>
      ${errs}<button class="btn pri block" data-close style="margin-top:14px">Listo</button>`);
  }
  go(back);
}
function simSummary() {
  if (P.timer) clearInterval(P.timer);
  const R = P.simRes; const ok = R.filter((x) => x.ok).length; const mins = Math.round((Date.now() - P.t0Session) / 60000);
  const secs = {}; R.forEach((x) => { secs[x.sec] = secs[x.sec] || [0, 0]; secs[x.sec][1]++; if (x.ok) secs[x.sec][0]++; });
  const wrong = R.filter((x) => !x.ok);
  P = null; activeField = null;
  const mm = modal(`<div class="celebrate"><div class="em">${ok >= 45 ? '🏆' : ok >= 30 ? '💪' : '📚'}</div><h2>Simulacro: ${ok}/${R.length}</h2><p class="mute">${mins} min${R.length < 60 ? ` · respondiste ${R.length} de 60` : ''}</p></div>
    ${Object.entries(secs).map(([k, [a, b]]) => `<div class="tbar"><span>${k}</span>${bar(a / b, 'thin blue')}<span class="small">${a}/${b}</span></div>`).join('')}
    ${wrong.length ? `<p class="mute small" style="margin-top:10px">Fallaste: ${wrong.map((x) => '#' + x.id).join(', ')}. Ya están en <b>Repasar errores</b>, con la explicación de cada una.</p><button class="btn pri block" id="sim-rev">🔁 Repasar mis errores ahora</button>` : ''}
    <button class="btn block ghost" data-close style="margin-top:6px">Cerrar</button>`, { onClose: () => go('bank') });
  const rv = $('#sim-rev', mm.el); if (rv) rv.onclick = () => { mm.el.remove(); startSession({ kind: 'bank', mode: 'errors' }); };
}
function summaryErrs(n) {
  const L = E.load().log.slice(-n); const c = {};
  L.forEach((e) => { if (e.err) c[e.err] = (c[e.err] || 0) + 1; });
  const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const seg = L.filter((e) => e.conf === 'seguro' && !e.ok).length;
  return (top.length ? `<h3 style="margin-top:14px">Lo que más debes vigilar</h3>${top.map(([k, v]) => `<div class="errrow"><span>${E.ERR[k] || k}</span><b>${v}×</b></div>`).join('')}` : '')
    + (seg ? `<div class="goal-flag">⚠️ ${seg} respuesta(s) marcadas "seguro" estaban mal. Comprueba antes de marcar seguro.</div>` : '');
}
function renderPracticeShell() {
  app.innerHTML = `<div class="view practice">
    <div class="ptop"><button class="x" id="p-x" aria-label="Salir">✕</button><div id="p-bar" style="flex:1"></div><div class="fire" id="p-fire"></div></div>
    <div class="pscroll" id="p-scroll"></div>
    <div id="p-bottom"></div></div>`;
  $('#p-x').onclick = endSession;
}
function updateTop() {
  const st = E.load(); const d = E.day(); const goal = st.settings.goal;
  let html;
  if (P.session.kind === 'daily') html = `${bar(Math.min(1, d.n / goal))}<div class="mute small" style="margin-top:3px;text-align:center">${d.n}/${goal} hoy${d.approved.length ? ' · ✅ tema aprobado' : ''}</div>`;
  else if (P.session.kind === 'topic') { const m = E.mastery(P.session.topic); html = `${bar(m.pct, 'amber')}<div class="mute small" style="margin-top:3px;text-align:center">${E.TOPIC[P.session.topic].name}: ${m.score}/8</div>`; }
  else if (P.session.kind === 'exam') { const ex = E.EXAMS.find((x) => x.id === P.session.exam); html = `${bar(E.examReadiness(ex), 'blue')}<div class="mute small" style="margin-top:3px;text-align:center">Repaso ${ex.name}</div>`; }
  else if (P.session.kind === 'curso') {
    const c = E.cstate(P.session.tema);
    const info = c.done ? '✅ dominado · repaso' : c.lvl < 2 ? `Nivel ${c.lvl + 1}/3 · ${E.LEVEL_NAMES[c.lvl]} · ${c.streak}/${E.LEVEL_UP} seguidas` : `Nivel 3/3 · Tipo examen · ${c.examOk || 0}/${E.EXAM_DONE}`;
    html = `${bar(E.cursoProgress(P.session.tema), 'amber')}<div class="mute small" style="margin-top:3px;text-align:center">${ESC(P.session.tema)} · ${info}</div>`;
  }
  else if (P.session.kind === 'bank') {
    const done = P.session.total - P.session.queue.length;
    const el = Math.floor((Date.now() - P.t0Session) / 1000);
    html = `${bar(done / P.session.total, 'blue')}<div class="mute small" style="margin-top:3px;text-align:center">${P.session.sim ? `Simulacro · ${done}/${P.session.total} · ⏱ <span id="sim-t">${Math.floor(el / 60)}:${String(el % 60).padStart(2, '0')}</span>` : `Examen diagnóstico · ${done}/${P.session.total}`}</div>`;
  }
  else { const st2 = E.load(); html = `${bar(st2.reason.hist.slice(-10).reduce((a, b) => a + b, 0) / 7, 'amber')}<div class="mute small" style="margin-top:3px;text-align:center">Lógica · nivel ${st2.reason.level}</div>`; }
  $('#p-bar').innerHTML = html;
  $('#p-fire').innerHTML = P.streak >= 2 ? `🔥${P.streak}` : '';
}
function nextQ(sameVariant) {
  let prob;
  try {
    if (sameVariant && P.prob && !P.prob.isReason) prob = E.makeProblem(P.prob.topic, { variant: P.prob.variant });
    else prob = E.nextProblem(P.session);
  } catch (e) { console.error(e); prob = E.makeReason(); }
  if (!prob) {
    if (P.session.sim) return simSummary();
    const mm = modal(`<div class="celebrate"><div class="em">✅</div><h2>¡Terminaste esta tanda!</h2><p class="mute">Lo que fallaste quedó en "Repasar errores".</p></div><button class="btn pri block" data-close>Listo</button>`, { onClose: () => endSession() });
    void mm; return;
  }
  if (P.session.sim && !P.timer) P.timer = setInterval(() => { const t = $('#sim-t'); if (!t || !P) return; const el = Math.floor((Date.now() - P.t0Session) / 1000); t.textContent = `${Math.floor(el / 60)}:${String(el % 60).padStart(2, '0')}`; }, 1000);
  P.prob = prob; P.t0 = Date.now(); P.hints = 0; P.tries = 0; P.done = false; P.lines = [];
  updateTop();
  const tags = [`<span class="chip-tag acc">${ESC(prob.topicName)}</span>`, prob.mode === 'mental' ? '<span class="chip-tag">🧠 sin lápiz</span>' : '<span class="chip-tag amb">✏️ con lápiz</span>'];
  if (prob.isReason) tags.push(`<span class="chip-tag">nivel ${prob.level}</span>`);
  if (prob.isBank) tags[1] = `<span class="chip-tag">${E.bstate(prob.bank.id).last === false ? '🔁 la fallaste antes' : E.bstate(prob.bank.id).n ? 'repaso' : 'nueva'}</span>`;
  $('#p-scroll').innerHTML = `<div class="qcard">
      <div class="qtags">${tags.join('')}</div>
      <div class="qtext">${prob.q}</div>
      ${prob.ill ? `<div class="ill">${prob.ill}</div>` : ''}
      ${prob.ans.type !== 'choice' ? `<div class="ansbox"><label>Tu respuesta${prob.unit ? ` (${prob.unit})` : ''}${prob.ans.type === 'set' ? ' · separa con ;' : prob.ans.type === 'sys' ? ' · ej.: x=3; y=2' : ''}</label><div id="ans"></div></div>
      <div class="tools"><button class="btn" id="b-hint">💡 Pista</button><button class="btn" id="b-steps">✎ Mis pasos</button></div>` : (P.session.sim ? '' : '<div class="tools"><button class="btn" id="b-hint">💡 Pista</button></div>')}
    </div>
    <div id="hints"></div><div id="steps-area"></div><div id="fb"></div>`;
  if ($('#b-hint')) $('#b-hint').onclick = showHint;
  if (prob.ans.type === 'choice') {
    $('#p-bottom').innerHTML = `<div class="choices">${prob.ans.opts.map((o, i) => `<button class="btn" data-c="${i}">${o}</button>`).join('')}</div>`;
    $('#p-bottom').querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => submitChoice(+b.dataset.c)));
    P.field = null; activeField = null;
  } else {
    $('#b-steps').onclick = toggleSteps;
    $('#p-bottom').innerHTML = `<div class="kbwrap"><div class="conf" id="conf"><button class="btn" data-conf="seguro">😎 Seguro</button><button class="btn" data-conf="dudo">🤔 Dudo</button><button class="btn" data-conf="nose">🙈 No sé</button></div><div id="kb"></div></div>`;
    P.field = new MathField($('#ans'), { placeholder: 'toca las teclas de abajo' });
    focusField(P.field);
    P.kb = new Keyboard($('#kb'), { onOk: okPressed });
    P.kb.attach(P.field);
    $('#ans').addEventListener('click', () => focusField(P.field));
    $('#conf').querySelectorAll('[data-conf]').forEach((b) => (b.onclick = () => submit(b.dataset.conf)));
  }
  $('#p-scroll').scrollTop = 0;
  if (prob.isCurso && !E.cstate(prob.cursoTema).lesson) showCursoLesson(prob.cursoTema);
}
function focusField(f) {
  document.querySelectorAll('.mf.focus').forEach((x) => x.classList.remove('focus'));
  activeField = f; f.el.classList.add('focus');
  if (P && P.kb) P.kb.attach(f);
  if (NB.kb) NB.kb.attach(f);
}
function okPressed() {
  if (!P || P.done) return;
  const c = $('#conf'); if (!c) return;
  c.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 300 });
  toast('Elige: <b>😎 Seguro</b> o <b>🤔 Dudo</b> para revisar');
}
function showHint() {
  const st = P.prob.steps || [];
  if (P.hints >= st.length) { toast('Ya viste todas las pistas'); return; }
  P.hints++;
  const s = st.slice(0, P.hints);
  $('#hints').innerHTML = `<div class="hintbox"><div class="h-t">PISTA ${P.hints} DE ${st.length}</div>${V.chain(s.map((x) => ({ html: x.html, note: x.note })))}${P.hints < st.length ? '<div class="mute small">Toca 💡 otra vez para el siguiente paso. (Con pista, el ejercicio vale medio punto.)</div>' : ''}</div>`;
  $('#b-hint').textContent = P.hints < st.length ? `💡 Pista (${P.hints}/${st.length})` : '💡 Sin más pistas';
}

// ---- Mis pasos (libreta dentro del ejercicio) ----
function toggleSteps() {
  const area = $('#steps-area');
  if (area.dataset.open) { area.innerHTML = ''; delete area.dataset.open; P.lines = []; focusField(P.field); return; }
  area.dataset.open = '1';
  area.innerHTML = `<div class="card" style="margin-top:12px"><div class="row between"><b>✎ Mis pasos</b><span class="mute small">reviso cada línea</span></div><div class="mute small" style="margin-bottom:8px">Escribe un paso por línea. Te marco ✓ si sigue siendo igual a la anterior y ✗ donde aparece el error.</div><div id="lines"></div><button class="btn sm" id="add-line">+ línea</button></div>`;
  $('#add-line').onclick = () => addLine();
  addLine();
}
function addLine(container = $('#lines'), store = P.lines, onCh) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="nb-line"><span class="nb-mark"></span><div class="mfx"></div><button class="nb-del" aria-label="Borrar">✕</button></div><div class="nb-res"></div>`;
  container.appendChild(wrap);
  const f = new MathField($('.mfx', wrap), { placeholder: store.length ? 'siguiente paso' : 'primer paso', onChange: () => evalLines(store, onCh) });
  const line = { f, wrap };
  store.push(line);
  $('.mfx', wrap).addEventListener('click', () => focusField(f));
  $('.nb-del', wrap).onclick = () => { const i = store.indexOf(line); store.splice(i, 1); wrap.remove(); evalLines(store, onCh); if (activeField === f) focusField(store.length ? store[store.length - 1].f : (P && P.field) || null); };
  focusField(f);
  return line;
}
function evalLines(store, onCh) {
  let prev = null;
  store.forEach((ln) => {
    const mark = $('.nb-mark', ln.wrap), res = $('.nb-res', ln.wrap);
    mark.textContent = ''; res.innerHTML = '';
    if (ln.f.isEmpty()) return;
    let ast; try { ast = ln.f.toAST(); } catch (e) { res.innerHTML = `<span class="mute">${ESC(e.message)}</span>`; return; }
    const rel = lineRelation(prev, ast);
    if (rel === 'ok') { mark.innerHTML = '<span class="g">✓</span>'; }
    if (rel === 'bad') { mark.innerHTML = '<span class="r">✗</span>'; res.innerHTML = '<span class="r">Este paso no es igual al anterior: aquí está el error.</span>'; }
    if (onCh) onCh(ln, ast, res);
    prev = ast;
  });
}

// ---- Revisar ----
function submit(conf) {
  if (!P || P.done) return;
  const prob = P.prob;
  if (conf === 'nose') return finish({ ok: false, conf: 'nose' }, null);
  if (P.field.isEmpty()) { toast('Primero escribe tu respuesta con el teclado'); return; }
  let ast; try { ast = P.field.toAST(); } catch (e) { showFb('alm', `<div class="fb-h">✏️ Revisa lo que escribiste</div>${ESC(e.message)}`); P.field.el.className = 'mf focus alm'; return; }
  const r = check(prob, ast);
  if (r.status === 'almost') {
    P.tries++;
    P.field.el.className = 'mf focus alm';
    showFb('alm', `<div class="fb-h">🟡 Casi…</div>${r.msg}<div class="mute small" style="margin-top:6px">Corrige y vuelve a enviar (no te resta).</div>`);
    return;
  }
  finish({ ok: r.status === 'ok', conf }, r);
}
function submitChoice(i) {
  if (!P || P.done) return;
  const ok = i === P.prob.ans.correct;
  if (P.session.sim) {
    P.done = true;
    E.record(P.prob, { ok, conf: null, hints: 0, ms: Date.now() - P.t0, choice: i });
    P.simRes.push({ id: P.prob.bank.id, sec: P.prob.bank.sec, ok });
    $('#p-bottom').querySelectorAll('[data-c]').forEach((b, k) => { b.disabled = true; if (k === i) b.style.borderColor = 'var(--acc)'; });
    setTimeout(() => { if (P) nextQ(); }, 250);
    return;
  }
  if (P.prob.trapFor) {
    P.choice = i;
    $('#p-bottom').querySelectorAll('[data-c]').forEach((b, k) => { b.disabled = true; if (k === P.prob.ans.correct) b.style.borderColor = 'var(--green)'; else if (k === i) b.style.borderColor = 'var(--red)'; });
    const why = P.prob.trapFor(i);
    return finish({ ok, conf: null, choice: i }, ok ? { status: 'ok' } : { status: 'bad', msg: why ? `<b>Tu error:</b> ${why.replace(/</g, '&lt;')}` : 'Esa opción no es la correcta. Revisa los pasos de abajo.' });
  }
  $('#p-bottom').querySelectorAll('[data-c]').forEach((b, k) => { b.disabled = true; if (k === P.prob.ans.correct) b.style.borderColor = 'var(--green)'; else if (k === i) b.style.borderColor = 'var(--red)'; });
  finish({ ok, conf: null }, ok ? { status: 'ok' } : { status: 'bad', msg: 'No es esa.' });
}
function finish(res, r) {
  const prob = P.prob; P.done = true;
  const ms = Date.now() - P.t0;
  const err = !res.ok ? (r && r.trap && r.trap.err) || (prob.isReason ? null : null) : null;
  const ap = E.record(prob, { ok: res.ok, conf: res.conf, hints: P.hints, ms, err, choice: res.choice });
  P.count++; if (res.ok) { P.ok++; P.streak++; } else P.streak = 0;
  if (P.field) P.field.el.className = `mf ${res.ok ? 'ok' : 'bad'}`;
  updateTop();
  const ansH = answerHTML(prob);
  const steps = (prob.steps || []).map((s) => ({ html: s.html, note: s.note }));
  const explain = `${steps.length ? V.chain(steps) : ''}${prob.viz ? `<div class="ill">${prob.viz}</div>` : ''}${prob.extra || ''}`;
  if (res.ok) {
    const praise = ['¡Correcto!', '¡Bien!', '¡Exacto!', '¡Eso es!', '¡Muy bien!'][Math.floor(Math.random() * 5)];
    showFb('ok', `<div class="fb-h">✅ ${praise} ${P.streak >= 3 ? `<span class="small">🔥 ${P.streak} seguidas</span>` : ''}</div>
      ${res.conf === 'dudo' ? '<div class="small">Dudaste pero acertaste: ¡confía más en tu razonamiento! 💪</div>' : ''}
      ${P.hints ? '<div class="small mute">Con pista: cuenta medio punto.</div>' : ''}
      ${steps.length ? `<details style="margin-top:8px"><summary class="small">Ver la solución paso a paso</summary>${explain}</details>` : ''}`);
  } else {
    const trap = r && r.trap;
    let mine = '';
    try { if (P.field && !P.field.isEmpty()) mine = `<span class="m">${toHTML(P.field.toAST())}</span>`; } catch { mine = ''; }
    const wrongViz = trap && trap.wrong ? V.compare(trap.wrong, ansH) : mine ? V.compare(`Tu respuesta: <b>${mine}</b>`, `<b>${ansH}</b>`) : '';
    showFb('bad', `<div class="fb-h">${res.conf === 'nose' ? '📘 Veamos cómo se hace' : '❌ No es correcto'}</div>
      ${r && r.msg ? `<div>${r.msg}</div>` : ''}
      ${wrongViz}
      ${wrongViz && !(trap && trap.wrong) ? '' : `<div class="sol">Respuesta correcta: <b>${ansH}</b></div>`}
      ${res.conf === 'seguro' ? '<div class="warn">⚠️ Marcaste <b>seguro</b> y fallaste: eso es <b>falsa seguridad</b>. La próxima vez comprueba (reemplaza o haz la operación inversa) antes de enviar.</div>' : ''}
      <div style="margin-top:10px"><b>Paso a paso:</b></div>${explain}`);
  }
  // barra inferior
  if (prob.trapFor && res.choice != null) { const tr = $(`#fb [data-trap="${res.choice}"]`); if (tr) tr.style.color = 'var(--red)'; }
  $('#p-bottom').innerHTML = `<div class="nextbar">${!res.ok && !prob.isReason && !prob.isBank && !prob.isCurso ? '<button class="btn" id="b-same">🔁 Otro parecido</button>' : ''}<button class="btn pri" id="b-next">Siguiente →</button></div>`;
  $('#b-next').onclick = () => nextQ();
  const bs = $('#b-same'); if (bs) bs.onclick = () => nextQ(true);
  activeField = null;
  // celebraciones
  const d = E.day(); const goal = E.load().settings.goal;
  if (ap && ap.cursoUp) {
    const lv = ap.cursoUp;
    setTimeout(() => modal(`<div class="celebrate"><div class="em">⬆️</div><h2>¡Subiste al nivel ${lv + 1}!</h2><p><b>${ESC(ap.tema)}</b> · ${E.LEVEL_NAMES[lv]}</p><p class="mute">${lv === 1 ? 'Ahora los ejercicios tienen un paso más: negativos, fracciones o una trampa típica. Si te trabas, usa 💡 Pista.' : 'Ahora vienen preguntas tipo examen, incluidas las del examen diagnóstico real. Necesitas ' + E.EXAM_DONE + ' correctas para dominar el tema.'}</p></div><button class="btn pri block" data-close>¡Vamos!</button>`), 400);
  } else if (ap && ap.cursoDone) {
    const nx = E.nextCursoTema();
    setTimeout(() => modal(`<div class="celebrate"><div class="em">🏅</div><h2>¡Tema dominado!</h2><p><b>${ESC(ap.cursoDone)}</b></p>${nx ? `<p class="mute">Siguiente tema sugerido: <b>${ESC(nx)}</b></p>` : ''}</div>${nx ? '<button class="btn pri block" id="cu-next">Empezar el siguiente</button>' : ''}<button class="btn block ghost" data-close style="margin-top:6px">Seguir aquí</button>`), 400);
    setTimeout(() => { const b = $('#cu-next'); if (b) b.onclick = () => { document.querySelector('.modal').remove(); if (P && P.timer) clearInterval(P.timer); P = null; startSession({ kind: 'curso', tema: nx }); }; }, 500);
  } else if (ap && ap.topic) {
    const nxt = E.currentTopic();
    setTimeout(() => modal(`<div class="celebrate"><div class="em">🏅</div><h2>¡Tema aprobado!</h2><p><b>${E.TOPIC[ap.topic].name}</b></p>${nxt ? `<p class="mute">Se desbloqueó: <b>${E.TOPIC[nxt].name}</b></p>` : ''}</div><button class="btn pri block" data-close>¡Vamos!</button>`, { onClose: () => { if (P && nxt && P.session.kind === 'daily' && !E.tstate(nxt).lesson) showLesson(nxt); } }), 400);
  } else if (ap && ap.reasonLevel) {
    setTimeout(() => modal(`<div class="celebrate"><div class="em">🧩</div><h2>¡Subiste a nivel ${ap.reasonLevel}!</h2><p class="mute">Los retos de lógica serán un poco más difíciles.</p></div><button class="btn pri block" data-close>Continuar</button>`), 400);
  } else if (d.n === goal) {
    setTimeout(() => toast(d.approved.length ? '🏆 ¡Meta del día cumplida!' : '🎯 30 ejercicios listos. ¡Ahora a aprobar el tema!', 3500), 300);
  } else if (d.n % 10 === 0 && d.n > 0) {
    const b = d.blocks[d.n / 10 - 1] || 0;
    setTimeout(() => toast(b >= 7 ? `⭐ Bloque completo: ${b}/10. ¡Estrella ganada!` : `Bloque completo: ${b}/10. Para la estrella necesitas 7.`), 300);
  } else if (P.streak === 5 || P.streak === 10) setTimeout(() => toast(`🔥 ¡${P.streak} seguidas!`), 200);
  setTimeout(() => { const fb = $('#fb'); if (fb) fb.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
}
function showFb(cls, html) { $('#fb').innerHTML = `<div class="fb ${cls}">${html}</div>`; if (cls !== 'alm') return; setTimeout(() => $('#fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50); }

// =============================================================
// EXAMEN DIAGNÓSTICO (banco de 60 preguntas)
// =============================================================
function showCursoLesson(tema, then) {
  const t = E.CURSO_BY[tema]; const c = E.cstate(tema);
  modal(`<div class="mute small">Aprende desde cero</div><h2>${ESC(tema)}</h2><div class="lesson">${t.lesson()}</div>
    <div class="goal-flag">🪜 <div>Vas a subir en 3 niveles: <b>Fácil → Medio → Tipo examen</b>. Pasas de nivel con ${E.LEVEL_UP} correctas seguidas. Si fallas, te explico tu error y sigues en el mismo nivel.</div></div>
    <button class="btn pri block" data-close style="margin-top:12px">${then ? '¡Entendido, empecemos! →' : 'Cerrar'}</button>`, { onClose: then });
  c.lesson = true; E.save();
}
function cursoSheet(tema) {
  const c = E.cstate(tema); const t = E.CURSO_BY[tema];
  const lvls = E.LEVEL_NAMES.map((n, i) => `<div class="stat" style="text-align:center;${!c.done && i === c.lvl ? 'outline:2px solid var(--acc)' : ''}"><div class="v" style="font-size:1.1rem">${c.done || i < c.lvl ? '✅' : i === c.lvl ? '▶' : '🔒'}</div><div class="l">${i + 1}. ${n}</div></div>`).join('');
  const bankIds = t.bank || [];
  const mm = modal(`<h2>${ESC(tema)}</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0 12px">${lvls}</div>
    <div class="mute small" style="margin-bottom:10px">${c.done ? 'Dominado. Puedes seguir practicando para no olvidarlo.' : c.lvl < 2 ? `Nivel ${c.lvl + 1}: llevas ${c.streak} de ${E.LEVEL_UP} seguidas.` : `Tipo examen: ${c.examOk || 0} de ${E.EXAM_DONE} correctas.`} · ${c.n} ejercicios hechos. Preguntas del examen real en este tema: ${bankIds.map((id) => '#' + id).join(', ')}.</div>
    <details class="card"><summary><b>📖 Lección</b></summary><div class="lesson">${t.lesson()}</div></details>
    <button class="btn pri block" id="cs-go">▶ ${c.n ? 'Continuar' : 'Empezar'} a aprender</button>
    <button class="btn block ghost" data-close style="margin-top:6px">Cerrar</button>`);
  $('#cs-go', mm.el).onclick = () => { mm.el.remove(); startSession({ kind: 'curso', tema }); };
}
async function renderBank() {
  const { GLOSARIO, FORMULAS } = await import('./bank_diag.js');
  const b = E.bankStats();
  const doneN = E.CURSO.filter((t) => E.cstate(t.tema).done).length;
  const nx = E.nextCursoTema();
  const row = (t) => { const c = E.cstate(t.tema); const dots = [0, 1, 2].map((i) => `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;margin-left:3px;background:${c.done || i < c.lvl ? 'var(--green)' : i === c.lvl && c.n ? 'var(--amber)' : 'var(--line)'}"></span>`).join('');
    return `<button class="tnode ${c.done ? 'done' : t.tema === nx ? 'cur' : ''}" data-tema="${ESC(t.tema)}" style="padding:10px 12px"><span class="tb"><div class="row between"><span class="tn" style="font-size:.95rem">${c.done ? '✅ ' : ''}${ESC(t.tema)}</span><span>${dots}</span></div><div style="margin-top:5px">${bar(E.cursoProgress(t.tema), 'thin')}</div></span></button>`; };
  const bySec = {}; E.CURSO.forEach((t) => { const sec = (E.BANK.find((x) => x.tema === t.tema) || {}).sec || 'Otros'; (bySec[sec] = bySec[sec] || []).push(row(t)); });
  app.innerHTML = `<div class="view"><h1>Examen diagnóstico</h1><p class="mute">35 temas, cada uno con su lección y 3 niveles: <b>fácil → medio → tipo examen</b>. Los ejercicios son infinitos, y las 60 preguntas reales salen en el nivel examen.</p>
    <div class="card hero">
      <div class="row between"><b>Temas dominados</b><span>${doneN}/${E.CURSO.length}</span></div>${bar(doneN / E.CURSO.length)}
      ${nx ? `<button class="btn pri block" id="bk-learn" style="margin-top:12px">▶ Aprender: ${ESC(nx)}</button>` : ''}
      <div class="mute small" style="margin-top:8px">Puedes elegir cualquier tema de la lista. Si recién empiezas, te recomiendo Aritmética, que es la base para lo demás.</div>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <div class="row between"><b>Las 60 preguntas reales</b><span class="small mute">${b.answered}/${b.total} · ${b.ok} bien</span></div>
      <button class="btn block" id="bk-err" ${b.errors ? '' : 'disabled style="opacity:.5"'}>🔁 Repasar errores (${b.errors})</button>
      <button class="btn block" id="bk-sim">⏱ Simulacro de 60 (sin ayuda, nota al final)</button>
      <button class="btn block ghost" id="bk-go">Practicar las 60 en orden</button>
    </div>
    ${['Aritmética', 'Álgebra', 'Geometría'].map((sec) => `<div class="unit-h">${sec}</div><div class="path">${(bySec[sec] || []).join('')}</div>`).join('')}
    <div class="unit-h">Para consultar</div>
    <details class="card"><summary><b>🔣 Glosario de símbolos</b></summary>${GLOSARIO.map(([sy, d]) => `<div class="errrow"><b class="m" style="min-width:56px">${ESC(sy)}</b><span style="flex:1;text-align:right">${ESC(d)}</span></div>`).join('')}</details>
    <details class="card"><summary><b>📐 Fórmulas clave</b></summary>${FORMULAS.map(([tt, f]) => `<div style="margin:10px 0"><div class="mute small">${ESC(tt)}</div><div class="m" style="white-space:normal">${ESC(f)}</div></div>`).join('')}</details>
  </div>`;
  const L = $('#bk-learn'); if (L) L.onclick = () => startSession({ kind: 'curso', tema: nx });
  $('#bk-go').onclick = () => startSession({ kind: 'bank', mode: 'practice' });
  $('#bk-err').onclick = () => b.errors && startSession({ kind: 'bank', mode: 'errors' });
  $('#bk-sim').onclick = () => startSession({ kind: 'bank', mode: 'sim' });
  app.querySelectorAll('[data-tema]').forEach((x) => (x.onclick = () => cursoSheet(x.dataset.tema)));
}

// =============================================================
// LIBRETA (calculadora paso a paso)
// =============================================================
const NB = { lines: [], kb: null };
function renderNotebook() {
  app.innerHTML = `<div class="view practice">
    <div class="ptop"><button class="x" id="nb-x">✕</button><div style="flex:1"><b>✎ Libreta</b><div class="mute small">Escribe cualquier problema. Reviso cada paso.</div></div><button class="btn sm" id="nb-clear">Limpiar</button></div>
    <div class="pscroll"><div class="card mute small">• Una operación (ej. −2·3 − 4·(−5)) → te doy el resultado y los pasos.<br>• Una ecuación (ej. 2x − 6 = x + 4) → te digo la solución.<br>• Varias líneas → marco ✓ o ✗ si cada paso es igual al anterior.</div><div id="nb-lines"></div><button class="btn sm" id="nb-add">+ línea</button></div>
    <div class="kbwrap"><div id="nb-kb"></div></div></div>`;
  NB.lines = [];
  NB.kb = new Keyboard($('#nb-kb'), { onOk: () => addLine($('#nb-lines'), NB.lines, nbInfo) });
  $('#nb-x').onclick = () => { NB.kb = null; saveNb(); go('home'); };
  $('#nb-add').onclick = () => addLine($('#nb-lines'), NB.lines, nbInfo);
  $('#nb-clear').onclick = () => { NB.lines = []; $('#nb-lines').innerHTML = ''; saveNb(); addLine($('#nb-lines'), NB.lines, nbInfo); };
  let saved = []; try { saved = JSON.parse(localStorage.getItem('mate-nb') || '[]'); } catch { saved = []; }
  if (saved.length) saved.forEach((j) => { const l = addLine($('#nb-lines'), NB.lines, nbInfo); l.f.set(j); });
  else addLine($('#nb-lines'), NB.lines, nbInfo);
  evalLines(NB.lines, nbInfo);
}
function saveNb() { try { localStorage.setItem('mate-nb', JSON.stringify(NB.lines.map((l) => l.f.get()).filter((r) => r.length))); } catch { /* */ } }
function nbInfo(ln, ast, res) {
  saveNb();
  if (res.innerHTML) return;
  if (varsOf(ast).size === 0 && ast.t !== 'rel' && ast.t !== 'list') {
    const q = tryQ(ast);
    if (q) {
      const id = 'st' + Math.random().toString(36).slice(2, 7);
      res.innerHTML = `= <b class="m">${toHTML({ t: 'num', v: q })}</b>${q.isInt() ? '' : q.isTerminating() ? ` <span class="mute">(${q.toDec()})</span>` : ''} <button class="btn sm ghost" data-steps="${id}">ver pasos</button><div id="${id}"></div>`;
      res.querySelector('[data-steps]').onclick = () => {
        const box = res.querySelector('#' + id);
        if (box.innerHTML) { box.innerHTML = ''; return; }
        const st = evalSteps(ast);
        box.innerHTML = V.chain(st.map((s) => ({ html: s.html, note: s.final ? 'Resultado' : `${s.piece} = <b>${s.res}</b>` })));
      };
    } else res.innerHTML = '<span class="mute">No tiene un resultado exacto (¿raíz no exacta o división entre 0?).</span>';
    return;
  }
  if (ast.t === 'rel' && ast.op === '=') {
    const s = solveLinear(ast);
    if (s && s.x) res.innerHTML = `Solución: <b class="m"><i>${s.v}</i> = ${toHTML({ t: 'num', v: s.x })}</b>`;
    else if (s && s.identity) res.innerHTML = 'Es verdadera para cualquier valor.';
    else if (s && s.none) res.innerHTML = 'No tiene solución.';
  }
}

// =============================================================
// YO (análisis)
// =============================================================
function renderMe() {
  const A = E.analysis(); const st = E.load();
  const tb = A.byTopic.filter((t) => t.n > 0);
  app.innerHTML = `<div class="view"><h1>Tu análisis</h1>
    <div class="grid2" style="margin-bottom:14px">
      <div class="stat"><div class="v">${A.total}</div><div class="l">ejercicios resueltos</div></div>
      <div class="stat"><div class="v">${pct(A.acc)}</div><div class="l">precisión total</div></div>
      <div class="stat"><div class="v">🔥 ${A.streakDays || 0}</div><div class="l">días seguidos</div></div>
      <div class="stat"><div class="v">${A.reasonLevel}/6</div><div class="l">nivel de lógica</div></div>
    </div>
    <div class="card"><h3>🧠 Cómo aprendes</h3>${A.insights.map((i) => `<div class="ins"><div class="ic">${i.ic}</div><div><div class="t">${i.t}</div><div class="d">${i.d}</div></div></div>`).join('')}</div>
    <div class="card"><h3>💪 En qué eres bueno</h3>${A.strengths.length ? A.strengths.map((t) => `<div class="errrow"><span>${t.name}</span><b class="g">${pct(t.acc)}</b></div>`).join('') : '<div class="mute small">Según tu diagnóstico: regla de tres directa, % de un número, descuentos y aumentos sucesivos (¡razonaste perfecto el 121!). Se actualizará con tu práctica.</div>'}</div>
    <div class="card"><h3>🎯 Lo que debes reforzar</h3>${A.weak.length ? A.weak.map((t) => `<div class="errrow"><span>${t.name}</span><b class="r">${pct(t.acc)}</b></div>`).join('') : ''}
      ${A.topErr.length ? `<div class="mute small" style="margin-top:10px">Errores más repetidos (últimos 300 ejercicios):</div>${A.topErr.map(([k, v]) => `<div class="errrow"><span>${E.ERR[k] || k}</span><b>${v}×</b></div>`).join('')}` : '<div class="mute small">Del diagnóstico: fracciones (1/6), potencias (2/7), potencia de potencia, transposición de términos y la regla de tres inversa.</div>'}</div>
    ${A.seguro.n ? `<div class="card"><h3>😎 Tu seguridad</h3><div class="errrow"><span>Marcaste "seguro"</span><b>${A.seguro.n}</b></div><div class="errrow"><span>…y estaba mal (falsa seguridad)</span><b class="${A.seguro.rate > 0.2 ? 'r' : 'g'}">${A.seguro.wrong} (${pct(A.seguro.rate)})</b></div>${A.dudo.n ? `<div class="errrow"><span>Cuando dudas, aciertas</span><b>${pct(A.dudo.acc)}</b></div>` : ''}</div>` : ''}
    ${tb.length ? `<div class="card"><h3>📈 Por tema</h3>${tb.map((t) => `<div class="tbar"><span>${t.name}</span>${bar(t.acc, 'thin')}<span class="small">${pct(t.acc)}</span></div>`).join('')}</div>` : ''}
    <div class="card"><h3>📋 Diagnóstico inicial (16 nov)</h3><div class="mute small" style="margin-bottom:6px">17/37 correctas. Tu punto de partida:</div>${E.DIAG.map(([n, a, b]) => `<div class="tbar"><span>${n}</span>${bar(a / b, 'thin blue')}<span class="small">${a}/${b}</span></div>`).join('')}</div>
    <div class="card"><h3>⚙️ Ajustes</h3>
      <label class="row between" style="margin:8px 0"><span>Ejercicios por día</span><select id="goal" style="width:auto">${[20, 30, 40, 50].map((g) => `<option ${st.settings.goal === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" id="exp">📤 Copiar mi progreso</button><button class="btn sm" id="imp">📥 Pegar progreso</button><button class="btn sm" id="rst" style="color:var(--red)">Borrar todo</button></div>
      <div class="mute small" style="margin-top:8px">Tu progreso se guarda en este celular. Para pasarlo a la laptop: "Copiar" aquí y "Pegar" allá.</div>
    </div>
    <div class="mute small" style="text-align:center;margin:10px 0">Mate PRE-ESAN · v1.0 · funciona sin internet</div></div>`;
  $('#goal').onchange = (e) => { st.settings.goal = +e.target.value; E.save(); toast('Meta diaria: ' + e.target.value); };
  $('#exp').onclick = async () => { const c = E.exportData(); try { await navigator.clipboard.writeText(c); toast('Copiado. Pégalo en el otro dispositivo.'); } catch { modal(`<h3>Tu código</h3><textarea rows="6" readonly>${c}</textarea><button class="btn block" data-close>Cerrar</button>`); } };
  $('#imp').onclick = () => { const m = modal(`<h3>Pega tu código</h3><textarea id="impc" rows="6"></textarea><button class="btn pri block" id="impgo" style="margin-top:10px">Importar</button>`); $('#impgo', m.el).onclick = () => { try { E.importData($('#impc', m.el).value); m.close(); toast('Progreso importado ✓'); go('me'); } catch (e) { toast('Código no válido'); } }; };
  $('#rst').onclick = () => { if (confirm('¿Borrar todo tu progreso? No se puede deshacer.')) { E.resetAll(); toast('Progreso borrado'); go('home'); } };
}

// =============================================================
// Inicio
// =============================================================
bindPhysical(() => activeField, () => { if (P && !P.done) okPressed(); else if (P && P.done) nextQ(); });
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; const i = $('#install'); if (i) i.classList.add('show'); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
E.load();
go('home');
window.__app = { E, startSession, go, Q };
