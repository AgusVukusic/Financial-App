import { useState, useEffect } from 'react';

const BUDGETS_KEY = 'financial_app_budgets';

export const useBudgets = () => {
  const [budgets, setBudgets] = useState(() => {
    try {
      const item = window.localStorage.getItem(BUDGETS_KEY);
      return item ? JSON.parse(item) : {};
    } catch (error) {
      return {};
    }
  });

  useEffect(() => {
    window.localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  }, [budgets]);

  const updateBudget = (category, amount) => {
    setBudgets(prev => ({
      ...prev,
      [category]: parseFloat(amount) || 0
    }));
  };

  return { budgets, updateBudget };
};
