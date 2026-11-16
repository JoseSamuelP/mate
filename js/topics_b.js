// =============================================================
// topics_b.js — Polinomios, factorización, fracciones, ecuaciones,
// modelamiento, regla de tres, porcentajes, sistemas, cuadráticas
// =============================================================
import { ri, nz, pick, chance, P, S, soles, poly, lin, gcd, lcm, num, expr, sol, choice, T, Q, M, qHTML } from './util.js';
import * as V from './viz.js';
import { autoSteps } from './topics_a.js';

const L = (a, b) => lin(a, b); // "x+3"
const fx = (n, d) => { const q = new Q(n, d); return q.d === 1 ? `${q.n}` : `${q.n}/${q.d}`; };

// ---------------- 8. Suma y resta de polinomios ----------------
const poli_suma = {
  id: 'poli_suma', name: 'Sumar y restar polinomios', icon: '+P', mode: 'lapiz', unit: 'C1',
  lesson: () => `
    <p>Solo se juntan <b>términos semejantes</b> (misma letra con el mismo exponente), como juntar frutas del mismo tipo:</p>
    <p class="big">3 🍎 + 2 🍌 + 5 🍎 = 8 🍎 + 2 🍌</p>
    <p class="big">${M('3x^2+2x+5x^2')} = ${M('8x^2+2x')}</p>
    <p><b>Un menos delante del paréntesis cambia el signo de TODOS los de adentro:</b></p>
    <p class="big">${M('-(2x-7)')} = ${M('-2x+7')}</p>`,
  variants: [
    {
      id: 'suma', w: 2, errs: ['semejantes'],
      gen() {
        const A = [nz(-6, 6), nz(-9, 9), nz(-9, 9)], B = [nz(-6, 6), nz(-9, 9), nz(-9, 9)];
        const R = A.map((v, i) => v + B[i]);
        if (R[0] === 0) return this.gen();
        return {
          q: `Reduce: ${M(`(${poly(A)})+(${poly(B)})`)}`, ans: expr(poly(R), { form: ['expanded', 'reduced'] }),
          traps: [T(poly([A[0] + B[0], A[1] + B[1] + A[2] + B[2]]), 'semejantes', 'Solo se suman términos con la <b>misma letra y exponente</b>: x con x, números con números.')],
          steps: [{ note: `x²: ${S(A[0])} + ${S(B[0])} = ${S(R[0])}` }, { note: `x: ${S(A[1])} + ${S(B[1])} = ${S(R[1])}` }, { note: `números: ${S(A[2])} + ${S(B[2])} = ${S(R[2])}` }, { html: M(poly(R)) }],
        };
      },
    },
    {
      id: 'resta', w: 3, errs: ['menos_paren'],
      gen() {
        const A = [nz(-6, 6), nz(-9, 9), nz(-9, 9)], B = [nz(-6, 6), nz(-9, 9), nz(-9, 9)];
        const R = A.map((v, i) => v - B[i]);
        if (R[0] === 0) return this.gen();
        const wrong = [A[0] - B[0], A[1] + B[1], A[2] + B[2]];
        return {
          q: `Reduce: ${M(`(${poly(A)})-(${poly(B)})`)}`, ans: expr(poly(R), { form: ['expanded', 'reduced'] }),
          traps: [T(poly(wrong), 'menos_paren', 'El <b>−</b> delante del paréntesis cambia el signo de <b>todos</b> los términos, no solo del primero.', `${M(`-(${poly(B)})`)} → ${M(poly(B.map((b, i) => (i === 0 ? -b : b))))} ✗`), T(poly(A.map((v, i) => v + B[i])), 'menos_paren', 'Es una <b>resta</b>: cambia los signos del segundo polinomio.')],
          steps: [{ html: M(`${poly(A)}${poly(B.map((b) => -b)).startsWith('-') ? '' : '+'}${poly(B.map((b) => -b))}`), note: 'Quita el paréntesis cambiando <b>todos</b> los signos del segundo.' }, { html: M(poly(R)), note: 'Junta semejantes.' }],
        };
      },
    },
    {
      id: 'distr', w: 3, errs: ['menos_paren', 'dist_inc'],
      gen() {
        const a = ri(2, 9), k = ri(2, 5), b = nz(-9, 9);
        const R = [a - k, -k * b];
        if (R[0] === 0) return this.gen();
        return {
          q: `Reduce: ${M(`${a}x-${k}(${L(1, b)})`)}`, ans: expr(poly(R), { form: ['expanded', 'reduced'] }),
          traps: [T(poly([a - k, k * b]), 'menos_paren', `El −${k} multiplica también al ${S(b)}: −${k}·(${S(b)}) = ${S(-k * b)}.`), T(poly([a - k, -b]), 'dist_inc', `El ${k} multiplica a <b>los dos</b> términos del paréntesis.`)],
          steps: [{ html: M(`${a}x-${k}x${-k * b < 0 ? '' : '+'}${-k * b}`), note: `Reparte el −${k}: −${k}·x y −${k}·(${S(b)})` }, { html: M(poly(R)), note: 'Junta semejantes' }],
        };
      },
    },
  ],
};

// ---------------- 9. Multiplicación de polinomios ----------------
const poli_mult = {
  id: 'poli_mult', name: 'Multiplicar polinomios', icon: '(·)(·)', mode: 'lapiz', unit: 'C1',
  lesson: () => `
    <p>Multiplicar dos paréntesis es como calcular el <b>área de un rectángulo</b> cortado en pedazos:</p>
    ${V.areaModel([M('x'), M('3')], [M('x'), M('2')], [[M('x^2'), M('2x')], [M('3x'), M('6')]], `${M('(x+3)(x+2)')}`)}
    <p>Sumas los 4 pedazos: ${M('x^2+2x+3x+6')} = <b>${M('x^2+5x+6')}</b></p>
    <p class="mute">Tu error del diagnóstico fue sumar: 2x + 5. ¡Hay que multiplicar cada término por cada término!</p>`,
  variants: [
    {
      id: 'mono', w: 2, errs: ['dist_inc'],
      gen() {
        const k = nz(-5, 6), b = ri(2, 6), c = nz(-9, 9);
        const R = [k * b, k * c, 0];
        return {
          q: `Multiplica: ${M(`${k === 1 ? '' : k === -1 ? '-' : k}x(${b}x${c < 0 ? '' : '+'}${c})`)}`, ans: expr(poly(R), { form: ['expanded'] }),
          traps: [T(poly([k * b, 0, c]), 'dist_inc', `El ${S(k)}x multiplica a <b>cada</b> término del paréntesis.`)],
          steps: [{ note: `${M(poly([k, 0]))} · ${M(poly([b, 0]))} = ${M(poly([k * b, 0, 0]))}` }, { note: `${M(poly([k, 0]))} · (${S(c)}) = ${M(poly([k * c, 0]))}` }, { html: M(poly(R)) }],
          viz: V.areaModel([M(poly([k, 0]))], [M(poly([b, 0])), M(`${c}`)], [[M(poly([k * b, 0, 0])), M(poly([k * c, 0]))]]),
        };
      },
    },
    {
      id: 'bin', w: 4, errs: ['prod_suma', 'dist_inc', 'signo_mult'],
      gen() {
        const a = nz(-7, 7), b = nz(-7, 7);
        const R = [1, a + b, a * b];
        return {
          q: `Multiplica: ${M(`(${L(1, a)})(${L(1, b)})`)}`, ans: expr(poly(R), { form: ['expanded', 'reduced'] }),
          traps: [
            T(poly([2, a + b]), 'prod_suma', 'Sumaste los paréntesis. Hay que <b>multiplicar</b> cada término por cada término (mira el rectángulo).', `${M(`(${L(1, a)})(${L(1, b)})`)} → ${M(poly([2, a + b]))} ✗`),
            T(poly([1, 0, a * b]), 'dist_inc', 'Te faltaron los términos del medio: x·(' + S(b) + ') y (' + S(a) + ')·x.'),
            T(poly([1, a + b, -a * b]), 'signo_mult', `(${S(a)})·(${S(b)}) = ${S(a * b)}. Revisa la regla de signos.`),
            T(poly([1, -(a + b), a * b]), 'signo_suma', 'Revisa el signo del término del medio.'),
          ],
          steps: [
            { html: V.areaModel([M('x'), M(`${a}`)], [M('x'), M(`${b}`)], [[M('x^2'), M(poly([b, 0]))], [M(poly([a, 0])), M(`${a * b}`)]]), note: 'Cada pedazo es una multiplicación.' },
            { html: M(`x^2${b < 0 ? '' : '+'}${b}x${a < 0 ? '' : '+'}${a}x${a * b < 0 ? '' : '+'}${a * b}`), note: 'Suma los 4 pedazos.' },
            { html: M(poly(R)), note: `Junta los del medio: (${S(a)}) + (${S(b)}) = ${S(a + b)}` },
          ],
        };
      },
    },
    {
      id: 'binab', w: 2, errs: ['dist_inc', 'signo_mult'],
      gen() {
        const a = ri(2, 4), b = nz(-6, 6), c = ri(1, 3), d = nz(-6, 6);
        const R = [a * c, a * d + b * c, b * d];
        return {
          q: `Multiplica: ${M(`(${L(a, b)})(${L(c, d)})`)}`, ans: expr(poly(R), { form: ['expanded', 'reduced'] }),
          traps: [T(poly([a * c, 0, b * d]), 'dist_inc', 'Faltan los productos cruzados (los del medio).'), T(poly([a + c, b + d]), 'prod_suma', 'Se multiplican, no se suman.')],
          steps: [{ html: V.areaModel([M(poly([a, 0])), M(`${b}`)], [M(poly([c, 0])), M(`${d}`)], [[M(poly([a * c, 0, 0])), M(poly([a * d, 0]))], [M(poly([b * c, 0])), M(`${b * d}`)]]) }, { html: M(poly(R)), note: `Medio: ${S(a * d)} + ${S(b * c)} = ${S(a * d + b * c)}` }],
        };
      },
    },
  ],
};

// ---------------- 10. Productos notables ----------------
const prod_notables = {
  id: 'prod_notables', name: 'Productos notables', icon: '(a+b)²', mode: 'lapiz', unit: 'C1',
  lesson: () => `
    <p>${M('(x+5)^2')} NO es ${M('x^2+25')}. Mira el cuadrado:</p>
    ${V.areaModel([M('x'), M('5')], [M('x'), M('5')], [[M('x^2'), M('5x')], [M('5x'), M('25')]], 'Un cuadrado de lado (x + 5)')}
    <p>Faltaban los dos rectángulos del medio: <b>${M('x^2+10x+25')}</b></p>
    <p class="big">${M('(a+b)^2')} = ${M('a^2+2ab+b^2')}</p>
    <p class="big">${M('(a-b)^2')} = ${M('a^2-2ab+b^2')}</p>
    <p class="big">${M('(a+b)(a-b)')} = ${M('a^2-b^2')}</p>`,
  variants: [
    {
      id: 'cuad', w: 4, errs: ['binomio2'],
      gen() {
        const a = nz(-9, 9);
        const R = [1, 2 * a, a * a];
        return {
          q: `Desarrolla: ${M(`(${L(1, a)})^2`)}`, ans: expr(poly(R), { form: ['expanded', 'reduced'] }),
          traps: [
            T(poly([1, 0, a * a]), 'binomio2', `Olvidaste el término del medio: <b>2·x·${S(a)} = ${S(2 * a)}x</b>. Mira el cuadrado: hay dos rectángulos.`, `${M(`(${L(1, a)})^2`)} → ${M(poly([1, 0, a * a]))} ✗`),
            T(poly([1, a, a * a]), 'binomio2', 'El término del medio es el <b>doble</b> (2ab): hay dos rectángulos iguales.'),
            T(poly([1, 0, -a * a]), 'binomio2', 'El último término es (' + S(a) + ')², siempre positivo.'),
            T(poly([1, -2 * a, a * a]), 'signo_mult', 'Revisa el signo del término del medio.'),
          ],
          steps: [
            { html: V.areaModel([M('x'), M(`${a}`)], [M('x'), M(`${a}`)], [[M('x^2'), M(poly([a, 0]))], [M(poly([a, 0])), M(`${a * a}`)]]), note: 'Es un cuadrado: 4 pedazos.' },
            { note: `x² + 2·(x)·(${S(a)}) + (${S(a)})²` },
            { html: M(poly(R)) },
          ],
        };
      },
    },
    {
      id: 'cuadk', w: 2, errs: ['binomio2', 'pot_coef'],
      gen() {
        const k = ri(2, 4), a = nz(-5, 5);
        const R = [k * k, 2 * k * a, a * a];
        return {
          q: `Desarrolla: ${M(`(${L(k, a)})^2`)}`, ans: expr(poly(R), { form: ['expanded', 'reduced'] }),
          traps: [T(poly([k * k, 0, a * a]), 'binomio2', 'Falta el doble producto: 2·(' + k + 'x)·(' + S(a) + ').'), T(poly([k, 2 * k * a, a * a]), 'pot_coef', `(${k}x)² = ${k * k}x²: el ${k} también se eleva.`)],
          steps: [{ note: `(${k}x)² = ${k * k}x²` }, { note: `2·(${k}x)·(${S(a)}) = ${S(2 * k * a)}x` }, { note: `(${S(a)})² = ${a * a}` }, { html: M(poly(R)) }],
        };
      },
    },
    {
      id: 'difcuad', w: 3, errs: ['dif_cuad'],
      gen() {
        const a = ri(1, 10), k = pick([1, 1, 1, 2, 3]);
        const R = [k * k, 0, -a * a];
        return {
          q: `Multiplica: ${M(`(${L(k, a)})(${L(k, -a)})`)}`, ans: expr(poly(R), { form: ['expanded', 'reduced'] }),
          traps: [T(poly([k * k, 0, a * a]), 'dif_cuad', `${S(a)}·(${S(-a)}) = ${S(-a * a)}: el último término es <b>negativo</b>.`), T(poly([k * k, -2 * k * a, -a * a]), 'dif_cuad', 'Los términos del medio se cancelan: +' + k * a + 'x − ' + k * a + 'x = 0.')],
          steps: [{ html: V.areaModel([M(poly([k, 0])), M(`${a}`)], [M(poly([k, 0])), M(`${-a}`)], [[M(poly([k * k, 0, 0])), M(poly([-k * a, 0]))], [M(poly([k * a, 0])), M(`${-a * a}`)]]), note: 'Los del medio se anulan: ' + M(poly([-k * a, 0])) + ' y ' + M(poly([k * a, 0])) }, { html: M(poly(R)), note: 'Suma por diferencia = diferencia de cuadrados.' }],
        };
      },
    },
  ],
};

// ---------------- 11. Factor común y agrupación ----------------
const factor_comun = {
  id: 'factor_comun', name: 'Factor común y agrupación', icon: 'k( )', mode: 'lapiz', unit: 'C1',
  lesson: () => `
    <p>Factorizar es <b>lo contrario</b> de multiplicar: buscas lo que se repite en todos los términos y lo sacas.</p>
    <p class="big">${M('6x^2+9x')} → ambos tienen <b>3</b> y <b>x</b> → ${M('3x(2x+3)')}</p>
    <p>Comprueba multiplicando: ${M('3x*2x')} = ${M('6x^2')} ✓, ${M('3x*3')} = ${M('9x')} ✓</p>
    <p><b>Agrupación:</b> ${M('ax+ay+bx+by')} = ${M('a(x+y)+b(x+y)')} = ${M('(x+y)(a+b)')}</p>`,
  variants: [
    {
      id: 'fc', w: 4, errs: ['fac_comun'],
      gen() {
        const g = pick([2, 3, 4, 5, 6]), k = pick([1, 1, 2]);
        let p = ri(1, 6), q = nz(-7, 7); if (gcd(p, q) !== 1) return this.gen();
        const deg2 = k + 1;
        const A = g * p, B = g * q;
        const exprStr = `${A}x^${deg2}${B < 0 ? '' : '+'}${B}x^${k}`.replace('x^1', 'x');
        const ans = `${g}x^${k}(${p}x${q < 0 ? '' : '+'}${q})`.replace('x^1', 'x');
        return {
          q: `Factoriza: ${M(exprStr)}`, ans: expr(ans, { form: ['factored', 'gcf'], gcf: { g, k } }),
          traps: [],
          steps: [{ note: `Número común (MCD de ${A} y ${Math.abs(B)}): <b>${g}</b>` }, { note: `Letra común con el menor exponente: ${M(`x^${k}`.replace('^1', ''))}` }, { html: M(ans), note: 'Divide cada término entre el factor común.' }],
        };
      },
    },
    {
      id: 'agrup', w: 2, errs: ['fac_comun'],
      gen() {
        const a = ri(2, 7), b = nz(-7, 7);
        // (x+a)(y+b) = xy + bx + ay + ab
        const exprStr = `xy${b < 0 ? '' : '+'}${b}x+${a}y${a * b < 0 ? '' : '+'}${a * b}`;
        return {
          q: `Factoriza por agrupación: ${M(exprStr)}`, ans: expr(`(x+${a})(y${b < 0 ? '' : '+'}${b})`, { form: ['factored'] }),
          traps: [],
          steps: [{ html: M(`x(y${b < 0 ? '' : '+'}${b})+${a}(y${b < 0 ? '' : '+'}${b})`), note: 'Agrupa de dos en dos y saca factor común.' }, { html: M(`(y${b < 0 ? '' : '+'}${b})(x+${a})`), note: 'El paréntesis se repite: sácalo.' }],
        };
      },
    },
  ],
};

// ---------------- 12. Aspa simple ----------------
function aspaViz(a, c, m, n, b) {
  // a x² + b x + c = (p x + m)(q x + n) con a=p*q (aquí p=q=1 o p=a,q=1)
  return `<div class="aspa"><div><span>${M(a === 1 ? 'x' : `${a}x`)}</span><span>${M(`${m}`)}</span></div><div class="aspa-x">✕</div><div><span>${M('x')}</span><span>${M(`${n}`)}</span></div>
  <div class="aspa-n">Cruzado: ${a === 1 ? '' : a}x·(${S(n)}) + x·(${S(m)}) = ${M(poly([a * n + m, 0]))} ${a * n + m === b ? '✓' : '✗'}</div></div>`;
}
const aspa_simple = {
  id: 'aspa_simple', name: 'Factorizar: aspa simple', icon: '✕', mode: 'lapiz', unit: 'C1',
  lesson: () => `
    <p>Para ${M('x^2+5x+6')} busca <b>dos números</b> que:</p>
    <p>• <b>multiplicados</b> den <b>6</b> (el último)<br>• <b>sumados</b> den <b>5</b> (el del medio)</p>
    <p>Pares que multiplican 6: 1·6, <b>2·3</b>, (−2)(−3)… → 2 + 3 = 5 ✓</p>
    ${aspaViz(1, 6, 2, 3, 5)}
    <p class="big">${M('x^2+5x+6')} = ${M('(x+2)(x+3)')}</p>
    <p class="mute">Es lo contrario de multiplicar (x+2)(x+3). ¡Siempre puedes comprobar!</p>`,
  variants: [
    {
      id: 'mon', w: 4, errs: ['aspa'],
      gen() {
        const m = nz(-9, 9), n = nz(-9, 9);
        const b = m + n, c = m * n;
        if (b === 0) return this.gen();
        return {
          q: `Factoriza: ${M(poly([1, b, c]))}`, ans: expr(`(${L(1, m)})(${L(1, n)})`, { form: ['factored'] }),
          traps: [T(`(${L(1, -m)})(${L(1, -n)})`, 'aspa', `Revisa los signos: (${S(-m)})+(${S(-n)}) = ${S(-b)}, pero necesitas ${S(b)}.`), T(m !== n ? `(${L(1, m)})(${L(1, -n)})` : null, 'aspa', 'Multiplica para comprobar: el último término no coincide.')],
          steps: [{ note: `Dos números que multiplicados den <b>${S(c)}</b> y sumados den <b>${S(b)}</b>.` }, { note: `Son <b>${S(m)}</b> y <b>${S(n)}</b>: (${S(m)})·(${S(n)}) = ${S(c)} y (${S(m)}) + (${S(n)}) = ${S(b)}` }, { html: aspaViz(1, c, m, n, b) }, { html: M(`(${L(1, m)})(${L(1, n)})`) }],
        };
      },
    },
    {
      id: 'ax2', w: 1, errs: ['aspa'],
      gen() {
        const a = pick([2, 3]), m = nz(-5, 5), n = nz(-5, 5);
        // (a x + m)(x + n) = a x² + (a n + m) x + m n
        const b = a * n + m, c = m * n;
        if (b === 0 || gcd(gcd(a, Math.abs(m)), 1) !== 1 || gcd(a, Math.abs(m)) !== 1) return this.gen();
        return {
          q: `Factoriza: ${M(poly([a, b, c]))}`, ans: expr(`(${L(a, m)})(${L(1, n)})`, { form: ['factored'] }),
          traps: [],
          steps: [{ note: `Descompón ${a}x² = ${a}x · x y ${S(c)} = (${S(m)})(${S(n)})` }, { html: aspaViz(a, c, m, n, b) }, { html: M(`(${L(a, m)})(${L(1, n)})`) }],
        };
      },
    },
  ],
};

// ---------------- 13. Fracciones: suma y resta ----------------
const frac_suma = {
  id: 'frac_suma', name: 'Fracciones: sumar y restar', icon: '½+', mode: 'lapiz', unit: 'base',
  lesson: () => `
    <p>Solo se pueden sumar partes <b>del mismo tamaño</b>. Tercios y cuartos no se suman directo: hay que cortarlos igual.</p>
    ${V.fracAddViz(2, 3, 1, 4)}
    <p class="big">${M('2/3+1/4')} = ${M('8/12+3/12')} = ${M('11/12')}</p>
    <p class="mute">Error típico: sumar arriba y multiplicar abajo (3/12). Ese "método" no existe.</p>`,
  variants: [
    {
      id: 'dist', w: 4, errs: ['frac_suma'],
      gen() {
        const b = ri(2, 9), d = ri(2, 9); if (b === d) return this.gen();
        const a = ri(1, b - 1 || 1), c = ri(1, d - 1 || 1);
        const sub = chance(0.4);
        const r = sub ? new Q(a, b).sub(new Q(c, d)) : new Q(a, b).add(new Q(c, d));
        const m = lcm(b, d);
        return {
          q: `Calcula: ${M(`${a}/${b}${sub ? '-' : '+'}${c}/${d}`)}`, ans: num(r), ctxTag: 'frac',
          traps: [
            T(new Q(sub ? a - c : a + c, b * d), 'frac_suma', `Sumaste/restaste numeradores y multiplicaste denominadores. Así no funciona: primero hay que tener <b>partes del mismo tamaño</b>.`, `${M(`${a}/${b}${sub ? '-' : '+'}${c}/${d}`)} → ${M(`${sub ? a - c : a + c}/${b * d}`)} ✗`),
            T(sub ? (b + d !== 0 ? new Q(a - c, b + d) : null) : new Q(a + c, b + d), 'frac_suma', '¡No se suman los denominadores! El denominador dice el <b>tamaño</b> de las partes.'),
            T(new Q(a * d + c * b * (sub ? -1 : 1) + (sub ? 0 : 0), b * d).eq(r) ? null : new Q(a * c, b * d), 'frac_mult', 'Eso es multiplicar fracciones; aquí es suma/resta.'),
          ],
          steps: [
            { note: `Partes del mismo tamaño: el común denominador es <b>${m}</b>.` },
            { html: M(`${a * m / b}/${m}${sub ? '-' : '+'}${c * m / d}/${m}`), note: `${a}/${b} = ${a * m / b}/${m} y ${c}/${d} = ${c * m / d}/${m}` },
            { html: M(`${sub ? a * m / b - c * m / d : a * m / b + c * m / d}/${m}`), note: 'Ahora sí, se suman/restan solo los de arriba.' },
            { html: qHTML(r), note: 'Simplifica si se puede.' },
          ],
          viz: sub && r.n < 0 ? '' : V.fracAddViz(a, b, c, d, sub),
        };
      },
    },
    {
      id: 'mixto', w: 2, errs: ['frac_suma'],
      gen() {
        const n = ri(1, 4), a = ri(1, 6), b = ri(a + 1, 9);
        const r = new Q(n).add(new Q(a, b));
        return {
          q: `Calcula: ${M(`${n}+${a}/${b}`)}`, ans: num(r),
          traps: [T(new Q(n + a, b), 'frac_suma', `El ${n} es un entero: vale ${n * b}/${b}, no ${n}/${b}.`)],
          steps: [{ html: M(`${n * b}/${b}+${a}/${b}`), note: `${n} = ${n * b}/${b} (${n} enteros de ${b} partes)` }, { html: qHTML(r) }],
        };
      },
    },
    {
      id: 'ctx', w: 2, errs: ['frac_suma'], ctx: true,
      gen() {
        const [b, d] = pick([[2, 3], [3, 4], [4, 6], [2, 5], [3, 5], [4, 8]]); const a = 1, c = ri(1, d - 1);
        const r = new Q(a, b).add(new Q(c, d));
        if (r.cmp(1) >= 0) return this.gen();
        return {
          q: `De una pizza, Ana comió ${M(`${a}/${b}`)} y Luis ${M(`${c}/${d}`)}. ¿Qué fracción de la pizza comieron entre los dos?`,
          ans: num(r), traps: [T(new Q(a + c, b * d), 'frac_suma', 'Primero corta la pizza en partes iguales (común denominador).'), T(new Q(a + c, b + d), 'frac_suma', 'Los denominadores no se suman.')],
          steps: [{ note: `Común denominador: ${lcm(b, d)}` }, { html: qHTML(r) }], viz: V.fracAddViz(a, b, c, d),
        };
      },
    },
  ],
};

// ---------------- 14. Fracciones: multiplicar y dividir ----------------
const frac_mult = {
  id: 'frac_mult', name: 'Fracciones: multiplicar y dividir', icon: '½×', mode: 'lapiz', unit: 'base',
  lesson: () => `
    <p><b>Multiplicar:</b> en línea recta. Arriba × arriba, abajo × abajo. (Simplifica antes si puedes.)</p>
    ${V.fracMulViz(2, 3, 3, 4)}
    <p class="big">${M('(2/3)(3/4)')} = ${M('6/12')} = ${M('1/2')}</p>
    <p><b>Dividir:</b> la primera igual, <b>la segunda se voltea</b> y se multiplica.</p>
    <p class="big">${M('(4/7):(2/21)')} = ${M('(4/7)(21/2)')} = ${M('84/14')} = 6</p>
    <p class="mute">¿Por qué 6? Porque ${M('2/21')} cabe 6 veces en ${M('4/7')} = ${M('12/21')}.</p>`,
  variants: [
    {
      id: 'mult', w: 3, errs: ['frac_mult'],
      gen() {
        const a = ri(1, 9), b = ri(2, 10), c = ri(1, 9), d = ri(2, 10);
        const r = new Q(a * c, b * d);
        return {
          q: `Calcula: ${M(`(${a}/${b})(${c}/${d})`)}`, ans: num(r),
          traps: [
            T(new Q(a * d + b * c, b * d), 'frac_mult', 'Usaste el método de la <b>suma</b> (en cruz). Multiplicar es más fácil: <b>en línea recta</b>.', `${a}·${d} + ${b}·${c} ✗`),
            T(new Q(a * d, b * c), 'frac_div', 'Eso es dividir (voltear). Para multiplicar: arriba × arriba, abajo × abajo.'),
          ],
          steps: [{ html: M(`(${a}*${c})/(${b}*${d})`), note: 'Arriba × arriba, abajo × abajo' }, { html: M(`${a * c}/${b * d}`) }, { html: qHTML(r), note: 'Simplifica' }],
          viz: a <= b && c <= d && b <= 8 && d <= 8 ? V.fracMulViz(a, b, c, d) : '',
        };
      },
    },
    {
      id: 'div', w: 3, errs: ['frac_div'],
      gen() {
        const a = ri(1, 9), b = ri(2, 9), c = ri(1, 9), d = ri(2, 9);
        const r = new Q(a * d, b * c);
        return {
          q: `Calcula: ${M(`(${a}/${b}):(${c}/${d})`)}`, ans: num(r),
          traps: [
            T(new Q(a * c, b * d), 'frac_div', 'Multiplicaste directo. Para dividir hay que <b>voltear la segunda</b> fracción.'),
            T(new Q(b * c, a * d), 'frac_div', 'Volteaste la fracción equivocada: se voltea <b>la segunda</b>.'),
          ],
          steps: [{ html: M(`(${a}/${b})(${d}/${c})`), note: 'Voltea la segunda y multiplica' }, { html: M(`${a * d}/${b * c}`) }, { html: qHTML(r), note: 'Simplifica' }],
        };
      },
    },
    {
      id: 'entero', w: 2, errs: ['frac_mult'], ctx: true,
      gen() {
        const d = pick([3, 4, 5, 6, 8]), n = ri(1, d - 1), k = ri(2, 12) * d;
        return {
          q: `Un celular cuesta ${soles(k * 10)}. Pagas ${M(`${n}/${d}`)} al contado. ¿Cuánto pagas al contado?`, ans: num(k * 10 * n / d), unit: 'S/',
          traps: [T(new Q(k * 10 * n, d * k * 10), 'frac_mult', 'Multiplica solo el numerador por el precio.'), T(new Q(k * 10 * d, n), 'frac_div', 'Es una multiplicación: precio × fracción.')],
          steps: [{ note: `${M(`${n}/${d}`)} de ${k * 10} = ${k * 10} ÷ ${d} × ${n}` }, { note: `${k * 10} ÷ ${d} = ${k * 10 / d}; × ${n} = <b>${k * 10 * n / d}</b>` }],
        };
      },
    },
  ],
};

// ---------------- 15. Operaciones combinadas con fracciones ----------------
const frac_comb = {
  id: 'frac_comb', name: 'Fracciones combinadas', icon: '½±×', mode: 'lapiz', unit: 'base',
  lesson: () => `<p>Misma jerarquía de siempre: primero multiplicaciones y divisiones, al final sumas y restas.</p>${V.chain(autoSteps('1/2+(2/3)(3/4)'))}`,
  variants: [
    {
      id: 'sm', w: 3, errs: ['jerarquia', 'frac_suma'],
      gen() {
        const a = ri(1, 3), b = ri(2, 6), c = ri(1, 5), d = ri(2, 6), e = ri(1, 5), f = ri(2, 6);
        const spec = `${a}/${b}+(${c}/${d})(${e}/${f})`;
        const r = new Q(a, b).add(new Q(c * e, d * f));
        const lr = new Q(a, b).add(new Q(c, d)).mul(new Q(e, f));
        return { q: `Calcula: ${M(spec)}`, ans: num(r), traps: [T(lr, 'jerarquia', 'Primero la multiplicación y después la suma.')], steps: autoSteps(spec) };
      },
    },
    {
      id: 'neg', w: 2, errs: ['frac_suma', 'signo_suma'],
      gen() {
        const a = ri(1, 5), b = ri(2, 6), c = ri(1, 5), d = ri(2, 6), k = ri(2, 4);
        const spec = `${a}/${b}-${k}*(${c}/${d})`;
        const r = new Q(a, b).sub(new Q(k * c, d));
        return { q: `Calcula: ${M(spec)}`, ans: num(r), traps: [T(new Q(a, b).sub(new Q(c, d)).mul(k), 'jerarquia', 'La multiplicación va antes que la resta.')], steps: autoSteps(spec) };
      },
    },
  ],
};

// ---------------- 16. Ecuaciones lineales ----------------
function balSteps(a, b, c, d, x) {
  // a x + b = c x + d
  const st = [];
  st.push({ html: V.balance(M(`${poly([a, b])}`), M(`${poly([c, d])}`)), note: 'La ecuación es una balanza: lo que hagas a un lado, hazlo al otro.' });
  if (c !== 0) st.push({ html: V.balance(M(poly([a - c, b])), M(`${d}`)), note: `${c > 0 ? 'Restamos' : 'Sumamos'} ${M(`${Math.abs(c)}x`.replace(/^1x/, 'x'))} a ambos lados (la x "pasa" con signo cambiado).` });
  st.push({ html: V.balance(M(`${a - c}x`.replace(/^1x/, 'x').replace(/^-1x/, '-x')), M(`${d - b}`)), note: `${b > 0 ? 'Restamos' : 'Sumamos'} ${Math.abs(b)} a ambos lados: el ${S(b)} pasa como <b>${S(-b)}</b>.` });
  if (a - c !== 1) st.push({ html: V.balance(M('x'), M(fx(d - b, a - c))), note: `Dividimos ambos lados entre ${S(a - c)}.` });
  st.push({ note: `x = <b>${fx(d - b, a - c).replace('-', '−')}</b>. Comprueba reemplazando.` });
  void x; return st;
}
const ec_lineales = {
  id: 'ec_lineales', name: 'Ecuaciones de primer grado', icon: 'x=', mode: 'lapiz', unit: 'PC1',
  lesson: () => `
    <p>Una ecuación es una <b>balanza en equilibrio</b>. "Pasar al otro lado" en realidad es <b>hacer lo mismo a ambos lados</b>, por eso el signo cambia:</p>
    ${V.chain(balSteps(2, -6, 1, 4))}
    <p class="mute">Tu error del diagnóstico: pasar el −6 como −6 (sin cambiar signo) y marcarlo como "seguro". ¡Ojo con eso!</p>`,
  variants: [
    {
      id: 'simple', w: 2, errs: ['transpos', 'despeje_div'], mode: 'mental',
      gen() {
        const a = nz(-9, 9), x = nz(-10, 10), b = nz(-15, 15); const c = a * x + b;
        if (a === 1) return this.gen();
        return {
          q: `Resuelve: ${M(`${poly([a, b])}=${c}`)}`, ans: sol(x),
          traps: [T(new Q(c + b, a), 'transpos', `El ${S(b)} pasa al otro lado como <b>${S(-b)}</b> (cambia de signo).`), T(new Q(-(c - b), a), 'despeje_div', `El ${S(a)} pasa dividiendo <b>con su signo</b>.`), T(new Q((c - b) * a), 'despeje_div', `El ${S(a)} multiplica a x, así que pasa <b>dividiendo</b>.`)],
          steps: balSteps(a, b, 0, c),
        };
      },
    },
    {
      id: 'ambos', w: 4, errs: ['transpos'],
      gen() {
        const a = nz(-6, 8), c = nz(-6, 8); if (a === c) return this.gen();
        const x = nz(-10, 12), b = nz(-12, 12); const d = (a - c) * x + b;
        return {
          q: `Resuelve: ${M(`${poly([a, b])}=${poly([c, d])}`)}`, ans: sol(x),
          traps: [
            T(new Q(d + b, a - c), 'transpos', `Pasaste el ${S(b)} sin cambiarle el signo. Al pasar al otro lado, <b>${S(b)} se vuelve ${S(-b)}</b>.`, `${M(`${a - c}x=${d}${b < 0 ? '' : '+'}${b}`)} ✗`),
            T(a + c !== 0 ? new Q(d - b, a + c) : null, 'transpos', `La ${M(poly([c, 0]))} pasa al otro lado con el signo <b>cambiado</b>.`),
            T(new Q(b - d, a - c), 'transpos', 'Revisa los signos al pasar los términos.'),
          ],
          steps: balSteps(a, b, c, d),
        };
      },
    },
    {
      id: 'paren', w: 3, errs: ['dist_inc', 'transpos'],
      gen() {
        const k = nz(-5, 6), b = nz(-8, 8), x = nz(-9, 9), e = nz(-9, 9);
        if (Math.abs(k) === 1) return this.gen();
        const rhs = k * (x + b) + e;
        return {
          q: `Resuelve: ${M(`${k}(${L(1, b)})${e < 0 ? '' : '+'}${e}=${rhs}`)}`, ans: sol(x),
          traps: [T(new Q(rhs - e - b, k), 'dist_inc', `El ${S(k)} multiplica también al ${S(b)}.`), T(new Q(rhs + e - k * b, k), 'transpos', `El ${S(e)} pasa con signo cambiado.`)],
          steps: [{ html: M(`${k}x${k * b < 0 ? '' : '+'}${k * b}${e < 0 ? '' : '+'}${e}=${rhs}`), note: `Distribuye el ${S(k)}` }, { html: M(`${k}x=${rhs - k * b - e}`), note: 'Pasa los números con signo cambiado' }, { html: M(`x=${fx(rhs - k * b - e, k)}`), note: `Divide entre ${S(k)}` }],
        };
      },
    },
    {
      id: 'ctx', w: 2, errs: ['modelo', 'transpos'], ctx: true,
      gen() {
        const k = pick([0, 1, 2]);
        if (k === 0) {
          const x = ri(5, 40), m = pick([2, 3]); const s = x + m * x;
          return { q: `Un número más su ${m === 2 ? 'doble' : 'triple'} es igual a ${s}. ¿Cuál es el número?`, ans: sol(x), traps: [T(new Q(s, m), 'modelo', `El número (x) más su ${m === 2 ? 'doble (2x)' : 'triple (3x)'} = ${m + 1}x.`)], steps: [{ html: M(`x+${m}x=${s}`) }, { html: M(`${m + 1}x=${s}`) }, { html: M(`x=${x}`) }] };
        }
        if (k === 1) {
          const tarifa = ri(3, 6), km = ri(2, 5) / 2 * 2, x = ri(4, 20); const total = tarifa + km * x;
          return { q: `Un taxi por app cobra ${soles(tarifa)} de base más ${soles(km)} por km. Pagaste ${soles(total)}. ¿Cuántos km recorriste?`, ans: sol(x), traps: [T(new Q(total + tarifa, km), 'transpos', 'La tarifa base se <b>resta</b> del total.'), T(new Q(total, km), 'modelo', 'No olvides la tarifa base.')], steps: [{ html: M(`${tarifa}+${km}x=${total}`) }, { html: M(`${km}x=${total - tarifa}`), note: `Resta ${tarifa} a ambos lados` }, { html: M(`x=${x}`) }] };
        }
        const e = ri(15, 30), x = ri(2, 15); const s = 2 * e + 3 * x;
        return { q: `Tienes ${x === 1 ? '' : ''}la edad x. Tu hermano tiene ${e} años. El doble de su edad más el triple de la tuya da ${s}. ¿Cuántos años tienes?`, ans: sol(x), traps: [T(new Q(s + 2 * e, 3), 'transpos', 'Al pasar el ' + 2 * e + ' cambia de signo.')], steps: [{ html: M(`2*${e}+3x=${s}`) }, { html: M(`3x=${s - 2 * e}`) }, { html: M(`x=${x}`) }] };
      },
    },
  ],
};

// ---------------- 17. Ecuaciones con fracciones ----------------
const ec_fracciones = {
  id: 'ec_fracciones', name: 'Ecuaciones con fracciones', icon: 'x/3', mode: 'lapiz', unit: 'PC1',
  lesson: () => `
    <p>Truco: <b>multiplica TODO por el denominador</b> (o el MCM) para eliminar las fracciones.</p>
    ${V.chain([{ html: M('x/3+2=5'), note: '' }, { html: M('3*(x/3)+3*2=3*5'), note: 'Multiplica cada término por 3' }, { html: M('x+6=15'), note: '' }, { html: M('x=9'), note: 'Resta 6' }])}
    <p class="mute">Lo que está <b>dividiendo</b> pasa <b>multiplicando</b> (y al revés).</p>`,
  variants: [
    {
      id: 'xa', w: 3, errs: ['despeje_div', 'ec_frac'],
      gen() {
        const a = ri(2, 9), x0 = nz(-8, 10) * a, b = nz(-9, 9); const c = x0 / a + b;
        return {
          q: `Resuelve: ${M(`x/${a}${b < 0 ? '' : '+'}${b}=${c}`)}`, ans: sol(x0),
          traps: [T(new Q(c - b, a), 'despeje_div', `El ${a} está <b>dividiendo</b> a x: pasa <b>multiplicando</b>.`, `x = ${M(`(${c}-${P(b)})/${a}`)} ✗`), T((c + b) * a, 'transpos', `El ${S(b)} pasa con signo cambiado.`)],
          steps: [{ html: M(`x/${a}=${c - b}`), note: `Pasa el ${S(b)} como ${S(-b)}` }, { html: M(`x=${c - b}*${a}`), note: `El ${a} que divide pasa multiplicando` }, { html: M(`x=${x0}`) }],
        };
      },
    },
    {
      id: 'dos', w: 2, errs: ['ec_frac'],
      gen() {
        const [a, b] = pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 6], [2, 4]]); const m = lcm(a, b); const x0 = m * ri(1, 6);
        const c = x0 / a + x0 / b;
        return {
          q: `Resuelve: ${M(`x/${a}+x/${b}=${c}`)}`, ans: sol(x0),
          traps: [T(new Q(c * (a + b)), 'ec_frac', 'No se suman denominadores: multiplica todo por el MCM.')],
          steps: [{ note: `MCM(${a}, ${b}) = ${m}. Multiplica todo por ${m}.` }, { html: M(`${m / a}x+${m / b}x=${c * m}`) }, { html: M(`${m / a + m / b}x=${c * m}`) }, { html: M(`x=${x0}`) }],
        };
      },
    },
    {
      id: 'binfrac', w: 2, errs: ['ec_frac', 'despeje_div'],
      gen() {
        const b = ri(2, 7), x0 = nz(-8, 12), a = nz(-9, 9); if ((x0 + a) % b !== 0) return this.gen();
        const c = (x0 + a) / b;
        return {
          q: `Resuelve: ${M(`(${L(1, a)})/${b}=${c}`)}`, ans: sol(x0),
          traps: [T(c * b + a, 'transpos', `El ${S(a)} pasa al otro lado como ${S(-a)}.`), T(new Q(c - a, b), 'despeje_div', `El ${b} que divide pasa multiplicando a todo el ${c}.`)],
          steps: [{ html: M(`${L(1, a)}=${c}*${b}`), note: `El ${b} pasa multiplicando` }, { html: M(`x=${c * b}${a < 0 ? '+' : '-'}${Math.abs(a)}`) }, { html: M(`x=${x0}`) }],
        };
      },
    },
  ],
};

// ---------------- 18. Modelamiento: costo, ingreso, utilidad ----------------
const modelamiento = {
  id: 'modelamiento', name: 'Costo, ingreso y utilidad', icon: 'S/', mode: 'lapiz', unit: 'PC1',
  lesson: () => `
    <p>Imagina que vendes <b>q</b> polos:</p>
    <p>• <b>Costo total</b>: ${M('C=CF+c*q')} (costo fijo + costo por polo)</p>
    <p>• <b>Ingreso</b>: ${M('I=p*q')} (precio × cantidad)</p>
    <p>• <b>Utilidad</b> (ganancia): ${M('U=I-C')}</p>
    <p>• <b>Punto de equilibrio</b>: cuando U = 0 (ni ganas ni pierdes).</p>`,
  variants: [
    {
      id: 'util', w: 3, errs: ['modelo'], ctx: true,
      gen() {
        const cf = ri(3, 12) * 100, c = ri(5, 20), p = c + ri(5, 25), q = ri(20, 120);
        const U = p * q - (cf + c * q);
        return {
          q: `Vendes polos a ${soles(p)} cada uno. Producir cada polo cuesta ${soles(c)} y tienes un costo fijo de ${soles(cf)} al mes. Si vendes <b>${q}</b> polos, ¿cuál es tu utilidad?`, ans: num(U), unit: 'S/',
          traps: [T(p * q - c * q, 'modelo', `Olvidaste el costo fijo de ${soles(cf)}.`), T(p * q - cf + c * q, 'menos_paren', 'Al restar el costo, se resta <b>todo</b>: −(CF + c·q).')],
          steps: [{ html: M(`I=${p}*${q}=${p * q}`), note: 'Ingreso' }, { html: M(`C=${cf}+${c}*${q}=${cf + c * q}`), note: 'Costo' }, { html: M(`U=${p * q}-${cf + c * q}=${U}`), note: 'Utilidad = Ingreso − Costo' }],
        };
      },
    },
    {
      id: 'equil', w: 3, errs: ['modelo', 'transpos'], ctx: true,
      gen() {
        const c = ri(5, 20), m = ri(4, 20), p = c + m, q = ri(10, 90); const cf = m * q;
        return {
          q: `Un emprendimiento de queques tiene costo fijo ${soles(cf)}, costo por queque ${soles(c)} y precio de venta ${soles(p)}. ¿Cuántos queques debe vender para el <b>punto de equilibrio</b> (U = 0)?`, ans: sol(q, 'q'),
          traps: [T(new Q(cf, p), 'modelo', 'En el equilibrio, Ingreso = Costo: p·q = CF + c·q. No olvides el costo por unidad.'), T(new Q(cf, p + c), 'transpos', `Al pasar ${c}q al otro lado cambia de signo: (${p} − ${c})q.`)],
          steps: [{ html: M(`${p}q=${cf}+${c}q`), note: 'Ingreso = Costo' }, { html: M(`${p}q-${c}q=${cf}`), note: `Pasa ${c}q restando` }, { html: M(`${m}q=${cf}`) }, { html: M(`q=${q}`) }],
        };
      },
    },
    {
      id: 'meta', w: 2, errs: ['modelo'], ctx: true,
      gen() {
        const c = ri(3, 12), m = ri(3, 10), p = c + m, cf = ri(2, 8) * 100, q = ri(20, 80); const U = m * q - cf;
        if (U <= 0) return this.gen();
        return {
          q: `Vendes jugos a ${soles(p)}; cada uno te cuesta ${soles(c)} y pagas ${soles(cf)} de alquiler. ¿Cuántos jugos debes vender para ganar ${soles(U)}?`, ans: sol(q, 'q'),
          traps: [T(new Q(U, m), 'modelo', 'También hay que cubrir el alquiler (costo fijo).'), T(new Q(U + cf, p), 'modelo', 'Cada jugo deja de ganancia precio − costo.')],
          steps: [{ html: M(`${p}q-(${cf}+${c}q)=${U}`) }, { html: M(`${m}q-${cf}=${U}`) }, { html: M(`${m}q=${U + cf}`) }, { html: M(`q=${q}`) }],
        };
      },
    },
  ],
};

// ---------------- 19. Regla de tres ----------------
const regla_tres = {
  id: 'regla_tres', name: 'Regla de tres', icon: '⇅', mode: 'mental', unit: 'base',
  lesson: () => `
    <p>Primero pregúntate: <b>si uno aumenta, ¿el otro aumenta o disminuye?</b></p>
    ${V.ruleOfThree('Obreros', 'Días', 8, 15, 16, '?', true)}
    <p>Más obreros → <b>menos</b> días. Es <b>inversa</b>: 8·15 = 16·x → x = 7,5 días.</p>
    ${V.ruleOfThree('Kg', 'Soles', 3, 12, 5, '?', false)}
    <p>Más kilos → <b>más</b> soles. Es <b>directa</b>: x = 5·12/3 = 20.</p>`,
  variants: [
    {
      id: 'directa', w: 2, errs: ['r3_inversa'], ctx: true,
      gen() {
        const u = ri(2, 6), p = ri(2, 9), n = ri(2, 12); if (n === u) return this.gen();
        const item = pick([['cuadernos', 'cuestan'], ['kg de arroz', 'cuestan'], ['pasajes', 'cuestan']]);
        return {
          q: `${u} ${item[0]} ${item[1]} ${soles(u * p)}. ¿Cuánto ${item[1]} ${n}?`, ans: num(n * p), unit: 'S/',
          traps: [T(new Q(u * u * p, n), 'r3_inversa', 'Más cosas → más dinero: es <b>directa</b>, se multiplica en cruz.')],
          steps: [{ html: V.ruleOfThree(item[0], 'Soles', u, u * p, n, '?', false) }, { note: `x = ${n}·${u * p} ÷ ${u} = <b>${n * p}</b>` }],
        };
      },
    },
    {
      id: 'inversa', w: 4, errs: ['r3_inversa'], ctx: true,
      gen() {
        const k = pick([0, 1, 2]);
        const a = ri(2, 12), b = ri(2, 20);
        const cs = []; for (let c = 2; c <= 16; c++) if (c !== a && (a * b * 2) % c === 0) cs.push(c);
        if (!cs.length) return this.gen();
        const c = pick(cs); const r = new Q(a * b, c);
        const [h1, h2, txt] = [
          ['Obreros', 'Días', `${a} obreros construyen un muro en ${b} días. ¿En cuántos días lo harían ${c} obreros (al mismo ritmo)?`],
          ['Velocidad (km/h)', 'Horas', `A ${a * 10} km/h un bus llega en ${b} horas. ¿En cuántas horas llegaría a ${c * 10} km/h?`],
          ['Amigos', 'Días', `La comida alcanza para ${a} amigos durante ${b} días. ¿Para cuántos días alcanza si son ${c} amigos?`],
        ][k];
        return {
          q: txt, ans: num(r, { dec: true }),
          traps: [T(new Q(c * b, a), 'r3_inversa', `Si ${c > a ? 'aumentan' : 'disminuyen'} ${h1.toLowerCase()}, los ${h2.toLowerCase()} <b>${c > a ? 'disminuyen' : 'aumentan'}</b>: es <b>inversa</b>. Se multiplica en línea recta.`, V.ruleOfThree(h1, h2, k === 1 ? a * 10 : a, b, k === 1 ? c * 10 : c, '?', false))],
          steps: [{ html: V.ruleOfThree(h1, h2, k === 1 ? a * 10 : a, b, k === 1 ? c * 10 : c, '?', true) }, { note: `${k === 1 ? a * 10 : a}·${b} = ${k === 1 ? c * 10 : c}·x` }, { note: `x = <b>${r.toDec() || r.toString()}</b>` }],
        };
      },
    },
    {
      id: 'cual', w: 2, errs: ['r3_inversa'], ctx: true,
      gen() {
        const items = [['Más obreros y el tiempo de una obra', 1], ['Más kilos de pollo y el precio a pagar', 0], ['Más velocidad y el tiempo de viaje', 1], ['Más horas trabajadas y el sueldo (pago por hora)', 0], ['Más grifos llenando un tanque y el tiempo', 1], ['Más invitados y la comida necesaria', 0], ['Más personas comiendo y los días que dura la comida', 1], ['Más metros de tela y su costo', 0]];
        const [t, inv] = pick(items);
        return { q: `${t}: ¿qué relación tienen?`, ans: choice(['Directa (ambos suben)', 'Inversa (uno sube, otro baja)'], inv), traps: [], steps: [{ note: inv ? 'Si uno aumenta, el otro <b>disminuye</b> → inversa.' : 'Si uno aumenta, el otro también → directa.' }], flash: true };
      },
    },
  ],
};

// ---------------- 20. Porcentajes ----------------
const porcentajes = {
  id: 'porcentajes', name: 'Porcentajes', icon: '%', mode: 'mental', unit: 'base',
  lesson: () => `
    <p><b>% significa "de cada 100"</b>.</p>
    <p><b>¿Qué % de 48 es 12?</b> → divide la parte entre el total: 12 ÷ 48 = 0,25 → <b>25%</b></p>
    ${V.pctBar(25, '12', '48')}
    <p class="mute">Error del diagnóstico: multiplicar 48·12. Cuando preguntan "qué %", es <b>parte ÷ total × 100</b>.</p>
    <p><b>Descuentos sucesivos</b> (20% y luego 10%) NO son 30%: el segundo se aplica sobre el precio ya rebajado. 100 → 80 → 72: total 28%.</p>`,
  variants: [
    {
      id: 'que', w: 4, errs: ['pct_que'], ctx: true,
      gen() {
        const tot = pick([20, 25, 40, 50, 60, 80, 120, 200, 48, 75, 150]); const pct = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]);
        const part = tot * pct / 100; if (!Number.isInteger(part)) return this.gen();
        return {
          q: pick([`¿Qué porcentaje de ${tot} es ${part}?`, `En un examen de ${tot} preguntas acertaste ${part}. ¿Qué porcentaje acertaste?`, `De ${soles(tot)} gastaste ${soles(part)}. ¿Qué porcentaje gastaste?`]),
          ans: num(pct, { pct: true }),
          traps: [T(tot * part, 'pct_que', 'Multiplicaste. Para saber <b>qué porcentaje</b> es, se <b>divide</b>: parte ÷ total × 100.', `${tot}·${part} = ${tot * part} ✗`), T(new Q(tot * 100, part), 'pct_que', 'Al revés: es <b>parte ÷ total</b>, no total ÷ parte.'), T(new Q(part, tot), 'pct_que', 'Falta multiplicar por 100.')],
          steps: [{ html: M(`${part}/${tot}`), note: 'Parte ÷ total' }, { note: `= ${new Q(part, tot).toDec()} → × 100 = <b>${pct}%</b>` }], viz: V.pctBar(pct, String(part), String(tot)),
        };
      },
    },
    {
      id: 'de', w: 2, errs: ['pct_que'], ctx: true,
      gen() {
        const n = pick([40, 60, 80, 120, 150, 200, 250, 300, 360, 500]), p = pick([10, 15, 20, 25, 30, 35, 40, 75]);
        const r = new Q(n * p, 100);
        return { q: `Calcula el ${p}% de ${n}.`, ans: num(r, { dec: true }), traps: [T(new Q(n, p), 'pct_que', `${p}% de ${n} es ${p}/100 × ${n}.`)], steps: [{ note: `10% de ${n} = ${new Q(n, 10).toDec()}` }, { note: `${p}% = ${M(`${p}/100*${n}`)} = <b>${r.toDec()}</b>` }], viz: V.pctBar(p, `${p}%`, String(n)) };
      },
    },
    {
      id: 'sucesivo', w: 3, errs: ['pct_suc'], ctx: true,
      gen() {
        const a = pick([10, 20, 30, 40, 50]), b = pick([10, 20, 25, 50]); const desc = chance(0.6);
        const f = desc ? (100 - a) * (100 - b) / 100 : (100 + a) * (100 + b) / 100;
        const r = desc ? 100 - f : f - 100;
        return {
          q: desc ? `Una tienda hace un descuento del ${a}% y luego otro del ${b}% sobre el nuevo precio. ¿A qué descuento único equivalen?` : `Un precio sube ${a}% y luego ${b}% más. ¿A qué aumento único equivale?`,
          ans: num(new Q(r * 100, 100), { pct: true, dec: true }),
          traps: [T(a + b, 'pct_suc', `No se suman: el segundo ${desc ? 'descuento' : 'aumento'} se aplica sobre el precio <b>ya cambiado</b>. Prueba con S/ 100.`)],
          steps: [{ note: `Empieza con S/ 100.` }, { note: `${desc ? '−' : '+'}${a}% → ${desc ? 100 - a : 100 + a}` }, { note: `${desc ? '−' : '+'}${b}% de ${desc ? 100 - a : 100 + a} → ${f}` }, { note: `Total: ${desc ? `100 − ${f}` : `${f} − 100`} = <b>${new Q(r * 100, 100).toDec()}%</b>` }],
        };
      },
    },
    {
      id: 'variacion', w: 2, errs: ['pct_var'], ctx: true,
      gen() {
        const a = pick([20, 40, 50, 80, 100, 200, 250, 400]); const p = pick([-50, -25, -20, -10, 10, 20, 25, 50, 75]);
        const b = a * (100 + p) / 100; if (!Number.isInteger(b)) return this.gen();
        return {
          q: `El pasaje subió de ${soles(a)} a ${soles(b)}. ¿Cuál fue la variación porcentual? (usa − si bajó)`.replace('subió', p < 0 ? 'cambió' : 'subió'),
          ans: num(p, { pct: true }),
          traps: [T(new Q((b - a) * 100, b), 'pct_var', 'Se divide entre el valor <b>inicial</b> (el de antes), no el final.'), T(b - a, 'pct_var', 'Esa es la variación en soles; falta dividir entre el inicial y × 100.'), T(-p, 'pct_var', 'Revisa el signo: subió (+) o bajó (−).')],
          steps: [{ html: M(`(${b}-${a})/${a}*100`), note: '(final − inicial) ÷ inicial × 100' }, { note: `= <b>${p}%</b>` }],
        };
      },
    },
    {
      id: 'inverso', w: 1, errs: ['pct_que'], ctx: true,
      gen() {
        const orig = ri(4, 30) * 10, p = pick([10, 20, 25, 50]); const pay = orig * (100 - p) / 100;
        return {
          q: `Con ${p}% de descuento pagaste ${soles(pay)}. ¿Cuál era el precio original?`, ans: num(orig), unit: 'S/',
          traps: [T(pay + pay * p / 100, 'pct_que', `El ${p}% se calcula sobre el precio <b>original</b>, no sobre lo que pagaste.`)],
          steps: [{ note: `Pagaste el ${100 - p}% del original.` }, { html: M(`${100 - p}/100*x=${pay}`) }, { note: `x = ${pay} ÷ ${(100 - p) / 100} = <b>${orig}</b>` }],
        };
      },
    },
  ],
};

// ---------------- 21. Sistemas 2×2 ----------------
const sistemas = {
  id: 'sistemas', name: 'Sistemas de ecuaciones 2×2', icon: '{ }', mode: 'lapiz', unit: 'PC1',
  lesson: () => `
    <p><b>Sustitución:</b> despeja una letra y reemplázala en la otra ecuación.</p>
    ${V.chain([{ html: `${M('x+y=10')} ; ${M('x-y=4')}` }, { html: M('x=10-y'), note: 'Despeja x de la 1.ª' }, { html: M('(10-y)-y=4'), note: 'Reemplaza en la 2.ª' }, { html: M('10-2y=4'), note: '' }, { html: M('y=3'), note: '' }, { html: M('x=7'), note: 'Vuelve a la 1.ª' }])}
    <p><b>Escribe la respuesta así:</b> x=7; y=3 (usa la tecla <b>;</b>).</p>`,
  variants: [
    {
      id: 'sumdif', w: 2, errs: ['sistema'],
      gen() {
        const x = nz(-6, 12), y = nz(-6, 10);
        return { q: `Resuelve: ${M(`x+y=${x + y}`)} ; ${M(`x-y=${x - y}`)}`, ans: { type: 'sys', v: { x: new Q(x), y: new Q(y) } }, traps: [], steps: [{ html: M(`2x=${2 * x}`), note: 'Suma ambas ecuaciones: la y se elimina' }, { html: M(`x=${x}`) }, { html: M(`y=${x + y}-${P(x)}=${y}`) }] };
      },
    },
    {
      id: 'gen', w: 3, errs: ['sistema', 'transpos'],
      gen() {
        const x = nz(-5, 8), y = nz(-5, 8), a = ri(1, 4), b = nz(-3, 3), c = ri(1, 3), d = nz(-4, 4);
        if (a * d - b * c === 0) return this.gen();
        const e1 = `${poly([a, 0]).replace(/0$/, '')}`;
        void e1;
        const t = (p, q) => `${p === 1 ? '' : p === -1 ? '-' : p}x${q < 0 ? '-' : '+'}${Math.abs(q) === 1 ? '' : Math.abs(q)}y`;
        return {
          q: `Resuelve: ${M(`${t(a, b)}=${a * x + b * y}`)} ; ${M(`${t(c, d)}=${c * x + d * y}`)}`, ans: { type: 'sys', v: { x: new Q(x), y: new Q(y) } }, traps: [],
          steps: [{ note: 'Despeja una variable (la que tenga coeficiente 1 si hay) y sustitúyela, o multiplica una ecuación para eliminar.' }, { note: `Solución: x = ${S(x)}, y = ${S(y)}. Comprueba en ambas.` }],
        };
      },
    },
    {
      id: 'ctx', w: 3, errs: ['sistema', 'modelo'], ctx: true,
      gen() {
        const pa = ri(8, 20), pn = ri(3, pa - 2), a = ri(2, 8), n = ri(2, 8);
        return {
          q: `En el cine, una entrada de adulto cuesta ${soles(pa)} y la de niño ${soles(pn)}. Una familia compró ${a + n} entradas y pagó ${soles(pa * a + pn * n)}. ¿Cuántas de adulto (x) y de niño (y)? Escribe: x=…; y=…`,
          ans: { type: 'sys', v: { x: new Q(a), y: new Q(n) } }, traps: [],
          steps: [{ html: `${M(`x+y=${a + n}`)} ; ${M(`${pa}x+${pn}y=${pa * a + pn * n}`)}`, note: 'Plantea: cantidad y dinero' }, { html: M(`x=${a + n}-y`), note: 'Despeja x' }, { note: `Reemplaza: ${pa}(${a + n} − y) + ${pn}y = ${pa * a + pn * n}` }, { note: `y = ${n}, x = ${a}` }],
        };
      },
    },
  ],
};

// ---------------- 22. Ecuaciones cuadráticas ----------------
const cuadraticas = {
  id: 'cuadraticas', name: 'Ecuaciones cuadráticas', icon: 'x²=', mode: 'lapiz', unit: 'PAR',
  lesson: () => `
    <p>Si ${M('(x-2)(x-3)=0')}, entonces <b>uno de los dos paréntesis es 0</b>: x = 2 o x = 3.</p>
    <p>Pasos: 1) todo a un lado (= 0), 2) factoriza (aspa), 3) iguala cada factor a 0.</p>
    ${V.chain([{ html: M('x^2-5x+6=0') }, { html: M('(x-2)(x-3)=0'), note: 'Aspa: −2·−3 = 6, −2−3 = −5' }, { html: 'x − 2 = 0 → x = 2 ; x − 3 = 0 → x = 3' }])}
    <p>Fórmula general: ${M('x=(-b±sqrt(b^2-4ac))/(2a)')}</p>
    <p><b>Escribe las dos soluciones separadas con ;</b> → 2; 3</p>`.replace('±', '+'),
  variants: [
    {
      id: 'fact', w: 4, errs: ['cuad', 'aspa'],
      gen() {
        const r1 = nz(-9, 9), r2 = nz(-9, 9);
        const b = -(r1 + r2), c = r1 * r2;
        return {
          q: `Resuelve: ${M(`${poly([1, b, c])}=0`)}`, ans: { type: 'set', v: [...new Set([r1, r2])].map((v) => new Q(v)) },
          traps: [T([-r1, -r2], 'cuad', `Los números del aspa son ${S(-r1)} y ${S(-r2)}, pero la solución hace <b>cero</b> cada paréntesis: x ${-r1 < 0 ? '−' : '+'} ${Math.abs(r1)} = 0 → x = ${S(r1)}.`)],
          steps: [{ html: M(`(${L(1, -r1)})(${L(1, -r2)})=0`), note: 'Factoriza con aspa' }, { note: `x = ${S(r1)} ; x = ${S(r2)}` }],
        };
      },
    },
    {
      id: 'pura', w: 2, errs: ['cuad'],
      gen() {
        const r = ri(1, 12), a = pick([1, 1, 2, 3]);
        return {
          q: `Resuelve: ${M(`${a === 1 ? '' : a}x^2=${a * r * r}`)}`, ans: { type: 'set', v: [new Q(r), new Q(-r)] },
          traps: [T([r], 'cuad', `También vale x = ${S(-r)}: (${S(-r)})² = ${r * r}. ¡Hay <b>dos</b> soluciones!`)],
          steps: [{ html: M(`x^2=${r * r}`) }, { note: `x = ${r} ; x = −${r} (los dos al cuadrado dan ${r * r})` }],
        };
      },
    },
    {
      id: 'ctx', w: 1, errs: ['cuad', 'modelo'], ctx: true,
      gen() {
        const w = ri(3, 12), d = ri(2, 6); const l = w + d; const A = w * l;
        return {
          q: `Un terreno rectangular tiene ${d} m más de largo que de ancho y su área es ${A} m². ¿Cuánto mide el <b>ancho</b>?`, ans: sol(w, 'x'),
          traps: [T(l, 'modelo', 'Ese es el largo; piden el ancho.')],
          steps: [{ html: M(`x(x+${d})=${A}`) }, { html: M(`x^2+${d}x-${A}=0`) }, { html: M(`(x-${w})(x+${l})=0`) }, { note: `x = ${w} (el ancho no puede ser negativo)` }],
        };
      },
    },
  ],
};

export const TOPICS_B = [poli_suma, poli_mult, prod_notables, factor_comun, aspa_simple, frac_suma, frac_mult, frac_comb, ec_lineales, ec_fracciones, modelamiento, regla_tres, porcentajes, sistemas, cuadraticas];
void fx; void chance;
