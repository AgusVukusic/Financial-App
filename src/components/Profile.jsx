import React, { useState } from 'react';
import { User, Settings, Trash2, Shield, PlusCircle, CreditCard, FileText, Zap, Edit2, X, Check } from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { formatCurrency, exportToPDF } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { useDialog } from '../contexts/DialogContext';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';

const Profile = ({ userName, uid, onClearData, onExportData, onPaySubscription, onAddTransaction, allTransactions }) => {
  const { subscriptions, addSubscription, deleteSubscription, editSubscription } = useSubscriptions(uid);
  const { confirm, alert } = useDialog();
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState(null);
  const [subForm, setSubForm] = useState({ description: '', amount: '', category: 'Servicios' });

  const handleClearData = async () => {
    const isConfirmed = await confirm("¿Estás seguro de que deseas cerrar sesión? (Tus datos en la nube no se borrarán)");
    if (isConfirmed) {
      onClearData();
    }
  };

  const handleAddOrEditSub = (e) => {
    e.preventDefault();
    if (!subForm.amount || !subForm.description) return;
    
    if (editingSubId) {
      editSubscription(editingSubId, {
        description: subForm.description,
        amount: parseFloat(subForm.amount),
        category: subForm.category
      });
      setEditingSubId(null);
    } else {
      addSubscription({
        description: subForm.description,
        amount: parseFloat(subForm.amount),
        category: subForm.category,
        type: 'expense'
      });
    }
    
    setIsAddingSub(false);
    setSubForm({ description: '', amount: '', category: 'Servicios' });
  };

  const startEditing = (sub) => {
    setEditingSubId(sub.id);
    setSubForm({ description: sub.description, amount: sub.amount, category: sub.category || 'Servicios' });
    setIsAddingSub(true);
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
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Gastos Fijos / Recurrentes</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" onClick={handleExecuteSubscriptions} title="Ejecutar cobros fijos" style={{ color: 'var(--success)', padding: '8px' }}>
                <Zap size={20} />
              </Button>
              <Button variant="ghost" onClick={() => {
                if (isAddingSub) {
                  setIsAddingSub(false);
                  setEditingSubId(null);
                  setSubForm({ description: '', amount: '', category: 'Servicios' });
                } else {
                  setIsAddingSub(true);
                }
              }} style={{ color: 'var(--accent-primary)', padding: '8px' }}>
                {isAddingSub ? <X size={24} /> : <PlusCircle size={24} />}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {isAddingSub && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleAddOrEditSub} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <Input type="text" placeholder="Ej. Universidad, Netflix" required value={subForm.description} onChange={e => setSubForm({...subForm, description: e.target.value})} />
                <Input type="number" placeholder="Monto base estimado" required value={subForm.amount} onChange={e => setSubForm({...subForm, amount: e.target.value})} />
                <Select value={subForm.category} onChange={e => setSubForm({...subForm, category: e.target.value})}>
                  {['Servicios', 'Hogar', 'Transporte', 'Otros'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
                <Button type="submit" variant="primary" style={{ marginTop: '4px' }}>
                  {editingSubId ? 'Actualizar Fijo' : 'Guardar Fijo'}
                </Button>
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
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Button variant="ghost" onClick={() => onPaySubscription(sub)} style={{ color: 'var(--success)', padding: '6px' }} title="Pagar">
                    <Check size={16} />
                  </Button>
                  <Button variant="ghost" onClick={() => startEditing(sub)} style={{ color: 'var(--accent-primary)', padding: '6px' }} title="Editar">
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="ghost" onClick={() => deleteSubscription(sub.id)} style={{ color: 'var(--danger)', padding: '6px' }} title="Eliminar">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </motion.div>
            ))}
            {subscriptions.length === 0 && !isAddingSub && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>No tienes gastos fijos registrados.</p>
            )}
          </div>
        </Card>

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
