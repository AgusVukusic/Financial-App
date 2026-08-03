import React from 'react';
import { User, Shield, FileText } from 'lucide-react';
import { exportToPDF, exportToCSV } from '../utils/formatters';
import { motion } from 'framer-motion';
import { useDialog } from '../contexts/DialogContext';
import Card from './ui/Card';
import Button from './ui/Button';
import { useAllTransactions } from '../hooks/useAllTransactions';
import MigrationButton from './MigrationButton';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { RefreshCw } from 'lucide-react';
import { useToast } from './ui/ToastContext';

const Profile = ({ userName, uid, onClearData, accounts }) => {
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const allTransactions = useAllTransactions(uid);

  const handleRecalculateBalances = async () => {
    const isConfirmed = await confirm("¿Quieres resincronizar los saldos de tus cuentas basados en tu historial de transacciones?");
    if (!isConfirmed) return;

    try {
      showToast("Sincronizando saldos...", "info");
      
      const updatePromises = accounts.map(async (acc) => {
        let trueBalance = acc.initialBalance || 0;
        
        allTransactions.forEach(tx => {
          if (tx.accountId === acc.id) {
            if (tx.type === 'expense') trueBalance -= tx.amount;
            if (tx.type === 'income') trueBalance += tx.amount;
            if (tx.type === 'transfer') trueBalance -= tx.amount;
          }
          if (tx.type === 'transfer' && tx.transferToAccountId === acc.id) {
            trueBalance += tx.amount;
          }
        });

        const accRef = doc(db, 'accounts', acc.id);
        return updateDoc(accRef, { currentBalance: trueBalance });
      });

      await Promise.all(updatePromises);
      showToast("Saldos sincronizados correctamente", "success");
    } catch (error) {
      console.error("Error sincronizando saldos:", error);
      showToast("Error al sincronizar saldos", "error");
    }
  };

  const handleClearData = async () => {
    const isConfirmed = await confirm("¿Estás seguro de que deseas cerrar sesión? (Tus datos en la nube no se borrarán)");
    if (isConfirmed) {
      onClearData();
    }
  };

  const handleExportData = () => {
    exportToCSV(allTransactions);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="profile-container" style={{ padding: 'var(--spacing-md) 0' }}>
      <MigrationButton uid={uid} accounts={accounts || []} />
      
      <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Mi Perfil</h2>
      
      <Card className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          <User size={32} color="white" />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</h3>
          <p className="text-secondary" style={{ margin: 0, fontSize: '0.9rem' }}>Plan Cloud Activo</p>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Card style={{ flex: 1, padding: 0 }}>
            <Button variant="ghost" onClick={() => exportToPDF(allTransactions || [])} style={{ width: '100%', height: '100%', padding: 'var(--spacing-md)', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <FileText size={20} className="text-secondary" />
              <span>PDF</span>
            </Button>
          </Card>
          <Card style={{ flex: 1, padding: 0 }}>
            <Button variant="ghost" onClick={handleExportData} style={{ width: '100%', height: '100%', padding: 'var(--spacing-md)', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <Shield size={20} className="text-secondary" />
              <span>CSV</span>
            </Button>
          </Card>
        </div>

        <Button 
          variant="outline" 
          onClick={handleRecalculateBalances}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', justifyContent: 'center' }}
        >
          <RefreshCw size={20} className="text-secondary" />
          <span>Sincronizar Saldos</span>
        </Button>

        <Button 
          variant="danger" 
          onClick={handleClearData}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', justifyContent: 'center', marginTop: 'var(--spacing-md)' }}
        >
          <User size={20} />
          <span>Cerrar sesión</span>
        </Button>
      </div>
    </motion.div>
  );
};

export default Profile;
