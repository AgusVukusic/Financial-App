import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Zap, Edit2, X, Check, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useDialog } from '../../contexts/DialogContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const SubscriptionsCard = ({ subscriptions, addSubscription, deleteSubscription, editSubscription, onPaySubscription, onAddTransaction }) => {
  const { confirm, alert } = useDialog();
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState(null);
  const [subForm, setSubForm] = useState({ description: '', amount: '', category: 'Servicios' });

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
  );
};

export default SubscriptionsCard;
