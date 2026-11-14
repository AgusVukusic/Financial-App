import { describe, it, expect } from 'vitest';
import { getFrequentExpenses, localDateString } from './frequentExpenses';

const exp = (over) => ({ type: 'expense', amount: 1000, description: 'Café', category: 'Comida', accountId: 'efectivo', date: '2026-11-05T12:00:00.000Z', ...over });

describe('getFrequentExpenses', () => {
  it('agrupa por descripción, categoría y cuenta, y cuenta las repeticiones', () => {
    const r = getFrequentExpenses([exp(), exp({ date: '2026-11-06T12:00:00.000Z' }), exp({ description: 'Uber', category: 'Transporte', accountId: 'mp' })]);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ label: 'Café', count: 2, category: 'Comida', accountId: 'efectivo' });
    expect(r[1]).toMatchObject({ label: 'Uber', count: 1 });
  });

  it('usa el último monto cargado, sin importar el orden de la lista', () => {
    const r = getFrequentExpenses([
      exp({ amount: 3500, date: '2026-11-10T12:00:00.000Z' }),
      exp({ amount: 3000, date: '2026-11-02T12:00:00.000Z' }),
      exp({ amount: 3200, date: '2026-11-06T12:00:00.000Z' }),
    ]);
    expect(r[0].amount).toBe(3500);
  });

  it('no mezcla la misma descripción en cuentas o categorías distintas', () => {
    const r = getFrequentExpenses([exp(), exp({ accountId: 'mp' }), exp({ category: 'Otros' })]);
    expect(r).toHaveLength(3);
  });

  it('ignora ingresos, transferencias, pagos de gastos fijos y montos inválidos', () => {
    const r = getFrequentExpenses([
      exp({ type: 'income' }),
      exp({ type: 'transfer' }),
      exp({ subscriptionId: 'sub1' }),
      exp({ amount: 0 }),
      exp({ amount: -5 }),
      exp({ accountId: undefined }),
    ]);
    expect(r).toEqual([]);
  });

  it('sin descripción usa la categoría como rótulo; sin ambas, lo descarta', () => {
    const r = getFrequentExpenses([exp({ description: '', category: 'Otros' }), exp({ description: '  ', category: '' })]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ label: 'Otros', description: '' });
  });

  it('desempata por más reciente y luego por nombre, y respeta el límite', () => {
    const items = ['Zeta', 'Alfa', 'Beta', 'Gama'].map((description, i) => exp({ description, date: `2026-11-0${i + 1}T12:00:00.000Z` }));
    const r = getFrequentExpenses(items, 3);
    expect(r.map((x) => x.label)).toEqual(['Gama', 'Beta', 'Alfa']);
  });

  it('el orden principal es la cantidad de usos', () => {
    const r = getFrequentExpenses([exp({ description: 'Nafta', date: '2026-11-09T12:00:00.000Z' }), exp(), exp({ date: '2026-11-03T12:00:00.000Z' })]);
    expect(r[0].label).toBe('Café');
  });

  it('tolera entradas vacías', () => {
    expect(getFrequentExpenses(undefined)).toEqual([]);
    expect(getFrequentExpenses([])).toEqual([]);
  });

  it('no expone campos internos', () => {
    expect(Object.keys(getFrequentExpenses([exp()])[0]).sort()).toEqual(['accountId', 'amount', 'category', 'count', 'description', 'key', 'label']);
  });
});

describe('localDateString', () => {
  it('da AAAA-MM-DD con ceros, en hora local', () => {
    expect(localDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localDateString(new Date(2026, 10, 14, 0, 1))).toBe('2026-11-14');
  });
});
