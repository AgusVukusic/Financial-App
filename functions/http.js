const { HttpsError } = require('firebase-functions/v2/https');

/**
 * Transporte HTTP genérico para los handlers de `handlers.js` (lo usa `api/[fn].js` en Vercel).
 *
 * Contrato, calcado del protocolo Callable para que el frontend no note diferencia:
 *   POST /api/<nombre>  Authorization: Bearer <ID token de Firebase>  body: { data }
 *   200 → { result }    error → { error: { code, message } } con el status HTTP del HttpsError
 *
 * `verifyIdToken` se inyecta (getAuth().verifyIdToken en producción) para poder testearlo.
 */
function createHttpHandler({ handlers, verifyIdToken, logger = console }) {
  return async function handle({ method, fn, authorization, body }) {
    if (method !== 'POST') {
      return errorResponse(405, 'invalid-argument', 'Método no permitido.');
    }
    // hasOwn: evita invocar propiedades heredadas (constructor, __proto__, ...)
    if (typeof fn !== 'string' || !Object.hasOwn(handlers, fn)) {
      return errorResponse(404, 'not-found', 'Función inexistente.');
    }

    try {
      const auth = await authFromHeader(authorization, verifyIdToken);
      const data = body && typeof body === 'object' ? body.data : undefined;
      const result = await handlers[fn]({ auth, data });
      return { status: 200, body: { result: result === undefined ? null : result } };
    } catch (error) {
      if (error instanceof HttpsError) {
        return errorResponse(error.httpErrorCode.status, error.code, error.message);
      }
      // Igual que onCall: los errores inesperados no filtran detalles al cliente
      logger.error(`Error inesperado en ${fn}:`, error);
      return errorResponse(500, 'internal', 'Error interno.');
    }
  };
}

/** Sin header → auth null (el handler decide con requireAuth). Token inválido → unauthenticated. */
async function authFromHeader(authorization, verifyIdToken) {
  if (!authorization) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match) throw new HttpsError('unauthenticated', 'Sesión inválida.');
  try {
    const decoded = await verifyIdToken(match[1]);
    return { uid: decoded.uid, token: decoded };
  } catch {
    throw new HttpsError('unauthenticated', 'Sesión inválida o vencida. Volvé a iniciar sesión.');
  }
}

function errorResponse(status, code, message) {
  return { status, body: { error: { code, message } } };
}

/**
 * Handler listo para producción: inicializa el Admin SDK (una vez por instancia) y usa
 * getAuth().verifyIdToken. Se requiere desde acá (y no desde api/) para que el Admin SDK
 * sea la misma copia que usan los handlers.
 *
 * Variables de entorno:
 *   FIREBASE_SERVICE_ACCOUNT  JSON de la cuenta de servicio en base64 (producción)
 *   FIREBASE_PROJECT_ID       proyecto a usar con emuladores (FIRESTORE_EMULATOR_HOST /
 *                             FIREBASE_AUTH_EMULATOR_HOST definidos), sin credenciales
 */
function createDefaultHttpHandler() {
  const { initializeApp, getApps, cert } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');

  if (getApps().length === 0) {
    const encoded = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (encoded) {
      const serviceAccount = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
      initializeApp({ credential: cert(serviceAccount) });
    } else if (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_PROJECT_ID) {
      initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    } else {
      throw new Error('Falta FIREBASE_SERVICE_ACCOUNT (o configuración de emuladores).');
    }
  }

  return createHttpHandler({
    handlers: require('./handlers'),
    verifyIdToken: (token) => getAuth().verifyIdToken(token),
  });
}

module.exports = { createHttpHandler, createDefaultHttpHandler };
