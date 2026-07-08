import React, { useState } from 'react';
import Button from './ui/Button';
import { AlertCircle, Check } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { useToast } from './ui/ToastContext';
import Card from './ui/Card';

const MigrationButton = ({ uid, accounts }) => {
  const [migrating, setMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const { showToast } = useToast();

  const handleMigration = async () => {
    if (!uid) return;
    setMigrating(true);
    
    try {
      const q = query(collection(db, 'transactions'), where('userId', '==', uid));
      const snapshot = await getDocs(q);
      const allTransactions = snapshot.docs.map(doc => doc.data());

      const balances = {};
      accounts.forEach(acc => { balances[acc.id] = acc.initialBalance || 0; });

      allTransactions.forEach(t => {
        if (t.type === 'income' && t.accountId && balances[t.accountId] !== undefined) {
          balances[t.accountId] += t.amount;
        } else if (t.type === 'expense' && t.accountId && balances[t.accountId] !== undefined) {
          balances[t.accountId] -= t.amount;
        } else if (t.type === 'transfer') {
          if (t.accountId && balances[t.accountId] !== undefined) balances[t.accountId] -= t.amount;
          if (t.transferToAccountId && balances[t.transferToAccountId] !== undefined) balances[t.transferToAccountId] += t.amount;
        }
      });

      const batch = writeBatch(db);
      accounts.forEach(acc => {
        const accRef = doc(db, 'accounts', acc.id);
        batch.update(accRef, { currentBalance: balances[acc.id] });
      });

      await batch.commit();
      setMigrated(true);
      showToast("Saldos migrados correctamente.", "success");
    } catch (error) {
      console.error(error);
      showToast("Error en la migración.", "error");
    } finally {
      setMigrating(false);
    }
  };

  // Only show migration button if there is any account missing currentBalance
  const needsMigration = accounts.some(acc => acc.currentBalance === undefined);

  if (!needsMigration && !migrated) return null;

  return (
    <Card style={{ padding: 'var(--spacing-md)', borderLeft: '4px solid var(--accent-primary)', marginBottom: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-sm)' }}>
        <AlertCircle color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '4px' }} />
        <div>
          <h4 style={{ margin: '0 0 var(--spacing-xs) 0', color: 'var(--text-primary)' }}>Acción Requerida: Migrar Saldos</h4>
          <p style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Hemos actualizado el sistema para que la aplicación sea mucho más rápida. Por favor, haz clic en el botón para sincronizar tus saldos históricos.
          </p>
          <Button 
            variant="primary" 
            onClick={handleMigration} 
            disabled={migrating || migrated}
            style={{ fontSize: '0.9rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {migrating ? 'Sincronizando...' : migrated ? <><Check size={16} /> ¡Migrado!</> : 'Migrar Saldos Ahora'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MigrationButton;
