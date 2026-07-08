import React, { useState, useEffect, useMemo } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useBudgets } from './hooks/useBudgets';
import { useAccounts } from './hooks/useAccounts';
import { useTheme } from './hooks/useTheme';
import { useUser } from './hooks/useUser';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import AddAccountModal from './components/Accounts/AddAccountModal';
import Reports from './components/Reports';
import Profile from './components/Profile';
import Groups from './components/Groups';
import WelcomeScreen from './components/WelcomeScreen';
import LandingPage from './components/LandingPage';
import { exportToCSV } from './utils/formatters';
import { calculateAccountBalances } from './utils/calculations';
import { Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import './App.css';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  const { theme, toggleTheme } = useTheme();
  const { user, loading, userName, clearUser } = useUser();
  const { transactions, allTransactions, addTransaction, updateTransaction, deleteTransaction, totalIncome, totalExpense, expensesByCategory, balance } = useTransactions(selectedMonth, selectedYear, user?.uid);
  const { budgets, updateBudget } = useBudgets(user?.uid);
  const { accounts, loadingAccounts, addAccount, updateAccount, deleteAccount } = useAccounts(user?.uid);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalData, setAccountModalData] = useState(null);

  const [activeTab, setActiveTab] = useState('home');
  const [showLogin, setShowLogin] = useState(false);

  // Auto-create default account for existing users who have transactions but no accounts
  useEffect(() => {
    if (user?.uid && !loadingAccounts && accounts.length === 0 && allTransactions.length > 0) {
      addAccount({ name: 'General', type: 'cash', initialBalance: 0 });
    }
  }, [user?.uid, loadingAccounts, accounts.length, allTransactions.length, addAccount]);

  const { balances: accountBalances, totalNetWorth } = useMemo(() => {
    return calculateAccountBalances(accounts, allTransactions);
  }, [accounts, allTransactions]);

  const handleClearData = () => {
    window.localStorage.removeItem('financial_app_transactions');
    window.localStorage.removeItem('financial_app_budgets');
    window.localStorage.removeItem('financial_app_subscriptions');
    clearUser();
    window.location.reload();
  };

  const handleExportData = () => {
    exportToCSV(allTransactions);
  };

  const handlePaySubscription = (sub) => {
    setModalInitialData(sub);
    setIsModalOpen(true);
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
      groups: 'Grupos - Financial App'
    };
    document.title = titles[activeTab] || 'Financial App';
  }, [activeTab]);

  if (loading || (user && loadingAccounts)) {
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

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onAddClick={handleOpenModal}
    >
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Hola, {userName} 👋</h2>
          <p className="text-secondary">
            {activeTab === 'home' && "Aquí está tu resumen financiero"}
            {activeTab === 'reports' && "Analiza en qué estás gastando"}
            {activeTab === 'profile' && "Gestiona tu cuenta y datos"}
          </p>
        </div>
        
        <Button variant="ghost" isIcon onClick={toggleTheme} className="theme-toggle">
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </Button>
      </header>

      {(activeTab === 'home' || activeTab === 'reports') && (
        <Card noPadding style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-sm) var(--spacing-md)', marginBottom: 'var(--spacing-md)', borderRadius: 'var(--radius-full)' }}>
          <Button variant="ghost" isIcon onClick={() => handleMonthChange(-1)}><ChevronLeft size={20} /></Button>
          <span style={{ fontWeight: '500' }}>{monthNames[selectedMonth]} {selectedYear}</span>
          <Button variant="ghost" isIcon onClick={() => handleMonthChange(1)}><ChevronRight size={20} /></Button>
        </Card>
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
          transactions={transactions} 
          allTransactions={allTransactions} 
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
          onExportData={handleExportData} 
          onPaySubscription={handlePaySubscription}
          onAddTransaction={addTransaction}
          allTransactions={allTransactions}
        />
      )}

      {activeTab === 'groups' && (
        <Groups uid={user?.uid} userName={userName} accountBalances={accountBalances} />
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
        allTransactions={allTransactions}
        onClose={() => setIsAccountModalOpen(false)}
        onAdd={addAccount}
        onEdit={updateAccount}
        onDelete={deleteAccount}
      />
    </Layout>
  );
}

export default App;
