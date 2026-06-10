import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const useSubscriptions = (uid) => {
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubscriptions(data);
    }, (error) => {
      console.error("Error fetching subscriptions: ", error);
    });

    return () => unsubscribe();
  }, [uid]);

  const addSubscription = async (sub) => {
    if (!uid) return;
    try {
      await addDoc(collection(db, 'subscriptions'), {
        ...sub,
        userId: uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding subscription: ", error);
    }
  };

  const deleteSubscription = async (id) => {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'subscriptions', id));
    } catch (error) {
      console.error("Error deleting subscription: ", error);
    }
  };

  const editSubscription = async (id, updatedData) => {
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'subscriptions', id), updatedData);
    } catch (error) {
      console.error("Error editing subscription: ", error);
    }
  };

  return { subscriptions, addSubscription, deleteSubscription, editSubscription };
};
