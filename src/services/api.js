import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';

// 'http' → endpoints /api de Vercel (plan gratuito); cualquier otro valor → Callables de Firebase
const USE_HTTP = import.meta.env.VITE_API_TRANSPORT === 'http';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

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
 * Invoca un handler del backend y devuelve su resultado, por Callable o por HTTP según
 * VITE_API_TRANSPORT. En ambos casos los errores traen `code` con el formato de Firebase
 * ('functions/<código>') y el mensaje del servidor.
 */
export const invokeFn = async (name, payload = {}) => {
  if (!USE_HTTP) {
    const { data } = await httpsCallable(functions, name)(payload);
    return data;
  }

  const headers = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;

  let response;
  try {
    response = await fetch(`${API_BASE}/${name}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: payload }),
    });
  } catch (cause) {
    throw Object.assign(new Error('No hay conexión con el servidor.'), { code: 'functions/unavailable', cause });
  }

  const json = await response.json().catch(() => null);
  if (response.ok && json && 'result' in json) return json.result;
  const error = json?.error;
  throw Object.assign(new Error(error?.message || `HTTP ${response.status}`), {
    code: `functions/${error?.code || 'internal'}`,
  });
};

/**
 * Llama a un handler del backend y devuelve su resultado.
 * Ante un error lanza un Error cuyo `message` ya es apto para mostrar al usuario.
 */
export const callFn = async (name, payload = {}) => {
  try {
    return await invokeFn(name, payload);
  } catch (error) {
    console.error(`Error en ${name}:`, error);
    const wrapped = new Error(errorMessage(error));
    wrapped.code = error?.code;
    throw wrapped;
  }
};
