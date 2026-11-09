import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { calculateTotalsAndCategories } from '../utils/calculations';
import { mapTransactionDocs } from '../utils/mappers';
import { toPositiveMinor } from '../utils/money';
import { callFn, newRequestId } from '../services/api';
import { useToast } from '../components/ui/ToastContext';

/** 'YYYY-MM-DD' → mediodía local en ISO (evita corrimientos de día por zona horaria). ISO completo pasa tal cual. */
const toOccurredAt = (date) => {
  if (!date) return new Date().toISOString();
  return String(date).includes('T') ? new Date(date).toISOString() : new Date(`${date}T12:00:00`).toISOString();
};

/** Campos comunes de createTransaction / replaceTransaction a partir de los datos del formulario. */
const toPayload = (data) => {
  const payload = {
    kind: data.type, // 'expense' | 'income' | 'transfer'
    accountId: data.accountId,
    amountMinor: toPositiveMinor(data.amount),
    category: data.category || '',
    description: data.description || '',
    occurredAt: toOccurredAt(data.date),
  };
  if (data.type === 'transfer') payload.toAccountId = data.transferToAccountId;
  return payload;
};

/**
 * Movimientos del mes seleccionado. Lectura en tiempo real; escritura solo vía Cloud Functions.
 * Los movimientos son inmutables (ADR 001): editar = reemplazar (atómico), eliminar = anular.
 */
export const useTransactions = (selectedMonth, selectedYear, uid) => {
  const [transactions, setTransactions] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (!uid) return;

    // occurredAt es un Timestamp: los límites deben ser Date (con strings la consulta vuelve vacía sin error).
    const startOfMonth = new Date(selectedYear, selectedMonth, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', uid),
      where('occurredAt', '>=', startOfMonth),
      where('occurredAt', '<=', endOfMonth)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = mapTransactionDocs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      // Orden local por fecha y, a igual fecha, por creación (evita índices compuestos extra)
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
      console.error('Error fetching transactions: ', error);
      showToast('Error de conexión o falta índice en Firestore. Revisa la consola.', 'error', 5000);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, selectedMonth, selectedYear]);

  const { totalIncome, totalExpense, expensesByCategory } = useMemo(
    () => calculateTotalsAndCategories(transactions),
    [transactions]
  );

  const balance = totalIncome - totalExpense;

  /** data: { type, amount (pesos), accountId, transferToAccountId?, category, description, date, requestId? } */
  const addTransaction = useCallback(async (data) => {
    if (!uid) return;
    await callFn('createTransaction', { requestId: data.requestId ?? newRequestId(), ...toPayload(data) });
  }, [uid]);

  /** Reemplaza (anula + crea) en una sola operación atómica del servidor. */
  const updateTransaction = useCallback(async (id, data) => {
    if (!uid) return;
    await callFn('replaceTransaction', { transactionId: id, requestId: data.requestId ?? newRequestId(), ...toPayload(data) });
  }, [uid]);

  /** "Eliminar" = anular con movimiento compensatorio. */
  const deleteTransaction = useCallback(async (id) => {
    if (!uid) return;
    await callFn('voidTransaction', { transactionId: id });
  }, [uid]);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    totalIncome,
    totalExpense,
    expensesByCategory,
    balance,
  };
};
