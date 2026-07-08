import React, { useState, useEffect } from 'react';
import { X, Landmark, Smartphone, Wallet, CreditCard } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useToast } from '../ui/ToastContext';
import { useDialog } from '../../contexts/DialogContext';

export const ACCOUNT_TYPES = [
  { id: 'bank', label: 'Banco', icon: Landmark },
  { id: 'wallet', label: 'Billetera Virtual', icon: Smartphone },
  { id: 'cash', label: 'Efectivo', icon: Wallet },
  { id: 'credit', label: 'Tarjeta de Crédito', icon: CreditCard }
];

const AddAccountModal = ({ isOpen, onClose, onAdd, onEdit, onDelete, initialData, allTransactions = [] }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [initialBalance, setInitialBalance] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialData) {
        setName(initialData.name || '');
        setType(initialData.type || 'bank');
        setInitialBalance(initialData.initialBalance?.toString() || '0');
      } else {
        setName('');
        setType('bank');
        setInitialBalance('');
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;

    const data = {
      name,
      type,
      initialBalance: parseFloat(initialBalance || 0)
    };

    try {
      if (initialData && initialData.id && onEdit) {
        await onEdit(initialData.id, data);
        showToast('Cuenta actualizada', 'success');
      } else {
        await onAdd(data);
        showToast('Cuenta creada', 'success');
      }
      onClose();
    } catch (error) {
      showToast('Error al guardar la cuenta: ' + error.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!initialData || !initialData.id) return;
    
    // Check if account has transactions
    const hasTransactions = allTransactions.some(t => 
      t.accountId === initialData.id || t.transferToAccountId === initialData.id
    );

    if (hasTransactions) {
      showToast('No puedes eliminar una cuenta que tiene movimientos asociados.', 'error');
      return;
    }

    const isConfirmed = await confirm(`¿Estás seguro de que quieres eliminar la cuenta "${initialData.name}"?`);
    if (isConfirmed) {
      try {
        await onDelete(initialData.id);
        showToast('Cuenta eliminada', 'success');
        onClose();
      } catch (error) {
        showToast('Error al eliminar: ' + error.message, 'error');
      }
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <Card className="modal-content animate-slide-up" style={{ padding: 'var(--spacing-xl)' }}>
        <div className="modal-header">
          <h2>{initialData ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
          <Button variant="ghost" className="close-btn" onClick={onClose} style={{ padding: '8px' }}>
            <X size={24} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nombre de la cuenta</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mercado Pago"
              required
              maxLength={25}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Tipo</label>
            <Select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
            >
              {ACCOUNT_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </Select>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Saldo Inicial ($)</label>
            <Input
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0.00"
              step="0.01"
              disabled={!!initialData}
            />
            {initialData && <small style={{ color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>No puedes editar el saldo inicial de una cuenta existente.</small>}
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <Button type="submit" variant="primary" style={{ flex: 1, padding: '16px' }}>
              Guardar
            </Button>
            {initialData && (
              <Button type="button" variant="danger" style={{ padding: '16px' }} onClick={handleDelete}>
                Eliminar
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddAccountModal;
