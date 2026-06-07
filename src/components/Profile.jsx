import React, { useState } from 'react';
import { User, Settings, Trash2, Shield, PlusCircle, CreditCard, FileText, Zap } from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { formatCurrency, exportToPDF } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { useDialog } from '../contexts/DialogContext';

const Profile = ({ userName, uid, onClearData, onExportData, onPaySubscription, onAddTransaction, allTransactions }) => {
  const { subscriptions, addSubscription, deleteSubscription } = useSubscriptions(uid);
  const { confirm, alert } = useDialog();
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [subForm, setSubForm] = useState({ description: '', amount: '', category: 'Servicios' });

  const handleClearData = async () => {
    const isConfirmed = await confirm("¿Estás seguro de que deseas cerrar sesión? (Tus datos en la nube no se borrarán)");
    if (isConfirmed) {
      onClearData();
    }
  };

  const handleAddSub = (e) => {
    e.preventDefault();
    if (!subForm.amount || !subForm.description) return;
    addSubscription({
      description: subForm.description,
      amount: parseFloat(subForm.amount),
      category: subForm.category,
      type: 'expense'
    });
    setIsAddingSub(false);
    setSubForm({ description: '', amount: '', category: 'Servicios' });
  };

  const handleExecuteSubscriptions = async () => {
    if (subscriptions.length === 0) {
      await alert('No tienes cobros fijos configurados.');
      return;
    }
    const isConfirmed = await confirm(`¿Ejecutar ${subscriptions.length} cobros fijos ahora? Esto añadirá los gastos a tus transacciones del mes.`);
    if (isConfirmed) {
      subscriptions.forEach(sub => {
        onAddTransaction({
          description: sub.description,
          amount: sub.amount,
          category: sub.category,
          type: 'expense'
        });
      });
      await alert('Cobros fijos ejecutados correctamente.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="profile-container" style={{ padding: 'var(--spacing-md) 0' }}>
      <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Mi Perfil</h2>
      
      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          <User size={32} color="white" />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</h3>
          <p className="text-secondary" style={{ margin: 0, fontSize: '0.9rem' }}>Plan Cloud Activo</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Gastos Fijos / Recurrentes</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleExecuteSubscriptions} title="Ejecutar cobros fijos" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Zap size={20} />
              </button>
              <button onClick={() => setIsAddingSub(!isAddingSub)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                <PlusCircle size={24} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isAddingSub && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleAddSub} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <input type="text" placeholder="Ej. Universidad, Netflix" required value={subForm.description} onChange={e => setSubForm({...subForm, description: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }} />
                <input type="number" placeholder="Monto base estimado" required value={subForm.amount} onChange={e => setSubForm({...subForm, amount: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }} />
                <select value={subForm.category} onChange={e => setSubForm({...subForm, category: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                  <option value="Servicios">Servicios</option>
                  <option value="Hogar">Hogar</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Otros">Otros</option>
                </select>
                <button type="submit" style={{ background: 'var(--accent-primary)', color: 'white', padding: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Guardar Fijo</button>
              </motion.form>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {subscriptions.map(sub => (
              <motion.div key={sub.id} layout style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{sub.description}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatCurrency(sub.amount)} aprox.</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => onPaySubscription(sub)} style={{ background: 'var(--success-bg)', color: 'var(--success)', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CreditCard size={14} /> Pagar
                  </button>
                  <button onClick={() => deleteSubscription(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
            {subscriptions.length === 0 && !isAddingSub && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>No tienes gastos fijos registrados.</p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button onClick={() => exportToPDF(allTransactions || [])} className="glass-panel" style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', flex: 1, cursor: 'pointer', color: 'var(--text-primary)' }}>
            <FileText size={20} className="text-secondary" />
            <span style={{ fontSize: '0.95rem' }}>PDF</span>
          </button>
          <button onClick={onExportData} className="glass-panel" style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', flex: 1, cursor: 'pointer', color: 'var(--text-primary)' }}>
            <Shield size={20} className="text-secondary" />
            <span style={{ fontSize: '0.95rem' }}>CSV</span>
          </button>
        </div>

        <button 
          onClick={handleClearData}
          className="glass-panel" 
          style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', border: '1px solid var(--danger-bg)', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--danger)', marginTop: 'var(--spacing-md)' }}
        >
          <User size={20} />
          <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: '500' }}>Cerrar sesión</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Profile;
