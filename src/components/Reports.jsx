import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { useBudgets } from '../hooks/useBudgets';
import { Settings, Check } from 'lucide-react';

const CATEGORIES = ['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros'];

const Reports = ({ transactions }) => {
  const { budgets, updateBudget } = useBudgets();
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleSaveBudget = (category) => {
    updateBudget(category, budgetInput);
    setEditingBudget(null);
  };

  return (
    <div className="reports-container animate-fade-in" style={{ padding: 'var(--spacing-md) 0' }}>
      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Reportes Detallados</h2>
      
      {chartData.length > 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem', color: 'var(--text-secondary)' }}>
            Distribución de Gastos
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={70}
                  outerRadius={100}
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
          
          <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Presupuestos por Categoría</h3>
            
            {CATEGORIES.map((category, index) => {
              const spent = expensesByCategory[category] || 0;
              const limit = budgets[category] || 0;
              const hasBudget = limit > 0;
              const percentage = hasBudget ? Math.min((spent / limit) * 100, 100) : 0;
              
              let barColor = 'var(--accent-primary)';
              if (hasBudget) {
                if (percentage >= 100) barColor = 'var(--danger)';
                else if (percentage >= 80) barColor = '#f59e0b'; // amber/warning
                else barColor = 'var(--success)';
              }

              return (
                <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{category}</span>
                    </div>
                    
                    {editingBudget === category ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input 
                          type="number" 
                          autoFocus
                          value={budgetInput} 
                          onChange={(e) => setBudgetInput(e.target.value)}
                          style={{ width: '80px', padding: '4px', borderRadius: '4px', border: '1px solid var(--accent-primary)', background: 'transparent', color: 'var(--text-primary)' }}
                        />
                        <button onClick={() => handleSaveBudget(category)} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer' }}><Check size={16} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem' }}>
                          {formatCurrency(spent)} {hasBudget ? `/ ${formatCurrency(limit)}` : ''}
                        </span>
                        <button onClick={() => { setEditingBudget(category); setBudgetInput(limit); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <Settings size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {hasBudget && (
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-base)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: barColor, transition: 'width 0.3s ease, background-color 0.3s ease' }}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
          <p className="text-secondary">Aún no hay suficientes gastos para generar reportes.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
