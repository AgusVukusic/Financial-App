import { describe, it, expect } from 'vitest';
import { calculateTotalsAndCategories } from './calculations';

describe('Calculations Utils', () => {
  describe('calculateTotalsAndCategories', () => {
    it('debe calcular los ingresos y gastos correctamente, y agrupar por categoría', () => {
      const transactions = [
        { type: 'income', amount: 5000, category: 'Sueldo' },
        { type: 'expense', amount: 1000, category: 'Comida' },
        { type: 'expense', amount: 500, category: 'Transporte' },
        { type: 'expense', amount: 200, category: 'Comida' },
      ];

      const result = calculateTotalsAndCategories(transactions);

      expect(result.totalIncome).toBe(5000);
      expect(result.totalExpense).toBe(1700);
      expect(result.expensesByCategory['Comida']).toBe(1200);
      expect(result.expensesByCategory['Transporte']).toBe(500);
    });

    it('debe retornar 0 si no hay transacciones', () => {
      const result = calculateTotalsAndCategories([]);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(Object.keys(result.expensesByCategory).length).toBe(0);
    });

    it('debe ignorar transacciones de tipo transfer', () => {
      const transactions = [
        { type: 'transfer', amount: 1000 },
      ];
      const result = calculateTotalsAndCategories(transactions);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
    });
  });
});
