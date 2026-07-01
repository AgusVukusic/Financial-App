import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy, updateDoc } from 'firebase/firestore';

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

  // Calculate totals and category budgets for the filtered period
  const { totalIncome, totalExpense, expensesByCategory } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCategory = {};

    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        if (t.category !== 'Saldo de deuda' && !t.categoryAdjustments) {
          // Normal expense
          expense += t.amount;
          byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        } else if (t.category === 'Saldo de deuda' || t.categoryAdjustments) {
          // Settlement expense (you paid someone back)
          if (t.categoryAdjustments) {
            Object.entries(t.categoryAdjustments).forEach(([cat, amount]) => {
              expense += amount;
              byCategory[cat] = (byCategory[cat] || 0) + amount;
            });
          } else {
            // Fallback for old settlements
            expense += t.amount;
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
          }
        } else {
          expense += t.amount;
          byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        }
      } else if (t.type === 'income') {
        if (t.category !== 'Saldo de deuda') {
          // Normal income
          income += t.amount;
        } else {
          // Settlement income (someone paid you back)
          if (t.categoryAdjustments) {
            Object.entries(t.categoryAdjustments).forEach(([cat, amount]) => {
              // amount is negative for receiver (e.g. Comida: -750)
              expense += amount;
              byCategory[cat] = (byCategory[cat] || 0) + amount;
            });
          } else {
            // Fallback for old settlements: just subtract from global expense
            expense -= t.amount;
          }
        }
      }
    });

    return { totalIncome: income, totalExpense: expense, expensesByCategory: byCategory };
  }, [filteredTransactions]);

  const balance = totalIncome - totalExpense;

  const addTransaction = async (transaction) => {
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
  };

  const updateTransaction = async (id, updatedData) => {
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
  };

  const deleteTransaction = async (id) => {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      throw error;
    }
  };

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
