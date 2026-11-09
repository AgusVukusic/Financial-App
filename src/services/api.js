import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

/**
 * ID de idempotencia para una acción del usuario. Solo letras, números y guiones
 * (el servidor reserva '_' para sus propios IDs). Generarlo UNA vez por acción y
 * reutilizarlo si el usuario reintenta tras un error.
 */
export const newRequestId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

/** Códigos de error de Functions cuyo mensaje (en español) se puede mostrar al usuario. */
const USER_FACING = new Set([
  'functions/invalid-argument',
  'functions/failed-precondition',
  'functions/not-found',
  'functions/already-exists',
  'functions/resource-exhausted',
  'functions/permission-denied',
  'functions/out-of-range',
]);

/** Texto apto para un toast a partir de un error de callable. */
export const errorMessage = (error, fallback = 'No se pudo completar la operación. Intentá de nuevo.') =>
  USER_FACING.has(error?.code) && error.message ? error.message : fallback;

/**
 * Llama a una Cloud Function callable y devuelve `data`.
 * Ante un error lanza un Error cuyo `message` ya es apto para mostrar al usuario.
 */
export const callFn = async (name, payload = {}) => {
  try {
    const { data } = await httpsCallable(functions, name)(payload);
    return data;
  } catch (error) {
    console.error(`Error en ${name}:`, error);
    const wrapped = new Error(errorMessage(error));
    wrapped.code = error?.code;
    throw wrapped;
  }
};
