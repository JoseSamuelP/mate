// util.js — utilidades compartidas por los generadores
import { Q, M, qHTML } from './expr.js';
export { Q, M, qHTML };

export const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const nz = (a, b) => { let v; do v = ri(a, b); while (v === 0); return v; };
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const chance = (p) => Math.random() < p;
export const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
// número entre paréntesis si es negativo (para texto de expresiones)
export const P = (n) => (n < 0 ? `(${n})` : `${n}`);
// número con signo tipográfico
export const S = (n) => String(n).replace('-', '−');
export const soles = (n) => `S/ ${String(n).replace('.', ',')}`;
// polinomio a texto: coefs de mayor a menor grado
export function poly(coefs, v = 'x') {
  const deg = coefs.length - 1; let s = '';
  coefs.forEach((c, i) => {
    const e = deg - i; if (c === 0) return;
    const sign = c < 0 ? '-' : (s ? '+' : '');
    const a = Math.abs(c);
    const coef = (a === 1 && e > 0) ? '' : `${a}`;
    const vv = e === 0 ? '' : e === 1 ? v : `${v}^${e}`;
    s += `${sign}${coef}${vv}`;
  });
  return s || '0';
}
// término lineal "x+3" / "x-3"
export const lin = (a, b, v = 'x') => poly([a, b], v);
export const frac = (n, d) => { const q = new Q(n, d); return q; };
export const fs = (n, d) => (d === 1 ? `${n}` : `${n}/${d}`);
// Respuestas
export const num = (v, extra = {}) => ({ type: 'num', v: Q.of(v), ...extra });
export const expr = (v, extra = {}) => ({ type: 'expr', v, ...extra });
export const sol = (v, varName = 'x', extra = {}) => ({ type: 'sol', v: Q.of(v), var: varName, ...extra });
export const choice = (opts, correct) => ({ type: 'choice', opts, correct });
// trampa (error típico)
export const T = (v, err, msg, wrong) => ({ v, err, msg, wrong });
