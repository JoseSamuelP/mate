// =============================================================
// reasoning.js — Problemas de razonamiento (sin lápiz, ilustrados)
// Cada generador recibe el nivel (1..6) y sube la dificultad.
// =============================================================
import { ri, nz, pick, chance, shuffle, S, soles, num, choice, T, Q, M, qHTML, gcd } from './util.js';
import * as V from './viz.js';

const R = [];
const add = (id, name, icon, w, gen, extra = {}) => R.push({ id, name, icon, w, gen, ...extra });

// 1. Series numéricas
add('serie', 'Series', '1,2,4…', 4, (L) => {
  const k = pick(L <= 2 ? [0, 0, 1, 2] : L <= 4 ? [0, 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]);
  let seq, rule;
  if (k === 0) { const a = ri(-10, 20), d = nz(-9, 12) * (L > 3 ? 3 : 1); seq = Array.from({ length: 6 }, (_, i) => a + i * d); rule = `Se ${d > 0 ? 'suma' : 'resta'} ${Math.abs(d)} cada vez.`; }
  else if (k === 1) { const a = ri(1, 5), r = pick([2, 3, -2]); seq = Array.from({ length: 6 }, (_, i) => a * r ** i); rule = `Se multiplica por ${S(r)} cada vez.`; }
  else if (k === 2) { const a = ri(1, 10), d = ri(1, 4); seq = [a]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + d * i); rule = `Se suma ${d}, ${2 * d}, ${3 * d}… (lo que se suma crece).`; }
  else if (k === 3) { const s = ri(1, 4); seq = Array.from({ length: 6 }, (_, i) => (i + s) ** 2); rule = 'Son cuadrados: ' + seq.slice(0, 3).map((v, i) => `${i + s}²`).join(', ') + '…'; }
  else if (k === 4) { const a = ri(1, 4), b = ri(1, 5); seq = [a, b]; for (let i = 2; i < 7; i++) seq.push(seq[i - 1] + seq[i - 2]); rule = 'Cada número es la suma de los dos anteriores.'; seq = seq.slice(0, 6); }
  else if (k === 5) { const a = ri(2, 9), p = ri(2, 6), m = ri(1, 4); seq = [a]; for (let i = 1; i < 6; i++) seq.push(i % 2 ? seq[i - 1] + p : seq[i - 1] - m); rule = `Alterna: +${p}, −${m}, +${p}, −${m}…`; }
  else { const a = ri(1, 3); seq = [a]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] * 2 + (i % 2 ? 1 : 0)); rule = 'Se duplica y a veces se suma 1 (×2, ×2+1…).'; }
  const hide = L >= 4 && chance(0.4) ? ri(1, 4) : 5;
  const shown = seq.map((v, i) => (i === hide ? '<b class="q">?</b>' : S(v)));
  return {
    q: `¿Qué número va en el lugar de <b>?</b>`, ill: `<div class="seq">${shown.map((s) => `<span>${s}</span>`).join('')}</div>`,
    ans: num(seq[hide]), traps: [], steps: [{ note: 'Mira cuánto cambia de un número al siguiente.' }, { note: rule }, { note: `Respuesta: <b>${S(seq[hide])}</b>` }],
  };
});

// 2. Balanza de figuras (álgebra visual)
add('figuras', 'Balanza de figuras', '■●▲', 4, (L) => {
  const v = { sq: ri(1, 9), ci: ri(1, 9), tr: ri(1, 9) };
  const nm = { sq: 'cuadrado', ci: 'círculo', tr: 'triángulo' };
  if (L <= 2) {
    const n = ri(2, 5);
    return { q: `¿Cuánto vale un ${nm.sq} ${V.shapeIcon('sq')}?`, ill: V.shapeBalance([['sq', n]], n * v.sq), ans: num(v.sq), traps: [T(n * v.sq - n, 'razon', 'Repartir en partes iguales es dividir.')], steps: [{ note: `${n} cuadrados pesan ${n * v.sq}.` }, { note: `Uno pesa ${n * v.sq} ÷ ${n} = <b>${v.sq}</b>` }] };
  }
  const a = ri(1, 3), b = ri(1, 3);
  const b1 = [['sq', a + (L > 3 ? 1 : 0)]]; const t1 = b1[0][1] * v.sq;
  const b2 = [['sq', a], ['ci', b]]; const t2 = a * v.sq + b * v.ci;
  if (L <= 4) {
    return {
      q: `¿Cuánto vale un ${nm.ci} ${V.shapeIcon('ci')}?`, ill: V.shapeBalance(b1, t1) + V.shapeBalance(b2, t2), ans: num(v.ci), traps: [],
      steps: [{ note: `Balanza 1: cada ${V.shapeIcon('sq')} vale ${t1} ÷ ${b1[0][1]} = ${v.sq}` }, { note: `Balanza 2: ${a}·${v.sq} = ${a * v.sq}; quedan ${t2 - a * v.sq} para ${b} ${V.shapeIcon('ci')}` }, { note: `${V.shapeIcon('ci')} = <b>${v.ci}</b>` }],
    };
  }
  const b3 = [['ci', 1], ['tr', 2]]; const t3 = v.ci + 2 * v.tr;
  return {
    q: `¿Cuánto vale un ${nm.tr} ${V.shapeIcon('tr')}?`, ill: V.shapeBalance(b1, t1) + V.shapeBalance(b2, t2) + V.shapeBalance(b3, t3), ans: num(v.tr), traps: [],
    steps: [{ note: `${V.shapeIcon('sq')} = ${v.sq}` }, { note: `${V.shapeIcon('ci')} = ${v.ci}` }, { note: `${V.shapeIcon('tr')} = (${t3} − ${v.ci}) ÷ 2 = <b>${v.tr}</b>` }],
  };
});

// 3. Pirámide numérica
add('piramide', 'Pirámide', '△', 3, (L) => {
  const n = L <= 2 ? 3 : 4; const neg = L >= 4;
  const base = Array.from({ length: n }, () => (neg ? nz(-6, 9) : ri(1, 9)));
  const lv = [base]; while (lv[lv.length - 1].length > 1) { const p = lv[lv.length - 1]; lv.push(p.slice(1).map((v, i) => p[i] + v)); }
  const hideTop = L <= 1 || chance(0.4);
  let ans, shown;
  if (hideTop) { ans = lv[lv.length - 1][0]; shown = lv.map((r, i) => (i === lv.length - 1 ? [null] : r)); }
  else { const k = ri(0, n - 1); ans = base[k]; shown = lv.map((r, i) => (i === 0 ? r.map((v, j) => (j === k ? null : v)) : i === lv.length - 1 ? r : r.map(() => '·'))); shown = lv.map((r, i) => (i === 0 ? r.map((v, j) => (j === k ? null : v)) : r)); }
  return {
    q: 'Cada bloque es la <b>suma</b> de los dos que tiene debajo. ¿Qué número va en <b>?</b>', ill: V.pyramid(shown), ans: num(ans), traps: [],
    steps: [{ note: hideTop ? 'Suma de dos en dos, subiendo piso por piso.' : 'Usa el bloque de arriba del ? y réstale su vecino.' }, { note: `Respuesta: <b>${S(ans)}</b>` }],
  };
});

// 4. Cuadrado mágico
add('magico', 'Cuadrado mágico', '▦', 2, (L) => {
  const base = pick([[2, 7, 6, 9, 5, 1, 4, 3, 8], [4, 9, 2, 3, 5, 7, 8, 1, 6], [8, 1, 6, 3, 5, 7, 4, 9, 2], [6, 1, 8, 7, 5, 3, 2, 9, 4]]);
  const k = L >= 3 ? ri(1, 4) * (chance(0.5) ? 1 : -1) : 0, m = L >= 5 ? 2 : 1;
  const cells = base.map((v) => v * m + k); const sum = 15 * m + 3 * k;
  const hide = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, L >= 4 ? 2 : 1);
  const ask = Math.min(...hide);
  return {
    q: `En este cuadrado, cada fila, columna y diagonal suma lo mismo. ¿Qué número va en el <b>?</b> resaltado?`, ill: V.magicSquare(cells.map((v, i) => (hide.includes(i) ? null : v))).replace('<span class="q">', '<span class="q q1">'),
    ans: num(cells[ask]), traps: [],
    steps: [{ note: 'Busca una fila o columna completa para saber la suma mágica.' }, { note: `Suma mágica: ${sum}` }, { note: `Respuesta: <b>${S(cells[ask])}</b>` }],
  };
});

// 5. Áreas y perímetros
add('area', 'Áreas y perímetros', '▭', 3, (L) => {
  const k = L <= 2 ? pick([0, 1]) : pick([0, 1, 2, 3]);
  if (k <= 1) {
    const w = ri(3, 15), h = ri(2, 10);
    return k === 0
      ? { q: '¿Cuál es el <b>área</b> del rectángulo? (en m²)', ill: V.rectFig(w, h, `${w} m`, `${h} m`), ans: num(w * h), traps: [T(2 * (w + h), 'razon', 'Eso es el perímetro (el borde). El área es lo de adentro: base × altura.')], steps: [{ note: 'Área = base × altura' }, { note: `${w} × ${h} = <b>${w * h}</b> m²` }] }
      : { q: '¿Cuál es el <b>perímetro</b> del rectángulo? (en m)', ill: V.rectFig(w, h, `${w} m`, `${h} m`), ans: num(2 * (w + h)), traps: [T(w * h, 'razon', 'Eso es el área. El perímetro es la vuelta completa: suma los 4 lados.'), T(w + h, 'razon', 'Son 4 lados, no 2.')], steps: [{ note: 'Perímetro = suma de los 4 lados' }, { note: `${w} + ${h} + ${w} + ${h} = <b>${2 * (w + h)}</b>` }] };
  }
  if (k === 2) {
    const W0 = ri(6, 12), H0 = ri(5, 10), cw = ri(2, W0 - 3), ch = ri(2, H0 - 2);
    const A = W0 * H0 - cw * ch;
    return { q: '¿Cuál es el <b>área</b> de la figura? (medidas en cm)', ill: V.lShape(W0, H0, cw, ch), ans: num(A), traps: [T(W0 * H0, 'razon', 'Le falta una esquina: réstala.')], steps: [{ note: `Rectángulo completo: ${W0}·${H0} = ${W0 * H0}` }, { note: `Esquina que falta: ${cw}·${ch} = ${cw * ch}` }, { note: `${W0 * H0} − ${cw * ch} = <b>${A}</b>` }] };
  }
  const b = ri(2, 12) * 2, h = ri(2, 10);
  return { q: '¿Cuál es el <b>área</b> del triángulo? (base y altura en cm)', ill: `<svg viewBox="0 0 260 150" class="viz geo"><path d="M30,130 L230,130 L110,25Z" fill="color-mix(in srgb, var(--blue) 15%, transparent)" stroke="var(--blue)" stroke-width="2"/><line x1="110" y1="25" x2="110" y2="130" stroke="var(--amber)" stroke-dasharray="4 3"/><text x="130" y="146" text-anchor="middle" font-size="13" fill="var(--ink)">base ${b}</text><text x="116" y="85" font-size="13" fill="var(--amber)">h = ${h}</text></svg>`, ans: num(b * h / 2), traps: [T(b * h, 'razon', 'Un triángulo es la <b>mitad</b> de un rectángulo: (base × altura) ÷ 2.')], steps: [{ note: 'Área = (base × altura) ÷ 2' }, { note: `${b}·${h} ÷ 2 = <b>${b * h / 2}</b>` }] };
});

// 6. Ángulos
add('angulos', 'Ángulos', '∠', 2, () => {
  if (chance(0.6)) {
    const a = ri(25, 90), b = ri(20, 150 - a); const c = 180 - a - b;
    return { q: 'Los ángulos de un triángulo suman 180°. ¿Cuánto mide el ángulo <b>?</b> (en grados)', ill: V.triangleAngles(a, b, c, 2), ans: num(c), traps: [T(360 - a - b, 'razon', 'Los ángulos interiores de un triángulo suman <b>180°</b>, no 360°.')], steps: [{ note: `180 − ${a} − ${b}` }, { note: `= <b>${c}°</b>` }] };
  }
  const a = ri(20, 160);
  return { q: 'Una línea recta mide 180°. ¿Cuánto mide el ángulo <b>?</b>', ill: V.lineAngle(a), ans: num(180 - a), traps: [T(90 - a, 'razon', 'Una línea recta es 180°, no 90°.')], steps: [{ note: `180 − ${a} = <b>${180 - a}°</b>` }] };
});

// 7. Pitágoras
add('pitagoras', 'Pitágoras', '◺', 2, (L) => {
  const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20]]);
  const u = L <= 3 ? 'c' : pick(['a', 'c', 'b']);
  const ans = { a, b, c }[u];
  return { q: `Triángulo rectángulo: ${M('a^2+b^2=c^2')} (c es el lado más largo). ¿Cuánto mide el lado <b>?</b>`, ill: V.rightTriangle(a, b, c, u), ans: num(ans), traps: [T(u === 'c' ? a + b : c - (u === 'a' ? b : a), 'razon', 'Los lados no se suman/restan directo: se suman/restan sus <b>cuadrados</b>.')], steps: [{ note: u === 'c' ? `${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}` : `${c}² − ${u === 'a' ? b : a}² = ${c * c} − ${(u === 'a' ? b : a) ** 2} = ${ans * ans}` }, { note: `√${ans * ans} = <b>${ans}</b>` }] };
});

// 8. Fracción sombreada
add('sombreado', 'Fracción sombreada', '◩', 2, (L) => {
  const [r, c] = pick([[2, 4], [3, 4], [4, 4], [2, 6], [3, 6], [4, 5], [5, 4]]);
  const tot = r * c; let k = ri(1, tot - 1); if (L >= 3 && gcd(k, tot) === 1) k = Math.max(2, Math.floor(tot / 2));
  const cells = new Set(shuffle([...Array(tot).keys()]).slice(0, k));
  const q = new Q(k, tot);
  return { q: '¿Qué fracción está pintada? Simplifícala.', ill: V.shadedGrid(r, c, cells), ans: num(q), traps: [T(new Q(k, tot - k), 'frac_simpl', 'El denominador es el <b>total</b> de cuadritos, no los que no están pintados.')], steps: [{ note: `Pintados: ${k}, total: ${tot} → ${M(`${k}/${tot}`)}` }, { note: `Simplificada: ${qHTML(q)}` }] };
});

// 9. Operación inventada
add('operacion', 'Operación inventada', '★', 3, (L) => {
  const forms = [
    ['a★b = 2a + b', (a, b) => 2 * a + b], ['a★b = a² − b', (a, b) => a * a - b], ['a★b = ab − a', (a, b) => a * b - a],
    ['a★b = 3a − 2b', (a, b) => 3 * a - 2 * b], ['a★b = (a + b)²', (a, b) => (a + b) ** 2], ['a★b = a·b + a + b', (a, b) => a * b + a + b],
  ];
  const [txt, f] = pick(forms); const a = L >= 3 ? nz(-5, 6) : ri(1, 6), b = L >= 3 ? nz(-5, 6) : ri(1, 6);
  if (L >= 5) {
    const c = ri(1, 4); const inner = f(a, b); const r = f(inner, c);
    return { q: `Si <b>${txt}</b>, calcula <b>(${S(a)}★${S(b)})★${c}</b>`, ans: num(r), traps: [], steps: [{ note: `Primero ${S(a)}★${S(b)} = ${S(inner)}` }, { note: `Luego ${S(inner)}★${c} = <b>${S(r)}</b>` }] };
  }
  return { q: `Si <b>${txt}</b>, calcula <b>${S(a)}★${S(b)}</b>`, ans: num(f(a, b)), traps: [T(f(b, a), 'razon', 'El primero ocupa el lugar de <b>a</b> y el segundo el de <b>b</b>.')], steps: [{ note: `Reemplaza a = ${S(a)} y b = ${S(b)} (con paréntesis si son negativos).` }, { note: `= <b>${S(f(a, b))}</b>` }] };
});

// 10. Pienso un número (operaciones inversas)
add('pienso', 'Pienso un número', '🤔', 3, (L) => {
  const x = ri(2, 20); const ops = [];
  let v = x; const n = L <= 2 ? 2 : L <= 4 ? 3 : 4;
  for (let i = 0; i < n; i++) {
    const k = pick(['m', 's', 'r', i > 0 ? 'd' : 'm']);
    if (k === 'm') { const m = ri(2, 5); v *= m; ops.push([`lo multiplico por ${m}`, `÷ ${m}`]); }
    else if (k === 's') { const m = ri(2, 15); v += m; ops.push([`le sumo ${m}`, `− ${m}`]); }
    else if (k === 'r') { const m = ri(1, Math.max(1, v - 1)); v -= m; ops.push([`le resto ${m}`, `+ ${m}`]); }
    else { const ds = [2, 3, 4, 5].filter((d) => v % d === 0); if (!ds.length) { const m = ri(2, 9); v += m; ops.push([`le sumo ${m}`, `− ${m}`]); } else { const d = pick(ds); v /= d; ops.push([`lo divido entre ${d}`, `× ${d}`]); } }
  }
  return {
    q: `Pienso un número, ${ops.map((o) => o[0]).join(', luego ')} y obtengo <b>${v}</b>. ¿Qué número pensé?`, ans: num(x), traps: [],
    steps: [{ note: 'Regresa desde el final haciendo la operación <b>contraria</b> en orden inverso.' }, { note: `${v} ${[...ops].reverse().map((o) => o[1]).join(' → ')} = <b>${x}</b>` }],
  };
});

// 11. Cálculo mental con truco
add('mental', 'Cálculo mental', '⚡', 4, () => {
  const k = ri(0, 7);
  if (k === 0) { const n = ri(2, 19) * 4; return { q: `Calcula rápido: <b>25 × ${n}</b>`, ans: num(25 * n), traps: [], steps: [{ note: '25 = 100 ÷ 4. Entonces 25 × n = n ÷ 4 × 100.' }, { note: `${n} ÷ 4 = ${n / 4} → <b>${25 * n}</b>` }] }; }
  if (k === 1) { const n = ri(3, 12); return { q: `Calcula rápido: <b>99 × ${n}</b>`, ans: num(99 * n), traps: [], steps: [{ note: `99 × ${n} = 100 × ${n} − ${n}` }, { note: `${100 * n} − ${n} = <b>${99 * n}</b>` }] }; }
  if (k === 2) { const n = ri(2, 30) * 20; return { q: `Calcula rápido: <b>15% de ${n}</b>`, ans: num(n * 15 / 100), traps: [], steps: [{ note: `10% de ${n} = ${n / 10}; 5% es la mitad = ${n / 20}` }, { note: `${n / 10} + ${n / 20} = <b>${n * 15 / 100}</b>` }] }; }
  if (k === 3) { const n = ri(11, 19); return { q: `Calcula rápido: <b>${n} × 11</b>`, ans: num(n * 11), traps: [], steps: [{ note: `${n} × 11 = ${n} × 10 + ${n}` }, { note: `${n * 10} + ${n} = <b>${n * 11}</b>` }] }; }
  if (k === 4) { const n = ri(2, 9) * 10 + 5; return { q: `Calcula rápido: <b>${n}²</b>`, ans: num(n * n), traps: [], steps: [{ note: `Truco del 5: decena × (decena+1), y al final 25.` }, { note: `${Math.floor(n / 10)}×${Math.floor(n / 10) + 1} = ${Math.floor(n / 10) * (Math.floor(n / 10) + 1)} → <b>${n * n}</b>` }] }; }
  if (k === 5) { const a = ri(21, 89), b = ri(11, 49); return { q: `Calcula rápido: <b>${a} + ${b}</b>`, ans: num(a + b), traps: [], steps: [{ note: `${a} + ${Math.floor(b / 10) * 10} = ${a + Math.floor(b / 10) * 10}; + ${b % 10} = <b>${a + b}</b>` }] }; }
  if (k === 6) { const n = ri(3, 9), m = ri(12, 19); return { q: `Calcula rápido: <b>${n} × ${m}</b>`, ans: num(n * m), traps: [], steps: [{ note: `${n}×10 + ${n}×${m - 10} = ${n * 10} + ${n * (m - 10)} = <b>${n * m}</b>` }] }; }
  const p = pick([200, 500, 1000, 50]), c = ri(11, p === 50 ? 49 : 189);
  return { q: `Pagas con ${soles(p)} una compra de ${soles(c)}. ¿Cuánto es tu vuelto?`, ans: num(p - c), traps: [], steps: [{ note: `Completa desde ${c} hasta ${p}.` }, { note: `<b>${p - c}</b>` }] };
});

// 12. Patrones con palitos
add('palitos', 'Patrones con palitos', '⊞', 2, (L) => {
  const kind = pick(['sq', 'tri']);
  const f = kind === 'sq' ? (n) => 3 * n + 1 : (n) => 2 * n + 1;
  const n = L <= 2 ? 4 : L <= 4 ? 10 : ri(15, 30);
  return {
    q: `Mira cuántos palitos tiene cada figura. ¿Cuántos palitos tendrá la <b>figura ${n}</b>?`, ill: V.stickPattern(kind, [1, 2, 3]) + `<div class="mute small">Palitos: ${f(1)}, ${f(2)}, ${f(3)}…</div>`,
    ans: num(f(n)), traps: [T(f(1) * n, 'razon', 'Las figuras comparten palitos: no es multiplicar la primera.')],
    steps: [{ note: `Cada figura nueva agrega <b>${kind === 'sq' ? 3 : 2}</b> palitos.` }, { note: `Fórmula: ${kind === 'sq' ? '3n + 1' : '2n + 1'}` }, { note: `n = ${n}: <b>${f(n)}</b>` }],
  };
});

// 13. ¿Cuál es mayor?
add('mayor', '¿Cuál es mayor?', '⚖', 3, () => {
  const k = ri(0, 5);
  const pairs = [
    () => { const a = ri(2, 4), b = ri(3, 6); return [M(`${a}^${b}`), M(`${b}^${a}`), a ** b, b ** a]; },
    () => { const a = ri(1, 6), b = ri(a + 1, 9), c = ri(1, 6), d = ri(c + 1, 9); return [M(`${a}/${b}`), M(`${c}/${d}`), a / b, c / d]; },
    () => { const a = ri(2, 6); return [M(`(-${a})^2`), M(`-${a}^2`), a * a, -a * a]; },
    () => { const a = ri(2, 5); return [M(`${a}^(-1)`), M(`${a}^0`), 1 / a, 1]; },
    () => { const p = pick([10, 20, 30]), n = ri(2, 9) * 50; const m = ri(2, 9) * 50; return [`${p}% de ${n}`, `${p + 10}% de ${m}`, p * n, (p + 10) * m]; },
    () => { const a = ri(2, 9) / 10; return [`${String(a).replace('.', ',')}`, M(`${a * 10}/${a * 10 + 1}`), a, (a * 10) / (a * 10 + 1)]; },
  ];
  const [A, B, va, vb] = pairs[k]();
  if (va === vb) return R.find((r) => r.id === 'mayor').gen();
  return { q: '¿Cuál es <b>mayor</b>?', ans: choice([A, B], va > vb ? 0 : 1), traps: [], steps: [{ note: `${A} = ${String(+va.toFixed(3)).replace('.', ',')} ; ${B} = ${String(+vb.toFixed(3)).replace('.', ',')}` }], flash: true };
});

// 14. Edades y dinero (lógica)
add('logica', 'Problemas de lógica', '🧩', 3, (L) => {
  const k = ri(0, 3);
  if (k === 0) { const h = ri(5, 15), d = ri(2, 8); const s = 2 * h + d; return { q: `Entre Ana y Beto tienen ${soles(s)}. Ana tiene ${soles(d)} más que Beto. ¿Cuánto tiene Beto?`, ans: num(h), traps: [T(new Q(s, 2), 'razon', 'Si fueran iguales sería la mitad, pero Ana tiene más.')], steps: [{ note: `Quita la diferencia: ${s} − ${d} = ${s - d}` }, { note: `Repártelo en dos: <b>${h}</b>` }] }; }
  if (k === 1) { const y = ri(8, 20), f = ri(2, 4), x = ri(3, 10); return { q: `Hoy un padre tiene ${f} veces la edad de su hijo, que tiene ${y} años. ¿Cuántos años tendrá el padre dentro de ${x} años?`, ans: num(f * y + x), traps: [T(f * (y + x), 'razon', 'Dentro de unos años, el padre solo suma esos años (no se vuelve a multiplicar).')], steps: [{ note: `Padre hoy: ${f}·${y} = ${f * y}` }, { note: `+ ${x} = <b>${f * y + x}</b>` }] }; }
  if (k === 2) { const p = ri(3, 6), c = ri(5, 15) * p * (p - 1); return { q: `${p} amigos pagan una cuenta de ${soles(c * 1)} en partes iguales, pero uno no tiene dinero y los demás se reparten su parte. ¿Cuánto paga cada uno de los que pagan?`, ans: num(new Q(c, p - 1), { dec: true }), traps: [T(new Q(c, p), 'razon', 'Ahora son ' + (p - 1) + ' los que pagan.')], steps: [{ note: `Pagan ${p - 1} personas: ${c} ÷ ${p - 1}` }, { note: `= <b>${new Q(c, p - 1).toDec() || new Q(c, p - 1).toString()}</b>` }] }; }
  const g = ri(3, 8), pr = ri(2, 6), r = ri(1, 9); const pay = g * pr + r;
  return { q: `Compras ${g} panes a ${soles(pr)} cada uno y una gaseosa. Pagas en total ${soles(pay)}. ¿Cuánto costó la gaseosa?`, ans: num(r), traps: [], steps: [{ note: `Panes: ${g}·${pr} = ${g * pr}` }, { note: `${pay} − ${g * pr} = <b>${r}</b>` }] };
});

export const REASONING = R;
