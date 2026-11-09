const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { normalizeEmail } = require('../utils/normalize');

exports.activateBetaUser = onCall(async (request) => {
  // 1. Verificar autenticación
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes estar autenticado para activar tu cuenta.');
  }

  const { uid, token } = request.auth;
  const email = token.email;
  const emailVerified = token.email_verified;

  // 2. Verificar email verificado
  if (!email || !emailVerified) {
    throw new HttpsError('permission-denied', 'Debes verificar tu dirección de correo electrónico antes de activar tu cuenta.');
  }

  const db = getFirestore();
  const normalizedEmail = normalizeEmail(email);

  // Usar email normalizado como ID del documento en betaInvites para búsqueda directa y rápida.
  // Evita consultas compuestas e índices, garantizando unicidad.
  const inviteRef = db.collection('betaInvites').doc(normalizedEmail);
  const userRef = db.collection('users').doc(uid);

  try {
    const result = await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);

      // Idempotencia: si ya está activa, retorna éxito
      if (userDoc.exists && userDoc.data().active === true) {
        return { message: 'Tu cuenta ya se encontraba activa.', status: 'already_active' };
      }

      const inviteDoc = await t.get(inviteRef);
      if (!inviteDoc.exists) {
        throw new HttpsError('permission-denied', 'Tu correo no se encuentra en la lista de invitados para la Beta.');
      }

      // Crear o actualizar perfil
      const userData = {
        email: normalizedEmail,
        active: true,
        schemaVersion: 1,
        updatedAt: FieldValue.serverTimestamp()
      };

      if (!userDoc.exists) {
        userData.createdAt = FieldValue.serverTimestamp();
        t.set(userRef, userData);
      } else {
        t.update(userRef, userData);
      }

      return { message: 'Cuenta activada exitosamente.', status: 'activated' };
    });

    return result;
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error("Error activating beta user:", error);
    throw new HttpsError('internal', 'Ocurrió un error interno al intentar activar la cuenta.');
  }
});
