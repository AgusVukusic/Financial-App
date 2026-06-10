import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './Dashboard.css';

import { AlertTriangle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from './ui/Card';

const Dashboard = ({ balance, income, expense, transactions, expensesByCategory, budgets = {} }) => {

  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Calculate budget alerts
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

  return (
    <div className="dashboard animate-fade-in">
      {budgetAlerts.length > 0 && (
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
      )}

      <Card className="balance-card">
        <div className="balance-header">
          <span className="text-secondary">Balance Total</span>
          <Wallet size={20} className="text-secondary" />
        </div>
        <h1 className="balance-amount">{formatCurrency(balance)}</h1>
        
        <div className="balance-stats">
          <div className="stat-item income">
            <div className="stat-icon bg-success">
              <ArrowDownRight size={16} />
            </div>
            <div>
              <div className="stat-label">Ingresos</div>
              <div className="stat-value text-success">{formatCurrency(income)}</div>
            </div>
          </div>
          
          <div className="stat-item expense">
            <div className="stat-icon bg-danger">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <div className="stat-label">Gastos</div>
              <div className="stat-value text-danger">{formatCurrency(expense)}</div>
            </div>
          </div>
        </div>
      </Card>

      {chartData.length > 0 && (
        <Card className="chart-container animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="chart-title">Gastos por Categoría</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
