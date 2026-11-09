const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { requireAuth, requireActiveUser, requireOwned } = require('../utils/guards');
const v = require('../utils/validate');

const CURRENCY = 'ARS';
const KINDS = ['income', 'expense', 'transfer'];

const signed = (direction, amountMinor) => (direction === 'IN' ? amountMinor : -amountMinor);

function nextBalance(current, delta) {
  const next = current + delta;
  if (!Number.isSafeInteger(next)) throw new HttpsError('out-of-range', 'El saldo excede el máximo permitido.');
  return next;
}

/**
 * Crea un movimiento (ingreso, gasto o transferencia) y actualiza saldos atómicamente.
 *
 * - Idempotente: `requestId` es el ID del documento (transferencia: `${requestId}_out` / `_in`).
 * - Transferencia = dos documentos (OUT + IN) con el mismo `transferId`.
 * - Cada cuenta referenciada se verifica como propia dentro de la transacción.
 */
exports.createTransaction = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const id = v.requestId(data.requestId);
  const kind = v.oneOf(data.kind, KINDS, 'Tipo de movimiento');
  const accountId = v.docId(data.accountId, 'accountId');
  const amountMinor = v.amountMinor(data.amountMinor);
  const category = v.text(data.category, 'Categoría', { max: 40 });
  const description = v.text(data.description, 'Descripción', { max: 200 });
  const occurredAt = Timestamp.fromDate(v.isoDate(data.occurredAt, 'occurredAt'));

  let toAccountId = null;
  if (kind === 'transfer') {
    toAccountId = v.docId(data.toAccountId, 'toAccountId');
    if (toAccountId === accountId) throw new HttpsError('invalid-argument', 'Origen y destino deben ser distintos.');
  }

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);

    const mainId = kind === 'transfer' ? `${id}_out` : id;
    const mainRef = db.collection('transactions').doc(mainId);
    const fromRef = db.collection('accounts').doc(accountId);
    const toRef = toAccountId ? db.collection('accounts').doc(toAccountId) : null;

    const reads = [mainRef, fromRef];
    if (toRef) reads.push(toRef);
    const [mainSnap, fromSnap, toSnap] = await t.getAll(...reads);

    if (mainSnap.exists) {
      if (mainSnap.data().userId !== uid) throw new HttpsError('already-exists', 'requestId en uso.');
      return { transactionIds: kind === 'transfer' ? [`${id}_out`, `${id}_in`] : [id], status: 'already_created' };
    }

    const from = requireOwned(fromSnap, uid, 'Cuenta');
    const to = toSnap ? requireOwned(toSnap, uid, 'Cuenta destino') : null;

    const base = {
      userId: uid,
      amountMinor,
      currency: CURRENCY,
      occurredAt,
      category,
      description,
      schemaVersion: 1,
      createdAt: FieldValue.serverTimestamp(),
    };

    if (kind === 'transfer') {
      t.create(mainRef, { ...base, kind, direction: 'OUT', accountId, counterpartAccountId: toAccountId, transferId: id });
      t.create(db.collection('transactions').doc(`${id}_in`), {
        ...base, kind, direction: 'IN', accountId: toAccountId, counterpartAccountId: accountId, transferId: id,
      });
      t.update(fromRef, { balanceMinor: nextBalance(from.balanceMinor, -amountMinor), updatedAt: FieldValue.serverTimestamp() });
      t.update(toRef, { balanceMinor: nextBalance(to.balanceMinor, amountMinor), updatedAt: FieldValue.serverTimestamp() });
      return { transactionIds: [`${id}_out`, `${id}_in`], status: 'created' };
    }

    const direction = kind === 'income' ? 'IN' : 'OUT';
    t.create(mainRef, { ...base, kind, direction, accountId });
    t.update(fromRef, {
      balanceMinor: nextBalance(from.balanceMinor, signed(direction, amountMinor)),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { transactionIds: [id], status: 'created' };
  });
});

/**
 * Anula un movimiento con una transacción compensatoria (las originales son inmutables).
 *
 * - El documento de anulación tiene ID `void_<originalId>` → anular dos veces es idempotente.
 * - Una transferencia se anula completa (ambas patas).
 * - La compensación conserva el `occurredAt` original: en el mes del movimiento se netea a cero.
 *   El cliente debe tratar el par (original + `voidsTransactionId`) como "anulado".
 * - Editar = anular + crear uno nuevo (lo orquesta el cliente).
 */
exports.voidTransaction = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const transactionId = v.docId(data.transactionId, 'transactionId');

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);

    const origSnap = await t.get(db.collection('transactions').doc(transactionId));
    const orig = requireOwned(origSnap, uid, 'Movimiento');
    if (orig.kind === 'void') throw new HttpsError('failed-precondition', 'No se puede anular una anulación.');

    const legIds = orig.transferId ? [`${orig.transferId}_out`, `${orig.transferId}_in`] : [transactionId];
    const legRefs = legIds.map((x) => db.collection('transactions').doc(x));
    const voidRefs = legIds.map((x) => db.collection('transactions').doc(`void_${x}`));

    const [legSnaps, voidSnaps] = await Promise.all([t.getAll(...legRefs), t.getAll(...voidRefs)]);
    const legs = legSnaps.map((s) => requireOwned(s, uid, 'Movimiento'));

    // Defensa en profundidad: un doc con ID void_<x> solo cuenta como anulación si lo es de verdad.
    voidSnaps.forEach((s, i) => {
      if (!s.exists) return;
      const d = s.data();
      if (d.kind !== 'void' || d.voidsTransactionId !== legIds[i] || d.userId !== uid) {
        throw new HttpsError('data-loss', 'Estado inconsistente: documento de anulación inválido.');
      }
    });

    if (voidSnaps.every((s) => s.exists)) {
      return { voidIds: voidRefs.map((r) => r.id), status: 'already_voided' };
    }
    if (voidSnaps.some((s) => s.exists)) {
      throw new HttpsError('data-loss', 'Estado inconsistente: anulación parcial.');
    }

    // Una lectura por cuenta afectada (una transferencia entre las mismas cuentas no ocurre: son distintas)
    const accountIds = [...new Set(legs.map((l) => l.accountId))];
    const accountRefs = accountIds.map((x) => db.collection('accounts').doc(x));
    const accountSnaps = await t.getAll(...accountRefs);
    const balances = {};
    accountSnaps.forEach((s, i) => { balances[accountIds[i]] = requireOwned(s, uid, 'Cuenta').balanceMinor; });

    legs.forEach((leg, i) => {
      const reverse = leg.direction === 'IN' ? 'OUT' : 'IN';
      t.create(voidRefs[i], {
        userId: uid,
        kind: 'void',
        direction: reverse,
        accountId: leg.accountId,
        amountMinor: leg.amountMinor,
        currency: CURRENCY,
        occurredAt: leg.occurredAt,
        voidsTransactionId: legIds[i],
        category: leg.category || '',
        description: leg.description || '',
        schemaVersion: 1,
        createdAt: FieldValue.serverTimestamp(),
      });
      balances[leg.accountId] = nextBalance(balances[leg.accountId], signed(reverse, leg.amountMinor));
    });

    accountIds.forEach((x, i) => {
      t.update(accountRefs[i], { balanceMinor: balances[x], updatedAt: FieldValue.serverTimestamp() });
    });

    return { voidIds: voidRefs.map((r) => r.id), status: 'voided' };
  });
});
