import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { mapTransactionDocs } from '../utils/mappers';

/** Historial completo (exportaciones). Mismo mapeo que useTransactions: sin anulaciones. */
export const useAllTransactions = (uid) => {
  const [allTransactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, 'transactions'), where('userId', '==', uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(mapTransactionDocs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))));
    }, (error) => {
      console.error('Error fetching all transactions: ', error);
    });

    return () => unsubscribe();
  }, [uid]);

  return allTransactions;
};
