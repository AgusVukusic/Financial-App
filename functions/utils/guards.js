const { HttpsError } = require('firebase-functions/v2/https');

/** Corta antes de validar el payload si no hay sesión. */
function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes estar autenticado.');
}

/**
 * Exige sesión autenticada y perfil Beta activo (users/{uid}.active === true).
 * Debe llamarse DENTRO de una transacción de Firestore para que la lectura
 * participe de la consistencia. Devuelve el uid.
 */
async function requireActiveUser(request, db, t) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes estar autenticado.');
  }
  const uid = request.auth.uid;
  const userSnap = await t.get(db.collection('users').doc(uid));
  if (!userSnap.exists || userSnap.data().active !== true) {
    throw new HttpsError('permission-denied', 'Tu cuenta Beta no está activa.');
  }
  return uid;
}

/** Verifica que un documento exista y pertenezca al usuario. */
function requireOwned(snap, uid, label) {
  if (!snap.exists || snap.data().userId !== uid) {
    // Mismo mensaje para "no existe" y "ajeno": no filtrar existencia de datos de terceros.
    throw new HttpsError('not-found', `${label} no encontrada.`);
  }
  return snap.data();
}

module.exports = { requireAuth, requireActiveUser, requireOwned };
