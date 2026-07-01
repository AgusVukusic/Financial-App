import React from 'react';
import './Dashboard.css';
import BudgetAlerts from './dashboard/BudgetAlerts';
import BalanceCard from './dashboard/BalanceCard';
import ExpenseChart from './dashboard/ExpenseChart';

const Dashboard = ({ balance, income, expense, expensesByCategory, budgets = {} }) => {
  return (
    <div className="dashboard animate-fade-in">
      <BudgetAlerts budgets={budgets} expensesByCategory={expensesByCategory} />
      <BalanceCard balance={balance} income={income} expense={expense} />
      <ExpenseChart expensesByCategory={expensesByCategory} />
    </div>
  );
};

export default Dashboard;
