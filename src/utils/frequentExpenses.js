/**
 * Gastos frecuentes: agrupa los gastos del mes por descripción + categoría + cuenta y devuelve los más usados,
 * cada uno con el último monto cargado. Alimenta los botones de "Anotar rápido" (un toque = un gasto).
 *
 * Solo mira gastos "de mano": ignora ingresos, transferencias y pagos de gastos fijos (llevan subscriptionId).
 * Trabaja sobre el view model de los hooks (pesos, type, date ISO), no sobre documentos de Firestore.
 */

const clean = (text) => String(text ?? '').trim();

/**
 * @param {Array<{type:string, amount:number, description?:string, category?:string, accountId?:string, date?:string, subscriptionId?:string}>} transactions
 * @param {number} [limit=6]
 * @returns {Array<{key:string, label:string, amount:number, category:string, accountId:string, description:string, count:number}>}
 */
export const getFrequentExpenses = (transactions, limit = 6) => {
  const groups = new Map();

  (transactions || []).forEach((t) => {
    if (t.type !== 'expense' || t.subscriptionId || !(t.amount > 0) || !t.accountId) return;

    const description = clean(t.description);
    const category = clean(t.category);
    const label = description || category;
    if (!label) return;

    const key = `${description.toLowerCase()}|${category}|${t.accountId}`;
    const time = t.date ? new Date(t.date).getTime() || 0 : 0;
    const group = groups.get(key);

    if (!group) {
      groups.set(key, { key, label, amount: t.amount, category, accountId: t.accountId, description, count: 1, lastTime: time });
    } else {
      group.count += 1;
      if (time >= group.lastTime) {
        group.lastTime = time;
        group.amount = t.amount;
      }
    }
  });

  return [...groups.values()]
    .sort((a, b) => b.count - a.count || b.lastTime - a.lastTime || a.label.localeCompare(b.label, 'es'))
    .slice(0, limit)
    .map(({ lastTime, ...item }) => item); // eslint-disable-line no-unused-vars
};

/** 'YYYY-MM-DD' en hora local (lo que espera useTransactions como `date`). */
export const localDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
