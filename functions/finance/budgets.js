const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { requireAuth, requireActiveUser } = require('../utils/guards');
const v = require('../utils/validate');
const { CURRENCY } = require('./ledger');

const MAX_CATEGORIES = 50;

/**
 * Fija el límite mensual de una categoría. Un documento por usuario: budgets/{uid},
 * con `limitsMinor: { [categoría]: centavos }`. Límite 0 = sin tope.
 */
exports.setBudget = onCall(async (request) => {
  requireAuth(request);
  const db = getFirestore();
  const data = v.asObject(request.data);
  const category = v.categoryKey(data.category);
  const limitMinor = v.intInRange(data.limitMinor, 0, Number.MAX_SAFE_INTEGER, 'limitMinor');

  return db.runTransaction(async (t) => {
    const uid = await requireActiveUser(request, db, t);
    const ref = db.collection('budgets').doc(uid);
    const snap = await t.get(ref);

    const current = snap.exists ? snap.data().limitsMinor || {} : {};
    if (!Object.hasOwn(current, category) && Object.keys(current).length >= MAX_CATEGORIES) {
      throw new HttpsError('resource-exhausted', `Máximo ${MAX_CATEGORIES} categorías con presupuesto.`);
    }

    t.set(
      ref,
      {
        userId: uid,
        currency: CURRENCY,
        schemaVersion: 1,
        limitsMinor: { [category]: limitMinor },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { category, limitMinor, status: 'updated' };
  });
});
