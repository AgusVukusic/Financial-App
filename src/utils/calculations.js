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
    // Note: type === 'transfer' is ignored for global income/expense
  });

  return { totalIncome: income, totalExpense: expense, expensesByCategory: byCategory };
};

export const calculateAccountBalances = (accounts, allTransactions) => {
  const balances = {};
  let totalNetWorth = 0;

  // Initialize with initial balances
  accounts.forEach(acc => {
    balances[acc.id] = acc.initialBalance || 0;
  });

  // Apply transactions
  allTransactions.forEach(t => {
    if (t.type === 'income') {
      if (t.accountId && balances[t.accountId] !== undefined) {
        balances[t.accountId] += t.amount;
      }
    } else if (t.type === 'expense') {
      if (t.accountId && balances[t.accountId] !== undefined) {
        balances[t.accountId] -= t.amount;
      }
    } else if (t.type === 'transfer') {
      if (t.accountId && balances[t.accountId] !== undefined) {
        balances[t.accountId] -= t.amount;
      }
      if (t.transferToAccountId && balances[t.transferToAccountId] !== undefined) {
        balances[t.transferToAccountId] += t.amount;
      }
    }
  });

  // Calculate total net worth
  Object.values(balances).forEach(bal => {
    totalNetWorth += bal;
  });

  return { balances, totalNetWorth };
};
