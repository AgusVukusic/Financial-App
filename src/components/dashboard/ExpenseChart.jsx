import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '../ui/Card';

const CATEGORY_COLORS = {
  Comida: '#f43f5e',      // Rojo (Rose)
  Compras: '#6366f1',     // Azul (Indigo)
  Hogar: '#10b981',       // Verde (Emerald)
  Transporte: '#f59e0b',  // Naranja (Amber)
  Servicios: '#a855f7',   // Morado (Purple)
  Otros: '#64748b'        // Gris (Slate)
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="custom-tooltip-label">{payload[0].name}</div>
        <div className="custom-tooltip-value">{formatCurrency(payload[0].value)}</div>
      </div>
    );
  }
  return null;
};

const ExpenseChart = ({ expensesByCategory }) => {
  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  if (chartData.length === 0) return null;

  return (
    <Card className="chart-container animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <h3 className="chart-title">Gastos por Categoría</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={8}
              dataKey="value"
              stroke="var(--bg-base)"
              strokeWidth={2}
              cornerRadius={8}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#ec4899'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ExpenseChart;
