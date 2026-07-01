import React from 'react';
import { User, Shield, FileText } from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { exportToPDF } from '../utils/formatters';
import { motion } from 'framer-motion';
import { useDialog } from '../contexts/DialogContext';
import Card from './ui/Card';
import Button from './ui/Button';
import SubscriptionsCard from './profile/SubscriptionsCard';

const Profile = ({ userName, uid, onClearData, onExportData, onPaySubscription, onAddTransaction, allTransactions }) => {
  const { subscriptions, addSubscription, deleteSubscription, editSubscription } = useSubscriptions(uid);
  const { confirm, alert } = useDialog();
  const handleClearData = async () => {
    const isConfirmed = await confirm("¿Estás seguro de que deseas cerrar sesión? (Tus datos en la nube no se borrarán)");
    if (isConfirmed) {
      onClearData();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="profile-container" style={{ padding: 'var(--spacing-md) 0' }}>
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
        <SubscriptionsCard
          subscriptions={subscriptions}
          addSubscription={addSubscription}
          deleteSubscription={deleteSubscription}
          editSubscription={editSubscription}
          onPaySubscription={onPaySubscription}
          onAddTransaction={onAddTransaction}
        />

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Card style={{ flex: 1, padding: 0 }}>
            <Button variant="ghost" onClick={() => exportToPDF(allTransactions || [])} style={{ width: '100%', height: '100%', padding: 'var(--spacing-md)', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <FileText size={20} className="text-secondary" />
              <span>PDF</span>
            </Button>
          </Card>
          <Card style={{ flex: 1, padding: 0 }}>
            <Button variant="ghost" onClick={onExportData} style={{ width: '100%', height: '100%', padding: 'var(--spacing-md)', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <Shield size={20} className="text-secondary" />
              <span>CSV</span>
            </Button>
          </Card>
        </div>

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
