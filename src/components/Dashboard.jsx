import React from 'react';
import './Dashboard.css';
import BudgetAlerts from './dashboard/BudgetAlerts';
import BalanceCard from './dashboard/BalanceCard';
import AccountList from './Accounts/AccountList';

const Dashboard = ({ balance, netWorth, income, expense, expensesByCategory, budgets = {}, accounts = [], accountBalances = {}, onAddAccountClick, onEditAccountClick }) => {
  return (
    <div className="dashboard animate-fade-in">
      <BudgetAlerts budgets={budgets} expensesByCategory={expensesByCategory} />
      <BalanceCard netWorth={netWorth} balance={balance} income={income} expense={expense} />
      <AccountList accounts={accounts} balances={accountBalances} onAddClick={onAddAccountClick} onEditClick={onEditAccountClick} />
    </div>
  );
};

export default Dashboard;
