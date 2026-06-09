import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, arrayUnion, serverTimestamp, getDocs, getDoc, deleteDoc } from 'firebase/firestore';

export const useGroups = (uid, userName) => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'groups'),
      where('membersIds', 'array-contains', uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(data);
    }, (error) => {
      console.error("Error fetching groups: ", error);
    });

    return () => unsubscribe();
  }, [uid]);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createGroup = async (name) => {
    if (!uid) return;
    try {
      const code = generateInviteCode();
      await addDoc(collection(db, 'groups'), {
        name,
        inviteCode: code,
        membersIds: [uid],
        members: [{ uid, name: userName }],
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creating group: ", error);
    }
  };

  const joinGroup = async (code) => {
    if (!uid) return { error: 'No user' };
    try {
      const q = query(collection(db, 'groups'), where('inviteCode', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { error: 'Código inválido' };
      }

      const groupDoc = querySnapshot.docs[0];
      const data = groupDoc.data();

      if (data.membersIds.includes(uid)) {
        return { error: 'Ya estás en este grupo' };
      }

      await updateDoc(doc(db, 'groups', groupDoc.id), {
        membersIds: arrayUnion(uid),
        members: arrayUnion({ uid, name: userName })
      });

      return { success: true };
    } catch (error) {
      console.error("Error joining group: ", error);
      return { error: 'Ocurrió un error al unirse' };
    }
  };

  return { groups, createGroup, joinGroup };
};

export const useGroupDetails = (groupId) => {
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    if (!groupId) return;

    const groupUnsub = onSnapshot(doc(db, 'groups', groupId), (docSnap) => {
      if (docSnap.exists()) {
        setGroup({ id: docSnap.id, ...docSnap.data() });
      }
    });

    const q = query(
      collection(db, `groups/${groupId}/expenses`)
    );

    const expensesUnsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExpenses(data);
    });

    return () => {
      groupUnsub();
      expensesUnsub();
    };
  }, [groupId]);

  const addSharedExpense = async (expenseData) => {
    if (!groupId) return;
    try {
      const docRef = await addDoc(collection(db, `groups/${groupId}/expenses`), {
        ...expenseData,
        createdAt: serverTimestamp()
      });

      // Handle personal transactions
      if (expenseData.isSettlement) {
        // Create Expense for payer
        await addDoc(collection(db, 'transactions'), {
          type: 'expense',
          amount: expenseData.amount,
          description: expenseData.expenseDescription || expenseData.description,
          category: 'Saldo de deuda',
          userId: expenseData.paidBy,
          groupExpenseId: docRef.id,
          groupId: groupId,
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });

        // Create Income for receiver
        const receiverUid = expenseData.receiverUid || Object.keys(expenseData.splits)[0];
        if (receiverUid) {
          await addDoc(collection(db, 'transactions'), {
            type: 'income',
            amount: expenseData.amount,
            description: expenseData.incomeDescription || 'Ingreso por saldo de deuda',
            category: 'Saldo de deuda',
            userId: receiverUid,
            groupExpenseId: docRef.id,
            groupId: groupId,
            date: new Date().toISOString(),
            createdAt: serverTimestamp()
          });
        }
      } else {
        // Normal group expense
        await addDoc(collection(db, 'transactions'), {
          type: 'expense',
          amount: expenseData.amount,
          description: `Gasto de grupo: ${expenseData.description}`,
          category: expenseData.category || 'Comida',
          userId: expenseData.paidBy,
          groupExpenseId: docRef.id,
          groupId: groupId,
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error adding shared expense: ", error);
    }
  };

  const deleteSharedExpense = async (expenseId) => {
    if (!groupId) return;
    try {
      const expenseDocRef = doc(db, `groups/${groupId}/expenses`, expenseId);
      const expenseDoc = await getDoc(expenseDocRef);
      
      if (expenseDoc.exists()) {
        const data = expenseDoc.data();
        if (data.isSettlement && data.settledExpenses) {
          for (const { expId, uidToSettle } of data.settledExpenses) {
            const expToRevertRef = doc(db, `groups/${groupId}/expenses`, expId);
            const expToRevertDoc = await getDoc(expToRevertRef);
            if (expToRevertDoc.exists()) {
              const currentSettledSplits = expToRevertDoc.data().settledSplits || {};
              const newSettledSplits = { ...currentSettledSplits };
              delete newSettledSplits[uidToSettle];
              await updateDoc(expToRevertRef, {
                settledSplits: newSettledSplits
              });
            }
          }
        }
      }

      await deleteDoc(expenseDocRef);
      
      const q = query(collection(db, 'transactions'), where('groupExpenseId', '==', expenseId));
      const querySnapshot = await getDocs(q);
      const deletePromises = [];
      querySnapshot.forEach((docSnap) => {
        deletePromises.push(deleteDoc(docSnap.ref));
      });
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error deleting shared expense: ", error);
    }
  };

  const deleteGroup = async () => {
    if (!groupId) return;
    try {
      await deleteDoc(doc(db, 'groups', groupId));
    } catch (error) {
      console.error("Error deleting group: ", error);
    }
  };

  const updateSharedExpense = async (expenseId, updatedData) => {
    if (!groupId) return;
    try {
      const expenseDocRef = doc(db, `groups/${groupId}/expenses`, expenseId);
      const expenseDoc = await getDoc(expenseDocRef);
      const isSettlement = expenseDoc.exists() ? expenseDoc.data().isSettlement : false;

      await updateDoc(expenseDocRef, updatedData);

      if (updatedData.amount !== undefined) {
        const q = query(collection(db, 'transactions'), where('groupExpenseId', '==', expenseId));
        const querySnapshot = await getDocs(q);
        const updatePromises = [];
        
        querySnapshot.forEach((docSnap) => {
          const txData = docSnap.data();
          if (isSettlement) {
            updatePromises.push(updateDoc(docSnap.ref, {
              amount: updatedData.amount
            }));
          } else {
            if (txData.type === 'expense') {
              updatePromises.push(updateDoc(docSnap.ref, {
                amount: updatedData.amount,
                description: updatedData.description ? `Gasto de grupo: ${updatedData.description}` : txData.description,
                category: updatedData.category || txData.category,
                userId: updatedData.paidBy || txData.userId
              }));
            }
          }
        });
        await Promise.all(updatePromises);
      }
    } catch (error) {
      console.error("Error updating shared expense: ", error);
    }
  };

  return { group, expenses, addSharedExpense, updateSharedExpense, deleteSharedExpense, deleteGroup };
};
