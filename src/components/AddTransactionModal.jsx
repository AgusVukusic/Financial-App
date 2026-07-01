import React, { useState } from 'react';
import { X } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { useToast } from './ui/ToastContext';
import './AddTransactionModal.css';

const CATEGORIES = ['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros'];

const AddTransactionModal = ({ isOpen, onClose, onAdd, onEdit, initialData }) => {
  const { showToast } = useToast();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Evita que el fondo haga scroll
      
      if (initialData) {
        setType(initialData.type || 'expense');
        setAmount(initialData.amount || '');
        setCategory(initialData.category || CATEGORIES[0]);
        setDescription(initialData.description || '');
        setDate(initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      } else {
        setType('expense');
        setAmount('');
        setCategory(CATEGORIES[0]);
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
      }
    } else {
      document.body.style.overflow = 'auto'; // Restaura el scroll
    }

    // Cleanup para cuando el componente se desmonte
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;

    const data = {
      type,
      amount: parseFloat(amount),
      category: type === 'income' ? 'Ingreso' : category,
      description,
      date
    };

    try {
      if (initialData && initialData.id && onEdit) {
        await onEdit(initialData.id, data);
        showToast('Movimiento editado correctamente', 'success');
      } else {
        await onAdd(data);
        showToast('Movimiento añadido exitosamente', 'success');
      }

      // Reset and close
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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="type-selector" style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
            <Button
              type="button"
              variant={type === 'expense' ? 'danger' : 'outline'}
              style={{ flex: 1 }}
              onClick={() => setType('expense')}
            >
              Gasto
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'success' : 'outline'}
              style={{ flex: 1 }}
              onClick={() => setType('income')}
            >
              Ingreso
            </Button>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Monto ($)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              min="0.01"
              step="0.01"
            />
          </div>

          {type === 'expense' && (
            <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Categoría</label>
              <Select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Fecha</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Descripción (Opcional)</label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Cena con amigos"
              maxLength={30}
            />
          </div>

          <Button type="submit" variant="primary" style={{ width: '100%', padding: '16px' }}>
            Guardar {type === 'expense' ? 'Gasto' : 'Ingreso'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AddTransactionModal;
