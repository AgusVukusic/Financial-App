import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { calculateTotalsAndCategories } from '../utils/calculations';

export const useTransactions = (selectedMonth, selectedYear, uid) => {
  const [transactions, setTransactions] = useState([]);

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
      // Sort locally by date, and fallback to createdAt for transactions on the same day
      data.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff === 0) {
           const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
           const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
           return timeB - timeA;
        }
        return dateDiff;
      });
      setTransactions(data);
    }, (error) => {
      console.error("Error fetching transactions: ", error);
    });

    return () => unsubscribe();
  }, [uid]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const date = new Date(t.date);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Calculate totals and category budgets for the filtered period
  // Calculate totals and category budgets for the filtered period
  const { totalIncome, totalExpense, expensesByCategory } = useMemo(() => {
    return calculateTotalsAndCategories(filteredTransactions);
  }, [filteredTransactions]);

  const balance = totalIncome - totalExpense;

  const addTransaction = useCallback(async (transaction) => {
    if (!uid) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        userId: uid,
        date: transaction.date ? new Date(transaction.date + 'T12:00:00').toISOString() : new Date().toISOString(),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding transaction: ", error);
      throw error;
    }
  }, [uid]);

  const updateTransaction = useCallback(async (id, updatedData) => {
    if (!uid) return;
    try {
      const dataToUpdate = { ...updatedData };
      if (dataToUpdate.date) {
        dataToUpdate.date = new Date(dataToUpdate.date + 'T12:00:00').toISOString();
      }
      await updateDoc(doc(db, 'transactions', id), dataToUpdate);
    } catch (error) {
      console.error("Error updating transaction: ", error);
      throw error;
    }
  }, [uid]);

  const deleteTransaction = useCallback(async (id) => {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      throw error;
    }
  }, [uid]);

  return {
    transactions: filteredTransactions,
    allTransactions: transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    totalIncome,
    totalExpense,
    expensesByCategory,
    balance
  };
};
