import React from 'react';
import './Dashboard.css';
import BudgetAlerts from './dashboard/BudgetAlerts';
import BalanceCard from './dashboard/BalanceCard';
import AccountList from './Accounts/AccountList';
import UpcomingSubscriptions from './dashboard/UpcomingSubscriptions';

const Dashboard = ({ balance, netWorth, income, expense, expensesByCategory, budgets = {}, accounts = [], accountBalances = {}, onAddAccountClick, onEditAccountClick, subscriptions, onNavigateToSubscriptions }) => {
  return (
    <div className="dashboard animate-fade-in">
      <BalanceCard netWorth={netWorth} balance={balance} income={income} expense={expense} />
      <AccountList accounts={accounts} balances={accountBalances} onAddClick={onAddAccountClick} onEditClick={onEditAccountClick} />
      <UpcomingSubscriptions subscriptions={subscriptions} onNavigate={onNavigateToSubscriptions} />
    </div>
  );
};

export default Dashboard;
