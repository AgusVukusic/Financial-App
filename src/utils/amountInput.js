/**
 * Montos escritos a mano, con las costumbres argentinas: coma para los centavos y punto para los miles.
 *
 *   "3500" -> 3500        "3,5" -> 3.5        "1.500" -> 1500        "2.500,50" -> 2500.5
 *   "1.500.000" -> 1500000    "12.5" -> 12.5 (un punto que no separa miles es decimal)    "$ 1.200" -> 1200
 *
 * Un campo type="number" no sirve acá: "1.500" lo lee como 1,5 y un gasto de $1.500 se guardaría como $1,50.
 * Devuelve `null` si el texto no es un monto.
 */
export const parseAmountInput = (text) => {
  let s = String(text ?? '').replace(/[\s$]/g, '');
  if (s === '') return null;

  let sign = 1;
  if (s.startsWith('-')) {
    sign = -1;
    s = s.slice(1);
  }
  if (s === '') return null;

  let normalized;
  if (s.includes(',')) {
    // La coma es el decimal; los puntos, miles: "2.500,50"
    if (!/^\d{1,3}(\.\d{3})*,\d*$|^\d+,\d*$/.test(s)) return null;
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // Solo puntos agrupando de a tres: miles ("1.500", "1.500.000")
    normalized = s.replace(/\./g, '');
  } else if (/^\d+(\.\d+)?$/.test(s)) {
    normalized = s;
  } else {
    return null;
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? sign * n : null;
};

/** Número -> texto para el campo, sin separador de miles y con coma decimal: 12.5 -> "12,5", 1200 -> "1200". */
export const formatAmountInput = (n) => {
  if (n === null || n === undefined || n === '' || !Number.isFinite(Number(n))) return '';
  return Number(n).toLocaleString('es-AR', { useGrouping: false, maximumFractionDigits: 2 });
};
