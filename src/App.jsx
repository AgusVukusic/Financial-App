import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useBudgets } from './hooks/useBudgets';
import { useAccounts } from './hooks/useAccounts';
import { useTheme } from './hooks/useTheme';
import { useUser } from './hooks/useUser';
import { useBetaAccess } from './hooks/useBetaAccess';
import ActivationScreen from './components/ActivationScreen';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import AddAccountModal from './components/Accounts/AddAccountModal';
import Reports from './components/Reports';
import Profile from './components/Profile';
import SubscriptionsManager from './components/SubscriptionsManager';
import WelcomeScreen from './components/WelcomeScreen';
import LandingPage from './components/LandingPage';

import AppHeader from './components/AppHeader';
import MonthSelector from './components/MonthSelector';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  const { theme, toggleTheme } = useTheme();
  const { user, loading, userName, clearUser } = useUser();
  const { status: accessStatus, activate } = useBetaAccess(user?.uid);
  // Los datos solo se cargan con el perfil Beta activo (ADR 002)
  const activeUid = accessStatus === 'active' ? user.uid : undefined;
  const { transactions, addTransaction, updateTransaction, deleteTransaction, totalIncome, totalExpense, expensesByCategory, balance } = useTransactions(selectedMonth, selectedYear, activeUid);
  const { subscriptions, addSubscription, deleteSubscription, editSubscription, paySubscription } = useSubscriptions(activeUid);
  const { budgets, updateBudget } = useBudgets(activeUid);
  const { accounts, loadingAccounts, addAccount, updateAccount, deleteAccount } = useAccounts(activeUid);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalData, setAccountModalData] = useState(null);

  const [activeTab, setActiveTab] = useState('home');
  const [showLogin, setShowLogin] = useState(false);

  const { balances: accountBalances, totalNetWorth } = useMemo(() => {
    const balances = {};
    let totalNetWorth = 0;
    accounts.forEach(acc => {
      const bal = acc.currentBalance !== undefined ? acc.currentBalance : (acc.initialBalance || 0);
      balances[acc.id] = bal;
      totalNetWorth += bal;
    });
    return { balances, totalNetWorth };
  }, [accounts]);

  const handleClearData = () => {
    window.localStorage.removeItem('financial_app_transactions');
    window.localStorage.removeItem('financial_app_budgets');
    window.localStorage.removeItem('financial_app_subscriptions');
    clearUser();
    window.location.reload();
  };

  const handleOpenModal = () => {
    setModalInitialData(null);
    setIsModalOpen(true);
  };

  const handleOpenAccountModal = (acc = null) => {
    setAccountModalData(acc);
    setIsAccountModalOpen(true);
  };

  const handleMonthChange = (offset) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  useEffect(() => {
    const titles = {
      home: 'Dashboard - Financial App',
      reports: 'Reportes - Financial App',
      profile: 'Perfil - Financial App',
      subscriptions: 'Gastos Fijos - Financial App'
    };
    document.title = titles[activeTab] || 'Financial App';
  }, [activeTab]);

  if (loading || (user && accessStatus === 'checking') || (activeUid && loadingAccounts)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-primary)' }}>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    if (showLogin) {
      return <WelcomeScreen onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  if (accessStatus !== 'active') {
    return (
      <ActivationScreen
        key={user.uid}
        email={user.email}
        onActivate={activate}
        onSignOut={clearUser}
        connectionError={accessStatus === 'error'}
      />
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onAddClick={handleOpenModal}
    >
      <AppHeader
        userName={userName}
        activeTab={activeTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBack={() => setActiveTab('home')}
      />

      {(activeTab === 'home' || activeTab === 'reports') && (
        <MonthSelector label={`${monthNames[selectedMonth]} ${selectedYear}`} onChange={handleMonthChange} />
      )}

      {activeTab === 'home' && (
        <>
          <Dashboard 
            balance={balance} 
            netWorth={totalNetWorth}
            income={totalIncome} 
            expense={totalExpense} 
            transactions={transactions} 
            expensesByCategory={expensesByCategory}
            budgets={budgets}
            accounts={accounts}
            accountBalances={accountBalances}
            subscriptions={subscriptions}
            onNavigateToSubscriptions={() => setActiveTab('subscriptions')}
            onAddAccountClick={() => handleOpenAccountModal()}
            onEditAccountClick={(acc) => handleOpenAccountModal(acc)}
          />
          <TransactionList 
            transactions={transactions} 
            onDelete={deleteTransaction} 
            onEdit={(t) => { setModalInitialData(t); setIsModalOpen(true); }}
          />
        </>
      )}

      {activeTab === 'reports' && (
        <Reports 
          uid={user?.uid} 
          expensesByCategory={expensesByCategory}
          budgets={budgets} 
          updateBudget={updateBudget} 
        />
      )}

      {activeTab === 'profile' && (
        <Profile 
          userName={userName}
          uid={user?.uid}
          onClearData={handleClearData} 
        />
      )}

      {activeTab === 'subscriptions' && (
        <SubscriptionsManager 
          subscriptions={subscriptions}
          addSubscription={addSubscription}
          deleteSubscription={deleteSubscription}
          editSubscription={editSubscription}
          paySubscription={paySubscription}
          accounts={accounts}
        />
      )}

      <AddTransactionModal 
        isOpen={isModalOpen} 
        initialData={modalInitialData}
        accounts={accounts}
        onClose={() => setIsModalOpen(false)} 
        onAdd={addTransaction} 
        onEdit={updateTransaction}
      />

      <AddAccountModal
        isOpen={isAccountModalOpen}
        initialData={accountModalData}
        onClose={() => setIsAccountModalOpen(false)}
        onAdd={addAccount}
        onEdit={updateAccount}
        onDelete={deleteAccount}
      />
    </Layout>
  );
}

export default App;
