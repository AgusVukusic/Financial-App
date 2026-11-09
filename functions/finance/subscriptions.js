const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { requireAuth, requireActiveUser, requireOwned } = require('../utils/guards');
const v = require('../utils/validate');
const { CURRENCY, signed, nextBalance } = require('./ledger');

/** Valida los campos editables de un gasto fijo (compartido por create y update). */
function parseFields(data) {
  return {
    description: v.text(data.description, 'Descripción', { max: 80, required: true }),
    amountMinor: v.amountMinor(data.amountMinor),
    category: v.text(data.category, 'Categoría', { max: 40, required: true }),
    dueDay: v.intInRange(data.dueDay, 1, 31, 'dueDay'),
    cycle: v.oneOf(data.cycle, v.CYCLES, 'Ciclo'),
    accountId: v.docId(data.accountId, 'accountId'),
  };
}

exports.createSubscription = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const id = v.requestId(data.requestId);
  const fields = parseFields(data);

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);
    const ref = db.collection('subscriptions').doc(id);
    const [snap, accSnap] = await t.getAll(ref, db.collection('accounts').doc(fields.accountId));

    if (snap.exists) {
      if (snap.data().userId !== uid) throw new HttpsError('already-exists', 'requestId en uso.');
      return { subscriptionId: id, status: 'already_created' };
    }
    requireOwned(accSnap, uid, 'Cuenta');

    t.create(ref, {
      userId: uid,
      ...fields,
      currency: CURRENCY,
      lastPaidAt: null,
      schemaVersion: 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { subscriptionId: id, status: 'created' };
  });
});

/** Reemplaza los campos editables. `lastPaidAt` solo lo cambia paySubscription. */
exports.updateSubscription = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const subscriptionId = v.docId(data.subscriptionId, 'subscriptionId');
  const fields = parseFields(data);

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);
    const ref = db.collection('subscriptions').doc(subscriptionId);
    const [snap, accSnap] = await t.getAll(ref, db.collection('accounts').doc(fields.accountId));
    requireOwned(snap, uid, 'Gasto fijo');
    requireOwned(accSnap, uid, 'Cuenta');

    t.update(ref, { ...fields, updatedAt: FieldValue.serverTimestamp() });
    return { subscriptionId, status: 'updated' };
  });
});

exports.deleteSubscription = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const subscriptionId = v.docId(data.subscriptionId, 'subscriptionId');

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);
    const ref = db.collection('subscriptions').doc(subscriptionId);
    requireOwned(await t.get(ref), uid, 'Gasto fijo');
    t.delete(ref);
    return { subscriptionId, status: 'deleted' };
  });
});

/**
 * Registra el pago de un gasto fijo: crea el gasto, descuenta el saldo y marca
 * `lastPaidAt`, todo en una sola transacción. El monto, la categoría y la cuenta salen
 * del gasto fijo guardado, nunca del cliente. Idempotente por `requestId`
 * (el ID del movimiento).
 */
exports.paySubscription = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const subscriptionId = v.docId(data.subscriptionId, 'subscriptionId');
  const id = v.requestId(data.requestId);
  const occurredDate = v.isoDate(data.occurredAt, 'occurredAt');

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);
    const subRef = db.collection('subscriptions').doc(subscriptionId);
    const txRef = db.collection('transactions').doc(id);

    const [subSnap, txSnap] = await t.getAll(subRef, txRef);
    if (txSnap.exists) {
      if (txSnap.data().userId !== uid || txSnap.data().subscriptionId !== subscriptionId) {
        throw new HttpsError('already-exists', 'requestId en uso.');
      }
      return { transactionId: id, status: 'already_created' };
    }
    const sub = requireOwned(subSnap, uid, 'Gasto fijo');

    const accRef = db.collection('accounts').doc(sub.accountId);
    const account = requireOwned(await t.get(accRef), uid, 'Cuenta');

    t.create(txRef, {
      userId: uid,
      kind: 'expense',
      direction: 'OUT',
      accountId: sub.accountId,
      amountMinor: sub.amountMinor,
      currency: CURRENCY,
      occurredAt: Timestamp.fromDate(occurredDate),
      category: sub.category,
      description: sub.description,
      subscriptionId,
      previousLastPaidAt: sub.lastPaidAt ?? null, // para restaurarlo si el pago se anula
      schemaVersion: 1,
      createdAt: FieldValue.serverTimestamp(),
    });
    t.update(accRef, {
      balanceMinor: nextBalance(account.balanceMinor, signed('OUT', sub.amountMinor)),
      updatedAt: FieldValue.serverTimestamp(),
    });
    // Un pago con fecha anterior al último registrado no debe retroceder lastPaidAt.
    const advances = !sub.lastPaidAt || occurredDate.getTime() > sub.lastPaidAt.toMillis();
    t.update(subRef, {
      ...(advances ? { lastPaidAt: Timestamp.fromDate(occurredDate) } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { transactionId: id, status: 'created' };
  });
});
