import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Calendar, Edit2, X, Check, Trash2, CreditCard, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useDialog } from '../contexts/DialogContext';
import { getSubscriptionStatus, calculateTotalMonthlySubscriptions } from '../utils/subscriptionUtils';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import './SubscriptionsManager.css';

const SubscriptionsManager = ({ subscriptions, addSubscription, deleteSubscription, editSubscription, onPaySubscription, onAddTransaction, accounts }) => {
  const { confirm, alert } = useDialog();
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState(null);
  const [subForm, setSubForm] = useState({ 
    description: '', 
    amount: '', 
    category: 'Entretenimiento',
    dueDate: '1',
    cycle: 'monthly',
    accountId: ''
  });

  const categories = ['Entretenimiento', 'Servicios', 'Software', 'Hogar', 'Transporte', 'Otros'];

  const totalMonthly = calculateTotalMonthlySubscriptions(subscriptions);

  const handleAddOrEditSub = (e) => {
    e.preventDefault();
    if (!subForm.amount || !subForm.description) return;
    
    const subData = {
      description: subForm.description,
      amount: parseFloat(subForm.amount),
      category: subForm.category,
      dueDate: parseInt(subForm.dueDate, 10),
      cycle: subForm.cycle,
      accountId: subForm.accountId,
      type: 'expense'
    };

    if (editingSubId) {
      editSubscription(editingSubId, subData);
      setEditingSubId(null);
    } else {
      addSubscription(subData);
    }
    
    setIsAddingSub(false);
    resetForm();
  };

  const resetForm = () => {
    setSubForm({ description: '', amount: '', category: 'Entretenimiento', dueDate: '1', cycle: 'monthly', accountId: '' });
  };

  const startEditing = (sub) => {
    setEditingSubId(sub.id);
    setSubForm({ 
      description: sub.description, 
      amount: sub.amount, 
      category: sub.category || 'Entretenimiento',
      dueDate: sub.dueDate || 1,
      cycle: sub.cycle || 'monthly',
      accountId: sub.accountId || ''
    });
    setIsAddingSub(true);
  };

  const handleManualPayment = async (sub) => {
    const accountName = accounts.find(a => a.id === sub.accountId)?.name || 'General';
    const isConfirmed = await confirm(`¿Registrar pago de ${sub.description} por ${formatCurrency(sub.amount)} desde ${accountName}?`);
    if (isConfirmed) {
      // 1. Create transaction
      onAddTransaction({
        description: sub.description,
        amount: sub.amount,
        category: sub.category,
        type: 'expense',
        accountId: sub.accountId,
        date: new Date().toISOString()
      });
      
      // 2. Update lastPaidDate in subscription
      editSubscription(sub.id, {
        lastPaidDate: new Date().toISOString()
      });
      
      await alert('Pago registrado correctamente.');
    }
  };

  const renderStatusBadge = (statusObj) => {
    if (statusObj.status === 'overdue') {
      return <span className="status-badge overdue">Vencido hace {statusObj.days} días</span>;
    } else if (statusObj.status === 'due_soon') {
      return <span className="status-badge due-soon">Vence en {statusObj.days} días</span>;
    } else {
      return <span className="status-badge paid">Al día</span>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="subscriptions-manager">
      <header className="subscriptions-header">
        <div>
          <h2>Gastos Fijos</h2>
          <p className="text-secondary">Tus cobros recurrentes y fijos</p>
        </div>
        <Button variant="primary" onClick={() => { setIsAddingSub(!isAddingSub); setEditingSubId(null); resetForm(); }}>
          {isAddingSub ? <X size={20} /> : <PlusCircle size={20} />}
          {!isAddingSub && <span style={{ marginLeft: '8px' }}>Añadir</span>}
        </Button>
      </header>

      <div className="subscriptions-stats">
        <Card className="stat-card">
          <div className="stat-icon"><CreditCard size={24} color="var(--accent-primary)" /></div>
          <div>
            <p className="stat-label">Gasto Mensual Estimado</p>
            <h3 className="stat-value text-gradient">{formatCurrency(totalMonthly)}</h3>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {isAddingSub && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }} 
            onSubmit={handleAddOrEditSub} 
            className="subscription-form glass-panel"
          >
            <h3>{editingSubId ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Descripción</label>
                <Input type="text" placeholder="Ej. Netflix" required value={subForm.description} onChange={e => setSubForm({...subForm, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Monto</label>
                <Input type="number" placeholder="0.00" required value={subForm.amount} onChange={e => setSubForm({...subForm, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Día de cobro</label>
                <Input type="number" min="1" max="31" required value={subForm.dueDate} onChange={e => setSubForm({...subForm, dueDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Frecuencia</label>
                <Select value={subForm.cycle} onChange={e => setSubForm({...subForm, cycle: e.target.value})}>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </Select>
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <Select value={subForm.category} onChange={e => setSubForm({...subForm, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="form-group">
                <label>Cuenta de pago</label>
                <Select value={subForm.accountId} onChange={e => setSubForm({...subForm, accountId: e.target.value})}>
                  <option value="">Cuenta General</option>
                  {accounts?.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </Select>
              </div>
            </div>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => setIsAddingSub(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">
                {editingSubId ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="subscriptions-list">
        {subscriptions.length === 0 && !isAddingSub ? (
          <div className="empty-state">
            <Calendar size={48} color="var(--text-muted)" />
            <p>No tienes gastos fijos registrados.</p>
            <Button variant="ghost" onClick={() => setIsAddingSub(true)}>Añadir mi primer gasto fijo</Button>
          </div>
        ) : (
          // Sort by due date
          [...subscriptions].sort((a, b) => {
            const statusA = getSubscriptionStatus(a);
            const statusB = getSubscriptionStatus(b);
            return statusA.nextPayment - statusB.nextPayment;
          }).map(sub => {
            const statusObj = getSubscriptionStatus(sub);
            
            return (
              <Card key={sub.id} className={`subscription-item ${statusObj.status}`}>
                <div className="sub-info">
                  <div className="sub-header">
                    <h4>{sub.description}</h4>
                    {renderStatusBadge(statusObj)}
                  </div>
                  <div className="sub-details">
                    <span className="sub-amount">{formatCurrency(sub.amount)} <small>/{sub.cycle === 'monthly' ? 'mes' : 'año'}</small></span>
                    <span className="sub-date">
                      <Clock size={14} /> 
                      Vence el {statusObj.nextPayment.getDate()}/{statusObj.nextPayment.getMonth() + 1}
                    </span>
                  </div>
                </div>
                
                <div className="sub-actions">
                  {(statusObj.status === 'due_soon' || statusObj.status === 'overdue') && (
                    <Button variant="primary" onClick={() => handleManualPayment(sub)} title="Registrar Pago">
                      Pagar
                    </Button>
                  )}
                  <Button variant="ghost" isIcon onClick={() => startEditing(sub)} title="Editar">
                    <Edit2 size={18} />
                  </Button>
                  <Button variant="ghost" isIcon onClick={() => deleteSubscription(sub.id)} style={{ color: 'var(--danger)' }} title="Eliminar">
                    <Trash2 size={18} />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default SubscriptionsManager;
