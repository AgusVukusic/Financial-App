import React from 'react';
import { Coffee, ShoppingBag, Home, Car, Zap, DollarSign, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import './TransactionList.css';

const categoryIcons = {
  Comida: <Coffee size={20} />,
  Compras: <ShoppingBag size={20} />,
  Hogar: <Home size={20} />,
  Transporte: <Car size={20} />,
  Servicios: <Zap size={20} />,
  Otros: <DollarSign size={20} />
};

const TransactionList = ({ transactions, onDelete, onEdit }) => {
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
        <AnimatePresence>
          {transactions.map((transaction) => (
            <motion.div 
              key={transaction.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              layout
              className="transaction-item glass-panel"
            >
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="edit-btn" 
                      onClick={() => onEdit && onEdit(transaction)}
                      aria-label="Editar transacción"
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '4px' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
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
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TransactionList;
