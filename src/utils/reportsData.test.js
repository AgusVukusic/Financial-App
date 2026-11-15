import { describe, it, expect } from 'vitest';
import {
  REPORT_CATEGORIES,
  categoryKind,
  hasLimit,
  budgetStatus,
  alertSummary,
  distribution,
  monthlySeries,
  formatCompact,
  niceMax,
} from './reportsData';

const flat = (s) => s.replace(/\s/g, ' ');

describe('categoryKind', () => {
  it('es el índice en la lista fija', () => {
    expect(REPORT_CATEGORIES).toEqual(['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros']);
    expect(categoryKind('Comida')).toBe(0);
    expect(categoryKind('Servicios')).toBe(4);
    expect(categoryKind('Otros')).toBe(5);
  });
  it('una categoría desconocida usa la trama de Otros', () => {
    expect(categoryKind('Mascotas')).toBe(5);
    expect(categoryKind(undefined)).toBe(5);
  });
});

describe('budgetStatus', () => {
  it('sin tope (0, vacío, negativo o inválido) es "none"', () => {
    [0, undefined, null, NaN, -5].forEach((limit) => {
      expect(budgetStatus(1000, limit)).toEqual({ state: 'none', text: 'Sin tope' });
    });
    expect(hasLimit(0)).toBe(false);
    expect(hasLimit(1)).toBe(true);
  });

  it('gastado mayor al tope: superado, con el exceso', () => {
    const s = budgetStatus(187499, 100000);
    expect(s.state).toBe('over');
    expect(flat(s.text)).toBe('Superado por $ 87.499');
  });

  it('gastado igual al tope: llegaste al tope', () => {
    expect(budgetStatus(50000, 50000)).toEqual({ state: 'full', text: 'Llegaste al tope' });
  });

  it('gastado igual al tope aunque la suma traiga ruido de decimales', () => {
    expect(budgetStatus(0.1 + 0.2 + 99.7, 100).state).toBe('full');
  });

  it('79 % es ok, 80 % es cerca del límite, 100 % es el tope', () => {
    expect(budgetStatus(79, 100).state).toBe('ok');
    expect(flat(budgetStatus(79, 100).text)).toBe('Quedan $ 21');
    expect(budgetStatus(80, 100)).toEqual({ state: 'warn', text: 'Cerca del límite · 80%' });
    expect(budgetStatus(93, 100).text).toBe('Cerca del límite · 93%');
    expect(budgetStatus(100, 100).state).toBe('full');
  });

  it('el porcentaje se trunca: 99,6 % no dice 100%', () => {
    expect(budgetStatus(99.6, 100).text).toBe('Cerca del límite · 99%');
    expect(budgetStatus(58, 100).state).toBe('ok');
  });

  it('gastado 0 con tope: quedan todo el tope', () => {
    const s = budgetStatus(0, 50000);
    expect(s.state).toBe('ok');
    expect(flat(s.text)).toBe('Quedan $ 50.000');
  });

  it('un gasto negativo o inválido se toma como 0', () => {
    expect(flat(budgetStatus(-500, 1000).text)).toBe('Quedan $ 1.000');
    expect(flat(budgetStatus(undefined, 1000).text)).toBe('Quedan $ 1.000');
  });

  it('montos enormes no rompen la comparación', () => {
    expect(budgetStatus(999999999999999, 999999999999999).state).toBe('full');
    expect(budgetStatus(999999999999999, 1000000000).state).toBe('over');
    expect(budgetStatus(1, 999999999999999).state).toBe('ok');
  });
});

describe('alertSummary', () => {
  it('sin topes ni gastos no hay nada que avisar', () => {
    expect(alertSummary({}, {})).toEqual({ over: 0, near: 0 });
    expect(alertSummary(undefined, undefined)).toEqual({ over: 0, near: 0 });
  });

  it('cuenta superados aparte de cerca; un tope en 0 no cuenta', () => {
    const budgets = { Comida: 100, Hogar: 100, Compras: 100, Servicios: 100, Transporte: 0 };
    const spent = { Comida: 150, Hogar: 90, Compras: 10, Servicios: 80, Transporte: 999 };
    expect(alertSummary(budgets, spent)).toEqual({ over: 1, near: 2 });
  });

  it('llegar justo al tope cuenta como "cerca", no como superado (igual que el renglón)', () => {
    expect(alertSummary({ Comida: 100 }, { Comida: 100 })).toEqual({ over: 0, near: 1 });
    expect(budgetStatus(100, 100).state).toBe('full');
  });

  it('ignora categorías que no se ven en la pantalla', () => {
    expect(alertSummary({ Mascotas: 10 }, { Mascotas: 500 })).toEqual({ over: 0, near: 0 });
  });
});

describe('distribution', () => {
  it('ordena de mayor a menor con porcentajes enteros', () => {
    const { items, total } = distribution({ Comida: 380, Hogar: 250, Compras: 370 });
    expect(total).toBe(1000);
    expect(items.map((i) => [i.name, i.pct])).toEqual([['Comida', 38], ['Compras', 37], ['Hogar', 25]]);
    expect(items[0]).toMatchObject({ kind: 0, value: 380 });
  });

  it('suma las categorías desconocidas a Otros y omite valores ≤ 0', () => {
    const { items, total } = distribution({ Comida: 100, Otros: 20, Mascotas: 30, Viajes: 50, Hogar: 0, Compras: -40, Raro: NaN });
    expect(total).toBe(200);
    expect(items.map((i) => [i.name, i.value])).toEqual([['Comida', 100], ['Otros', 100]]);
    expect(items[1].kind).toBe(5);
  });

  it('sin gastos devuelve vacío', () => {
    expect(distribution({})).toEqual({ items: [], total: 0 });
    expect(distribution(undefined)).toEqual({ items: [], total: 0 });
    expect(distribution({ Comida: 0 }).items).toEqual([]);
  });

  it('con un solo gasto es 100 % y con montos enormes sigue siendo finito', () => {
    expect(distribution({ Comida: 5 }).items[0].pct).toBe(100);
    const big = distribution({ Comida: 999999999999999, Hogar: 1 });
    expect(big.items[0].pct).toBe(100);
    expect(Number.isFinite(big.total)).toBe(true);
  });
});

describe('monthlySeries', () => {
  const NOV = new Date(2026, 10, 15);
  const at = (y, m, d = 10) => new Date(y, m, d, 12).toISOString();

  it('devuelve 6 meses del más viejo al más nuevo, con mes corto sin punto', () => {
    const s = monthlySeries([], NOV);
    expect(s.map((m) => m.label)).toEqual(['jun', 'jul', 'ago', 'sep', 'oct', 'nov']);
    expect(s.map((m) => m.key)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
    expect(s.every((m) => m.income === 0 && m.expense === 0)).toBe(true);
  });

  it('cruza el año nuevo', () => {
    const s = monthlySeries([], new Date(2027, 0, 20));
    expect(s.map((m) => m.key)).toEqual(['2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01']);
    expect(s.map((m) => m.label)).toEqual(['ago', 'sep', 'oct', 'nov', 'dic', 'ene']);
  });

  it('suma entró y salió por mes y descarta lo que cae fuera de los 6 meses', () => {
    const s = monthlySeries(
      [
        { type: 'income', amount: 1000, category: 'Ingreso', date: at(2026, 10) },
        { type: 'expense', amount: 300, category: 'Comida', date: at(2026, 10) },
        { type: 'expense', amount: 50, category: 'Hogar', date: at(2026, 5) },
        { type: 'expense', amount: 999, category: 'Comida', date: at(2026, 4) },
        { type: 'expense', amount: 999, category: 'Comida', date: at(2026, 11) },
      ],
      NOV,
    );
    expect(s[5]).toMatchObject({ income: 1000, expense: 300 });
    expect(s[0]).toMatchObject({ income: 0, expense: 50 });
    expect(s.reduce((a, m) => a + m.expense, 0)).toBe(350);
  });

  it('una transferencia no suma a salió (el código viejo la contaba como gasto)', () => {
    const s = monthlySeries(
      [
        { type: 'transfer', amount: 5000, category: 'Transferencia', date: at(2026, 10) },
        { type: 'expense', amount: 200, category: 'Comida', date: at(2026, 10) },
      ],
      NOV,
    );
    expect(s[5].expense).toBe(200);
    expect(s[5].income).toBe(0);
  });

  it('coincide con calculateTotalsAndCategories: saldo de deuda y ajustes por categoría', () => {
    const s = monthlySeries(
      [
        { type: 'expense', amount: 100, category: 'Saldo de deuda', categoryAdjustments: { Comida: 40, Hogar: 60 }, date: at(2026, 10) },
        { type: 'income', amount: 30, category: 'Saldo de deuda', categoryAdjustments: { Comida: -30 }, date: at(2026, 10) },
      ],
      NOV,
    );
    expect(s[5].expense).toBe(70);
    expect(s[5].income).toBe(0);
  });

  it('ignora movimientos sin fecha o con fecha inválida y tolera datos vacíos', () => {
    const s = monthlySeries([{ type: 'expense', amount: 10, category: 'Comida' }, { type: 'expense', amount: 10, category: 'Comida', date: 'nope' }, null], NOV);
    expect(s.every((m) => m.expense === 0)).toBe(true);
    expect(monthlySeries(undefined, NOV)).toHaveLength(6);
  });
});

describe('formatCompact', () => {
  it('formatea con coma decimal es-AR', () => {
    expect(formatCompact(0)).toBe('$ 0');
    expect(formatCompact(850000)).toBe('$ 850 mil');
    expect(formatCompact(1500000)).toBe('$ 1,5 M');
    expect(formatCompact(1000000)).toBe('$ 1 M');
    expect(formatCompact(2000000)).toBe('$ 2 M');
    expect(formatCompact(500)).toBe('$ 500');
    expect(formatCompact(2500)).toBe('$ 2,5 mil');
  });
  it('tolera negativos, inválidos y cifras enormes', () => {
    expect(formatCompact(-10)).toBe('$ 0');
    expect(formatCompact(NaN)).toBe('$ 0');
    expect(formatCompact(undefined)).toBe('$ 0');
    expect(formatCompact(999800)).toBe('$ 1 M');
    expect(formatCompact(999999999999999)).toMatch(/^\$ [\d.]+ M$/);
  });
});

describe('niceMax', () => {
  it('redondea para arriba a un máximo con mitad redonda', () => {
    expect(niceMax(0)).toBe(0);
    expect(niceMax(-3)).toBe(0);
    expect(niceMax(1)).toBe(1);
    expect(niceMax(1300000)).toBe(2000000);
    expect(niceMax(2000000)).toBe(2000000);
    expect(niceMax(2000001)).toBe(4000000);
    expect(niceMax(850000)).toBe(1000000);
    expect(niceMax(1000)).toBe(1000);
    expect(niceMax(4300)).toBe(6000);
    expect(niceMax(9000000)).toBe(10000000);
  });
  it('nunca queda por debajo del valor', () => {
    [0.5, 7, 99, 101, 12345, 777777, 5e9, 999999999999999].forEach((n) => {
      expect(niceMax(n)).toBeGreaterThanOrEqual(n);
    });
  });
});

describe('budgetStatus con centavos', () => {
  it('la diferencia coincide con los pesos enteros que se muestran', () => {
    expect(flat(budgetStatus(138580.5, 180000).text)).toBe('Quedan $ 41.419');
    expect(flat(budgetStatus(100.2, 100).text)).toBe('Superado por $ 1');
  });
});
