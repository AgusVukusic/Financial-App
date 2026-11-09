import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { callFn, newRequestId } from '../services/api';
import { mapSubscriptionDoc } from '../utils/mappers';
import { toPositiveMinor } from '../utils/money';

/** Datos del formulario (pesos, `dueDate`) -> payload del servidor (centavos, `dueDay`). */
const toPayload = (sub) => ({
  description: sub.description,
  amountMinor: toPositiveMinor(sub.amount),
  category: sub.category,
  dueDay: sub.dueDate,
  cycle: sub.cycle,
  accountId: sub.accountId,
});

/**
 * Gastos fijos. Lectura en tiempo real; escritura vía Cloud Functions.
 * Todas las operaciones lanzan un Error con mensaje apto para mostrar si el servidor las rechaza.
 */
export const useSubscriptions = (uid) => {
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, 'subscriptions'), where('userId', '==', uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubscriptions(snapshot.docs.map((d) => mapSubscriptionDoc({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error('Error fetching subscriptions: ', error);
    });

    return () => unsubscribe();
  }, [uid]);

  const addSubscription = useCallback(async (sub) => {
    if (!uid) return;
    await callFn('createSubscription', { requestId: sub.requestId ?? newRequestId(), ...toPayload(sub) });
  }, [uid]);

  const editSubscription = useCallback(async (id, sub) => {
    if (!uid) return;
    await callFn('updateSubscription', { subscriptionId: id, ...toPayload(sub) });
  }, [uid]);

  const deleteSubscription = useCallback(async (id) => {
    if (!uid) return;
    await callFn('deleteSubscription', { subscriptionId: id });
  }, [uid]);

  /** Registra el pago: crea el gasto, descuenta la cuenta y marca lastPaidAt, todo en el servidor. */
  const paySubscription = useCallback(async (id, requestId = newRequestId()) => {
    if (!uid) return;
    // Mediodía local, como el resto de las fechas: evita que un pago de la noche caiga en el día siguiente en UTC.
    const occurredAt = new Date();
    occurredAt.setHours(12, 0, 0, 0);
    await callFn('paySubscription', { subscriptionId: id, requestId, occurredAt: occurredAt.toISOString() });
  }, [uid]);

  return { subscriptions, addSubscription, deleteSubscription, editSubscription, paySubscription };
};
