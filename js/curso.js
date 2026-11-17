// =============================================================
// curso.js — "Aprender": un curso corto por cada tema del examen
// diagnóstico. Cada tema: lección desde cero + 3 niveles
// (fácil → medio → tipo examen) con ejercicios infinitos.
// Un nivel puede ser una función gen() o {topic, variant} para
// reutilizar los generadores de la ruta.
// =============================================================
import { ri, nz, pick, chance, shuffle, S, P, gcd, lcm, poly, num, expr, choice, T, Q, M, qHTML } from './util.js';
import * as V from './viz.js';

const L3 = ['a', 'b', 'c', 'd'];
const fmt = (x) => String(x).replace('-', '−').replace('.', ',');
// Pregunta de opción múltiple con trampas explicadas
function mc(q, right, wrongs, steps, extra = {}) {
  const seen = new Set([right]); const ws = [];
  for (const [w, why] of wrongs) { if (w == null || seen.has(String(w))) continue; seen.add(String(w)); ws.push([String(w), why]); if (ws.length === 3) break; }
  let k = 1; while (ws.length < 3) { const alt = String(right).match(/^-?\d+$/) ? String(+right + k * 7) : `${right} + ${k}`; if (!seen.has(alt)) { seen.add(alt); ws.push([alt, 'No sale de ningún paso correcto.']); } k++; }
  const opts = shuffle([[String(right), null], ...ws]);
  const correct = opts.findIndex((o) => o[1] === null);
  const traps = opts.map((o, i) => (o[1] ? `<div class="errrow" data-trap="${i}"><span><b>${L3[i]})</b> ${o[0]}</span></div><div class="mute small" style="margin:-2px 0 6px">${o[1]}</div>` : '')).join('');
  return { q, ans: choice(opts.map((o, i) => `${L3[i]}) ${o[0]}`), correct), trapFor: (i) => opts[i][1], steps, extra: `<div style="margin-top:10px"><b>Trampas (por qué las otras están mal):</b></div>${traps}`, ...extra };
}
const st = (...notes) => notes.map((n) => (typeof n === 'string' ? { note: n } : n));
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const C = (n, k) => fact(n) / (fact(k) * fact(n - k));
const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const factorize = (n) => { const f = {}; let m = n; for (let p = 2; m > 1; p++) while (m % p === 0) { f[p] = (f[p] || 0) + 1; m /= p; } return f; };
const fstr = (n) => Object.entries(factorize(n)).map(([p, e]) => (e > 1 ? `${p}<sup>${e}</sup>` : p)).join('·');
const setStr = (a) => `{${a.join(', ')}}`;
const sup = (n) => String(n).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '-' ? '⁻' : c)).join('');

export const CURSO = [
  // ======================= ÁLGEBRA =======================
  { tema: 'Evaluar funciones',
    lesson: () => `<p>Una <b>función</b> es una máquina: le das un número (x) y te devuelve otro. <span class="m">f(x) = 2x + 3</span> dice: "multiplica por 2 y suma 3".</p>
      <p><b>f(4)</b> significa "mete el 4 en la máquina": <span class="m">2·4 + 3 = 11</span>.</p>
      <p>Ejemplo real: un taxi cobra S/ 3 de base + S/ 2 por km → <span class="m">f(km) = 2·km + 3</span>. Por 4 km pagas f(4) = 11.</p>
      <p><b>Regla de oro:</b> si metes un negativo, ponlo <b>entre paréntesis</b>: f(−1) = 2·(−1) + 3 = 1.</p>`,
    levels: [
      () => { const a = nz(-5, 6), b = nz(-9, 9), k = ri(-5, 6); return { q: `Si ${M(`f(x)=${poly([a, b])}`)}, calcula <b>f(${S(k)})</b>`, ans: num(a * k + b), traps: [T(-a * k + b, 'valor_num', 'Revisa el signo al multiplicar.')], steps: st(`Cambia x por (${S(k)}): ${M(`${a}*(${k})${b < 0 ? '' : '+'}${b}`)}`, `${S(a)}·(${S(k)}) = ${S(a * k)}`, `${S(a * k)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = <b>${S(a * k + b)}</b>`) }; },
      { topic: 'valor_numerico', variant: 'cuad' },
      { topic: 'valor_numerico', variant: 'dosvar' },
    ], bank: [1] },
  { tema: 'Ecuación de 2.º grado',
    lesson: () => `<p>Una ecuación de 2.º grado tiene <span class="m">x²</span>. Puede tener <b>dos</b> soluciones.</p>
      <p><b>Idea clave:</b> si una multiplicación da 0, uno de los factores es 0. Si <span class="m">(x − 3)(x − 4) = 0</span>, entonces x = 3 o x = 4.</p>
      <p><b>Cómo factorizar</b> <span class="m">x² − 7x + 12</span>: busca dos números que <b>multiplicados</b> den 12 y <b>sumados</b> den −7 → −3 y −4.</p>
      <p>Las soluciones <b>cambian de signo</b>: el −3 del paréntesis da x = 3.</p>
      <p>Escribe las dos soluciones separadas con <b>;</b> (ej.: 3; 4).</p>`,
    levels: [{ topic: 'cuadraticas', variant: 'pura' }, { topic: 'aspa_simple', variant: 'mon' }, { topic: 'cuadraticas', variant: 'fact' }], bank: [2] },
  { tema: 'Leyes de exponentes',
    lesson: () => `<p><span class="m">x⁴</span> es x·x·x·x (4 veces). De ahí salen las reglas:</p>
      <p>• <b>Multiplicar</b>: <span class="m">x³·x⁴ = x⁷</span> (juntas las x: 3 + 4).</p>
      <p>• <b>Dividir</b>: <span class="m">x⁷ ÷ x² = x⁵</span> (tachas 2 parejas: 7 − 2).</p>
      <p>• <b>Potencia de potencia</b>: <span class="m">(x²)³ = x⁶</span> (3 grupos de 2: 2 × 3).</p>
      <p>• <span class="m">x⁰ = 1</span> (algo dividido entre sí mismo).</p>${V.powerBlocks('x', 2, 3)}`,
    levels: [{ topic: 'pot_leyes', variant: 'prod' }, { topic: 'pot_leyes', variant: 'coc' }, { topic: 'pot_potencia', variant: 'producto' }], bank: [3, 14] },
  { tema: 'Ecuaciones lineales',
    lesson: () => `<p>Una ecuación es una <b>balanza en equilibrio</b>. Para encontrar x, haces lo mismo a los dos lados.</p>
      <p>"Pasar al otro lado" = hacer la operación contraria: lo que suma pasa restando; lo que multiplica pasa dividiendo.</p>
      <p><b>Paréntesis:</b> el número de afuera multiplica a TODO lo de adentro: <span class="m">2(3x − 4) = 6x − 8</span>.</p>
      ${V.balance(M('2x+6'), M('14'), 'Quito 6 de ambos lados → 2x = 8 → x = 4')}`,
    levels: [{ topic: 'ec_lineales', variant: 'simple' }, { topic: 'ec_lineales', variant: 'ambos' }, { topic: 'ec_lineales', variant: 'paren' }], bank: [4] },
  { tema: 'Sistemas 2×2',
    lesson: () => `<p>Un sistema son <b>dos ecuaciones que se cumplen a la vez</b> (el ";" las separa). Buscas los valores de x e y que sirvan para las dos.</p>
      <p>Ejemplo real: 2 panes y 1 jugo cuestan S/ 7; 1 pan y 1 jugo cuestan S/ 5. Si restas, desaparece el jugo → 1 pan = S/ 2.</p>
      <p><b>Método de suma:</b> si una ecuación tiene +y y la otra −y, al sumarlas la y desaparece.</p>
      <p>Escribe la respuesta así: <b>x=3; y=4</b>.</p>`,
    levels: [{ topic: 'sistemas', variant: 'sumdif' }, { topic: 'sistemas', variant: 'gen' }, { topic: 'sistemas', variant: 'ctx' }], bank: [5] },
  { tema: 'Factorización',
    lesson: () => `<p><b>Factorizar</b> es convertir una suma o resta en una <b>multiplicación</b>. Es lo contrario de "desarrollar".</p>
      <p>• Factor común: <span class="m">6x² + 9x = 3x(2x + 3)</span></p>
      <p>• Diferencia de cuadrados: <span class="m">a² − b² = (a − b)(a + b)</span>. Ejemplo: <span class="m">x² − 9 = (x − 3)(x + 3)</span>.</p>
      <p>• La <b>suma</b> de cuadrados <span class="m">x² + 9</span> NO se factoriza.</p>
      <p>Siempre puedes comprobar multiplicando.</p>`,
    levels: [
      { topic: 'factor_comun', variant: 'fc' },
      () => { const k = ri(1, 12); const a = pick([1, 1, 2, 3]); const ex = `${a === 1 ? '' : a * a}x^2-${k * k}`; const f = `(${a === 1 ? '' : a}x-${k})(${a === 1 ? '' : a}x+${k})`; return { q: `Factoriza: ${M(ex)}`, ans: expr(f, { form: ['factored'] }), traps: [T(`(${a === 1 ? '' : a}x-${k})^2`, 'dif_cuad', `(${a === 1 ? '' : a}x − ${k})² da un término del medio. La diferencia de cuadrados es (a − b)(a + b).`)], steps: st(`${M(ex)} es ${M(`(${a === 1 ? '' : a}x)^2-${k}^2`)}: una diferencia de cuadrados`, `a = ${a === 1 ? '' : a}x, b = ${k}`, `${M(f)}`) }; },
      { topic: 'aspa_simple', variant: 'mon' },
    ], bank: [6] },
  { tema: 'Discriminante',
    lesson: () => `<p>En <span class="m">ax² + bx + c = 0</span>, el <b>discriminante</b> <span class="m">Δ = b² − 4ac</span> te dice cuántas soluciones hay, sin resolver:</p>
      <p>• Δ &gt; 0 → <b>2</b> soluciones · Δ = 0 → <b>1</b> · Δ &lt; 0 → <b>ninguna</b> real.</p>
      <p>Primero identifica a, b, c <b>con su signo</b>. En <span class="m">2x² − 4x + 1</span>: a = 2, b = −4, c = 1.</p>
      <p><span class="m">Δ = (−4)² − 4·2·1 = 16 − 8 = 8</span>. Ojo: (−4)² = +16.</p>`,
    levels: [
      () => { const a = ri(1, 3), b = ri(1, 9), c = ri(1, 5); const d = b * b - 4 * a * c; return { q: `Si a = ${a}, b = ${b}, c = ${c}, calcula ${M('Δ=b^2-4ac')}`, ans: num(d), traps: [T(b * b, 'cuad', 'Eso es solo b²; falta restar 4ac.'), T(b * b + 4 * a * c, 'cuad', 'Es una resta: b² MENOS 4ac.')], steps: st(`b² = ${b}² = ${b * b}`, `4ac = 4·${a}·${c} = ${4 * a * c}`, `Δ = ${b * b} − ${4 * a * c} = <b>${S(d)}</b>`) }; },
      () => { const a = ri(1, 4), b = nz(-9, 9), c = nz(-6, 6); const d = b * b - 4 * a * c; return { q: `Calcula el discriminante de ${M(`${poly([a, b, c])}=0`)}`, ans: num(d), traps: [T(-b * b - 4 * a * c, 'neg_base', `(${S(b)})² es positivo: ${b * b}.`), T(b * b, 'cuad', 'Falta restar 4ac.'), T(b * b + 4 * a * c, 'signo_mult', `Cuidado: 4·${a}·(${S(c)}) = ${S(4 * a * c)}, y se resta.`)], steps: st(`a = ${a}, b = ${S(b)}, c = ${S(c)}`, `b² = (${S(b)})² = ${b * b}`, `4ac = 4·${a}·(${S(c)}) = ${S(4 * a * c)}`, `Δ = ${b * b} − (${S(4 * a * c)}) = <b>${S(d)}</b>`) }; },
      () => { const a = ri(1, 3), b = nz(-8, 8), c = nz(-5, 6); const d = b * b - 4 * a * c; const r = d > 0 ? '2 soluciones reales' : d === 0 ? '1 solución real' : 'Ninguna solución real'; return mc(`¿Cuántas soluciones reales tiene ${M(`${poly([a, b, c])}=0`)}?`, r, [['2 soluciones reales', `Δ = ${d}, que no es positivo.`], ['1 solución real', `Δ = ${d}, no es 0.`], ['Ninguna solución real', `Δ = ${d}, no es negativo.`], ['Infinitas soluciones', 'Una ecuación de 2.º grado tiene como máximo 2 soluciones.']], st(`Δ = (${S(b)})² − 4·${a}·(${S(c)}) = ${b * b} − (${S(4 * a * c)}) = ${S(d)}`, `${d > 0 ? 'Positivo → 2 soluciones' : d === 0 ? 'Cero → 1 solución' : 'Negativo → ninguna real'}`)); },
    ], bank: [7] },
  { tema: 'Logaritmos',
    lesson: () => `<p>El logaritmo responde la pregunta: <b>"¿a qué exponente elevo la base para obtener este número?"</b></p>
      <p><span class="m">log₂(8) = 3</span> porque <span class="m">2³ = 8</span>. La base es el número pequeñito de abajo.</p>
      <p><b>Para resolver</b> <span class="m">log₂(x) = 5</span>: léelo al revés → <span class="m">2⁵ = x</span> → x = 32.</p>
      <p>Error típico: hacer 5² = 25. La base (2) es la que se eleva.</p>`,
    levels: [
      () => { const b = pick([2, 3, 5, 10, 2, 3]); const n = b === 10 ? ri(2, 4) : b === 5 ? ri(2, 3) : ri(2, 5); const x = b ** n; return { q: `¿Cuánto vale log<sub>${b}</sub>(${x})? <span class="mute">(¿a qué exponente elevo el ${b} para obtener ${x}?)</span>`, ans: num(n), traps: [T(x / b, 'razon', `No es dividir: busca cuántas veces se multiplica el ${b}.`)], steps: st(`Pregunta: ${b}<sup>?</sup> = ${x}`, `${Array(n).fill(b).join('·')} = ${x}`, `Son <b>${n}</b> veces`) }; },
      () => { const b = pick([2, 3, 4, 5, 10]); const n = b >= 5 ? ri(1, 3) : ri(2, 5); return { q: `Si log<sub>${b}</sub>(x) = ${n}, ¿cuánto vale x?`, ans: num(b ** n), traps: [T(n ** b, 'razon', `Hiciste ${n}<sup>${b}</sup>; la base es ${b}: ${b}<sup>${n}</sup>.`), T(b * n, 'pot_base', 'No es multiplicar: es elevar.')], steps: st(`log<sub>${b}</sub>(x) = ${n} ⟺ ${b}<sup>${n}</sup> = x`, `x = <b>${b ** n}</b>`) }; },
      () => { if (chance(0.5)) { const b = pick([2, 3, 5]); const n = ri(2, 4); const x = b ** n; return mc(`Si log<sub>x</sub>(${x}) = ${n}, ¿cuánto vale x?`, String(b), [[String(x / n), 'Dividiste; hay que buscar qué número elevado a ' + n + ' da ' + x + '.'], [String(n), 'Ese es el exponente.'], [String(x), 'Ese es el resultado, no la base.']], st(`x<sup>${n}</sup> = ${x}`, `${b}<sup>${n}</sup> = ${x} → x = <b>${b}</b>`)); }
        const b = pick([2, 3, 4]); const n = ri(3, 6); return mc(`Si log<sub>${b}</sub>(x) = ${n}, ¿x?`, String(b ** n), [[String(n ** b), `Base y exponente al revés (${n}<sup>${b}</sup>).`], [String(b * n), 'Multiplicaste en vez de elevar.'], [String(b ** (n + 1)), `Eso es ${b}<sup>${n + 1}</sup>.`]], st(`${b}<sup>${n}</sup> = <b>${b ** n}</b>`)); },
    ], bank: [8] },
  { tema: 'Binomio al cuadrado',
    lesson: () => `<p><span class="m">(a + b)²</span> NO es <span class="m">a² + b²</span>. Es un cuadrado de lado (a + b) con 4 pedazos:</p>${V.areaModel([M('a'), M('b')], [M('a'), M('b')], [[M('a^2'), M('ab')], [M('ab'), M('b^2')]])}
      <p class="big">${M('(a+b)^2')} = ${M('a^2+2ab+b^2')}</p><p>El "2ab" son los dos rectángulos del medio. Es el error más común: olvidarlo.</p>`,
    levels: [{ topic: 'prod_notables', variant: 'cuad' }, { topic: 'prod_notables', variant: 'cuadk' }, { topic: 'prod_notables', variant: 'difcuad' }], bank: [9] },
  { tema: 'Inecuaciones',
    lesson: () => `<p>Una inecuación usa <b>&gt;</b> (mayor), <b>&lt;</b> (menor), <b>≥</b> (mayor o igual), <b>≤</b> (menor o igual). La respuesta no es un número: es un <b>grupo de números</b>.</p>
      <p>Ejemplo real: "necesito más de S/ 20" → <span class="m">x &gt; 20</span>.</p>
      <p>Se resuelve como una ecuación, con <b>una regla extra</b>: si multiplicas o divides por un <b>negativo</b>, el signo se voltea.</p>
      <p><span class="m">−2x &gt; 6</span> → <span class="m">x &lt; −3</span> (prueba: x = −4 → 8 &gt; 6 ✓).</p>`,
    levels: [
      () => { const a = nz(-9, 9), c = ri(-5, 12), op = pick(['>', '<', '≥', '≤']); const r = c - a; const opp = { '>': '<', '<': '>', '≥': '≤', '≤': '≥' }; return mc(`Resuelve: ${M(`x${a < 0 ? '' : '+'}${a}`)} ${op} ${fmt(c)}`, `x ${op} ${fmt(r)}`, [[`x ${opp[op]} ${fmt(r)}`, 'Solo se voltea el signo al multiplicar o dividir por un negativo.'], [`x ${op} ${fmt(c + a)}`, `El ${S(a)} pasa con el signo cambiado.`], [`x = ${fmt(r)}`, 'Es una inecuación: la respuesta es un grupo de números.']], st(`Pasa el ${S(a)} al otro lado: x ${op} ${fmt(c)} ${a < 0 ? '+' : '−'} ${Math.abs(a)}`, `x ${op} <b>${fmt(r)}</b>`)); },
      () => { const a = ri(2, 6), b = nz(-9, 9), x0 = ri(-5, 8); const c = a * x0 + b; const op = pick(['>', '≥', '<', '≤']); const opp = { '>': '<', '<': '>', '≥': '≤', '≤': '≥' }; const eqs = { '>': '≥', '≥': '>', '<': '≤', '≤': '<' }; return mc(`Resuelve: ${M(poly([a, b]))} ${op} ${c}`, `x ${op} ${fmt(x0)}`, [[`x ${opp[op]} ${fmt(x0)}`, 'Dividiste entre un positivo: el signo NO se voltea.'], [`x ${eqs[op]} ${fmt(x0)}`, `Mira si el ${fmt(x0)} entra o no: el signo original es ${op}.`], [`x ${op} ${fmt(new Q(c + b, a).toString())}`, `El ${S(b)} pasa con signo cambiado.`]], st(`${a}x ${op} ${c} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${c - b}`, `Divido entre ${a} (positivo, no se voltea): x ${op} <b>${fmt(x0)}</b>`)); },
      () => { const a = ri(2, 5), x0 = ri(-4, 6), b = nz(-9, 9); const c = -a * x0 + b; const op = pick(['>', '<']); const opp = { '>': '<', '<': '>' }; return mc(`Resuelve: ${M(poly([-a, b]))} ${op} ${c}`, `x ${opp[op]} ${fmt(x0)}`, [[`x ${op} ${fmt(x0)}`, `Dividiste entre −${a} (negativo) y no volteaste el signo.`], [`x ${opp[op]} ${fmt(-x0)}`, 'Revisa el signo del número al dividir.'], [`x ${op} ${fmt(-x0)}`, 'Dos errores: el signo de la desigualdad y el del número.']], st(`−${a}x ${op} ${c} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${c - b}`, `Divido entre −${a}: <b>se voltea</b> el signo`, `x ${opp[op]} <b>${fmt(x0)}</b>`)); },
    ], bank: [10] },
  { tema: 'Binomio de Newton',
    lesson: () => `<p>Para elevar <span class="m">(x + y)ⁿ</span> sin multiplicar todo, se usa el <b>triángulo de Pascal</b>: cada número es la suma de los dos de arriba.</p>
      <div class="pyr">${[[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1], [1, 5, 10, 10, 5, 1], [1, 6, 15, 20, 15, 6, 1]].map((r) => `<div class="pyr-row">${r.map((v) => `<span class="pyr-c" style="width:36px;padding:5px 0">${v}</span>`).join('')}</div>`).join('')}</div>
      <p>Fila 4: <span class="m">(x + y)⁴ = 1x⁴ + 4x³y + 6x²y² + 4xy³ + 1y⁴</span>. El exponente de x <b>baja</b> y el de y <b>sube</b>; siempre suman 4.</p>
      <p><b>Término independiente</b> (sin x) de <span class="m">(x + 2)⁴</span>: el último, <span class="m">2⁴ = 16</span>.</p>`,
    levels: [
      () => { const n = ri(2, 6), k = ri(1, n + 1); return { q: `En la fila ${n} del triángulo de Pascal, ¿cuál es el número en la posición ${k}? <span class="mute">(la fila ${n} tiene ${n + 1} números)</span>`, ans: num(C(n, k - 1)), traps: [], steps: st(`Fila ${n}: ${Array.from({ length: n + 1 }, (_, i) => C(n, i)).join(', ')}`, `Posición ${k}: <b>${C(n, k - 1)}</b>`) }; },
      () => { const a = ri(2, 4), n = ri(2, 5); return { q: `¿Cuál es el término independiente (el que no tiene x) de ${M(`(x+${a})^${n}`)}?`, ans: num(a ** n), traps: [T(a * n, 'pot_base', `Es ${a} elevado a ${n}, no ${a}·${n}.`), T(n, 'razon', 'Ese es el exponente.'), T(1, 'razon', 'Ese es el coeficiente de x elevado a ' + n + '.')], steps: st(`El término sin x es el último: se forma solo con el ${a}`, `${a}<sup>${n}</sup> = <b>${a ** n}</b>`) }; },
      () => { const n = ri(4, 6), k = ri(2, n); const term = (j) => `${C(n, j - 1) === 1 ? '' : C(n, j - 1)}x${sup(n - j + 1)}y${sup(j - 1)}`.replace('x¹', 'x').replace('y¹', 'y').replace('x⁰', '').replace('y⁰', ''); return mc(`¿Cuál es el término número ${k} de ${M(`(x+y)^${n}`)}?`, term(k), [[term(k - 1), `Ese es el término ${k - 1}.`], [term(k + 1), `Ese es el término ${k + 1}.`], [`${k}x${sup(n - k + 1)}y${sup(k - 1)}`, 'El número sale del triángulo de Pascal, no de la posición.']], st(`Fila ${n}: ${Array.from({ length: n + 1 }, (_, i) => C(n, i)).join(', ')}`, `Término ${k}: número ${C(n, k - 1)}, x<sup>${n - k + 1}</sup>, y<sup>${k - 1}</sup> (suman ${n})`, `<b>${term(k)}</b>`)); },
    ], bank: [11, 19] },
  { tema: 'Ecuaciones exponenciales',
    lesson: () => `<p>Aquí la x está <b>en el exponente</b>: <span class="m">2<sup>x</sup> = 32</span>. El símbolo ^ significa "elevado a": 3^(x+1) es 3<sup>x+1</sup>.</p>
      <p><b>Truco:</b> escribe los dos lados con la <b>misma base</b> y luego iguala los exponentes.</p>
      <p><span class="m">32 = 2⁵</span> → <span class="m">2<sup>x</sup> = 2⁵</span> → <b>x = 5</b>.</p>
      <p><span class="m">3<sup>x+1</sup> = 27 = 3³</span> → <span class="m">x + 1 = 3</span> → x = 2.</p>`,
    levels: [
      () => { const b = pick([2, 3, 5]); const n = b === 2 ? ri(2, 7) : ri(2, 4); return { q: `Resuelve: ${b}<sup>x</sup> = ${b ** n}`, ans: num(n), traps: [T((b ** n) / b, 'razon', 'No es dividir: cuenta cuántas veces se multiplica la base.')], steps: st(`${b ** n} = ${Array(n).fill(b).join('·')} = ${b}<sup>${n}</sup>`, `x = <b>${n}</b>`) }; },
      () => { const b = pick([2, 3]); const n = ri(3, 6), k = nz(-2, 3); return { q: `Resuelve: ${b}<sup>x${k < 0 ? '−' : '+'}${Math.abs(k)}</sup> = ${b ** n}`, ans: num(n - k), traps: [T(n, 'razon', `${n} es el exponente completo (x ${k < 0 ? '−' : '+'} ${Math.abs(k)}). Falta despejar x.`), T(n + k, 'transpos', 'Al pasar el número, cambia de signo.')], steps: st(`${b ** n} = ${b}<sup>${n}</sup>`, `x ${k < 0 ? '−' : '+'} ${Math.abs(k)} = ${n}`, `x = <b>${n - k}</b>`) }; },
      () => { const [B, b, e] = pick([[4, 2, 2], [9, 3, 2], [8, 2, 3], [27, 3, 3], [25, 5, 2]]); const m = ri(1, 5); const target = b ** m; const x = new Q(m, e); return { q: `Resuelve: ${B}<sup>x</sup> = ${target} <span class="mute">(puede salir fracción)</span>`, ans: num(x), traps: [T(new Q(m * e), 'pot_pot', `(${b}<sup>${e}</sup>)<sup>x</sup> = ${b}<sup>${e}x</sup>: el ${e} multiplica a la x.`)], steps: st(`${B} = ${b}<sup>${e}</sup>, así que ${B}<sup>x</sup> = ${b}<sup>${e}x</sup>`, `${target} = ${b}<sup>${m}</sup>`, `${e}x = ${m} → x = <b>${x.toString()}</b>`) }; },
    ], bank: [12] },
  { tema: 'Suma y producto de raíces',
    lesson: () => `<p>En <span class="m">ax² + bx + c = 0</span> puedes saber la suma y el producto de las dos soluciones <b>sin resolver</b>:</p>
      <p class="big">Suma = <span class="m">−b/a</span> · Producto = <span class="m">c/a</span></p>
      <p>Ejemplo: <span class="m">x² − 7x + 12 = 0</span> tiene raíces 3 y 4. Suma: 7 = −(−7)/1 ✓. Producto: 12 = 12/1 ✓.</p>
      <p>Ojo con el <b>signo menos</b> de la suma.</p>`,
    levels: [
      () => { const r1 = nz(-6, 7), r2 = nz(-6, 7); const b = -(r1 + r2), c = r1 * r2; const s = chance(0.5); return { q: `En ${M(`${poly([1, b, c])}=0`)}, ¿cuál es la <b>${s ? 'suma' : 'producto'}</b> de las raíces?`, ans: num(s ? -b : c), traps: s ? [T(b, 'signo_suma', 'Olvidaste el signo menos: suma = −b/a.'), T(c, 'razon', 'Eso es el producto.')] : [T(-c, 'signo_mult', 'Producto = c/a, sin cambiar el signo.'), T(-b, 'razon', 'Eso es la suma.')], steps: st(`a = 1, b = ${S(b)}, c = ${S(c)}`, s ? `Suma = −b/a = −(${S(b)}) = <b>${S(-b)}</b>` : `Producto = c/a = <b>${S(c)}</b>`) }; },
      () => { const a = ri(2, 6), b = nz(-12, 12), c = nz(-9, 9); const s = chance(0.5); const r = s ? new Q(-b, a) : new Q(c, a); return { q: `En ${M(`${poly([a, b, c])}=0`)}, ¿cuál es la <b>${s ? 'suma' : 'el producto'}</b> de las raíces?`.replace('la <b>el', 'el <b>'), ans: num(r), traps: s ? [T(new Q(b, a), 'signo_suma', 'Falta el signo menos: −b/a.'), T(new Q(c, a), 'razon', 'Eso es el producto.'), T(-b, 'razon', 'Falta dividir entre a.')] : [T(new Q(-b, a), 'razon', 'Eso es la suma.'), T(c, 'razon', 'Falta dividir entre a.')], steps: st(`a = ${a}, b = ${S(b)}, c = ${S(c)}`, s ? `−b/a = ${S(-b)}/${a}` : `c/a = ${S(c)}/${a}`, `= <b>${r.toString().replace('-', '−')}</b>`) }; },
      () => { const a = ri(2, 6), b = nz(-12, 12), c = nz(-9, 9); const sum = new Q(-b, a), pr = new Q(c, a); const h = (q) => (q.d === 1 ? S(q.n) : `${S(q.n)}/${q.d}`); return mc(`¿Cuál es la suma de las raíces de ${M(`${poly([a, b, c])}=0`)}?`, h(sum), [[h(pr), 'Eso es el producto (c/a).'], [h(sum.neg()), 'Olvidaste el signo menos de −b/a.'], [S(-b), 'Falta dividir entre a.']], st(`Suma = −b/a = −(${S(b)})/${a} = <b>${h(sum)}</b>`)); },
    ], bank: [13] },
  { tema: 'Función inversa',
    lesson: () => `<p>La <b>inversa</b> f⁻¹ <b>deshace</b> lo que hace f. El "−1" NO es un exponente: es solo el nombre.</p>
      <p>Si f "multiplica por 2 y suma 6", la inversa "resta 6 y divide entre 2" (en orden contrario, como quitarse los zapatos antes que las medias).</p>
      <p><b>Receta:</b> 1) escribe y = 2x + 6; 2) despeja x: x = (y − 6)/2; 3) cambia las letras: <span class="m">f⁻¹(x) = (x − 6)/2</span>.</p>
      <p>Comprueba: f(5) = 16 y f⁻¹(16) = 5 ✓.</p>`,
    levels: [
      () => { const a = ri(2, 6), b = nz(-9, 12), x = ri(-4, 9); const y = a * x + b; return { q: `Si ${M(`f(x)=${poly([a, b])}`)} y el resultado fue <b>f(x) = ${S(y)}</b>, ¿qué número x entró? <span class="mute">(deshaz las operaciones)</span>`, ans: num(x), traps: [T(new Q(y + b, a), 'transpos', `Para deshacer el ${b < 0 ? '−' : '+'}${Math.abs(b)}, se hace lo contrario.`), T(a * y + b, 'razon', 'Volviste a aplicar f. Hay que deshacerla.')], steps: st(`Deshago el ${b < 0 ? '−' : '+'}${Math.abs(b)}: ${S(y)} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${S(y - b)}`, `Deshago el ×${a}: ${S(y - b)} ÷ ${a} = <b>${S(x)}</b>`) }; },
      () => { const a = ri(2, 5), b = nz(-9, 9), x = ri(-3, 8); const k = a * x + b; return { q: `Si ${M(`f(x)=${poly([a, b])}`)}, calcula ${M(`f^-1(${k})`).replace('<sup>−1</sup>', '<sup>−1</sup>')}`, ans: num(x), traps: [T(a * k + b, 'razon', 'Eso es f(' + k + '), no la inversa.'), T(new Q(k + b, a), 'transpos', 'Al deshacer, el número se resta (o suma) al revés.')], steps: st(`f⁻¹(x) = (x ${b < 0 ? '+' : '−'} ${Math.abs(b)})/${a}`, `f⁻¹(${k}) = (${k} ${b < 0 ? '+' : '−'} ${Math.abs(b)})/${a} = ${k - b}/${a} = <b>${S(x)}</b>`) }; },
      () => { const a = ri(2, 7), b = nz(-9, 9); const sg = b < 0 ? '+' : '−', sg2 = b < 0 ? '−' : '+'; const B = Math.abs(b); return mc(`¿Cuál es la inversa de ${M(`f(x)=${poly([a, b])}`)}?`, `f⁻¹(x) = (x ${sg} ${B})/${a}`, [[`f⁻¹(x) = (x ${sg2} ${B})/${a}`, `No cambiaste el signo del ${B} al despejar.`], [`f⁻¹(x) = ${a}x ${sg} ${B}`, 'Hay que dividir entre ' + a + ', no multiplicar.'], [`f⁻¹(x) = x/${a} ${sg} ${B}`, 'El orden importa: primero se deshace la suma/resta, luego se divide (todo junto).']], st(`y = ${a}x ${sg2} ${B}`, `y ${sg} ${B} = ${a}x → x = (y ${sg} ${B})/${a}`, `Cambio letras: <b>f⁻¹(x) = (x ${sg} ${B})/${a}</b>`)); },
    ], bank: [15] },
  { tema: 'Conjuntos',
    lesson: () => `<p>Un <b>conjunto</b> es una lista de cosas entre llaves: <span class="m">A = {1, 2, 3}</span>.</p>
      <p>• <b>A ∩ B</b> (intersección): lo que está en <b>los dos</b>. • <b>A ∪ B</b> (unión): todo, sin repetir. • <b>|A|</b>: cuántos elementos tiene.</p>
      <p>Ejemplo real: A = amigos que juegan fútbol, B = los que juegan vóley. A ∩ B = los que juegan los dos deportes.</p>
      <p><b>P(A)</b> (conjunto potencia) son todos los grupos que puedes formar, incluido el vacío { } y el propio A. Si A tiene n elementos, P(A) tiene <b>2ⁿ</b>.</p>`,
    levels: [
      () => { const A = shuffle([...Array(10).keys()].map((x) => x + 1)).slice(0, ri(3, 5)).sort((a, b) => a - b); const B = shuffle([...Array(10).keys()].map((x) => x + 1)).slice(0, ri(3, 5)).sort((a, b) => a - b); const inter = A.filter((x) => B.includes(x)); const uni = [...new Set([...A, ...B])]; const op = chance(0.5); return { q: `A = ${setStr(A)} y B = ${setStr(B)}. ¿Cuánto es <b>|A ${op ? '∩' : '∪'} B|</b>?`, ans: num(op ? inter.length : uni.length), traps: op ? [T(uni.length, 'razon', '∩ es solo lo común; contaste la unión.')] : [T(A.length + B.length, 'razon', 'En la unión no se repiten los que están en los dos.'), T(inter.length, 'razon', 'Eso es la intersección.')], steps: st(op ? `Comunes: ${setStr(inter)}` : `Todos sin repetir: ${setStr(uni.sort((a, b) => a - b))}`, `Cuento: <b>${op ? inter.length : uni.length}</b>`) }; },
      () => { const n = ri(1, 6); return { q: `Si A tiene ${n} elemento${n > 1 ? 's' : ''}, ¿cuántos elementos tiene P(A)?`, ans: num(2 ** n), traps: [T(n * 2, 'razon', 'Es 2 ELEVADO a ' + n + ', no 2·' + n + '.'), T(n ** 2, 'razon', `Es 2<sup>${n}</sup>, no ${n}².`), T(2 ** n - 2, 'razon', 'No olvides el vacío { } y el conjunto completo.')], steps: st(`|P(A)| = 2<sup>n</sup> = 2<sup>${n}</sup>`, `= <b>${2 ** n}</b>`) }; },
      () => { const A = [1, 2, 3, 4, 5, 6].slice(0, ri(4, 6)); const k = ri(2, 4); const B = A.slice(-k).concat([7, 8, 9].slice(0, ri(1, 3))); const inter = A.filter((x) => B.includes(x)); const uni = [...new Set([...A, ...B])]; return mc(`A = ${setStr(A)}, B = ${setStr(B)}. ¿Cuál es A ∩ B?`, setStr(inter), [[setStr(uni), 'Esa es la unión (todo junto).'], [setStr(A.filter((x) => !B.includes(x))), 'Eso es lo que está SOLO en A (A − B).'], [setStr(B.filter((x) => !A.includes(x))), 'Eso es lo que está solo en B.']], st('∩ = lo que se repite en los dos', `<b>${setStr(inter)}</b>`)); },
    ], bank: [16, 17] },
  { tema: 'Valor absoluto',
    lesson: () => `<p><b>|x|</b> es la <b>distancia</b> de x al 0. Las distancias nunca son negativas: <span class="m">|−5| = 5</span> y <span class="m">|5| = 5</span>.</p>${V.numberLine({ start: 0, moves: [], from: -6, to: 6 })}
      <p>Por eso <span class="m">|algo| = 5</span> tiene <b>dos</b> posibilidades: algo = 5 o algo = −5.</p>
      <p><span class="m">|2x − 3| = 5</span> → 2x − 3 = 5 (x = 4) o 2x − 3 = −5 (x = −1).</p>`,
    levels: [
      () => { const a = nz(-12, 12), b = nz(-12, 12); const op = pick(['+', '−']); const r = op === '+' ? Math.abs(a) + Math.abs(b) : Math.abs(a) - Math.abs(b); return { q: `Calcula: |${S(a)}| ${op} |${S(b)}|`, ans: num(r), traps: [T(op === '+' ? a + b : a - b, 'razon', 'Primero quita las barras: cada |número| es positivo.')], steps: st(`|${S(a)}| = ${Math.abs(a)} y |${S(b)}| = ${Math.abs(b)}`, `${Math.abs(a)} ${op} ${Math.abs(b)} = <b>${S(r)}</b>`) }; },
      () => { const a = ri(-8, 8), b = ri(1, 9); return { q: `Resuelve ${M(`|x${a < 0 ? '+' : '-'}${Math.abs(a) || 0}|=${b}`).replace('x-0', 'x')} <span class="mute">(escribe las dos soluciones separadas con ;)</span>`.replace('|x+0|', '|x|'), ans: { type: 'set', v: [new Q(a + b), new Q(a - b)] }, traps: [T([a + b], 'razon', `Falta el otro caso: x ${a < 0 ? '+' : '−'} ${Math.abs(a)} = −${b}.`)], steps: st(`Caso 1: x ${a < 0 ? '+' : '−'} ${Math.abs(a)} = ${b} → x = ${S(a + b)}`, `Caso 2: x ${a < 0 ? '+' : '−'} ${Math.abs(a)} = −${b} → x = ${S(a - b)}`, `<b>${S(a + b)} ; ${S(a - b)}</b>`) }; },
      () => { const a = ri(2, 3), x1 = nz(-5, 6); const b = nz(-7, 7); const c = Math.abs(a * x1 - b); if (c === 0) return CURSO_FIX('Valor absoluto', 2); const x2 = new Q(b - c, a), x1q = new Q(b + c, a); const h = (q) => (q.d === 1 ? S(q.n) : `${S(q.n)}/${q.d}`); return mc(`Resuelve: |${a}x ${b < 0 ? '+' : '−'} ${Math.abs(b)}| = ${c}`, `x = ${h(x1q)} o x = ${h(x2)}`, [[`x = ${h(x1q)} o x = ${h(x2.neg())}`, 'En el 2.º caso revisa el signo al despejar.'], [`x = ${h(x1q.neg())} o x = ${h(x2.neg())}`, 'Signos al revés: comprueba reemplazando.'], [`x = ${h(x1q)}`, 'Falta el segundo caso (= −' + c + ').']], st(`Caso 1: ${a}x ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${c} → x = ${h(x1q)}`, `Caso 2: ${a}x ${b < 0 ? '+' : '−'} ${Math.abs(b)} = −${c} → x = ${h(x2)}`)); },
    ], bank: [18] },
  { tema: 'Dominio',
    lesson: () => `<p>El <b>dominio</b> son los números que la función <b>acepta</b> sin romperse.</p>
      <p>Dos cosas "rompen" una función: <b>raíz cuadrada de un negativo</b> (√−4 no existe en los reales) y <b>dividir entre 0</b>.</p>
      <p>En <span class="m">√(x − 4)</span>, lo de adentro debe ser ≥ 0: <span class="m">x − 4 ≥ 0 → x ≥ 4</span>. El 4 sí entra porque √0 = 0.</p>`,
    levels: [
      () => { const a = nz(-9, 12); return { q: `En ${M(`f(x)=sqrt(x${a < 0 ? '+' : '-'}${Math.abs(a)})`)}, ¿cuál es el número <b>más pequeño</b> que puede valer x?`, ans: num(a), traps: [T(-a, 'razon', 'Lo de adentro debe ser ≥ 0: despeja x con el signo correcto.'), T(a + 1, 'razon', `x = ${S(a)} sí sirve: √0 = 0 existe.`)], steps: st(`Adentro ≥ 0: x ${a < 0 ? '+' : '−'} ${Math.abs(a)} ≥ 0`, `x ≥ ${S(a)} → el más pequeño es <b>${S(a)}</b>`) }; },
      () => { const a = nz(-9, 12); return mc(`¿Cuál es el dominio de ${M(`f(x)=sqrt(x${a < 0 ? '+' : '-'}${Math.abs(a)})`)}?`, `x ≥ ${fmt(a)}`, [[`x > ${fmt(a)}`, `Excluiste el ${fmt(a)}, pero √0 = 0 sí existe.`], [`x ≤ ${fmt(a)}`, 'Al revés: con x menor queda negativo adentro.'], ['Todos los reales', 'No: algunos valores dan raíz de negativo.']], st(`x ${a < 0 ? '+' : '−'} ${Math.abs(a)} ≥ 0`, `<b>x ≥ ${fmt(a)}</b>`)); },
      () => { const a = nz(-9, 12); if (chance(0.5)) return mc(`¿Cuál es el dominio de ${M(`f(x)=sqrt(${a}-x)`)}?`, `x ≤ ${fmt(a)}`, [[`x ≥ ${fmt(a)}`, `Con x mayor que ${fmt(a)}, ${fmt(a)} − x es negativo.`], [`x < ${fmt(a)}`, `Excluiste el ${fmt(a)}, pero √0 sí existe.`], ['Todos los reales', 'No: algunos valores dan raíz de negativo.']], st(`${S(a)} − x ≥ 0`, `${S(a)} ≥ x → <b>x ≤ ${fmt(a)}</b>`));
        return mc(`¿Qué valor NO puede tomar x en ${M(`f(x)=1/(x${a < 0 ? '+' : '-'}${Math.abs(a)})`)}?`, `x = ${fmt(a)}`, [[`x = ${fmt(-a)}`, 'Revisa: se anula el denominador cuando x − (' + fmt(a) + ') = 0.'], ['x = 0', `Con x = 0 el denominador es ${fmt(-a)}, no 0.`], ['Puede tomar cualquier valor', 'No se puede dividir entre 0.']], st('No se puede dividir entre 0', `x ${a < 0 ? '+' : '−'} ${Math.abs(a)} = 0 → <b>x = ${fmt(a)}</b>`)); },
    ], bank: [20] },

  // ======================= ARITMÉTICA =======================
  { tema: 'MCD y MCM',
    lesson: () => `<p><b>MCD</b> (máximo común divisor): el número <b>más grande</b> que divide exacto a todos. Sirve para <b>repartir</b> en partes iguales.</p>
      <p><b>MCM</b> (mínimo común múltiplo): el número <b>más pequeño</b> que es múltiplo de todos. Sirve para saber <b>cuándo coinciden</b> cosas que se repiten.</p>
      <p>Ejemplo real: un bus pasa cada 12 min y otro cada 18 min. Coinciden cada MCM(12, 18) = 36 min.</p>
      <p><b>Método:</b> descompón en primos. MCD = los comunes con el exponente <b>menor</b>. MCM = todos con el exponente <b>mayor</b>.</p>
      <p>48 = 2⁴·3 y 72 = 2³·3² → MCD = 2³·3 = 24; MCM = 2⁴·3² = 144.</p>`,
    levels: [
      () => { const g = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]), a = ri(2, 6), b = ri(2, 7); if (gcd(a, b) !== 1 || a === b) return CURSO_FIX('MCD y MCM', 0); return { q: `¿Cuál es el MCD de ${g * a} y ${g * b}?`, ans: num(g), traps: [T(g * a * b, 'razon', 'Eso es el MCM (múltiplo), no el divisor.'), T(gcd(g, 6) !== g ? null : g / 2, 'razon', 'Divide a ambos, pero no es el mayor.')], steps: st(`${g * a} = ${fstr(g * a)}; ${g * b} = ${fstr(g * b)}`, 'Comunes con el menor exponente', `MCD = <b>${g}</b> (${g * a} ÷ ${g} = ${a}, ${g * b} ÷ ${g} = ${b})`) }; },
      () => { const a = pick([4, 6, 8, 9, 10, 12, 15]), b = pick([6, 8, 10, 12, 14, 15, 18, 20]); if (a === b) return CURSO_FIX('MCD y MCM', 1); const m = lcm(a, b); return { q: `Un bus pasa cada ${a} minutos y otro cada ${b} minutos. Si salen juntos, ¿en cuántos minutos vuelven a coincidir? (MCM)`, ans: num(m), traps: [T(a * b === m ? null : a * b, 'razon', 'Multiplicar da un múltiplo común, pero no el más pequeño.'), T(gcd(a, b), 'razon', 'Eso es el MCD.')], steps: st(`${a} = ${fstr(a)}; ${b} = ${fstr(b)}`, 'Todos los primos con el mayor exponente', `MCM = <b>${m}</b>`) }; },
      () => { const ns = shuffle([4, 6, 8, 9, 10, 12, 15, 18, 20, 24]).slice(0, 3); const m = ns.reduce(lcm); const g = ns.reduce(gcd); return chance(0.5) ? mc(`¿Cuál es el MCM de ${ns.join(', ')}?`, String(m), [[String(m * 2), 'Es múltiplo común, pero no el menor.'], [String(g), 'Eso es el MCD.'], [String(ns[0] * ns[1]), 'No es múltiplo de los tres o no es el menor.']], st(ns.map((n) => `${n} = ${fstr(n)}`).join('; '), `Mayor exponente de cada primo → <b>${m}</b>`)) : mc(`¿Cuál es el MCD de ${ns.map((n) => n * 2).join(', ')}?`, String(g * 2), [[String(m * 2), 'Eso es el MCM.'], [g * 2 > 2 ? '2' : '1', 'Divide a todos, pero no es el mayor.'], [String(ns[0] * 2), 'No divide a los tres.']], st(ns.map((n) => `${n * 2} = ${fstr(n * 2)}`).join('; '), `Comunes con el menor exponente → <b>${g * 2}</b>`)); },
    ], bank: [21, 22] },
  { tema: 'Fracciones',
    lesson: () => `<p>Una fracción es un pedazo: <span class="m">3/4</span> = de 4 partes iguales, tomo 3.</p>
      <p><b>Simplificar:</b> divide arriba y abajo por el mismo número (252/336 → ÷84 → 3/4).</p>
      <p><b>Sumar/restar:</b> solo partes del mismo tamaño: busca denominador común.</p>
      <p><b>Decimal a fracción:</b> 0,125 = 125/1000 = 1/8.</p>${V.fracAddViz(2, 3, 1, 4)}`,
    levels: [
      () => { const g = ri(2, 12), a = ri(1, 9), b = ri(a + 1, 12); if (gcd(a, b) !== 1) return CURSO_FIX('Fracciones', 0); return { q: `Simplifica: ${M(`${a * g}/${b * g}`)}`, ans: num(new Q(a, b)), traps: [], steps: st(`Divide arriba y abajo entre ${g}`, `${a * g} ÷ ${g} = ${a}; ${b * g} ÷ ${g} = ${b}`, `<b>${a}/${b}</b>`) }; },
      { topic: 'frac_suma', variant: 'dist' },
      () => { if (chance(0.5)) return { topic: 'frac_comb', variant: 'sm' }; const [d, f] = pick([['0,5', [1, 2]], ['0,25', [1, 4]], ['0,75', [3, 4]], ['0,2', [1, 5]], ['0,125', [1, 8]], ['0,375', [3, 8]], ['0,6', [3, 5]], ['0,05', [1, 20]]]); return { q: `Escribe ${d} como fracción irreducible.`, ans: num(new Q(f[0], f[1])), traps: [], steps: st(`${d} = ${d.split(',')[1].replace(/^0+/, '') || d}/${10 ** d.split(',')[1].length}`, `Simplifica → <b>${f[0]}/${f[1]}</b>`) }; },
    ], bank: [23, 24, 32] },
  { tema: 'Porcentajes',
    lesson: () => `<p><b>% = de cada 100</b>. 15% de 120 = <span class="m">120 × 0,15 = 18</span>.</p>
      <p>Descuento de 15% → pagas el 85%: <span class="m">120 × 0,85 = 102</span>.</p>
      <p>Si el 35% de un número es 63 → el número es <span class="m">63 ÷ 0,35 = 180</span>.</p>
      <p>Ganancia sobre el costo: <span class="m">ganancia ÷ costo × 100</span>.</p>${V.pctBar(25, '12', '48')}`,
    levels: [{ topic: 'porcentajes', variant: 'de' }, { topic: 'porcentajes', variant: 'que' }, { topic: 'porcentajes', variant: 'inverso' }], bank: [25, 26, 33] },
  { tema: 'Potencias y raíces',
    lesson: () => `<p><span class="m">3² = 3·3 = 9</span> (potencia). <span class="m">√25 = 5</span> porque 5·5 = 25 (raíz: lo contrario).</p>
      <p><b>Orden:</b> 1) paréntesis 2) potencias y raíces 3) × y ÷ 4) + y −.</p>
      <p><span class="m">3² + 4² − √25 = 9 + 16 − 5 = 20</span>.</p>`,
    levels: [
      { topic: 'pot_significado', variant: 'basico' },
      () => { const a = ri(2, 9), b = ri(2, 9), r = ri(2, 12); const spec = `${a}^2+${b}^2-sqrt(${r * r})`; return { q: `Calcula: ${M(`${a}^2+${b}^2-sqrt(${r * r})`)}`, ans: num(a * a + b * b - r), traps: [T(2 * a + 2 * b - r, 'pot_base', `${a}² es ${a}·${a}, no ${a}·2.`)], steps: st(`${a}² = ${a * a}; ${b}² = ${b * b}; √${r * r} = ${r}`, `${a * a} + ${b * b} − ${r} = <b>${a * a + b * b - r}</b>`), _s: spec }; },
      { topic: 'jerarquia', variant: 'parpot' },
    ], bank: [27] },
  { tema: 'Interés simple',
    lesson: () => `<p>Cuando prestas o ahorras dinero, el banco te paga un extra: el <b>interés</b>. En el interés <b>simple</b>, cada año ganas lo mismo.</p>
      <p class="big">I = C · r · t</p><p>C = capital (lo que pones), r = tasa (8% → 0,08), t = tiempo en años.</p>
      <p>Ejemplo: S/ 5000 al 8% por 3 años → por año 400 → en 3 años <b>1200</b>. El <b>monto</b> final es 5000 + 1200 = 6200.</p>`,
    levels: [
      () => { const c = ri(1, 20) * 500, r = pick([2, 4, 5, 6, 8, 10, 12]); return { q: `Ahorras ${soles(c)} al ${r}% de interés simple anual. ¿Cuánto ganas en <b>1 año</b>?`, ans: num(c * r / 100), traps: [T(c * r, 'pct_que', `${r}% es ${r}/100 = ${r / 100}.`)], steps: st(`${r}% = ${String(r / 100).replace('.', ',')}`, `${c} × ${String(r / 100).replace('.', ',')} = <b>${c * r / 100}</b>`) }; },
      () => { const c = ri(1, 20) * 500, r = pick([2, 4, 5, 6, 8, 10]), t = ri(2, 6); return { q: `${soles(c)} al ${r}% de interés simple anual durante ${t} años. ¿Cuánto interés genera?`, ans: num(c * r * t / 100), traps: [T(c * r / 100, 'razon', 'Eso es solo 1 año; multiplica por ' + t + '.'), T(c + c * r * t / 100, 'razon', 'Eso es el monto (capital + interés); piden solo el interés.')], steps: st(`Por año: ${c} × ${String(r / 100).replace('.', ',')} = ${c * r / 100}`, `× ${t} años = <b>${c * r * t / 100}</b>`) }; },
      () => { const c = ri(2, 20) * 500, r = pick([4, 5, 6, 8, 10]), t = ri(2, 5); const I = c * r * t / 100; return chance(0.5) ? { q: `Depositas ${soles(c)} al ${r}% anual simple por ${t} años. ¿Cuánto tendrás <b>en total</b> (monto)?`, ans: num(c + I), traps: [T(I, 'razon', 'Ese es solo el interés; súmale el capital.')], steps: st(`I = ${c}·${String(r / 100).replace('.', ',')}·${t} = ${I}`, `Monto = ${c} + ${I} = <b>${c + I}</b>`) } : { q: `Un capital de ${soles(c)} al ${r}% anual simple generó ${soles(I)} de interés. ¿Cuántos años estuvo depositado?`, ans: num(t), traps: [], steps: st(`Por año gana ${c * r / 100}`, `${I} ÷ ${c * r / 100} = <b>${t}</b> años`) }; },
    ], bank: [28] },
  { tema: 'Progresiones',
    lesson: () => `<p><b>Aritmética:</b> siempre se <b>suma</b> lo mismo (diferencia d). 5, 11, 17, 23… (d = 6). Término n: <span class="m">aₙ = a₁ + (n − 1)·d</span>.</p>
      <p><b>Geométrica:</b> siempre se <b>multiplica</b> por lo mismo (razón r). 2, 6, 18… (r = 3). Término n: <span class="m">aₙ = a₁ · rⁿ⁻¹</span>.</p>
      <p><b>Suma de una aritmética:</b> <span class="m">Sₙ = n·(a₁ + aₙ)/2</span>. Truco de Gauss: el primero + el último = el segundo + el penúltimo…</p>`,
    levels: [
      () => { const a = ri(-5, 20), d = nz(-6, 9); const s = Array.from({ length: 4 }, (_, i) => a + i * d); return { q: `¿Cuál es el siguiente número? ${s.map(S).join(', ')}, …`, ans: num(a + 4 * d), traps: [], steps: st(`Diferencia: ${S(s[1])} − ${S(s[0])} = ${S(d)}`, `${S(s[3])} ${d < 0 ? '−' : '+'} ${Math.abs(d)} = <b>${S(a + 4 * d)}</b>`) }; },
      () => { if (chance(0.5)) { const a = ri(1, 10), d = ri(2, 7), n = ri(8, 25); return { q: `En la progresión ${[0, 1, 2].map((i) => a + i * d).join(', ')}, …, ¿cuál es el término número ${n}?`, ans: num(a + (n - 1) * d), traps: [T(a + n * d, 'razon', 'Es (n − 1)·d: el primer término no suma la diferencia.')], steps: st(`a₁ = ${a}, d = ${d}`, `a<sub>${n}</sub> = ${a} + (${n} − 1)·${d} = ${a} + ${(n - 1) * d} = <b>${a + (n - 1) * d}</b>`) }; }
        const a = ri(1, 5), r = pick([2, 3]), n = ri(4, 7); return { q: `En la progresión geométrica ${[0, 1, 2].map((i) => a * r ** i).join(', ')}, …, ¿cuál es el término ${n}?`, ans: num(a * r ** (n - 1)), traps: [T(a * r ** n, 'razon', `Es r<sup>n−1</sup>: ese es el término ${n + 1}.`), T(a * r ** (n - 2), 'razon', `Ese es el término ${n - 1}.`)], steps: st(`a₁ = ${a}, r = ${r}`, `a<sub>${n}</sub> = ${a}·${r}<sup>${n - 1}</sup> = <b>${a * r ** (n - 1)}</b>`) }; },
      () => { const a = ri(1, 9), d = ri(2, 6), n = pick([10, 10, 12, 15, 20]); const an = a + (n - 1) * d; return { q: `¿Cuánto suman los ${n} primeros términos de ${[0, 1, 2, 3].map((i) => a + i * d).join(', ')}, …?`, ans: num(n * (a + an) / 2), traps: [T(n * (a + an), 'razon', 'Falta dividir entre 2.'), T(an, 'razon', 'Ese es el último término, no la suma.')], steps: st(`Último: a<sub>${n}</sub> = ${a} + ${n - 1}·${d} = ${an}`, `S = ${n}·(${a} + ${an})/2 = ${n}·${a + an}/2 = <b>${n * (a + an) / 2}</b>`) }; },
    ], bank: [29, 30, 40] },
  { tema: 'Regla de tres inversa',
    lesson: () => `<p>Primero pregúntate: <b>si uno sube, ¿el otro sube o baja?</b></p>${V.ruleOfThree('Personas', 'Días', 3, 12, 4, '?', true)}
      <p>Más personas → <b>menos</b> días: es inversa. El trabajo total no cambia: <span class="m">3 × 12 = 36</span> "persona-días". Con 4 personas: 36 ÷ 4 = <b>9 días</b>.</p>`,
    levels: [{ topic: 'regla_tres', variant: 'cual' }, { topic: 'regla_tres', variant: 'inversa' }, { topic: 'regla_tres', variant: 'inversa' }], bank: [31] },
  { tema: 'Números primos',
    lesson: () => `<p>Un número <b>primo</b> solo se puede dividir exacto entre <b>1 y él mismo</b> (tiene exactamente 2 divisores).</p>
      <p>Primos hasta 30: <b>2, 3, 5, 7, 11, 13, 17, 19, 23, 29</b> (son 10).</p>
      <p>El <b>1 no es primo</b> (tiene un solo divisor). El 2 es el único primo par.</p>
      <p>Truco: para saber si n es primo, prueba dividir entre 2, 3, 5, 7… hasta √n.</p>`,
    levels: [
      () => { const n = ri(2, 60); const p = isPrime(n); return { q: `¿El número <b>${n}</b> es primo?`, ans: choice(['Sí, es primo', 'No, no es primo'], p ? 0 : 1), traps: [], steps: st(p ? `${n} solo se divide entre 1 y ${n}` : `${n} = ${fstr(n)}: tiene otros divisores`) }; },
      () => { const a = ri(1, 30), b = a + ri(8, 20); const ps = []; for (let i = a; i <= b; i++) if (isPrime(i)) ps.push(i); return { q: `¿Cuántos números primos hay entre ${a} y ${b} (incluidos)?`, ans: num(ps.length), traps: [T(a === 1 ? ps.length + 1 : null, 'razon', 'Contaste el 1, que no es primo.')], steps: st(`Primos: ${ps.join(', ') || 'ninguno'}`, `Son <b>${ps.length}</b>`) }; },
      () => { const pr = pick([11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53]); const no = shuffle([21, 27, 33, 39, 49, 51, 57, 91, 1, 15, 25, 35]).slice(0, 3); return mc('¿Cuál de estos números es primo?', String(pr), no.map((n) => [String(n), n === 1 ? 'El 1 no es primo.' : `${n} = ${fstr(n).replace(/<\/?sup>/g, '')}: no es primo.`]), st(`${pr} solo se divide entre 1 y ${pr}`)); },
    ], bank: [34] },
  { tema: 'Factorial y conteo',
    lesson: () => `<p><b>n!</b> (factorial) = multiplicar desde n hasta 1: <span class="m">5! = 5·4·3·2·1 = 120</span>. El "!" no es emoción: es una operación.</p>
      <p><b>Ordenar</b> n cosas distintas: n! formas. 4 personas en 4 asientos: 4·3·2·1 = 24 (para el 1.er asiento hay 4 opciones, luego 3…).</p>
      <p><b>Combinaciones</b> (el orden NO importa, como elegir 2 amigos para un equipo): <span class="m">C(n, k) = n! / (k!(n − k)!)</span>. C(6, 2) = 6·5/2 = 15.</p>`,
    levels: [
      () => { const n = ri(3, 7); return { q: `Calcula: <b>${n}!</b>`, ans: num(fact(n)), traps: [T(fact(n - 1), 'razon', `Eso es ${n - 1}!.`), T(n * (n - 1), 'razon', 'Hay que multiplicar hasta llegar a 1.')], steps: st(`${n}! = ${Array.from({ length: n }, (_, i) => n - i).join('·')}`, `= <b>${fact(n)}</b>`) }; },
      () => { if (chance(0.5)) { const n = ri(3, 6); return { q: `¿De cuántas formas se pueden ordenar ${n} personas en una fila?`, ans: num(fact(n)), traps: [T(n * n, 'razon', 'No es n²: cada persona solo puede estar en un lugar.')], steps: st(`1.er lugar: ${n} opciones, luego ${n - 1}, …`, `${n}! = <b>${fact(n)}</b>`) }; }
        const n = ri(5, 9), k = 2; return { q: `En una carrera de ${n} corredores, ¿de cuántas formas puede quedar el 1.º y el 2.º puesto?`, ans: num(n * (n - 1)), traps: [T(C(n, 2), 'razon', 'Aquí el orden SÍ importa (1.º y 2.º son distintos).')], steps: st(`1.º: ${n} opciones; 2.º: ${n - 1}`, `${n}·${n - 1} = <b>${n * (n - 1)}</b>`), _k: k }; },
      () => { const n = ri(4, 10), k = pick([2, 2, 3]); return { q: `De ${n} amigos, ¿cuántos grupos de ${k} se pueden formar? (el orden no importa)`, ans: num(C(n, k)), traps: [T(fact(n) / fact(n - k), 'razon', `Contaste el orden (permutación). Divide entre ${k}! = ${fact(k)} porque {A, B} = {B, A}.`)], steps: st(`C(${n}, ${k}) = ${Array.from({ length: k }, (_, i) => n - i).join('·')} / ${k}!`, `= ${fact(n) / fact(n - k)} / ${fact(k)} = <b>${C(n, k)}</b>`) }; },
    ], bank: [35, 36, 37] },
  { tema: 'Probabilidad',
    lesson: () => `<p><b>Probabilidad</b> = casos favorables ÷ casos posibles. Es un número entre 0 (imposible) y 1 (seguro).</p>
      <p>Dado: P(sale 5) = 1/6. P(sale par) = 3/6 = 1/2 (2, 4 o 6).</p>
      <p>Moneda 3 veces: hay 2·2·2 = 8 resultados. Exactamente 2 caras: CCS, CSC, SCC → 3/8.</p>
      <p><b>Truco:</b> si te pierdes, <b>haz la lista</b> de todos los casos.</p>`,
    levels: [
      () => { const opts = [['un número par', 3], ['un número mayor que 4', 2], ['un 6', 1], ['un número menor que 3', 2], ['un número primo', 3], ['un múltiplo de 3', 2]]; const [t, f] = pick(opts); return { q: `Se lanza un dado de 6 caras. ¿Cuál es la probabilidad de obtener ${t}? (como fracción)`, ans: num(new Q(f, 6)), traps: [T(f, 'razon', 'Falta dividir entre los 6 casos posibles.')], steps: st(`Casos posibles: 6`, `Favorables: ${f}`, `P = ${f}/6 = <b>${new Q(f, 6).toString()}</b>`) }; },
      () => { const r = ri(1, 8), a = ri(1, 8), v = ri(1, 8); const tot = r + a + v; const col = pick([['roja', r], ['azul', a], ['verde', v]]); return { q: `En una bolsa hay ${r} bolas rojas, ${a} azules y ${v} verdes. Sacas una sin mirar. ¿Probabilidad de que sea ${col[0]}?`, ans: num(new Q(col[1], tot)), traps: [T(new Q(col[1], tot - col[1]), 'razon', 'El total son TODAS las bolas, incluidas las ' + col[0] + 's.')], steps: st(`Total: ${r} + ${a} + ${v} = ${tot}`, `P = ${col[1]}/${tot} = <b>${new Q(col[1], tot).toString()}</b>`) }; },
      () => { if (chance(0.5)) { const n = 3, k = ri(0, 3); return { q: `Se lanza una moneda ${n} veces. ¿Probabilidad de obtener exactamente ${k} cara${k === 1 ? '' : 's'}?`, ans: num(new Q(C(3, k), 8)), traps: [T(new Q(1, 8), 'razon', 'Hay varios órdenes posibles, no uno solo.')], steps: st('Posibles: 2·2·2 = 8', `Con ${k} caras: ${C(3, k)} formas`, `P = <b>${new Q(C(3, k), 8).toString()}</b>`) }; }
        const s = ri(2, 12); let f = 0; for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === s) f++; return { q: `Se lanzan dos dados. ¿Probabilidad de que la suma sea ${s}?`, ans: num(new Q(f, 36)), traps: [T(new Q(1, 11), 'razon', 'Las 11 sumas no son igual de probables: cuenta los 36 casos.')], steps: st('Posibles: 6·6 = 36', `Suma ${s}: ${f} casos`, `P = ${f}/36 = <b>${new Q(f, 36).toString()}</b>`) }; },
    ], bank: [38] },
  { tema: 'Media aritmética',
    lesson: () => `<p>La <b>media</b> (promedio) es "repartir en partes iguales": sumas todo y divides entre cuántos son.</p>
      <p>Notas 8, 12, 15, 9, 16: suma 60, son 5 → media <b>12</b>.</p>
      <p>Al revés: si el promedio de 4 notas es 14, la suma de las 4 es 4·14 = 56.</p>`,
    levels: [
      () => { const m = ri(5, 18); const a = m + ri(-4, 4), b = m + ri(-4, 4); const c = 3 * m - a - b; return { q: `¿Cuál es la media de ${a}, ${b} y ${c}?`, ans: num(m), traps: [T(3 * m, 'razon', 'Falta dividir entre 3.')], steps: st(`${a} + ${b} + ${c} = ${3 * m}`, `${3 * m} ÷ 3 = <b>${m}</b>`) }; },
      () => { const m = ri(8, 18); const xs = Array.from({ length: 4 }, () => m + ri(-5, 5)); xs.push(5 * m - xs.reduce((s, x) => s + x, 0)); return { q: `Calcula la media de: ${xs.join(', ')}`, ans: num(m), traps: [T(5 * m, 'razon', 'Falta dividir entre 5.')], steps: st(`Suma: ${5 * m}`, `÷ 5 = <b>${m}</b>`) }; },
      () => { const m = ri(11, 17), n = 4; const xs = Array.from({ length: 3 }, () => m + ri(-4, 4)); const x = n * m - xs.reduce((s, v) => s + v, 0); if (x < 0 || x > 20) return CURSO_FIX('Media aritmética', 2); return { q: `El promedio de 4 notas es ${m}. Tres de ellas son ${xs.join(', ')}. ¿Cuál es la cuarta?`, ans: num(x), traps: [T(m, 'razon', 'La cuarta no tiene por qué ser igual al promedio.')], steps: st(`Suma total: 4·${m} = ${4 * m}`, `Ya hay: ${xs.reduce((s, v) => s + v, 0)}`, `Falta: <b>${x}</b>`) }; },
    ], bank: [39] },

  // ======================= GEOMETRÍA =======================
  { tema: 'Ángulos de polígonos',
    lesson: () => `<p>Cualquier polígono se puede partir en triángulos desde una esquina: un polígono de n lados da <b>n − 2 triángulos</b>, y cada triángulo suma 180°.</p>
      <p class="big">Suma interior = (n − 2) · 180°</p><p>Hexágono (6 lados): 4 triángulos → 720°. Si es <b>regular</b> (todos iguales), cada ángulo = 720 ÷ 6 = 120°.</p>`,
    levels: [
      () => { const n = ri(3, 12); return { q: `¿Cuánto suman los ángulos interiores de un polígono de <b>${n} lados</b>?`, ans: num((n - 2) * 180), traps: [T(n * 180, 'razon', 'Son n − 2 triángulos, no n.')], steps: st(`(${n} − 2)·180° = ${n - 2}·180°`, `= <b>${(n - 2) * 180}°</b>`) }; },
      () => { const [n, nm] = pick([[3, 'triángulo equilátero'], [4, 'cuadrado'], [5, 'pentágono regular'], [6, 'hexágono regular'], [8, 'octógono regular'], [9, 'eneágono regular'], [10, 'decágono regular'], [12, 'dodecágono regular']]); return { q: `¿Cuánto mide cada ángulo interior de un ${nm} (${n} lados)?`, ans: num((n - 2) * 180 / n), traps: [T((n - 2) * 180, 'razon', `Esa es la suma; divide entre ${n}.`), T(360 / n, 'razon', 'Ese es el ángulo exterior.')], steps: st(`Suma: (${n} − 2)·180 = ${(n - 2) * 180}°`, `÷ ${n} = <b>${(n - 2) * 180 / n}°</b>`) }; },
      () => { const n = pick([5, 6, 8, 9, 10, 12, 15, 18]); const ang = (n - 2) * 180 / n; return { q: `Cada ángulo interior de un polígono regular mide ${ang}°. ¿Cuántos lados tiene?`, ans: num(n), traps: [], steps: st(`Ángulo exterior = 180 − ${ang} = ${180 - ang}°`, `Los exteriores suman 360°: 360 ÷ ${180 - ang} = <b>${n}</b>`) }; },
    ], bank: [41, 47] },
  { tema: 'Áreas',
    lesson: () => `<p>El área es cuánto <b>espacio</b> ocupa una figura (en cm², m²…).</p>
      <p>• Rectángulo: base × altura · Triángulo: <b>b·h ÷ 2</b> (la mitad de un rectángulo)</p>
      <p>• Rombo: <b>D·d ÷ 2</b> · Trapecio: <b>(B + b)·h ÷ 2</b> · Círculo: <b>π·r²</b></p>
      <p>• Apotema del cuadrado: del centro al medio de un lado = <b>mitad del lado</b>.</p>${V.rectFig(8, 5, '8 cm', '5 cm')}`,
    levels: [
      () => { const b = ri(2, 15) * 2, h = ri(2, 12); return chance(0.5) ? { q: '¿Cuál es el área de este rectángulo? (cm²)', ill: V.rectFig(b, h, `${b} cm`, `${h} cm`), ans: num(b * h), traps: [T(2 * (b + h), 'razon', 'Eso es el perímetro.')], steps: st(`${b} × ${h} = <b>${b * h}</b> cm²`) } : { q: `Área de un triángulo de base ${b} cm y altura ${h} cm`, ans: num(b * h / 2), traps: [T(b * h, 'razon', 'Olvidaste dividir entre 2.')], steps: st(`${b}·${h} = ${b * h}`, `÷ 2 = <b>${b * h / 2}</b> cm²`) }; },
      () => { if (chance(0.5)) { const D = ri(2, 10) * 2, d = ri(2, 9); return { q: `Área de un rombo con diagonales ${D} cm y ${d} cm`, ans: num(D * d / 2), traps: [T(D * d, 'razon', 'Olvidaste dividir entre 2.')], steps: st(`${D}·${d} = ${D * d}`, `÷ 2 = <b>${D * d / 2}</b> cm²`) }; }
        const B = ri(6, 16), b = ri(2, B - 1), h = ri(1, 6) * 2; return { q: `Área de un trapecio de bases ${B} y ${b} cm, y altura ${h} cm`, ans: num((B + b) * h / 2), traps: [T((B + b) * h, 'razon', 'Olvidaste dividir entre 2.'), T(B * b * h / 2, 'razon', 'Las bases se SUMAN.')], steps: st(`${B} + ${b} = ${B + b}`, `${B + b}·${h} = ${(B + b) * h}`, `÷ 2 = <b>${(B + b) * h / 2}</b> cm²`) }; },
      () => { const k = ri(0, 2); if (k === 0) { const r = ri(2, 12); return mc(`Un círculo tiene área ${r * r}π cm². ¿Cuánto mide el radio?`, `${r} cm`, [[`${r * r} cm`, 'Olvidaste sacar la raíz: r² = ' + r * r + '.'], [`${2 * r} cm`, 'Ese es el diámetro.'], [`${r * r / 2} cm`, 'No se divide entre 2: se saca raíz.']], st(`π·r² = ${r * r}π → r² = ${r * r}`, `r = √${r * r} = <b>${r}</b>`)); }
        if (k === 1) { const r = ri(2, 10); return mc(`Área de un círculo de radio ${r} cm`, `${r * r}π cm²`, [[`${2 * r}π cm²`, 'Eso es la longitud de la circunferencia (2πr).'], [`${r}π cm²`, 'Falta elevar el radio al cuadrado.'], [`${4 * r * r}π cm²`, 'Usaste el diámetro en vez del radio.']], st(`A = π·r² = π·${r}²`, `= <b>${r * r}π</b> cm²`)); }
        const l = ri(2, 10) * 2; return mc(`Apotema de un cuadrado de lado ${l} cm`, `${l / 2} cm`, [[`${l / 2}√2 cm`, 'Esa es la mitad de la diagonal (del centro a la esquina).'], [`${l}√2 cm`, 'Esa es la diagonal.'], [`${l} cm`, 'Ese es el lado.']], st('Apotema = del centro al medio de un lado', `= mitad del lado = <b>${l / 2}</b> cm`)); },
    ], bank: [42, 49, 54, 55, 57] },
  { tema: 'Pitágoras',
    lesson: () => `<p>En un triángulo con un ángulo recto (90°), los lados cortos son <b>catetos</b> y el largo es la <b>hipotenusa</b>.</p>
      <p class="big">c² = a² + b²</p>${V.rightTriangle(3, 4, 5, 'c')}
      <p>Catetos 3 y 4 → c² = 9 + 16 = 25 → c = 5. Error típico: sumar 3 + 4 = 7.</p>
      <p>Diagonal de un cuadrado de lado l: <b>l·√2</b>. Diagonal de un rectángulo: Pitágoras con sus lados.</p>`,
    levels: [
      () => { const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20]]); return { q: '¿Cuánto mide la hipotenusa?', ill: V.rightTriangle(a, b, c, 'c'), ans: num(c), traps: [T(a + b, 'razon', 'No se suman los catetos: se suman sus CUADRADOS.')], steps: st(`${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}`, `√${c * c} = <b>${c}</b>`) }; },
      () => { const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25]]); return { q: '¿Cuánto mide el cateto que falta?', ill: V.rightTriangle(a, b, c, 'a'), ans: num(a), traps: [T(c - b, 'razon', 'Se restan los CUADRADOS: c² − b².')], steps: st(`a² = ${c}² − ${b}² = ${c * c} − ${b * b} = ${a * a}`, `a = <b>${a}</b>`) }; },
      () => { if (chance(0.5)) { const [a, b, c] = pick([[5, 12, 13], [6, 8, 10], [9, 12, 15], [8, 15, 17], [3, 4, 5]]); return mc(`¿Cuánto mide la diagonal de un rectángulo de ${a} × ${b}?`, String(c), [[String(a + b), 'Sumaste los lados; se suman los cuadrados.'], [String(a * b), 'Eso es el área.'], [String(b - a), 'No se restan los lados.']], st(`${a}² + ${b}² = ${a * a + b * b}`, `√${a * a + b * b} = <b>${c}</b>`)); }
        const l = ri(2, 12); return mc(`Un cuadrado tiene diagonal ${l}√2 cm. ¿Cuál es su perímetro?`, `${4 * l} cm`, [[`${l * l} cm`, 'Eso es el área.'], [`${2 * l} cm`, 'El perímetro son 4 lados.'], [`${4 * l}√2 cm`, 'El lado es ' + l + ', sin √2.']], st(`Diagonal = lado·√2 → lado = ${l}`, `Perímetro = 4·${l} = <b>${4 * l}</b> cm`)); },
    ], bank: [43, 45, 60] },
  { tema: 'Volúmenes y superficies',
    lesson: () => `<p>El <b>volumen</b> es cuánto cabe adentro (cm³). La <b>superficie</b> es cuánto papel necesitas para forrarlo (cm²).</p>
      <p>• Cubo: <b>a³</b> (largo × ancho × alto) · Caja: l·a·h</p>
      <p>• Esfera: <b>(4/3)·π·r³</b> · Cilindro: volumen π·r²·h; área lateral (la "etiqueta") <b>2πrh</b></p>`,
    levels: [
      () => { if (chance(0.5)) { const a = ri(2, 10); return { q: `Volumen de un cubo de arista ${a} cm`, ans: num(a ** 3), traps: [T(a * a, 'razon', 'Eso es el área de una cara.'), T(6 * a * a, 'razon', 'Eso es el área total.'), T(3 * a, 'pot_base', `a³ es ${a}·${a}·${a}, no 3·${a}.`)], steps: st(`${a}·${a}·${a} = <b>${a ** 3}</b> cm³`) }; }
        const l = ri(2, 10), a = ri(2, 8), h = ri(2, 6); return { q: `Volumen de una caja de ${l} × ${a} × ${h} cm`, ans: num(l * a * h), traps: [T(l + a + h, 'razon', 'Se multiplican, no se suman.')], steps: st(`${l}·${a}·${h} = <b>${l * a * h}</b> cm³`) }; },
      () => { const r = ri(2, 8), h = ri(2, 12); return mc(`Área lateral de un cilindro de radio ${r} y altura ${h}`, `${2 * r * h}π`, [[`${2 * r * h + 2 * r * r}π`, 'Sumaste las tapas: eso es el área total.'], [`${r * r * h}π`, 'Eso es el volumen.'], [`${r * h}π`, 'Falta el 2: la vuelta completa es 2πr.']], st(`Etiqueta: largo 2πr = ${2 * r}π, alto ${h}`, `${2 * r}π·${h} = <b>${2 * r * h}π</b>`)); },
      () => { const r = pick([3, 3, 6]); const v = Math.round((4 / 3) * 3.14 * r ** 3 * 100) / 100; return { q: `Volumen de una esfera de radio ${r} cm (usa π ≈ 3,14)`, ans: num(Q.dec(String(v)), { dec: true }), traps: [T(Q.dec(String(Math.round(4 * 3.14 * r * r * 100) / 100)), 'razon', 'Eso es la superficie (4πr²), no el volumen.')], steps: st(`r³ = ${r ** 3}`, `(4/3)·${r ** 3} = ${4 * r ** 3 / 3}`, `× 3,14 = <b>${String(v).replace('.', ',')}</b> cm³`) }; },
    ], bank: [44, 46, 56] },
  { tema: 'Ángulos',
    lesson: () => `<p>• <b>Complementarios:</b> suman 90° (una esquina). Complemento de 30° = 60°.</p>
      <p>• <b>Suplementarios:</b> suman 180° (una línea recta). Suplemento de 65° = 115°.</p>
      <p>• Los 3 ángulos de un <b>triángulo</b> suman 180°.</p>${V.lineAngle(65)}`,
    levels: [
      () => { const a = ri(5, 85); return { q: `¿Cuál es el <b>complemento</b> de ${a}°?`, ans: num(90 - a), traps: [T(180 - a, 'razon', 'Eso es el suplemento (180°). Complemento = 90°.')], steps: st(`90 − ${a} = <b>${90 - a}°</b>`) }; },
      () => { if (chance(0.5)) { const a = ri(10, 170); return { q: `¿Cuál es el <b>suplemento</b> de ${a}°?`, ans: num(180 - a), traps: [T(90 - a, 'razon', 'Eso es el complemento (90°).')], steps: st(`180 − ${a} = <b>${180 - a}°</b>`) }; }
        const a = ri(20, 90), b = ri(20, 150 - a); return { q: 'Halla el ángulo que falta del triángulo', ill: V.triangleAngles(a, b, 180 - a - b, 2), ans: num(180 - a - b), traps: [T(360 - a - b, 'razon', 'El triángulo suma 180°, no 360°.')], steps: st(`180 − ${a} − ${b} = <b>${180 - a - b}°</b>`) }; },
      () => { const a = ri(15, 75); const s = chance(0.5); return mc(`¿Cuál es el ${s ? 'suplemento' : 'complemento'} de ${a}°?`, `${(s ? 180 : 90) - a}°`, [[`${(s ? 90 : 180) - a}°`, `Ese es el ${s ? 'complemento' : 'suplemento'}.`], [`${a}°`, 'Es el mismo ángulo.'], [`${(s ? 180 : 90) + a}°`, 'Se resta, no se suma.']], st(`${s ? 180 : 90} − ${a} = <b>${(s ? 180 : 90) - a}°</b>`)); },
    ], bank: [48, 51] },
  { tema: 'Trigonometría',
    lesson: () => `<p>En un triángulo rectángulo, para un ángulo θ:</p>
      <p>• <b>sen θ</b> = opuesto ÷ hipotenusa · <b>cos θ</b> = adyacente ÷ hipotenusa · <b>tan θ</b> = opuesto ÷ adyacente</p>
      <div class="tw"><table><tr><th></th><th>30°</th><th>45°</th><th>60°</th></tr><tr><th>sen</th><td>1/2</td><td>√2/2</td><td>√3/2</td></tr><tr><th>cos</th><td>√3/2</td><td>√2/2</td><td>1/2</td></tr><tr><th>tan</th><td>√3/3</td><td>1</td><td>√3</td></tr></table></div>
      <p>Truco: el seno sube 1, 2, 3 (√1/2, √2/2, √3/2) y el coseno baja al revés.</p>`,
    levels: [
      () => { const T6 = { 30: ['1/2', '√3/2'], 45: ['√2/2', '√2/2'], 60: ['√3/2', '1/2'] }; const g = pick([30, 45, 60]); const f = pick(['sen', 'cos']); const r = T6[g][f === 'sen' ? 0 : 1]; return mc(`¿Cuánto vale ${f} ${g}°?`, r, [['1/2', 'Ese es sen 30° o cos 60°.'], ['√3/2', 'Ese es sen 60° o cos 30°.'], ['√2/2', 'Ese es el de 45°.'], ['1', 'Ese es tan 45°.']], st(`Mira la tabla: ${f} ${g}° = <b>${r}</b>`)); },
      () => { const g = pick([30, 45, 60]); const r = { 30: '√3/3', 45: '1', 60: '√3' }[g]; return mc(`¿Cuánto vale tan ${g}°?`, r, [['√3/3', 'Ese es tan 30°.'], ['1', 'Ese es tan 45°.'], ['√3', 'Ese es tan 60°.'], ['1/2', 'Ese es sen 30°.']], st(`tan ${g}° = <b>${r}</b>`)); },
      () => { if (chance(0.5)) { const [v, g] = pick([['tan θ = 1', 45], ['sen θ = 1/2', 30], ['cos θ = 1/2', 60], ['sen θ = √3/2', 60], ['cos θ = √3/2', 30], ['tan θ = √3', 60]]); return mc(`Si ${v}, ¿cuánto vale θ? (primer cuadrante)`, `${g}°`, [['30°', 'Revisa la tabla.'], ['45°', 'Revisa la tabla.'], ['60°', 'Revisa la tabla.'], ['90°', 'En 90° el triángulo no se forma.']], st(`Busca en la tabla: ${v} → θ = <b>${g}°</b>`)); }
        const h = ri(2, 12) * 2; return { q: `En un triángulo rectángulo con hipotenusa ${h}, ¿cuánto mide el cateto opuesto al ángulo de 30°?`, ans: num(h / 2), traps: [T(h * 2, 'razon', 'sen 30° = 1/2: es la MITAD de la hipotenusa.')], steps: st('sen 30° = opuesto/hipotenusa = 1/2', `opuesto = ${h}/2 = <b>${h / 2}</b>`) }; },
    ], bank: [50, 58] },
  { tema: 'Geometría analítica',
    lesson: () => `<p>Los puntos se ubican con dos números (x, y): x es cuánto vas a la derecha y y cuánto subes.</p>
      <p>• <b>Distancia</b> entre dos puntos: Pitágoras → <span class="m">√((x₂ − x₁)² + (y₂ − y₁)²)</span>. De (1, 2) a (4, 6): √(9 + 16) = 5.</p>
      <p>• <b>Pendiente</b> (qué tan inclinada está la recta): <span class="m">m = (y₂ − y₁)/(x₂ − x₁)</span> = cuánto sube ÷ cuánto avanza.</p>
      <p>• <b>Circunferencia</b> con centro (0, 0) y radio r: <span class="m">x² + y² = r²</span>.</p>`,
    levels: [
      () => { const x1 = ri(-5, 5), y1 = ri(-5, 5); const [a, b] = pick([[3, 4], [6, 8], [5, 12], [8, 6], [4, 3], [0, 5], [7, 0]]); const x2 = x1 + a * (chance(0.5) ? 1 : -1), y2 = y1 + b * (chance(0.5) ? 1 : -1); const d = Math.sqrt(a * a + b * b); return { q: `Distancia entre A(${S(x1)}, ${S(y1)}) y B(${S(x2)}, ${S(y2)})`, ans: num(d), traps: [T(a + b === d ? null : a + b, 'razon', 'Se suman los CUADRADOS de las diferencias, luego raíz.')], steps: st(`Δx = ${Math.abs(x2 - x1)}, Δy = ${Math.abs(y2 - y1)}`, `√(${a * a} + ${b * b}) = √${a * a + b * b} = <b>${d}</b>`) }; },
      () => { const x1 = ri(-5, 5), y1 = ri(-5, 5), dx = nz(-5, 5), m = nz(-4, 4); const x2 = x1 + dx, y2 = y1 + m * dx * (chance(0.5) ? 1 : 1); const mq = new Q(y2 - y1, x2 - x1); return { q: `Pendiente de la recta que pasa por (${S(x1)}, ${S(y1)}) y (${S(x2)}, ${S(y2)})`, ans: num(mq), traps: [T(new Q(x2 - x1, y2 - y1), 'razon', 'Invertiste: es lo que SUBE (y) entre lo que AVANZA (x).'), T(y2 - y1, 'razon', 'Falta dividir entre lo que avanza.')], steps: st(`Sube: ${S(y2)} − (${S(y1)}) = ${S(y2 - y1)}`, `Avanza: ${S(x2)} − (${S(x1)}) = ${S(x2 - x1)}`, `m = <b>${mq.toString().replace('-', '−')}</b>`) }; },
      () => { const r = ri(2, 9); return mc(`Ecuación de la circunferencia con centro (0, 0) y radio ${r}`, `x² + y² = ${r * r}`, [[`x² + y² = ${r}`, 'Falta elevar el radio al cuadrado.'], [`x² − y² = ${r * r}`, 'Es una suma, no una resta.'], [`(x + ${r})² + y² = 0`, 'Esa no es una circunferencia de radio ' + r + '.']], st('x² + y² = r²', `r² = ${r * r} → <b>x² + y² = ${r * r}</b>`)); },
    ], bank: [52, 53, 59] },
];

// Reintento simple cuando un generador cae en un caso que no sirve
export function CURSO_FIX(tema, lvl) { const t = CURSO.find((c) => c.tema === tema); const g = t.levels[lvl]; return typeof g === 'function' ? g() : g; }
const soles = (n) => `S/ ${n}`;
export const CURSO_BY = Object.fromEntries(CURSO.map((c) => [c.tema, c]));
void P; void qHTML; void gcd;
