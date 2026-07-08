import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

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
    const q = query(
      collection(db, 'accounts'),
      where('userId', '==', uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by creation date or name
      data.sort((a, b) => a.name.localeCompare(b.name));
      setAccounts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching accounts: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const addAccount = useCallback(async (accountData) => {
    if (!uid) return null;
    try {
      const docRef = await addDoc(collection(db, 'accounts'), {
        ...accountData,
        userId: uid,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding account: ", error);
      throw error;
    }
  }, [uid]);

  const updateAccount = useCallback(async (id, updatedData) => {
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'accounts', id), updatedData);
    } catch (error) {
      console.error("Error updating account: ", error);
      throw error;
    }
  }, [uid]);

  const deleteAccount = useCallback(async (id) => {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'accounts', id));
    } catch (error) {
      console.error("Error deleting account: ", error);
      throw error;
    }
  }, [uid]);

  return {
    accounts,
    loadingAccounts: loading,
    addAccount,
    updateAccount,
    deleteAccount
  };
};
