import { describe, it, expect } from 'vitest';
import { mapTransactionDocs, mapAccountDoc, mapSubscriptionDoc, mapBudgetDoc } from './mappers';

const ts = (iso) => ({ toDate: () => new Date(iso) });
const AT = '2026-03-10T12:00:00.000Z';

const doc = (over) => ({
  id: 't1', userId: 'u', kind: 'expense', direction: 'OUT', accountId: 'a1', amountMinor: 250050,
  category: 'Comida', description: 'x', occurredAt: ts(AT), ...over,
});

describe('mapTransactionDocs', () => {
  it('convierte gasto e ingreso a la forma de la UI en pesos', () => {
    const out = mapTransactionDocs([
      doc({ id: 'e1' }),
      doc({ id: 'i1', kind: 'income', direction: 'IN', amountMinor: 100000 }),
    ]);
    expect(out).toEqual([
      expect.objectContaining({ id: 'e1', type: 'expense', amount: 2500.5, accountId: 'a1', date: AT, category: 'Comida' }),
      expect.objectContaining({ id: 'i1', type: 'income', amount: 1000 }),
    ]);
  });

  it('une las dos patas de una transferencia en un solo item', () => {
    const out = mapTransactionDocs([
      doc({ id: 'x_out', kind: 'transfer', direction: 'OUT', accountId: 'a1', counterpartAccountId: 'a2', transferId: 'x' }),
      doc({ id: 'x_in', kind: 'transfer', direction: 'IN', accountId: 'a2', counterpartAccountId: 'a1', transferId: 'x' }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'x_out', type: 'transfer', accountId: 'a1', transferToAccountId: 'a2', amount: 2500.5 });
  });

  it('oculta un movimiento anulado y su documento de anulación', () => {
    const out = mapTransactionDocs([
      doc({ id: 'e1' }),
      doc({ id: 'void_e1', kind: 'void', direction: 'IN', voidsTransactionId: 'e1' }),
      doc({ id: 'e2' }),
    ]);
    expect(out.map((t) => t.id)).toEqual(['e2']);
  });

  it('oculta por completo una transferencia anulada (ambas patas)', () => {
    const out = mapTransactionDocs([
      doc({ id: 'x_out', kind: 'transfer', direction: 'OUT', transferId: 'x', counterpartAccountId: 'a2' }),
      doc({ id: 'x_in', kind: 'transfer', direction: 'IN', accountId: 'a2', transferId: 'x' }),
      doc({ id: 'void_x_out', kind: 'void', direction: 'IN', voidsTransactionId: 'x_out' }),
      doc({ id: 'void_x_in', kind: 'void', direction: 'OUT', accountId: 'a2', voidsTransactionId: 'x_in' }),
    ]);
    expect(out).toEqual([]);
  });

  it('un movimiento reemplazado muestra solo el nuevo', () => {
    const out = mapTransactionDocs([
      doc({ id: 'old', amountMinor: 4000 }),
      doc({ id: 'void_old', kind: 'void', direction: 'IN', voidsTransactionId: 'old' }),
      doc({ id: 'new', amountMinor: 6000, replacesTransactionId: 'old' }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'new', amount: 60 });
  });
});

describe('otros mappers', () => {
  it('cuenta: saldos en pesos', () => {
    expect(mapAccountDoc({ id: 'a', name: 'Banco', type: 'bank', openingBalanceMinor: 100000, balanceMinor: 87550 }))
      .toMatchObject({ id: 'a', name: 'Banco', initialBalance: 1000, currentBalance: 875.5 });
  });

  it('gasto fijo: renombra a los campos que usa la UI', () => {
    expect(mapSubscriptionDoc({
      id: 's', description: 'Netflix', amountMinor: 450000, category: 'Software', dueDay: 5, cycle: 'monthly',
      accountId: 'a', lastPaidAt: ts(AT),
    })).toMatchObject({ id: 's', amount: 4500, dueDate: 5, lastPaidDate: AT, type: 'expense' });
    expect(mapSubscriptionDoc({ id: 's', amountMinor: 1, lastPaidAt: null }).lastPaidDate).toBeNull();
  });

  it('presupuesto: solo limitsMinor, en pesos', () => {
    expect(mapBudgetDoc({ userId: 'u', currency: 'ARS', limitsMinor: { Comida: 5000050, Hogar: 0 } }))
      .toEqual({ Comida: 50000.5, Hogar: 0 });
    expect(mapBudgetDoc(undefined)).toEqual({});
  });
});
