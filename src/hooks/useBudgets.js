import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { callFn } from '../services/api';
import { mapBudgetDoc } from '../utils/mappers';
import { toMinor } from '../utils/money';

/** Límites mensuales por categoría ({ categoría: pesos }). Escritura vía `setBudget`. */
export const useBudgets = (uid) => {
  const [budgets, setBudgets] = useState({});

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onSnapshot(doc(db, 'budgets', uid), (docSnap) => {
      setBudgets(docSnap.exists() ? mapBudgetDoc(docSnap.data()) : {});
    }, (error) => {
      console.error('Error fetching budgets: ', error);
    });

    return () => unsubscribe();
  }, [uid]);

  /** Lanza un Error con mensaje apto para mostrar si el servidor rechaza el valor. */
  const updateBudget = useCallback(async (category, amount) => {
    if (!uid) return;
    await callFn('setBudget', { category, limitMinor: toMinor(amount || 0) });
  }, [uid]);

  return { budgets, updateBudget };
};
