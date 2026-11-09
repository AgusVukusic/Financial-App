const { HttpsError } = require('firebase-functions/v2/https');

const ACCOUNT_TYPES = ['bank', 'wallet', 'cash', 'credit'];
const DIRECTIONS = ['IN', 'OUT'];
const CYCLES = ['monthly', 'yearly'];
// requestId sin '_' : el servidor deriva IDs con '_' (void_<id>, <id>_out, <id>_in) y no deben poder colisionar.
const REQUEST_ID_RE = /^[A-Za-z0-9-]{8,64}$/;
// docId valida referencias a documentos ya creados por el servidor, que sí pueden contener '_'.
const DOC_ID_RE = /^[A-Za-z0-9_-]{8,80}$/;

const bad = (msg) => new HttpsError('invalid-argument', msg);

function asObject(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw bad('Payload inválido.');
  return data;
}

function requestId(value) {
  if (typeof value !== 'string' || !REQUEST_ID_RE.test(value)) {
    throw bad('requestId inválido (8-64 caracteres: letras, números o -).');
  }
  return value;
}

function docId(value, label) {
  if (typeof value !== 'string' || !DOC_ID_RE.test(value)) throw bad(`${label} inválido.`);
  return value;
}

/** Monto estrictamente positivo, entero, en unidades menores. */
function amountMinor(value) {
  if (!Number.isSafeInteger(value) || value <= 0) throw bad('amountMinor debe ser un entero positivo.');
  return value;
}

/** Saldo inicial: entero (puede ser 0 o negativo, p. ej. tarjeta con deuda). */
function signedMinor(value, label) {
  if (!Number.isSafeInteger(value)) throw bad(`${label} debe ser un entero.`);
  return value;
}

function text(value, label, { max, required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw bad(`${label} es obligatorio.`);
    return '';
  }
  if (typeof value !== 'string') throw bad(`${label} debe ser texto.`);
  const trimmed = value.trim();
  if (required && !trimmed) throw bad(`${label} es obligatorio.`);
  if (trimmed.length > max) throw bad(`${label} supera ${max} caracteres.`);
  return trimmed;
}

function oneOf(value, allowed, label) {
  if (!allowed.includes(value)) throw bad(`${label} inválido.`);
  return value;
}

/** Entero dentro de [min, max]. */
function intInRange(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) throw bad(`${label} debe ser un entero entre ${min} y ${max}.`);
  return value;
}

/** Clave de categoría usable como campo de mapa en Firestore (sin . / * ~ [ ]). */
function categoryKey(value) {
  if (typeof value !== 'string' || !/^[\p{L}\p{N} ]{1,40}$/u.test(value.trim())) throw bad('Categoría inválida.');
  return value.trim();
}

/** ISO 8601 → Date. Rechaza fechas inválidas. */
function isoDate(value, label) {
  if (typeof value !== 'string') throw bad(`${label} debe ser una fecha ISO.`);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw bad(`${label} no es una fecha válida.`);
  return d;
}

module.exports = {
  ACCOUNT_TYPES, DIRECTIONS, CYCLES,
  asObject, requestId, docId, amountMinor, signedMinor, text, oneOf, isoDate, intInRange, categoryKey,
};
