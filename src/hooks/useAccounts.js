import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { callFn, newRequestId } from '../services/api';
import { mapAccountDoc } from '../utils/mappers';
import { toMinor } from '../utils/money';

/**
 * Cuentas del usuario. Lectura en tiempo real desde Firestore; toda escritura pasa por
 * Cloud Functions (ADR 001). Los componentes siguen viendo pesos (`initialBalance`, `currentBalance`).
 */
export const useAccounts = (uid) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'accounts'), where('userId', '==', uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => mapAccountDoc({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setAccounts(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching accounts: ', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  /** data: { name, type, initialBalance (pesos), requestId? } → id de la cuenta */
  const addAccount = useCallback(async (data) => {
    if (!uid) return null;
    const result = await callFn('createAccount', {
      requestId: data.requestId ?? newRequestId(),
      name: data.name,
      type: data.type,
      openingBalanceMinor: toMinor(data.initialBalance || 0),
    });
    return result.accountId;
  }, [uid]);

  /** Solo nombre y tipo: el saldo lo maneja el servidor. */
  const updateAccount = useCallback(async (id, data) => {
    if (!uid) return;
    await callFn('updateAccount', { accountId: id, name: data.name, type: data.type });
  }, [uid]);

  const deleteAccount = useCallback(async (id) => {
    if (!uid) return;
    await callFn('deleteAccount', { accountId: id });
  }, [uid]);

  return {
    accounts,
    loadingAccounts: loading,
    addAccount,
    updateAccount,
    deleteAccount,
  };
};
