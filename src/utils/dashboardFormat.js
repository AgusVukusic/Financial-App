const NUMBER = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/**
 * Parte un saldo en pesos para mostrarlo en grande: signo y dígitos con separador de miles argentino ("15.373.721").
 * El signo − va como carácter propio (no como guion) para que se lea y se ordene bien.
 */
export const splitBalance = (amount) => {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0;
  return { negative: n < 0, digits: NUMBER.format(Math.abs(n)) };
};

/** "1 día" / "3 días". */
export const pluralizeDays = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;

/** Estado de un gasto fijo en palabras, con el género correcto: "Venció hace 1 día" / "Vence en 3 días" / "Vence hoy". */
export const dueText = (status, days) => {
  if (status === 'overdue') return `Venció hace ${pluralizeDays(days)}`;
  if (days === 0) return 'Vence hoy';
  return `Vence en ${pluralizeDays(days)}`;
};
