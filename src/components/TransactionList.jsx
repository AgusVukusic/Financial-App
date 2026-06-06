import React from 'react';
import { Coffee, ShoppingBag, Home, Car, Zap, DollarSign, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import './TransactionList.css';

const categoryIcons = {
  Comida: <Coffee size={20} />,
  Compras: <ShoppingBag size={20} />,
  Hogar: <Home size={20} />,
  Transporte: <Car size={20} />,
  Servicios: <Zap size={20} />,
  Otros: <DollarSign size={20} />
};

const TransactionList = ({ transactions, onDelete }) => {
  if (transactions.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <p className="text-secondary">No hay transacciones todavía. ¡Añade la primera!</p>
      </div>
    );
  }

  return (
    <div className="transaction-list-container animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <h3 className="section-title">Movimientos Recientes</h3>
      <div className="transaction-list">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="transaction-item glass-panel">
            <div className="transaction-icon-wrapper">
              <div className={`transaction-icon ${transaction.type}`}>
                {categoryIcons[transaction.category] || <DollarSign size={20} />}
              </div>
            </div>
            
            <div className="transaction-details">
              <div className="transaction-header">
                <span className="transaction-title">{transaction.description || transaction.category}</span>
                <span className={`transaction-amount ${transaction.type === 'income' ? 'text-success' : ''}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
              </div>
              <div className="transaction-footer">
                <span className="transaction-date">{formatDate(transaction.date)}</span>
                <button 
                  className="delete-btn" 
                  onClick={() => onDelete(transaction.id)}
                  aria-label="Eliminar transacción"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
