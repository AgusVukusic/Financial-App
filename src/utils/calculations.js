export const calculateTotalsAndCategories = (filteredTransactions) => {
  let income = 0;
  let expense = 0;
  const byCategory = {};

  filteredTransactions.forEach(t => {
    if (t.type === 'expense') {
      if (t.category !== 'Saldo de deuda' && !t.categoryAdjustments) {
        // Normal expense
        expense += t.amount;
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      } else if (t.category === 'Saldo de deuda' || t.categoryAdjustments) {
        // Settlement expense (you paid someone back)
        if (t.categoryAdjustments) {
          Object.entries(t.categoryAdjustments).forEach(([cat, amount]) => {
            expense += amount;
            byCategory[cat] = (byCategory[cat] || 0) + amount;
          });
        } else {
          // Fallback for old settlements
          expense += t.amount;
          byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        }
      } else {
        expense += t.amount;
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      }
    } else if (t.type === 'income') {
      if (t.category !== 'Saldo de deuda') {
        // Normal income
        income += t.amount;
      } else {
        // Settlement income (someone paid you back)
        if (t.categoryAdjustments) {
          Object.entries(t.categoryAdjustments).forEach(([cat, amount]) => {
            // amount is negative for receiver (e.g. Comida: -750)
            expense += amount;
            byCategory[cat] = (byCategory[cat] || 0) + amount;
          });
        } else {
          // Fallback for old settlements: just subtract from global expense
          expense -= t.amount;
        }
      }
    }
  });

  return { totalIncome: income, totalExpense: expense, expensesByCategory: byCategory };
};
