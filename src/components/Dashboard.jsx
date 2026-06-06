import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './Dashboard.css';

const Dashboard = ({ balance, income, expense, transactions }) => {
  // Aggregate data for pie chart
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

  return (
    <div className="dashboard animate-fade-in">
      <div className="balance-card glass-panel">
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
      </div>

      {chartData.length > 0 && (
        <div className="chart-container glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
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
        </div>
      )}
    </div>
  );
};

export default Dashboard;
