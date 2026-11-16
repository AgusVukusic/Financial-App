import { calculateTotalsAndCategories } from './calculations';
import { formatCurrency } from './formatters';

/** Categorías fijas de la app. El índice define la trama (`Dither`) de cada una. */
export const REPORT_CATEGORIES = ['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros'];

const OTHERS = 'Otros';
const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Trama de una categoría; una desconocida usa la de "Otros". */
export const categoryKind = (name) => {
  const i = REPORT_CATEGORIES.indexOf(name);
  return i === -1 ? REPORT_CATEGORIES.indexOf(OTHERS) : i;
};

const num = (n) => (Number.isFinite(n) ? n : 0);
// Se compara en centavos enteros: las sumas en pesos con decimales pueden fallar un `===`.
const cents = (n) => Math.round(num(n) * 100);

/** Un tope vale si es mayor a cero; 0 (tope quitado), vacío o inválido es "sin tope". */
export const hasLimit = (limit) => Number.isFinite(limit) && limit > 0;

// La diferencia se calcula sobre los pesos enteros que se muestran ("$ 138.581 / $ 180.000" → 41.419), mínimo $ 1.
const pesosGap = (spent, limit) => Math.max(1, Math.abs(Math.round(num(limit)) - Math.round(Math.max(0, num(spent)))));

/**
 * Estado de una categoría frente a su tope.
 *   none: sin tope · ok: menos del 80 % · warn: 80 % o más sin llegar · full: justo el tope · over: pasado.
 * `text` es lo que se muestra y lo que lee el medidor. El porcentaje se trunca (99,6 % es "99%", no "100%").
 * Un gasto negativo (ajustes) se toma como 0.
 */
export const budgetStatus = (spent, limit) => {
  if (!hasLimit(limit)) return { state: 'none', text: 'Sin tope' };
  const s = Math.max(0, cents(spent));
  const l = cents(limit);
  if (s > l) return { state: 'over', text: `Superado por ${formatCurrency(pesosGap(spent, limit))}` };
  if (s === l) return { state: 'full', text: 'Llegaste al tope' };
  if (s * 100 >= l * 80) return { state: 'warn', text: `Cerca del límite · ${Math.floor((s * 100) / l)}%` };
  return { state: 'ok', text: `Quedan ${formatCurrency(pesosGap(spent, limit))}` };
};

/**
 * Cuántos topes están superados (`over`) y cuántos cerca o justo en el tope (`near`: warn + full, los dos
 * se muestran en --warn en el renglón y ninguno dice "superado"). Solo cuentan las 6 categorías fijas,
 * que son las que se ven en la pantalla.
 */
export const alertSummary = (budgets = {}, expensesByCategory = {}) => {
  let over = 0;
  let near = 0;
  REPORT_CATEGORIES.forEach((category) => {
    const { state } = budgetStatus(expensesByCategory?.[category], budgets?.[category]);
    if (state === 'over') over += 1;
    else if (state === 'warn' || state === 'full') near += 1;
  });
  return { over, near };
};

/**
 * Gasto por categoría, de mayor a menor, con su porcentaje entero. Las categorías fuera de la lista fija se
 * suman a "Otros"; los valores ≤ 0 (o no numéricos) se omiten.
 */
export const distribution = (expensesByCategory = {}) => {
  const sums = new Map();
  Object.entries(expensesByCategory || {}).forEach(([name, value]) => {
    if (!Number.isFinite(value) || value <= 0) return;
    const key = REPORT_CATEGORIES.includes(name) ? name : OTHERS;
    sums.set(key, (sums.get(key) || 0) + value);
  });

  const total = [...sums.values()].reduce((a, b) => a + b, 0);
  const items = [...sums.entries()]
    .map(([name, value]) => ({ name, kind: categoryKind(name), value, pct: total > 0 ? Math.round((value / total) * 100) : 0 }))
    .sort((a, b) => b.value - a.value || a.kind - b.kind);

  return { items, total };
};

/**
 * Entró y salió de los últimos 6 meses (el actual incluido), del más viejo al más nuevo. Cada mes se calcula con
 * `calculateTotalsAndCategories`, igual que el Inicio, así que las transferencias no cuentan como gasto.
 */
export const monthlySeries = (allTransactions, today = new Date()) => {
  const buckets = new Map();
  const series = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = { key, label: SHORT_MONTHS[d.getMonth()], income: 0, expense: 0 };
    buckets.set(key, { entry, list: [] });
    series.push(entry);
  }

  (allTransactions || []).forEach((t) => {
    if (!t || !t.date) return;
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) return;
    const bucket = buckets.get(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    if (bucket) bucket.list.push(t);
  });

  buckets.forEach(({ entry, list }) => {
    const { totalIncome, totalExpense } = calculateTotalsAndCategories(list);
    entry.income = totalIncome;
    entry.expense = totalExpense;
  });

  return series;
};

const compactNumber = (n, maxDecimals) => n.toLocaleString('es-AR', { maximumFractionDigits: maxDecimals });

/** Monto corto para el eje: "$ 0", "$ 850 mil", "$ 1,5 M", "$ 2 M" (coma decimal, es-AR). */
export const formatCompact = (n) => {
  const v = num(n);
  if (v <= 0) return '$ 0';
  if (v < 1000) return `$ ${Math.round(v)}`;
  if (v < 999500) {
    const k = v / 1000;
    return `$ ${compactNumber(k, k < 10 ? 1 : 0)} mil`;
  }
  const m = v / 1e6;
  return `$ ${compactNumber(m, m < 10 ? 1 : 0)} M`;
};

/** Máximo "redondo" del eje (1, 2, 4, 6, 8 o 10 por una potencia de 10), así la mitad también queda redonda. */
export const niceMax = (n) => {
  const v = num(n);
  if (v <= 0) return 0;
  const mag = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 4, 6, 8, 10].find((s) => s * mag >= v * (1 - 1e-12));
  return step * mag;
};
/** Los primeros días del mes un solo gasto grande dispara el ritmo (el alquiler el día 1): recién desde el día 4 se muestra. */
export const PACE_FIRST_DAY = 4;
/** Hasta cuánto se puede pasar (o quedar corto) del gasto esperado y seguir "en ritmo": ±10 %. */
const PACE_TOLERANCE = 10;

/**
 * Ritmo de gasto del mes en curso frente a los topes. Esperado = suma de los topes × (día de hoy / días del mes);
 * gastado = lo gastado en las categorías que tienen tope (las 6 fijas, que son las que se ven en la pantalla).
 *   fast: más del 10 % por encima de lo esperado · on: dentro de ±10 % · slow: más del 10 % por debajo.
 * Devuelve null si no hay nada para mostrar: no es el mes en curso, ningún tope cargado, o es antes del día
 * `PACE_FIRST_DAY`. `month` es 0-11. `today` se inyecta para las pruebas.
 */
export const paceStatus = ({ budgets = {}, expensesByCategory = {}, year, month, today = new Date() } = {}) => {
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (today.getFullYear() !== year || today.getMonth() !== month) return null;
  const day = today.getDate();
  if (day < PACE_FIRST_DAY) return null;

  const days = new Date(year, month + 1, 0).getDate();
  let limit = 0;
  let spent = 0;
  REPORT_CATEGORIES.forEach((category) => {
    const l = budgets?.[category];
    if (!hasLimit(l)) return;
    limit += cents(l);
    spent += Math.max(0, cents(expensesByCategory?.[category]));
  });
  if (limit <= 0) return null;

  const expected = Math.round((limit * day) / days);
  let state = 'on';
  if (spent * 100 > expected * (100 + PACE_TOLERANCE)) state = 'fast';
  else if (spent * 100 < expected * (100 - PACE_TOLERANCE)) state = 'slow';

  const text = { fast: 'Vas más rápido de lo esperado', on: 'En ritmo', slow: 'Vas más lento de lo esperado' }[state];
  return { state, text, spent: spent / 100, expected: expected / 100, limit: limit / 100, day, days };
};
