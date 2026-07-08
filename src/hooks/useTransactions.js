import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { calculateTotalsAndCategories } from '../utils/calculations';
import { useToast } from '../components/ui/ToastContext';

export const useTransactions = (selectedMonth, selectedYear, uid) => {
  const [transactions, setTransactions] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (!uid) return;

    // Create the date bounds for the selected month
    const startOfMonth = new Date(selectedYear, selectedMonth, 1).toISOString();
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999).toISOString();

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', uid),
      where('date', '>=', startOfMonth),
      where('date', '<=', endOfMonth)
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
      showToast("Error de conexión o falta índice en Firestore. Revisa la consola.", "error", 5000);
    });

    return () => unsubscribe();
  }, [uid, selectedMonth, selectedYear]);

  const { totalIncome, totalExpense, expensesByCategory } = useMemo(() => {
    return calculateTotalsAndCategories(transactions);
  }, [transactions]);

  const balance = totalIncome - totalExpense;

  const addTransaction = useCallback(async (data) => {
    if (!uid) return;
    try {
      await runTransaction(db, async (transactionContext) => {
        const affectedAccountIds = new Set();
        if (data.accountId) affectedAccountIds.add(data.accountId);
        if (data.type === 'transfer' && data.transferToAccountId) affectedAccountIds.add(data.transferToAccountId);

        const accountsData = {};
        for (const accId of affectedAccountIds) {
           const ref = doc(db, 'accounts', accId);
           const docSnap = await transactionContext.get(ref);
           if (docSnap.exists()) {
               accountsData[accId] = {
                   ref,
                   balance: docSnap.data().currentBalance !== undefined ? docSnap.data().currentBalance : (docSnap.data().initialBalance || 0)
               };
           }
        }

        if (data.accountId && accountsData[data.accountId]) {
             if (data.type === 'expense') accountsData[data.accountId].balance -= data.amount;
             if (data.type === 'income') accountsData[data.accountId].balance += data.amount;
             if (data.type === 'transfer') accountsData[data.accountId].balance -= data.amount;
        }
        if (data.type === 'transfer' && data.transferToAccountId && accountsData[data.transferToAccountId]) {
             accountsData[data.transferToAccountId].balance += data.amount;
        }

        for (const accId of affectedAccountIds) {
           if (accountsData[accId]) {
               transactionContext.update(accountsData[accId].ref, { currentBalance: accountsData[accId].balance });
           }
        }

        const newTxRef = doc(collection(db, 'transactions'));
        transactionContext.set(newTxRef, {
          ...data,
          userId: uid,
          date: data.date ? new Date(data.date + 'T12:00:00').toISOString() : new Date().toISOString(),
          createdAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error("Error adding transaction: ", error);
      throw error;
    }
  }, [uid]);

  const updateTransaction = useCallback(async (id, updatedData) => {
    if (!uid) return;
    try {
      await runTransaction(db, async (transactionContext) => {
        const txRef = doc(db, 'transactions', id);
        const txDoc = await transactionContext.get(txRef);
        if (!txDoc.exists()) throw new Error("Transaction not found");
        const oldTx = txDoc.data();

        const affectedAccountIds = new Set();
        if (oldTx.accountId) affectedAccountIds.add(oldTx.accountId);
        if (oldTx.transferToAccountId) affectedAccountIds.add(oldTx.transferToAccountId);
        if (updatedData.accountId) affectedAccountIds.add(updatedData.accountId);
        if (updatedData.transferToAccountId) affectedAccountIds.add(updatedData.transferToAccountId);

        const accountsData = {};
        for (const accId of affectedAccountIds) {
           const ref = doc(db, 'accounts', accId);
           const docSnap = await transactionContext.get(ref);
           if (docSnap.exists()) {
               accountsData[accId] = {
                   ref,
                   balance: docSnap.data().currentBalance !== undefined ? docSnap.data().currentBalance : (docSnap.data().initialBalance || 0)
               };
           }
        }

        // Revert old
        if (oldTx.accountId && accountsData[oldTx.accountId]) {
             if (oldTx.type === 'expense') accountsData[oldTx.accountId].balance += oldTx.amount;
             if (oldTx.type === 'income') accountsData[oldTx.accountId].balance -= oldTx.amount;
             if (oldTx.type === 'transfer') accountsData[oldTx.accountId].balance += oldTx.amount;
        }
        if (oldTx.type === 'transfer' && oldTx.transferToAccountId && accountsData[oldTx.transferToAccountId]) {
             accountsData[oldTx.transferToAccountId].balance -= oldTx.amount;
        }

        // Apply new
        const newType = updatedData.type !== undefined ? updatedData.type : oldTx.type;
        const newAmount = updatedData.amount !== undefined ? updatedData.amount : oldTx.amount;
        const newAccountId = updatedData.accountId !== undefined ? updatedData.accountId : oldTx.accountId;
        const newTransferToAccountId = updatedData.transferToAccountId !== undefined ? updatedData.transferToAccountId : oldTx.transferToAccountId;

        if (newAccountId && accountsData[newAccountId]) {
             if (newType === 'expense') accountsData[newAccountId].balance -= newAmount;
             if (newType === 'income') accountsData[newAccountId].balance += newAmount;
             if (newType === 'transfer') accountsData[newAccountId].balance -= newAmount;
        }
        if (newType === 'transfer' && newTransferToAccountId && accountsData[newTransferToAccountId]) {
             accountsData[newTransferToAccountId].balance += newAmount;
        }

        for (const accId of affectedAccountIds) {
           if (accountsData[accId]) {
               transactionContext.update(accountsData[accId].ref, { currentBalance: accountsData[accId].balance });
           }
        }

        const dataToUpdate = { ...updatedData };
        if (dataToUpdate.date) {
          dataToUpdate.date = new Date(dataToUpdate.date + 'T12:00:00').toISOString();
        }
        transactionContext.update(txRef, dataToUpdate);
      });
    } catch (error) {
      console.error("Error updating transaction: ", error);
      throw error;
    }
  }, [uid]);

  const deleteTransaction = useCallback(async (id) => {
    if (!uid) return;
    try {
      await runTransaction(db, async (transactionContext) => {
        const txRef = doc(db, 'transactions', id);
        const txDoc = await transactionContext.get(txRef);
        if (!txDoc.exists()) throw new Error("Transaction not found");
        const txData = txDoc.data();

        const affectedAccountIds = new Set();
        if (txData.accountId) affectedAccountIds.add(txData.accountId);
        if (txData.transferToAccountId) affectedAccountIds.add(txData.transferToAccountId);

        const accountsData = {};
        for (const accId of affectedAccountIds) {
           const ref = doc(db, 'accounts', accId);
           const docSnap = await transactionContext.get(ref);
           if (docSnap.exists()) {
               accountsData[accId] = {
                   ref,
                   balance: docSnap.data().currentBalance !== undefined ? docSnap.data().currentBalance : (docSnap.data().initialBalance || 0)
               };
           }
        }

        if (txData.accountId && accountsData[txData.accountId]) {
             if (txData.type === 'expense') accountsData[txData.accountId].balance += txData.amount;
             if (txData.type === 'income') accountsData[txData.accountId].balance -= txData.amount;
             if (txData.type === 'transfer') accountsData[txData.accountId].balance += txData.amount;
        }
        if (txData.type === 'transfer' && txData.transferToAccountId && accountsData[txData.transferToAccountId]) {
             accountsData[txData.transferToAccountId].balance -= txData.amount;
        }

        for (const accId of affectedAccountIds) {
           if (accountsData[accId]) {
               transactionContext.update(accountsData[accId].ref, { currentBalance: accountsData[accId].balance });
           }
        }

        transactionContext.delete(txRef);
      });
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      throw error;
    }
  }, [uid]);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    totalIncome,
    totalExpense,
    expensesByCategory,
    balance
  };
};
