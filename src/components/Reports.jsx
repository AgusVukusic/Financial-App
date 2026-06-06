import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { useBudgets } from '../hooks/useBudgets';
import { Settings, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = ['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros'];

const Reports = ({ transactions, allTransactions, uid }) => {
  const { budgets, updateBudget } = useBudgets(uid);
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

  // Prepare data for temporal evolution (last 6 months)
  const temporalData = useMemo(() => {
    if (!allTransactions) return [];
    
    const monthsData = {};
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      const monthName = d.toLocaleString('es-ES', { month: 'short' });
      monthsData[monthKey] = { name: monthName, Ingresos: 0, Gastos: 0, order: d.getTime() };
    }

    allTransactions.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthsData[monthKey]) {
        if (t.type === 'income') monthsData[monthKey].Ingresos += t.amount;
        else monthsData[monthKey].Gastos += t.amount;
      }
    });

    return Object.values(monthsData).sort((a, b) => a.order - b.order);
  }, [allTransactions]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="reports-container" style={{ padding: 'var(--spacing-md) 0' }}>
      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Reportes Detallados</h2>
      
      {/* Temporal Evolution Chart */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem', color: 'var(--text-secondary)' }}>
          Evolución (Últimos 6 meses)
        </h3>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={temporalData} margin={{ top: 5, right: 0, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                contentStyle={{ backgroundColor: 'var(--bg-surface)', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Ingresos" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Gastos" fill="var(--danger)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem', color: 'var(--text-secondary)' }}>
            Distribución de Gastos (Mes Actual)
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
                else if (percentage >= 80) barColor = '#f59e0b';
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
          <p className="text-secondary">Aún no hay suficientes gastos este mes para el gráfico de torta.</p>
        </div>
      )}
    </motion.div>
  );
};

export default Reports;
