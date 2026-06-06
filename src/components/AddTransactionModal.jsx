import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddTransactionModal.css';

const CATEGORIES = ['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros'];

const AddTransactionModal = ({ isOpen, onClose, onAdd, initialData }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type || 'expense');
        setAmount(initialData.amount || '');
        setCategory(initialData.category || CATEGORIES[0]);
        setDescription(initialData.description || '');
      } else {
        setType('expense');
        setAmount('');
        setCategory(CATEGORIES[0]);
        setDescription('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;

    onAdd({
      type,
      amount: parseFloat(amount),
      category: type === 'income' ? 'Ingreso' : category,
      description
    });

    // Reset and close
    setAmount('');
    setDescription('');
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content glass-panel animate-slide-up">
        <div className="modal-header">
          <h2>Nuevo Movimiento</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="type-selector">
            <button
              type="button"
              className={`type-btn ${type === 'expense' ? 'active-expense' : ''}`}
              onClick={() => setType('expense')}
            >
              Gasto
            </button>
            <button
              type="button"
              className={`type-btn ${type === 'income' ? 'active-income' : ''}`}
              onClick={() => setType('income')}
            >
              Ingreso
            </button>
          </div>

          <div className="form-group">
            <label>Monto ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              min="0.01"
              step="0.01"
              autoFocus
            />
          </div>

          {type === 'expense' && (
            <div className="form-group">
              <label>Categoría</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Descripción (Opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Cena con amigos"
              maxLength={30}
            />
          </div>

          <button type="submit" className="submit-btn">
            Guardar {type === 'expense' ? 'Gasto' : 'Ingreso'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
