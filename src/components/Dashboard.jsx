import { useMemo } from 'react';
import './Dashboard.css';
import BalanceCard from './dashboard/BalanceCard';
import QuickAdd from './dashboard/QuickAdd';
import AccountList from './Accounts/AccountList';
import UpcomingSubscriptions from './dashboard/UpcomingSubscriptions';
import { getFrequentExpenses } from '../utils/frequentExpenses';

/**
 * Inicio: saldo total primero, anotar de un toque, lo que hay que pagar y las cuentas.
 * Los movimientos recientes los dibuja TransactionList debajo (App.jsx).
 */
const Dashboard = ({
  balance,
  netWorth,
  income,
  expense,
  transactions = [],
  accounts = [],
  accountBalances = {},
  subscriptions,
  quickAddEnabled = true,
  onAddTransaction,
  onDeleteTransaction,
  onOpenAdd,
  onAddAccountClick,
  onEditAccountClick,
  onNavigateToSubscriptions,
}) => {
  // Solo frecuentes de cuentas que existen (una cuenta borrada no puede recibir el gasto).
  const frequent = useMemo(
    () => getFrequentExpenses(transactions, 6).filter((f) => accounts.some((a) => a.id === f.accountId)),
    [transactions, accounts],
  );

  return (
    <div className="dashboard">
      <BalanceCard netWorth={netWorth} balance={balance} income={income} expense={expense} />
      <QuickAdd
        items={frequent}
        enabled={quickAddEnabled}
        onAddTransaction={onAddTransaction}
        onDeleteTransaction={onDeleteTransaction}
        onOpenAdd={onOpenAdd}
      />
      <UpcomingSubscriptions subscriptions={subscriptions} onNavigate={onNavigateToSubscriptions} />
      <AccountList accounts={accounts} balances={accountBalances} onAddClick={onAddAccountClick} onEditClick={onEditAccountClick} />
    </div>
  );
};

export default Dashboard;
