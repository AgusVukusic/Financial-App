const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { requireAuth, requireActiveUser, requireOwned } = require('../utils/guards');
const v = require('../utils/validate');

const CURRENCY = 'ARS';

/**
 * Crea una cuenta. `requestId` es el ID del documento → los reintentos son idempotentes.
 * El saldo (balanceMinor) arranca igual al saldo inicial y solo lo modifican las funciones.
 */
exports.createAccount = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const id = v.requestId(data.requestId);
  const name = v.text(data.name, 'Nombre', { max: 40, required: true });
  const type = v.oneOf(data.type, v.ACCOUNT_TYPES, 'Tipo de cuenta');
  const openingBalanceMinor = v.signedMinor(data.openingBalanceMinor ?? 0, 'Saldo inicial');

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);
    const ref = db.collection('accounts').doc(id);
    const snap = await t.get(ref);

    if (snap.exists) {
      if (snap.data().userId !== uid) throw new HttpsError('already-exists', 'requestId en uso.');
      return { accountId: id, status: 'already_created' };
    }

    t.create(ref, {
      userId: uid,
      name,
      type,
      currency: CURRENCY,
      openingBalanceMinor,
      balanceMinor: openingBalanceMinor,
      schemaVersion: 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { accountId: id, status: 'created' };
  });
});

/** Solo permite cambiar nombre y tipo. Los saldos nunca vienen del cliente. */
exports.updateAccount = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const accountId = v.docId(data.accountId, 'accountId');
  const name = v.text(data.name, 'Nombre', { max: 40, required: true });
  const type = v.oneOf(data.type, v.ACCOUNT_TYPES, 'Tipo de cuenta');

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);
    const ref = db.collection('accounts').doc(accountId);
    requireOwned(await t.get(ref), uid, 'Cuenta');
    t.update(ref, { name, type, updatedAt: FieldValue.serverTimestamp() });
    return { accountId, status: 'updated' };
  });
});

/**
 * Borra una cuenta solo si no tiene movimientos (las transacciones son inmutables
 * y quedarían huérfanas). Lee la cuenta dentro de la transacción: una createTransaction
 * concurrente también la lee/escribe, por lo que Firestore serializa ambas.
 */
exports.deleteAccount = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const accountId = v.docId(data.accountId, 'accountId');

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);
    const ref = db.collection('accounts').doc(accountId);
    requireOwned(await t.get(ref), uid, 'Cuenta');

    const used = await t.get(
      db.collection('transactions').where('userId', '==', uid).where('accountId', '==', accountId).limit(1)
    );
    if (!used.empty) {
      throw new HttpsError('failed-precondition', 'La cuenta tiene movimientos y no se puede eliminar.');
    }
    const linked = await t.get(
      db.collection('subscriptions').where('userId', '==', uid).where('accountId', '==', accountId).limit(1)
    );
    if (!linked.empty) {
      throw new HttpsError('failed-precondition', 'La cuenta está asociada a un gasto fijo y no se puede eliminar.');
    }
    t.delete(ref);
    return { accountId, status: 'deleted' };
  });
});
