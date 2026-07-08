import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { useToast } from './ui/ToastContext';
import './AddTransactionModal.css';

const CATEGORIES = ['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros'];

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AddTransactionModal = ({ isOpen, onClose, onAdd, onEdit, initialData, accounts = [] }) => {
  const { showToast } = useToast();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [accountId, setAccountId] = useState('');
  const [transferToAccountId, setTransferToAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      if (initialData) {
        setType(initialData.type || 'expense');
        setAmount(initialData.amount || '');
        setCategory(initialData.category || CATEGORIES[0]);
        setAccountId(initialData.accountId || (accounts.length > 0 ? accounts[0].id : ''));
        setTransferToAccountId(initialData.transferToAccountId || '');
        setDescription(initialData.description || '');
        setDate(initialData.date ? initialData.date.split('T')[0] : getLocalDateString());
      } else {
        setType('expense');
        setAmount('');
        setCategory(CATEGORIES[0]);
        setAccountId(accounts.length > 0 ? accounts[0].id : '');
        setTransferToAccountId(accounts.length > 1 ? accounts[1].id : '');
        setDescription('');
        setDate(getLocalDateString());
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, initialData, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;
    if (accounts.length === 0) {
      showToast('Debes crear una cuenta primero', 'error');
      return;
    }

    if (type === 'transfer' && accountId === transferToAccountId) {
      showToast('La cuenta origen y destino deben ser distintas', 'error');
      return;
    }

    const data = {
      type,
      amount: parseFloat(amount),
      accountId,
      description,
      date
    };

    if (type === 'expense') {
      data.category = category;
    } else if (type === 'income') {
      data.category = 'Ingreso';
    } else if (type === 'transfer') {
      data.transferToAccountId = transferToAccountId;
      data.category = 'Transferencia';
    }

    try {
      if (initialData && initialData.id && onEdit) {
        await onEdit(initialData.id, data);
        showToast('Movimiento editado', 'success');
      } else {
        await onAdd(data);
        showToast('Movimiento añadido', 'success');
      }
      setAmount('');
      setDescription('');
      onClose();
    } catch (error) {
      showToast('Error al guardar el movimiento: ' + error.message, 'error');
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <Card className="modal-content animate-slide-up" style={{ padding: 'var(--spacing-xl)' }}>
        <div className="modal-header">
          <h2>{initialData && initialData.id ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h2>
          <Button variant="ghost" className="close-btn" onClick={onClose} style={{ padding: '8px' }}>
            <X size={24} />
          </Button>
        </div>

        {accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0', color: 'var(--text-secondary)' }}>
            Debes crear al menos una cuenta antes de registrar movimientos.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="type-selector" style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              <Button type="button" variant={type === 'expense' ? 'danger' : 'outline'} style={{ flex: 1, padding: '8px' }} onClick={() => setType('expense')}>
                Gasto
              </Button>
              <Button type="button" variant={type === 'income' ? 'success' : 'outline'} style={{ flex: 1, padding: '8px' }} onClick={() => setType('income')}>
                Ingreso
              </Button>
              {accounts.length > 1 && (
                <Button type="button" variant={type === 'transfer' ? 'primary' : 'outline'} style={{ flex: 1, padding: '8px' }} onClick={() => setType('transfer')}>
                  <ArrowRightLeft size={16} />
                </Button>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Monto ($)</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required min="0.01" step="0.01" />
            </div>

            {type !== 'transfer' && (
              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Cuenta</label>
                <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </Select>
              </div>
            )}

            {type === 'transfer' && (
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Desde</label>
                  <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Hacia</label>
                  <Select value={transferToAccountId} onChange={(e) => setTransferToAccountId(e.target.value)} required>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            {type === 'expense' && (
              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Categoría</label>
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Select>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Fecha</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--spacing-xl)' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Descripción (Opcional)</label>
              <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Cena con amigos" maxLength={30} />
            </div>

            <Button type="submit" variant="primary" style={{ width: '100%', padding: '16px' }}>
              Guardar {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Transferencia'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default AddTransactionModal;
