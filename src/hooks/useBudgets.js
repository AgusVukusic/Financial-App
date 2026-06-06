import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export const useBudgets = (uid) => {
  const [budgets, setBudgets] = useState({});

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onSnapshot(doc(db, 'budgets', uid), (docSnap) => {
      if (docSnap.exists()) {
        setBudgets(docSnap.data());
      } else {
        setBudgets({});
      }
    });

    return () => unsubscribe();
  }, [uid]);

  const updateBudget = async (category, amount) => {
    if (!uid) return;
    try {
      const newBudgets = {
        ...budgets,
        [category]: parseFloat(amount) || 0,
        userId: uid
      };
      await setDoc(doc(db, 'budgets', uid), newBudgets, { merge: true });
    } catch (error) {
      console.error("Error updating budget: ", error);
    }
  };

  return { budgets, updateBudget };
};
