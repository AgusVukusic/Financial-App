const { HttpsError } = require('firebase-functions/v2/https');

const CURRENCY = 'ARS';

/** Efecto de un movimiento sobre el saldo: IN suma, OUT resta. */
const signed = (direction, amountMinor) => (direction === 'IN' ? amountMinor : -amountMinor);

function nextBalance(current, delta) {
  const next = current + delta;
  if (!Number.isSafeInteger(next)) throw new HttpsError('out-of-range', 'El saldo excede el máximo permitido.');
  return next;
}

module.exports = { CURRENCY, signed, nextBalance };
