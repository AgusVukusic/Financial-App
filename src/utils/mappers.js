import { fromMinor } from './money';

/**
 * Convierte documentos de Firestore (modelo V2: centavos, direction, occurredAt, ...)
 * al "view model" que consumen los componentes (pesos, type, date, currentBalance, ...).
 * Los componentes no conocen el formato de almacenamiento.
 */

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  return value instanceof Date ? value : new Date(value);
};

const toISO = (value) => toDate(value)?.toISOString() ?? null;

/**
 * Movimientos: oculta anulaciones y sus originales, y une las dos patas de cada transferencia.
 * @param {Array<{id: string}>} docs documentos de `transactions` (con `id`)
 */
export const mapTransactionDocs = (docs) => {
  const voided = new Set(docs.filter((d) => d.kind === 'void').map((d) => d.voidsTransactionId));
  const visible = docs.filter((d) => d.kind !== 'void' && !voided.has(d.id));

  const outLegIds = new Set(visible.filter((d) => d.kind === 'transfer' && d.direction === 'OUT').map((d) => d.transferId));
  const result = [];

  visible.forEach((d) => {
    const base = {
      id: d.id,
      amount: fromMinor(d.amountMinor),
      category: d.category || '',
      description: d.description || '',
      accountId: d.accountId,
      date: toISO(d.occurredAt),
      createdAt: d.createdAt,
      subscriptionId: d.subscriptionId,
    };

    if (d.kind !== 'transfer') {
      result.push({ ...base, type: d.direction === 'IN' ? 'income' : 'expense' });
      return;
    }
    if (d.direction === 'OUT') {
      result.push({ ...base, type: 'transfer', transferToAccountId: d.counterpartAccountId });
    } else if (!outLegIds.has(d.transferId)) {
      // Pata de entrada sin su pata de salida en este conjunto: se muestra sola, como ingreso.
      result.push({ ...base, type: 'income' });
    }
  });

  return result;
};

export const mapAccountDoc = (d) => ({
  id: d.id,
  userId: d.userId,
  name: d.name,
  type: d.type,
  initialBalance: fromMinor(d.openingBalanceMinor),
  currentBalance: fromMinor(d.balanceMinor),
  createdAt: d.createdAt,
});

export const mapSubscriptionDoc = (d) => ({
  id: d.id,
  userId: d.userId,
  description: d.description,
  amount: fromMinor(d.amountMinor),
  category: d.category,
  dueDate: d.dueDay,
  cycle: d.cycle,
  accountId: d.accountId,
  lastPaidDate: toISO(d.lastPaidAt),
  type: 'expense',
});

/** budgets/{uid}.limitsMinor -> { categoría: pesos } */
export const mapBudgetDoc = (d) => {
  const out = {};
  Object.entries(d?.limitsMinor || {}).forEach(([category, minor]) => {
    out[category] = fromMinor(minor);
  });
  return out;
};
