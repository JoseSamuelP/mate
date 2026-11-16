// =============================================================
// topics_a.js — Signos, jerarquía, potencias, valor numérico
// =============================================================
import { ri, nz, pick, chance, P, S, soles, poly, num, expr, T, Q, M, qHTML } from './util.js';
import { parse, evalSteps, evalQ, toHTML } from './expr.js';
import * as V from './viz.js';

// Cadena de pasos automática para una expresión numérica
export function autoSteps(spec, extraNotes = {}) {
  const st = evalSteps(parse(spec));
  return st.filter((s) => !s.final).map((s) => ({
    html: `${s.html}`,
    note: `${s.piece} = <b>${s.res}</b> ${noteFor(s) || ''}`,
  })).concat([{ html: st[st.length - 1].html, note: 'Resultado final' }]);
  function noteFor(s) {
    if (extraNotes[s.op]) return extraNotes[s.op];
    if (s.op === 'mul' || s.op === 'div' || s.op === 'frac') {
      const [a, b] = [s.node.a.v, s.node.b.v];
      if (a && b && (a.n < 0 || b.n < 0)) return `<span class="mute">(${(a.n < 0) === (b.n < 0) ? 'signos iguales → +' : 'signos distintos → −'})</span>`;
    }
    if (s.op === 'sub' && s.node.b.v && s.node.b.v.n < 0) return '<span class="mute">(restar un negativo = sumar)</span>';
    if (s.op === 'pow') return '<span class="mute">(potencia primero)</span>';
    return '';
  }
}

// ---------------- 1. Suma y resta con signos ----------------
const signos_suma = {
  id: 'signos_suma', name: 'Suma y resta con signos', icon: '±', mode: 'mental', unit: 'base',
  lesson: () => `
    <p>Piensa en <b class="g">ganancias (+)</b> y <b class="r">deudas (−)</b>.</p>
    ${V.numberLine({ start: -3, moves: [5], title: 'Debes 3 (−3) y ganas 5: avanzas 5 a la derecha → te quedan 2' })}
    <p><b>Restar un negativo</b> es <b>quitar una deuda</b>: ¡es como ganar!</p>
    <p class="big">${M('3-(-5)')} = ${M('3+5')} = <b>8</b></p>
    <p class="mute">Ojo: el paréntesis aquí NO significa multiplicar. Solo "protege" el signo del −5.</p>`,
  variants: [
    {
      id: 'mix', w: 3, errs: ['signo_suma'],
      gen() {
        const a = nz(-15, 15), b = nz(-15, 15); const op = pick(['+', '-']);
        const spec = op === '+' ? `${a}+${P(b)}` : `${a}-${b < 0 ? P(b) : b}`;
        const plain = op === '+' && b < 0 ? `${a}-${-b}` : op === '-' && b > 0 ? `${a}-${b}` : spec;
        const show = chance(0.5) ? plain : spec;
        const r = op === '+' ? a + b : a - b;
        const move = op === '+' ? b : -b;
        return {
          q: `Calcula: ${M(show)}`, ans: num(r),
          traps: [
            T(-r, 'signo_suma', 'El número está bien, pero el <b>signo</b> no. Mira hacia dónde terminas en la recta.'),
            T(Math.abs(a) + Math.abs(b) === Math.abs(r) ? null : (Math.sign(r || 1)) * (Math.abs(a) + Math.abs(b)), 'signo_suma', 'Sumaste las cantidades, pero tenían <b>signos distintos</b>: se restan y queda el signo del mayor.'),
          ],
          steps: [
            { note: `Empiezas en <b>${S(a)}</b> (${a < 0 ? `debes ${-a}` : `tienes ${a}`}).` },
            { note: `${move >= 0 ? `Sumas ${move}: avanzas <b class="g">${move} a la derecha</b>` : `Restas ${-move}: retrocedes <b class="r">${-move} a la izquierda</b>`}.` },
            { note: `Terminas en <b>${S(r)}</b>.` },
          ],
          viz: V.numberLine({ start: a, moves: [move] }),
        };
      },
    },
    {
      id: 'restaneg', w: 3, errs: ['resta_neg', 'paren_mult'],
      gen() {
        const a = ri(-9, 12), b = ri(2, 9);
        const r = a + b;
        return {
          q: `Calcula: ${M(`${a}-(-${b})`)}`, ans: num(r),
          traps: [
            T(a - b, 'resta_neg', `Restaste ${b}, pero estás restando un <b>negativo</b>: quitar una deuda es <b>sumar</b>.`, `${M(`${a}-(-${b})`)} → ${M(`${a}-${b}`)} ✗`),
            T(a * b, 'paren_mult', 'El paréntesis <b>no es multiplicar</b> aquí: solo encierra al número negativo.', `${M(`${a}-(-${b})`)} → ${M(`${a}·${b}`)} ✗`),
            T(-a * b, 'paren_mult', 'El paréntesis <b>no es multiplicar</b>: entre los números hay un signo de resta.'),
          ],
          steps: [
            { html: M(`${a}-(-${b})`), note: 'Dos signos menos juntos: <b>− (−) = +</b>. Quitar una deuda = ganar.' },
            { html: M(`${a}+${b}`), note: `Ahora suma: <b>${S(r)}</b>` },
          ],
          viz: V.numberLine({ start: a, moves: [b], title: `Te quitan una deuda de ${b} → subes ${b}` }),
        };
      },
    },
    {
      id: 'cadena', w: 2, errs: ['paren_mult', 'signo_suma'], mode: 'lapiz',
      gen() {
        const a = ri(-6, 9), b = ri(2, 9), c = ri(2, 9), d = nz(-8, 8);
        const spec = `${a}-(-${b})+(-${c})${d < 0 ? `-${-d}` : `+${d}`}`;
        const r = a + b - c + d;
        return {
          q: `Calcula: ${M(spec)}`, ans: num(r),
          traps: [
            T(a * b - c + d, 'paren_mult', `Multiplicaste ${S(a)}·${b}. Pero entre ellos hay un <b>−</b>: es una resta, no una multiplicación.`, `${M(`${a}-(-${b})`)} → ${M(`${a}·${b}`)} ✗`),
            T(a - b - c + d, 'resta_neg', 'Al restar un negativo (−(−) ) debes <b>sumar</b>.'),
            T(a + b + c + d, 'signo_suma', `Sumar un negativo, ${M(`+(-${c})`)}, es <b>restar</b>.`),
          ],
          steps: [
            { html: M(spec), note: 'Primero limpia los signos dobles: <b>−(−) = +</b> y <b>+(−) = −</b>.' },
            { html: M(`${a}+${b}-${c}${d < 0 ? `-${-d}` : `+${d}`}`), note: 'Ahora suma y resta de izquierda a derecha.' },
            { note: `Resultado: <b>${S(r)}</b>` },
          ],
          viz: V.numberLine({ start: a, moves: [b, -c, d] }),
        };
      },
    },
    {
      id: 'ctx', w: 2, errs: ['signo_suma'], ctx: true,
      gen() {
        const k = pick([0, 1, 2]);
        if (k === 0) {
          const t0 = ri(-8, 6), dn = ri(3, 12), up = ri(1, 9);
          const r = t0 - dn + up;
          return {
            q: `En Puno la temperatura a las 6 p. m. era de <b>${S(t0)} °C</b>. En la noche bajó <b>${dn} °C</b> y al amanecer subió <b>${up} °C</b>. ¿Qué temperatura hay al amanecer?`,
            ans: num(r), unit: '°C',
            traps: [T(t0 + dn - up, 'signo_suma', '"Bajó" significa <b>restar</b> y "subió" significa <b>sumar</b>.')],
            steps: [{ html: M(`${t0}-${dn}+${up}`), note: 'Bajar = restar, subir = sumar.' }, { note: `= <b>${S(r)} °C</b>` }],
            viz: V.numberLine({ start: t0, moves: [-dn, up] }),
          };
        }
        const have = ri(5, 40), spend = ri(20, 70), get = ri(5, 30);
        const r = have - spend + get;
        return {
          q: `Tienes ${soles(have)} en tu Yape. Pagas una compra de ${soles(spend)} (te quedas en negativo con la tarjeta) y luego te depositan ${soles(get)}. ¿Cuál es tu saldo? (negativo = deuda)`,
          ans: num(r), unit: 'S/',
          traps: [T(have + spend - get, 'signo_suma', 'Pagar es <b>restar</b>; recibir dinero es <b>sumar</b>.'), T(-r, 'signo_suma', 'Revisa el signo: ¿te quedó dinero o deuda?')],
          steps: [{ html: M(`${have}-${spend}+${get}`), note: 'Pagar = restar; depósito = sumar.' }, { note: `= <b>${S(r)}</b>` }],
          viz: V.numberLine({ start: have, moves: [-spend, get] }),
        };
      },
    },
  ],
};

// ---------------- 2. Multiplicación y división de signos ----------------
const signos_mult = {
  id: 'signos_mult', name: 'Multiplicar y dividir con signos', icon: '×', mode: 'mental', unit: 'base',
  lesson: () => `
    <p>¿Por qué <b>menos por menos es más</b>? Piensa así:</p>
    <p>Te <b class="r">quitan (−)</b> 4 <b class="r">deudas (−)</b> de S/ 6 cada una → ¡ahora tienes S/ 24 más!</p>
    <p class="big">${M('(-4)(-6)')} = <b class="g">+24</b></p>
    ${V.signTable()}
    <p class="mute">La regla vale SIEMPRE que multiplicas o divides, no solo en la distributiva.</p>`,
  variants: [
    {
      id: 'mult', w: 3, errs: ['signo_mult'],
      gen() {
        const a = nz(-12, 12), b = nz(-12, 12);
        const spec = chance(0.5) ? `(${a})(${b})` : `${P(a)}*${P(b)}`;
        return {
          q: `Calcula: ${M(spec)}`, ans: num(a * b),
          traps: [T(-a * b, 'signo_mult', (a < 0) === (b < 0) ? '<b>Signos iguales → resultado positivo.</b> Menos por menos es más.' : '<b>Signos distintos → resultado negativo.</b>', `${V.signRule(a, b)}`), T(a + b, 'signo_mult', 'Sumaste los números. Aquí se <b>multiplican</b> (dos paréntesis juntos = multiplicación).')],
          steps: [{ note: 'Primero el signo:' + V.signRule(a, b) }, { note: `Luego los números: ${Math.abs(a)}·${Math.abs(b)} = ${Math.abs(a * b)}` }, { note: `Resultado: <b>${S(a * b)}</b>` }],
        };
      },
    },
    {
      id: 'div', w: 2, errs: ['signo_mult'],
      gen() {
        const b = nz(-9, 9), r = nz(-12, 12); const a = b * r;
        return {
          q: `Calcula: ${M(`${P(a)}:${P(b)}`)}`, ans: num(r),
          traps: [T(-r, 'signo_mult', 'En la división, la regla de signos es <b>igual</b> que en la multiplicación.', V.signRule(a, b, '÷'))],
          steps: [{ note: 'Signo:' + V.signRule(a, b, '÷') }, { note: `${Math.abs(a)} ÷ ${Math.abs(b)} = ${Math.abs(r)} → <b>${S(r)}</b>` }],
        };
      },
    },
    {
      id: 'tres', w: 2, errs: ['signo_mult'],
      gen() {
        const f = [nz(-6, 6), nz(-5, 5), nz(-4, 4)];
        const r = f[0] * f[1] * f[2]; const negs = f.filter((x) => x < 0).length;
        return {
          q: `Calcula: ${M(f.map((x) => `(${x})`).join(''))}`, ans: num(r),
          traps: [T(-r, 'signo_mult', `Cuenta los negativos: hay <b>${negs}</b>. ${negs % 2 === 0 ? 'Cantidad par → +' : 'Cantidad impar → −'}`)],
          steps: [{ note: `Cuenta los signos negativos: <b>${negs}</b> → ${negs % 2 === 0 ? 'par → resultado <b class="g">+</b>' : 'impar → resultado <b class="r">−</b>'}` }, { note: `Números: ${f.map(Math.abs).join('·')} = ${Math.abs(r)}` }, { note: `Resultado: <b>${S(r)}</b>` }],
        };
      },
    },
    {
      id: 'ctx', w: 1, errs: ['signo_mult'], ctx: true,
      gen() {
        const n = ri(3, 8), d = ri(5, 30);
        return {
          q: `Tenías ${n} deudas de ${soles(d)} cada una (cada deuda es ${S(-d)}). Un familiar te <b>quita (−)</b> esas ${n} deudas. ¿Cuánto cambia tu dinero? Calcula ${M(`(-${n})(-${d})`)}.`,
          ans: num(n * d),
          traps: [T(-n * d, 'signo_mult', 'Quitar (−) deudas (−) te <b>beneficia</b>: el resultado es positivo.')],
          steps: [{ note: 'Quitar deudas = ganar.' + V.signRule(-n, -d) }, { note: `${n}·${d} = <b>${n * d}</b>` }],
        };
      },
    },
  ],
};

// ---------------- 3. Jerarquía de operaciones ----------------
function leftToRight(nums, ops) {
  let acc = nums[0];
  ops.forEach((o, i) => { const b = nums[i + 1]; acc = o === '+' ? acc + b : o === '-' ? acc - b : o === '*' ? acc * b : acc / b; });
  return acc;
}
const jerarquia = {
  id: 'jerarquia', name: 'Jerarquía de operaciones', icon: '①②', mode: 'lapiz', unit: 'base',
  lesson: () => `
    <p>Las operaciones tienen un <b>orden</b>, como cuando te vistes: medias antes que zapatos.</p>
    <ol class="order"><li><b>( )</b> Paréntesis</li><li><b>x²</b> Potencias y raíces</li><li><b>× ÷</b> Multiplicar y dividir (de izq. a der.)</li><li><b>+ −</b> Sumar y restar (de izq. a der.)</li></ol>
    ${V.chain(autoSteps('-2*3-4*(-5)'))}
    <p class="mute">Error típico: ir de izquierda a derecha sin respetar el orden.</p>`,
  variants: [
    {
      id: 'dosprod', w: 3, errs: ['jerarquia', 'signo_mult'],
      gen() {
        const a = nz(-7, 7), b = ri(2, 7), c = ri(2, 7), d = nz(-7, 7);
        const spec = `${a}*${b}-${c}*${P(d)}`;
        const r = a * b - c * d;
        return {
          q: `Calcula: ${M(spec)}`, ans: num(r),
          traps: [
            T(leftToRight([a, b, c, d], ['*', '-', '*']), 'jerarquia', 'Operaste de izquierda a derecha. Primero se hacen <b>las dos multiplicaciones</b>, después la resta.', `(${S(a)}·${b} − ${c})·${S(d)} ✗`),
            T(a * b + c * d, 'signo_mult', `Ojo con ${M(`-${c}*${P(d)}`)}: ${d < 0 ? 'menos por menos es <b>más</b>' : 'revisa el signo'}.`),
            T(a * b - c * -d, 'signo_mult', 'Revisa el signo del segundo producto.'),
          ],
          steps: autoSteps(spec), viz: '',
        };
      },
    },
    {
      id: 'sumprod', w: 3, errs: ['jerarquia'], mode: 'mental',
      gen() {
        const a = ri(-9, 15), b = ri(2, 9), c = nz(-6, 9);
        const op = pick(['+', '-']);
        const spec = `${a}${op}${b}*${P(c)}`;
        const r = op === '+' ? a + b * c : a - b * c;
        return {
          q: `Calcula: ${M(spec)}`, ans: num(r),
          traps: [T(leftToRight([a, b, c], [op, '*']), 'jerarquia', `Primero se multiplica ${b}·${S(c)}, y <b>después</b> se ${op === '+' ? 'suma' : 'resta'}.`, `(${S(a)} ${op === '+' ? '+' : '−'} ${b})·${S(c)} ✗`)],
          steps: autoSteps(spec),
        };
      },
    },
    {
      id: 'parpot', w: 2, errs: ['jerarquia', 'neg_base'],
      gen() {
        const a = ri(2, 6), b = ri(1, 9), c = ri(1, 9), d = ri(2, 5), e = pick([2, 2, 3]);
        const base = b - c;
        const spec = `${a}*(${b}-${c})^${e}-${d}`;
        const r = a * base ** e - d;
        return {
          q: `Calcula: ${M(spec)}`, ans: num(r),
          traps: [
            T((a * base) ** e - d, 'jerarquia', 'Multiplicaste antes de elevar. La <b>potencia va antes</b> que la multiplicación.'),
            T(a * base * e - d, 'pot_base', `Elevar a ${e} no es multiplicar por ${e}: es multiplicar la base ${e} veces.`),
          ],
          steps: autoSteps(spec),
        };
      },
    },
    {
      id: 'div', w: 2, errs: ['jerarquia'],
      gen() {
        const b = ri(2, 6), q = ri(2, 6), a = b * q, c = ri(1, 9), d = ri(2, 4);
        const spec = `${c}+${a}:${b}*${d}`;
        const r = c + q * d;
        return {
          q: `Calcula: ${M(spec)}`, ans: num(r),
          traps: [T(new Q(c * b * d + a, b * d), 'jerarquia', 'Multiplicación y división tienen el <b>mismo nivel</b>: se hacen de <b>izquierda a derecha</b>.'), T(new Q((c + a) * d, b), 'jerarquia', 'La suma va al final.')],
          steps: autoSteps(spec),
        };
      },
    },
  ],
};

// ---------------- 4. Potencias: significado ----------------
const pot_significado = {
  id: 'pot_significado', name: 'Potencias: qué significan', icon: 'xⁿ', mode: 'mental', unit: 'C1',
  lesson: () => `
    <p>Una potencia es una <b>multiplicación repetida</b>:</p>
    ${V.expandPow('2', 5, 32)}
    <p>${M('2^5')} NO es 2·5. Es el 2 multiplicado <b>5 veces</b>.</p>
    <p><b>El paréntesis decide quién se eleva:</b></p>
    <p class="big">${M('(-3)^2')} = (−3)·(−3) = <b class="g">9</b></p>
    <p class="big">${M('-3^2')} = −(3·3) = <b class="r">−9</b></p>
    <p><b>Exponente 0:</b> ${M('5^0')} = 1. ¿Por qué? ${M('5^3/5^3')} = 1 y también = ${M('5^(3-3)')} = ${M('5^0')}.</p>
    <p><b>Exponente negativo:</b> le da la vuelta: ${M('2^(-3)')} = ${M('1/2^3')} = ${M('1/8')}</p>`,
  variants: [
    {
      id: 'basico', w: 2, errs: ['pot_base'],
      gen() {
        const b = pick([2, 3, 4, 5, 10, 2, 3]); const n = b === 2 ? ri(3, 6) : b === 10 ? ri(2, 5) : ri(2, 4);
        const r = b ** n;
        return {
          q: `Calcula: ${M(`${b}^${n}`)}`, ans: num(r),
          traps: [T(b * n, 'pot_base', `${M(`${b}^${n}`)} no es ${b}·${n}. Es ${b} multiplicado <b>${n} veces</b>.`, `${b}·${n} = ${b * n} ✗`), T(n ** b, 'pot_base', 'Cambiaste base y exponente.')],
          steps: [{ html: V.expandPow(b, n), note: `El ${b} se repite ${n} veces.` }, { note: `= <b>${r}</b>` }],
        };
      },
    },
    {
      id: 'negbase', w: 4, errs: ['neg_base'],
      gen() {
        const a = ri(2, 7), n = pick([2, 2, 3, 4]); const withPar = chance(0.5);
        const spec = withPar ? `(-${a})^${n}` : `-${a}^${n}`;
        const r = withPar ? (-a) ** n : -(a ** n);
        return {
          q: `Calcula: ${M(spec)}`, ans: num(r),
          traps: [T(-r, 'neg_base', withPar ? `El paréntesis eleva <b>también el signo</b>: (−${a}) se multiplica ${n} veces. ${n % 2 === 0 ? 'Par → positivo.' : 'Impar → negativo.'}` : `Sin paréntesis, el exponente solo afecta al <b>${a}</b>, no al signo: −(${a}${'·' + a}${n > 2 ? '…' : ''}).`), T(withPar ? -a * n : -a * n, 'pot_base', 'La potencia no es multiplicar base × exponente.')],
          steps: [{ html: withPar ? V.expandPow(`(−${a})`, n) : `−( ${V.expandPow(a, n)} )`, note: withPar ? 'Con paréntesis, el negativo se multiplica también.' : 'Sin paréntesis, el "−" espera afuera.' }, { note: `= <b>${S(r)}</b>` }],
        };
      },
    },
    {
      id: 'cero', w: 2, errs: ['exp_cero'],
      gen() {
        const a = ri(2, 99); const k = pick([0, 1, 2, 3]);
        const spec = [`${a}^0`, `(-${a})^0`, `-${a}^0`, `${ri(2, 9)}*${a}^0`][k];
        const r = evalQ(parse(spec));
        return {
          q: `Calcula: ${M(spec)}`, ans: num(r),
          traps: [T(0, 'exp_cero', 'Todo número (distinto de 0) elevado a <b>0 es 1</b>, no 0.'), T(a, 'exp_cero', 'Elevar a 0 da <b>1</b>, no deja el número igual.'), T(r.neg(), 'neg_base', 'Mira si el signo está dentro o fuera del paréntesis.')],
          steps: [{ note: `${M(`${a}^0`)} = 1 porque ${M(`${a}^3/${a}^3`)} = 1 (algo dividido entre sí mismo).` }, { html: M(spec), note: `= <b>${S(r.toString())}</b>` }],
        };
      },
    },
    {
      id: 'negexp', w: 3, errs: ['exp_neg'],
      gen() {
        const a = pick([2, 3, 4, 5, 10]); const n = a <= 3 ? ri(1, 4) : ri(1, 2);
        const r = new Q(1, a ** n);
        return {
          q: `Calcula: ${M(`${a}^(-${n})`)} <span class="mute">(como fracción)</span>`, ans: num(r),
          traps: [T(-(a ** n), 'exp_neg', 'El exponente negativo <b>no vuelve negativo</b> al número: le da la vuelta (inverso).'), T(-a * n, 'exp_neg', 'El exponente negativo significa <b>1 entre</b> la potencia.'), T(a ** n, 'exp_neg', 'Falta "darle la vuelta": es 1 entre esa potencia.')],
          steps: [{ html: `${M(`${a}^(-${n})`)} = ${M(`1/${a}^${n}`)}`, note: 'El signo menos del exponente manda la potencia <b>abajo</b>.' }, { note: `= ${qHTML(r)}` }],
        };
      },
    },
    {
      id: 'fracpot', w: 1, errs: ['pot_base'],
      gen() {
        const a = ri(1, 5), b = ri(2, 6); const n = pick([2, 3]);
        if (a === b) return this.gen();
        const r = new Q(a ** n, b ** n);
        return {
          q: `Calcula: ${M(`(${a}/${b})^${n}`)}`, ans: num(r),
          traps: [T(new Q(a ** n, b), 'pot_base', 'Se eleva <b>el numerador y el denominador</b>.')],
          steps: [{ html: `${M(`${a}^${n}/${b}^${n}`)}`, note: 'Arriba y abajo se elevan.' }, { note: `= ${qHTML(r)}` }],
        };
      },
    },
  ],
};

// ---------------- 5. Leyes de exponentes (producto y cociente) ----------------
const pot_leyes = {
  id: 'pot_leyes', name: 'Producto y cociente de potencias', icon: 'xᵃ·xᵇ', mode: 'mental', unit: 'C1',
  lesson: () => `
    <p><b>Multiplicar</b> potencias de igual base → se <b>suman</b> exponentes. Cuenta los factores:</p>
    <div class="pblocks"><div class="prow"><span class="pgrp" style="--h:200"><i>x</i><b>·</b><i>x</i><b>·</b><i>x</i></span><b class="pdot">·</b><span class="pgrp" style="--h:30"><i>x</i><b>·</b><i>x</i><b>·</b><i>x</i><b>·</b><i>x</i></span></div><div class="pcount">${M('x^3*x^4')} = 3 + 4 = <b>7</b> factores → ${M('x^7')}</div></div>
    <p><b>Dividir</b> → se <b>restan</b> exponentes (se cancelan factores):</p>
    <p class="big">${M('x^5/x^2')} = ${M('(x*x*x*x*x)/(x*x)')} = ${M('x^3')}</p>`,
  variants: [
    {
      id: 'prod', w: 3, errs: ['prod_pot'],
      gen() {
        const v = pick(['x', 'a', 'm', 'y']); const a = ri(2, 7), b = ri(2, 7);
        return {
          q: `Simplifica: ${M(`${v}^${a}*${v}^${b}`)}`, ans: expr(`${v}^${a + b}`, { form: ['simplePow'] }),
          traps: [T(`${v}^${a * b}`, 'prod_pot', 'Multiplicaste los exponentes. Al <b>multiplicar potencias</b> de igual base se <b>suman</b>.', `${M(`${v}^${a}*${v}^${b}`)} → ${M(`${v}^${a * b}`)} ✗`)],
          steps: [{ html: V.expandPow(v, a) + V.expandPow(v, b), note: `${a} factores + ${b} factores` }, { note: `= ${M(`${v}^${a + b}`)}` }],
        };
      },
    },
    {
      id: 'coef', w: 2, errs: ['prod_pot'], mode: 'lapiz',
      gen() {
        const c1 = ri(2, 6), c2 = nz(-5, 6), a = ri(1, 5), b = ri(2, 6);
        const spec = `${c1}x^${a}*${P(c2)}x^${b}`.replace('x^1*', 'x*');
        return {
          q: `Simplifica: ${M(`(${c1}x^${a})(${c2}x^${b})`.replace('x^1)', 'x)'))}`, ans: expr(`${c1 * c2}x^${a + b}`, { form: ['simplePow'] }),
          traps: [T(`${c1 + c2}x^${a + b}`, 'prod_pot', 'Los <b>coeficientes se multiplican</b> (no se suman); los exponentes se suman.'), T(`${c1 * c2}x^${a * b}`, 'prod_pot', 'Los exponentes se <b>suman</b> al multiplicar.')],
          steps: [{ note: `Números: ${c1}·${S(c2)} = ${S(c1 * c2)}` }, { note: `Letras: ${M(`x^${a}*x^${b}`)} = ${M(`x^${a + b}`)}` }, { note: `Resultado: ${M(`${c1 * c2}x^${a + b}`)}` }],
          _spec: spec,
        };
      },
    },
    {
      id: 'coc', w: 3, errs: ['div_pot'],
      gen() {
        const v = pick(['x', 'a', 'y']); const b = ri(2, 5), a = b + ri(1, 6);
        return {
          q: `Simplifica: ${M(`${v}^${a}/${v}^${b}`)}`, ans: expr(`${v}^${a - b}`, { form: ['simplePow'] }),
          traps: [T(`${v}^${a + b}`, 'div_pot', 'Al <b>dividir</b> potencias de igual base, los exponentes se <b>restan</b>.'), T(a % b === 0 ? `${v}^${a / b}` : null, 'div_pot', 'Los exponentes no se dividen: se <b>restan</b>.')],
          steps: [{ note: `Arriba hay ${a} factores ${v}, abajo ${b}. Se cancelan ${b}.` }, { note: `Quedan ${a} − ${b} = ${a - b} → ${M(`${v}^${a - b}`)}` }],
        };
      },
    },
    {
      id: 'num', w: 2, errs: ['prod_pot', 'div_pot'],
      gen() {
        const b = pick([2, 3, 2, 5]); const x = ri(2, 6), y = ri(2, 6); const z = x + y - ri(1, b === 2 ? 4 : 2);
        const e = x + y - z;
        return {
          q: `Calcula: ${M(`(${b}^${x}*${b}^${y})/${b}^${z}`)}`, ans: num(b ** e),
          traps: [T(x * y - z <= 20 ? b ** (x * y - z) : null, 'prod_pot', 'Al multiplicar se <b>suman</b> exponentes.'), T(b * e, 'pot_base', `${M(`${b}^${e}`)} no es ${b}·${e}.`)],
          steps: [{ note: `Exponentes: ${x} + ${y} − ${z} = ${e}` }, { html: M(`${b}^${e}`), note: `= <b>${b ** e}</b>` }],
        };
      },
    },
    {
      id: 'negres', w: 1, errs: ['div_pot', 'exp_neg'],
      gen() {
        const a = ri(1, 4), b = a + ri(1, 4);
        return {
          q: `Simplifica y escribe con exponente positivo: ${M(`x^${a}/x^${b}`)}`, ans: expr(`1/x^${b - a}`, { form: ['posExp'] }),
          traps: [T(`x^${b - a}`, 'div_pot', `Arriba hay menos factores que abajo: lo que sobra <b>queda abajo</b>.`), T(`x^${a + b}`, 'div_pot', 'Al dividir se restan exponentes.')],
          steps: [{ note: `${a} − ${b} = ${a - b} → ${M(`x^(${a - b})`)}` }, { note: `Exponente negativo = va abajo: ${M(`1/x^${b - a}`)}` }],
        };
      },
    },
  ],
};

// ---------------- 6. Potencia de potencia y de un producto ----------------
const pot_potencia = {
  id: 'pot_potencia', name: 'Potencia de potencia', icon: '(xᵃ)ᵇ', mode: 'mental', unit: 'C1',
  lesson: () => `
    <p>Tu error del diagnóstico: ${M('(a^2)^3')} → a⁸ ✗. Veamos de dónde sale la regla:</p>
    ${V.powerBlocks('a', 2, 3)}
    <p class="big">${M('(a^2)^3')} = ${M('a^2*a^2*a^2')} = ${M('a^6')}</p>
    <p>Por eso en potencia de potencia los exponentes se <b>multiplican</b>: 2·3 = 6 (no 2³ = 8).</p>
    <p><b>Potencia de un producto:</b> TODO lo de adentro se eleva, también el número:</p>
    <p class="big">${M('(2x^3y)^2')} = ${M('2^2*x^6*y^2')} = ${M('4x^6y^2')}</p>`,
  variants: [
    {
      id: 'simple', w: 3, errs: ['pot_pot'],
      gen() {
        const v = pick(['a', 'x', 'm']); const m = ri(2, 5), n = ri(2, 4);
        return {
          q: `Simplifica: ${M(`(${v}^${m})^${n}`)}`, ans: expr(`${v}^${m * n}`, { form: ['simplePow'] }),
          traps: [
            T(`${v}^${m ** n}`, 'pot_pot', `Elevaste el exponente (${m}<sup>${n}</sup> = ${m ** n}). En potencia de potencia se <b>multiplican</b>: ${m}·${n}.`, `${M(`(${v}^${m})^${n}`)} → ${M(`${v}^${m ** n}`)} ✗`),
            T(`${v}^${m + n}`, 'pot_pot', `Sumaste ${m} + ${n}. Cuenta los factores: hay ${n} grupos de ${m}.`),
          ],
          steps: [{ html: V.powerBlocks(v, m, n), note: `${n} grupos de ${m} factores` }, { note: `${m}·${n} = ${m * n} → ${M(`${v}^${m * n}`)}` }],
          viz: V.powerBlocks(v, m, n),
        };
      },
    },
    {
      id: 'producto', w: 3, errs: ['pot_pot', 'pot_coef'], mode: 'lapiz',
      gen() {
        const k = pick([2, 3, 2, 5]), m = ri(2, 4), n = pick([2, 2, 3]);
        const hasY = chance(0.6);
        const inside = `${k}x^${m}${hasY ? 'y' : ''}`;
        const ans = `${k ** n}x^${m * n}${hasY ? `y^${n}` : ''}`;
        return {
          q: `Simplifica: ${M(`(${inside})^${n}`)}`, ans: expr(ans, { form: ['simplePow'] }),
          traps: [
            T(`${k ** n}x^${m ** n}${hasY ? `y^${n}` : ''}`, 'pot_pot', `En ${M(`x^${m}`)} elevado a ${n}, los exponentes se <b>multiplican</b>: ${m}·${n} = ${m * n} (no ${m}<sup>${n}</sup>).`, `${M(`(x^${m})^${n}`)} → ${M(`x^${m ** n}`)} ✗`),
            T(`${k}x^${m * n}${hasY ? `y^${n}` : ''}`, 'pot_coef', `El <b>${k}</b> también está dentro del paréntesis: se eleva → ${M(`${k}^${n}`)} = ${k ** n}.`),
            T(`${k * n}x^${m * n}${hasY ? `y^${n}` : ''}`, 'pot_base', `${M(`${k}^${n}`)} no es ${k}·${n}.`),
            T(hasY ? `${k ** n}x^${m * n}y` : null, 'pot_coef', 'La <b>y</b> también se eleva.'),
          ],
          steps: [
            { note: `Cada factor de adentro se eleva a ${n}:` },
            { html: M(`${k}^${n}*(x^${m})^${n}${hasY ? `*y^${n}` : ''}`), note: 'Reparte el exponente' },
            { html: M(ans), note: `${k}<sup>${n}</sup> = ${k ** n}; ${m}·${n} = ${m * n}` },
          ],
          viz: V.powerBlocks('x', m, n),
        };
      },
    },
    {
      id: 'negcoef', w: 1, errs: ['neg_base', 'pot_pot'], mode: 'lapiz',
      gen() {
        const k = ri(2, 3), m = ri(2, 4), n = pick([2, 3]);
        const c = (-k) ** n;
        return {
          q: `Simplifica: ${M(`(-${k}a^${m})^${n}`)}`, ans: expr(`${c}a^${m * n}`, { form: ['simplePow'] }),
          traps: [T(`${-c}a^${m * n}`, 'neg_base', `${M(`(-${k})^${n}`)}: exponente ${n % 2 === 0 ? 'par → positivo' : 'impar → negativo'}.`), T(`${c}a^${m ** n}`, 'pot_pot', 'Exponentes: se multiplican.')],
          steps: [{ note: `${M(`(-${k})^${n}`)} = ${S(c)}` }, { note: `${M(`(a^${m})^${n}`)} = ${M(`a^${m * n}`)}` }, { html: M(`${c}a^${m * n}`) }],
        };
      },
    },
    {
      id: 'combo', w: 2, errs: ['pot_pot', 'prod_pot'], mode: 'lapiz',
      gen() {
        const m = ri(2, 4), n = ri(2, 3), p = ri(2, 5);
        return {
          q: `Simplifica: ${M(`(x^${m})^${n}*x^${p}`)}`, ans: expr(`x^${m * n + p}`, { form: ['simplePow'] }),
          traps: [T(`x^${m ** n + p}`, 'pot_pot', 'Potencia de potencia: <b>multiplica</b> exponentes.'), T(`x^${(m + n) + p}`, 'pot_pot', 'Primero (potencia de potencia) se multiplica, luego (producto) se suma.'), T(`x^${m * n * p}`, 'prod_pot', `Al final es un <b>producto</b>: ${M(`x^${m * n}*x^${p}`)} → se suman.`)],
          steps: [{ html: M(`x^${m * n}*x^${p}`), note: `${m}·${n} = ${m * n}` }, { html: M(`x^${m * n + p}`), note: `${m * n} + ${p}` }],
        };
      },
    },
    {
      id: 'cociente', w: 1, errs: ['pot_pot', 'pot_coef'], mode: 'lapiz',
      gen() {
        const k = ri(2, 3), m = ri(2, 3), n = 2;
        return {
          q: `Simplifica: ${M(`(${k}a^${m}/b)^${n}`)}`, ans: expr(`${k ** n}a^${m * n}/b^${n}`, { form: ['simplePow'] }),
          traps: [T(`${k}a^${m * n}/b^${n}`, 'pot_coef', `El ${k} también se eleva.`), T(`${k ** n}a^${m * n}/b`, 'pot_coef', 'El denominador también se eleva.')],
          steps: [{ html: M(`(${k}^${n}*a^${m * n})/b^${n}`), note: 'Todo se eleva: arriba y abajo.' }, { html: M(`${k ** n}a^${m * n}/b^${n}`) }],
        };
      },
    },
  ],
};

// ---------------- 7. Valor numérico ----------------
const valor_numerico = {
  id: 'valor_numerico', name: 'Valor numérico', icon: 'x=?', mode: 'lapiz', unit: 'C1',
  lesson: () => `
    <p>Para reemplazar, <b>pon el número entre paréntesis</b> siempre. Así no pierdes el signo.</p>
    <p>${M('3x^2-x+1')} con x = −2:</p>
    ${V.chain([{ html: M('3(-2)^2-(-2)+1'), note: 'Reemplaza con paréntesis' }, { html: M('3*4-(-2)+1'), note: 'Potencia primero: (−2)² = 4' }, { html: M('12+2+1'), note: '3·4 = 12 y −(−2) = +2' }, { html: '<b>15</b>' }])}
    <p class="mute">Error típico: hacer (3·(−2))² = 36 → la potencia va ANTES que la multiplicación.</p>`,
  variants: [
    {
      id: 'cuad', w: 4, errs: ['valor_num', 'jerarquia', 'neg_base'],
      gen() {
        const a = nz(-4, 5), b = nz(-6, 6), c = nz(-9, 9), x = nz(-4, 4);
        if (x > 0 && chance(0.6)) return this.gen();
        const ex = poly([a, b, c]);
        const r = a * x * x + b * x + c;
        const sub = `${a === 1 ? '' : a === -1 ? '-' : a}${a === 1 || a === -1 ? '' : '*'}(${x})^2${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b) + '*'}(${x})${c < 0 ? '' : '+'}${c}`.replace('*(', '(');
        return {
          q: `Halla el valor de ${M(ex)} cuando <b>x = ${S(x)}</b>`, ans: num(r),
          traps: [
            T((a * x) ** 2 + b * x + c, 'jerarquia', `Multiplicaste ${S(a)}·(${S(x)}) antes de elevar. La <b>potencia va primero</b>: (${S(x)})² = ${x * x}.`),
            T(-a * x * x + b * x + c, 'neg_base', `(${S(x)})² es <b>positivo</b>: ${x * x}.`),
            T(a * x * x - b * x + c, 'valor_num', `Revisa el término ${M(`${b < 0 ? '-' : ''}${Math.abs(b) === 1 ? '' : Math.abs(b)}x`)} con x = ${S(x)}: ${S(b)}·(${S(x)}) = ${S(b * x)}.`),
            T(-r, 'valor_num', 'Revisa los signos al final.'),
          ],
          steps: autoSteps(sub).map((s, i) => (i === 0 ? { ...s, note: 'Reemplaza x por (' + S(x) + ') con paréntesis. ' + s.note } : s)),
        };
      },
    },
    {
      id: 'dosvar', w: 2, errs: ['valor_num', 'signo_mult'],
      gen() {
        const x = nz(-5, 5), y = nz(-5, 5); const k = pick([0, 1, 2]);
        const [ex, sub] = [
          ['x^2-y^2', `(${x})^2-(${y})^2`],
          ['2xy-x', `2(${x})(${y})-(${x})`],
          ['x^2+3xy', `(${x})^2+3(${x})(${y})`],
        ][k];
        const r = evalQ(parse(sub));
        return {
          q: `Si <b>x = ${S(x)}</b> y <b>y = ${S(y)}</b>, calcula ${M(ex)}`, ans: num(r),
          traps: [T(r.neg(), 'valor_num', 'Revisa los signos: usa paréntesis al reemplazar.')],
          steps: autoSteps(sub),
        };
      },
    },
    {
      id: 'ctx', w: 2, errs: ['valor_num'], ctx: true,
      gen() {
        const cf = ri(2, 9) * 100, cv = ri(3, 15), q = ri(10, 60);
        return {
          q: `El costo de producir q polos es ${M(`C=${cf}+${cv}q`)} soles. ¿Cuánto cuesta producir <b>${q}</b> polos?`, ans: num(cf + cv * q), unit: 'S/',
          traps: [T((cf + cv) * q, 'jerarquia', `Primero ${cv}·${q}, luego se suma ${cf}.`), T(cv * q, 'modelo', `No olvides el costo fijo de ${soles(cf)}.`)],
          steps: [{ html: M(`${cf}+${cv}*${q}`), note: 'Reemplaza q' }, { html: M(`${cf}+${cv * q}`), note: 'Multiplica primero' }, { note: `= ${soles(cf + cv * q)}` }],
        };
      },
    },
  ],
};

export const TOPICS_A = [signos_suma, signos_mult, jerarquia, pot_significado, pot_leyes, pot_potencia, valor_numerico];
void toHTML;
