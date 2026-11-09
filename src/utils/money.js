/**
 * Conversión pesos <-> centavos. Es el ÚNICO lugar donde se convierte dinero.
 * La UI trabaja en pesos (número); Firestore y las Cloud Functions, en centavos enteros (ADR 001).
 */

/** Pesos (número o string decimal) -> centavos enteros. Redondea al centavo más cercano. */
export const toMinor = (pesos) => {
  const n = Number(pesos);
  if (pesos === '' || pesos === null || pesos === undefined || !Number.isFinite(n)) {
    throw new Error('Monto inválido.');
  }
  const s = String(pesos).trim();
  // "1.005e2" evita el error binario de 1.005 * 100 = 100.49999999999999
  const minor = /e/i.test(s) ? Math.round(n * 100) : Math.round(Number(`${s}e2`));
  if (!Number.isSafeInteger(minor)) throw new Error('Monto fuera de rango.');
  return minor;
};

/** Como toMinor, pero exige un monto positivo (movimientos y gastos fijos). */
export const toPositiveMinor = (pesos) => {
  const minor = toMinor(pesos);
  if (minor <= 0) throw new Error('El monto debe ser mayor a 0.');
  return minor;
};

/** Centavos enteros -> pesos (número, para mostrar y calcular en la UI). */
export const fromMinor = (minor) => (Number.isFinite(minor) ? minor / 100 : 0);
