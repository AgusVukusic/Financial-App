import React from 'react';
import { Coffee, ShoppingBag, Home, Car, Zap, DollarSign, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2 } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
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
            <Card key={transaction.id} noPadding>
              <motion.div 
                className="transaction-item"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                layout
                style={{ width: '100%' }}
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
                    {transaction.groupId ? (
                      <span className="text-secondary" style={{ fontSize: '0.75rem', alignSelf: 'center', marginRight: '8px' }}>Gestionado en Grupo</span>
                    ) : (
                      <>
                        <Button 
                          variant="ghost"
                          size="sm"
                          isIcon
                          onClick={() => onEdit && onEdit(transaction)}
                          aria-label="Editar transacción"
                        >
                          <Edit2 size={16} color="var(--accent-primary)" />
                        </Button>
                        <Button 
                          variant="ghost"
                          size="sm"
                          isIcon
                          onClick={() => onDelete(transaction.id)}
                          aria-label="Eliminar transacción"
                        >
                          <Trash2 size={16} color="var(--danger)" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              </motion.div>
            </Card>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TransactionList;
