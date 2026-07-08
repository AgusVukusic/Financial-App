import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const useAllTransactions = (uid) => {
  const [allTransactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(data);
    });

    return () => unsubscribe();
  }, [uid]);

  return allTransactions;
};
