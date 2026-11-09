const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { requireAuth, requireActiveUser, requireOwned } = require('../utils/guards');
const v = require('../utils/validate');
const { CURRENCY, signed, nextBalance } = require('./ledger');

const KINDS = ['income', 'expense', 'transfer'];

// ---------------------------------------------------------------------------
// Piezas compartidas por create / void / replace.
// Regla de Firestore: TODAS las lecturas de una transacción van antes de cualquier escritura.
// Por eso cada operación se arma en dos fases: read*Plan (solo lecturas) y apply*Plan (solo escrituras).
// ---------------------------------------------------------------------------

/** Valida y normaliza los campos de un movimiento nuevo. */
function parseMovement(data) {
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
  return { kind, accountId, toAccountId, amountMinor, category, description, occurredAt };
}

const movementIds = (id, kind) => (kind === 'transfer' ? [`${id}_out`, `${id}_in`] : [id]);

/** Lee las cuentas afectadas (verificando propiedad) y lleva los saldos en memoria. */
async function loadAccounts(t, db, uid, accountIds) {
  const ids = [...new Set(accountIds)];
  const refs = ids.map((x) => db.collection('accounts').doc(x));
  const snaps = await t.getAll(...refs);
  const ctx = { refs: {}, balances: {}, touched: new Set() };
  snaps.forEach((s, i) => {
    ctx.refs[ids[i]] = refs[i];
    ctx.balances[ids[i]] = requireOwned(s, uid, 'Cuenta').balanceMinor;
  });
  ctx.adjust = (accountId, delta) => {
    ctx.balances[accountId] = nextBalance(ctx.balances[accountId], delta);
    ctx.touched.add(accountId);
  };
  return ctx;
}

function flushAccounts(t, ctx) {
  ctx.touched.forEach((accountId) => {
    t.update(ctx.refs[accountId], { balanceMinor: ctx.balances[accountId], updatedAt: FieldValue.serverTimestamp() });
  });
}

/** Fase de lectura de una creación. Si el movimiento ya existe (reintento) lo informa. */
async function readCreatePlan(t, db, uid, id, input) {
  const mainRef = db.collection('transactions').doc(input.kind === 'transfer' ? `${id}_out` : id);
  const mainSnap = await t.get(mainRef);
  if (mainSnap.exists && mainSnap.data().userId !== uid) throw new HttpsError('already-exists', 'requestId en uso.');
  return { id, input, mainRef, existing: mainSnap.exists ? mainSnap.data() : null };
}

/** Fase de escritura de una creación: documentos + efecto en saldos. `extra` se suma a cada documento. */
function applyCreatePlan(t, db, uid, plan, ctx, extra = {}) {
  const { id, input, mainRef } = plan;
  const base = {
    userId: uid,
    amountMinor: input.amountMinor,
    currency: CURRENCY,
    occurredAt: input.occurredAt,
    category: input.category,
    description: input.description,
    schemaVersion: 1,
    createdAt: FieldValue.serverTimestamp(),
    ...extra,
  };

  if (input.kind === 'transfer') {
    t.create(mainRef, {
      ...base, kind: 'transfer', direction: 'OUT', accountId: input.accountId, counterpartAccountId: input.toAccountId, transferId: id,
    });
    t.create(db.collection('transactions').doc(`${id}_in`), {
      ...base, kind: 'transfer', direction: 'IN', accountId: input.toAccountId, counterpartAccountId: input.accountId, transferId: id,
    });
    ctx.adjust(input.accountId, -input.amountMinor);
    ctx.adjust(input.toAccountId, input.amountMinor);
    return;
  }

  const direction = input.kind === 'income' ? 'IN' : 'OUT';
  t.create(mainRef, { ...base, kind: input.kind, direction, accountId: input.accountId });
  ctx.adjust(input.accountId, signed(direction, input.amountMinor));
}

/**
 * Fase de lectura de una anulación: movimiento original, todas sus patas, anulaciones previas y,
 * si era el pago de un gasto fijo, el gasto fijo.
 */
async function readVoidPlan(t, db, uid, transactionId) {
  const orig = requireOwned(await t.get(db.collection('transactions').doc(transactionId)), uid, 'Movimiento');
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
  if (voidSnaps.some((s) => s.exists) && !voidSnaps.every((s) => s.exists)) {
    throw new HttpsError('data-loss', 'Estado inconsistente: anulación parcial.');
  }
  const alreadyVoided = voidSnaps.every((s) => s.exists);

  let subRef = null;
  let sub = null;
  if (orig.subscriptionId && !alreadyVoided) {
    subRef = db.collection('subscriptions').doc(orig.subscriptionId);
    const subSnap = await t.get(subRef);
    if (subSnap.exists && subSnap.data().userId === uid) sub = subSnap.data();
  }

  return { transactionId, orig, legs, legIds, voidRefs, alreadyVoided, subRef, sub };
}

/** Fase de escritura de una anulación. Con `restoreSubscription: false` el llamador maneja lastPaidAt. */
function applyVoidPlan(t, uid, plan, ctx, { restoreSubscription = true } = {}) {
  plan.legs.forEach((leg, i) => {
    const reverse = leg.direction === 'IN' ? 'OUT' : 'IN';
    t.create(plan.voidRefs[i], {
      userId: uid,
      kind: 'void',
      direction: reverse,
      accountId: leg.accountId,
      amountMinor: leg.amountMinor,
      currency: CURRENCY,
      occurredAt: leg.occurredAt,
      voidsTransactionId: plan.legIds[i],
      category: leg.category || '',
      description: leg.description || '',
      schemaVersion: 1,
      createdAt: FieldValue.serverTimestamp(),
    });
    ctx.adjust(leg.accountId, signed(reverse, leg.amountMinor));
  });

  // Anular un pago deja el gasto fijo como estaba antes de ese pago (si ese pago era el último).
  const { sub, subRef, orig } = plan;
  if (restoreSubscription && sub && sub.lastPaidAt && orig.occurredAt && sub.lastPaidAt.toMillis() === orig.occurredAt.toMillis()) {
    t.update(subRef, { lastPaidAt: orig.previousLastPaidAt ?? null, updatedAt: FieldValue.serverTimestamp() });
  }
}

// ---------------------------------------------------------------------------
// Callables
// ---------------------------------------------------------------------------

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
  const input = parseMovement(data);

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);
    const plan = await readCreatePlan(t, db, uid, id, input);
    if (plan.existing) return { transactionIds: movementIds(id, input.kind), status: 'already_created' };

    const ctx = await loadAccounts(t, db, uid, [input.accountId, input.toAccountId].filter(Boolean));
    applyCreatePlan(t, db, uid, plan, ctx);
    flushAccounts(t, ctx);
    return { transactionIds: movementIds(id, input.kind), status: 'created' };
  });
});

/**
 * Anula un movimiento con una transacción compensatoria (las originales son inmutables).
 *
 * - El documento de anulación tiene ID `void_<originalId>` → anular dos veces es idempotente.
 * - Una transferencia se anula completa (ambas patas).
 * - La compensación conserva el `occurredAt` original: en el mes del movimiento se netea a cero.
 *   El cliente debe tratar el par (original + `voidsTransactionId`) como "anulado".
 */
exports.voidTransaction = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const transactionId = v.docId(data.transactionId, 'transactionId');

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);
    const plan = await readVoidPlan(t, db, uid, transactionId);
    if (plan.alreadyVoided) return { voidIds: plan.voidRefs.map((r) => r.id), status: 'already_voided' };

    const ctx = await loadAccounts(t, db, uid, plan.legs.map((l) => l.accountId));
    applyVoidPlan(t, uid, plan, ctx);
    flushAccounts(t, ctx);
    return { voidIds: plan.voidRefs.map((r) => r.id), status: 'voided' };
  });
});

/**
 * Edita un movimiento = anula el original y crea el nuevo EN LA MISMA transacción de Firestore:
 * o pasan las dos cosas o no pasa ninguna (nunca se pierde el movimiento).
 *
 * - `transactionId` es el original (o cualquiera de sus patas); `requestId` es el ID del nuevo.
 * - Idempotente: si el nuevo ya existe y reemplaza a este original, devuelve `already_replaced`.
 * - Un pago de gasto fijo solo puede reemplazarse por otro gasto; conserva `subscriptionId` y
 *   `previousLastPaidAt`, y mueve `lastPaidAt` a la nueva fecha si ese pago era el último.
 */
exports.replaceTransaction = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const transactionId = v.docId(data.transactionId, 'transactionId');
  const id = v.requestId(data.requestId);
  const input = parseMovement(data);

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);

    const createPlan = await readCreatePlan(t, db, uid, id, input);
    if (createPlan.existing) {
      if (createPlan.existing.replacesTransactionId !== transactionId) throw new HttpsError('already-exists', 'requestId en uso.');
      return { transactionIds: movementIds(id, input.kind), status: 'already_replaced' };
    }

    const voidPlan = await readVoidPlan(t, db, uid, transactionId);
    if (voidPlan.alreadyVoided) throw new HttpsError('failed-precondition', 'El movimiento ya fue anulado.');

    const { orig } = voidPlan;
    const extra = { replacesTransactionId: transactionId };
    if (orig.subscriptionId) {
      if (input.kind !== 'expense') {
        throw new HttpsError('failed-precondition', 'El pago de un gasto fijo solo puede reemplazarse por otro gasto.');
      }
      extra.subscriptionId = orig.subscriptionId;
      extra.previousLastPaidAt = orig.previousLastPaidAt ?? null;
    }

    const accountIds = [...voidPlan.legs.map((l) => l.accountId), input.accountId, input.toAccountId].filter(Boolean);
    const ctx = await loadAccounts(t, db, uid, accountIds);

    applyVoidPlan(t, uid, voidPlan, ctx, { restoreSubscription: false });
    applyCreatePlan(t, db, uid, createPlan, ctx, extra);
    flushAccounts(t, ctx);

    const { sub, subRef } = voidPlan;
    if (sub && sub.lastPaidAt && orig.occurredAt && sub.lastPaidAt.toMillis() === orig.occurredAt.toMillis()) {
      t.update(subRef, { lastPaidAt: input.occurredAt, updatedAt: FieldValue.serverTimestamp() });
    }
    return { transactionIds: movementIds(id, input.kind), status: 'replaced' };
  });
});
