import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

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
      // Sort locally to avoid needing a composite index in Firestore
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
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

  // Calculate totals for the filtered period
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  const addTransaction = async (transaction) => {
    if (!uid) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        userId: uid,
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding transaction: ", error);
    }
  };

  const deleteTransaction = async (id) => {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error("Error deleting transaction: ", error);
    }
  };

  return {
    transactions: filteredTransactions,
    allTransactions: transactions,
    addTransaction,
    deleteTransaction,
    totalIncome,
    totalExpense,
    balance
  };
};
