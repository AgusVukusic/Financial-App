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

      const transactionIds = [];

      // Handle personal transactions
      if (expenseData.isSettlement) {
        // Create Expense for payer
        const tx1 = await addDoc(collection(db, 'transactions'), {
          type: 'expense',
          amount: expenseData.amount,
          description: expenseData.expenseDescription || expenseData.description,
          category: 'Saldo de deuda',
          userId: expenseData.paidBy,
          accountId: expenseData.payerAccountId || null, // NEW
          groupExpenseId: docRef.id,
          groupId: groupId,
          date: new Date().toISOString(),
          categoryAdjustments: expenseData.categoryAdjustmentsPayer || null,
          createdAt: serverTimestamp()
        });
        transactionIds.push(tx1.id);

        let finalStatus = expenseData.status;

        // If not pending (backward compatibility or immediate settlement) OR isCashPayment
        if (expenseData.status !== 'pending' || expenseData.isCashPayment) {
          const receiverUid = expenseData.receiverUid;
          if (receiverUid) {
            let receiverAccountId = null;
            if (expenseData.isCashPayment) {
              const accQ = query(collection(db, 'accounts'), where('userId', '==', receiverUid));
              const accSnap = await getDocs(accQ);
              const cashAcc = accSnap.docs.find(doc => doc.data().type === 'cash' || doc.data().name?.toLowerCase().includes('efectivo'));
              if (cashAcc) {
                receiverAccountId = cashAcc.id;
              }
              finalStatus = 'completed'; // auto-complete if cash payment
            }

            const tx2 = await addDoc(collection(db, 'transactions'), {
              type: 'income',
              amount: expenseData.amount,
              description: expenseData.incomeDescription || 'Ingreso por saldo de deuda',
              category: 'Saldo de deuda',
              groupId: groupId,
              groupExpenseId: docRef.id,
              userId: receiverUid,
              accountId: receiverAccountId,
              date: new Date().toISOString(),
              categoryAdjustments: expenseData.categoryAdjustmentsReceiver || null,
              createdAt: serverTimestamp()
            });
            transactionIds.push(tx2.id);
          }
        }

        if (finalStatus !== expenseData.status) {
           await updateDoc(doc(db, `groups/${groupId}/expenses`, docRef.id), { status: finalStatus });
        }
      } else {
        // Normal group expense
        const tx = await addDoc(collection(db, 'transactions'), {
          type: 'expense',
          amount: expenseData.amount,
          description: `Gasto de grupo: ${expenseData.description}`,
          category: expenseData.category || 'Comida',
          userId: expenseData.paidBy,
          accountId: expenseData.accountId || null, // NEW
          groupExpenseId: docRef.id,
          groupId: groupId,
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
        transactionIds.push(tx.id);
      }

      if (transactionIds.length > 0) {
        await updateDoc(doc(db, `groups/${groupId}/expenses`, docRef.id), {
          transactionIds
        });
      }
    } catch (error) {
      console.error("Error adding shared expense: ", error);
    }
  };

  const confirmSettlement = async (expenseId, receiverUid, receiverAccountId, incomeDescription, categoryAdjustmentsReceiver) => {
    if (!groupId) return;
    try {
      const expenseDocRef = doc(db, `groups/${groupId}/expenses`, expenseId);
      const expenseDoc = await getDoc(expenseDocRef);
      
      if (!expenseDoc.exists()) return;
      const data = expenseDoc.data();

      // Create Income for receiver
      const tx = await addDoc(collection(db, 'transactions'), {
        type: 'income',
        amount: data.amount,
        description: incomeDescription || 'Ingreso por saldo de deuda',
        category: 'Saldo de deuda',
        groupId: groupId,
        groupExpenseId: expenseId,
        userId: receiverUid,
        accountId: receiverAccountId || null,
        date: new Date().toISOString(),
        categoryAdjustments: categoryAdjustmentsReceiver || null,
        createdAt: serverTimestamp()
      });

      const newTransactionIds = [...(data.transactionIds || []), tx.id];

      await updateDoc(expenseDocRef, {
        status: 'completed',
        transactionIds: newTransactionIds
      });

    } catch (error) {
      console.error("Error confirming settlement: ", error);
    }
  };

  const deleteSharedExpense = async (expenseId) => {
    if (!groupId) return;
    try {
      const expenseDocRef = doc(db, `groups/${groupId}/expenses`, expenseId);
      const expenseDoc = await getDoc(expenseDocRef);
      
      let transactionIdsToFallback = null;

      if (expenseDoc.exists()) {
        const data = expenseDoc.data();
        transactionIdsToFallback = data.transactionIds;
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
      
      if (transactionIdsToFallback) {
        const deletePromises = transactionIdsToFallback.map(id => deleteDoc(doc(db, 'transactions', id)));
        await Promise.all(deletePromises);
      } else {
        const q = query(collection(db, 'transactions'), where('groupExpenseId', '==', expenseId));
        const querySnapshot = await getDocs(q);
        const deletePromises = [];
        querySnapshot.forEach((docSnap) => {
          deletePromises.push(deleteDoc(docSnap.ref));
        });
        await Promise.all(deletePromises);
      }
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
        const data = expenseDoc.exists() ? expenseDoc.data() : null;
        
        const processTxDoc = async (txRef, txData) => {
          if (isSettlement) {
            return updateDoc(txRef, { amount: updatedData.amount });
          } else {
            if (txData.type === 'expense') {
              return updateDoc(txRef, {
                amount: updatedData.amount,
                description: updatedData.description ? `Gasto de grupo: ${updatedData.description}` : txData.description,
                category: updatedData.category || txData.category,
                userId: updatedData.paidBy || txData.userId,
                // optionally update accountId here if needed, but omitted for simplicity
              });
            }
          }
        };

        if (data && data.transactionIds) {
          const updatePromises = data.transactionIds.map(async (id) => {
            const txRef = doc(db, 'transactions', id);
            const txDoc = await getDoc(txRef);
            if (txDoc.exists()) {
              return processTxDoc(txRef, txDoc.data());
            }
          });
          await Promise.all(updatePromises);
        } else {
          const q = query(collection(db, 'transactions'), where('groupExpenseId', '==', expenseId));
          const querySnapshot = await getDocs(q);
          const updatePromises = [];
          
          querySnapshot.forEach((docSnap) => {
            updatePromises.push(processTxDoc(docSnap.ref, docSnap.data()));
          });
          await Promise.all(updatePromises);
        }
      }
    } catch (error) {
      console.error("Error updating shared expense: ", error);
    }
  };

  return { group, expenses, addSharedExpense, confirmSettlement, updateSharedExpense, deleteSharedExpense, deleteGroup };
};
