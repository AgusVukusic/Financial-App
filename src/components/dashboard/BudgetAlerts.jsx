import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';

const BudgetAlerts = ({ budgets = {}, expensesByCategory = {} }) => {
  const budgetAlerts = [];
  
  Object.entries(budgets).forEach(([category, limit]) => {
    if (limit > 0) {
      const spent = expensesByCategory[category] || 0;
      const percentage = (spent / limit) * 100;
      if (percentage >= 100) {
        budgetAlerts.push({ category, type: 'danger', message: `Has superado tu presupuesto de ${category}` });
      } else if (percentage >= 80) {
        budgetAlerts.push({ category, type: 'warning', message: `Estás al ${percentage.toFixed(0)}% de tu presupuesto de ${category}` });
      }
    }
  });

  if (budgetAlerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
      {budgetAlerts.map((alert, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: alert.type === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${alert.type === 'danger' ? 'var(--danger)' : '#f59e0b'}`,
            color: alert.type === 'danger' ? '#fca5a5' : '#fcd34d',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          {alert.type === 'danger' ? <AlertTriangle size={18} /> : <Info size={18} />}
          {alert.message}
        </motion.div>
      ))}
    </div>
  );
};

export default BudgetAlerts;
