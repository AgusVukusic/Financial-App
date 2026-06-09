import React, { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useBudgets } from './hooks/useBudgets';
import { useTheme } from './hooks/useTheme';
import { useUser } from './hooks/useUser';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import Reports from './components/Reports';
import Profile from './components/Profile';
import Groups from './components/Groups';
import WelcomeScreen from './components/WelcomeScreen';
import { exportToCSV } from './utils/formatters';
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
  const { transactions, allTransactions, addTransaction, updateTransaction, deleteTransaction, totalIncome, totalExpense, balance } = useTransactions(selectedMonth, selectedYear, user?.uid);
  const { budgets, updateBudget } = useBudgets(user?.uid);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

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

  const handleMonthChange = (offset) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-primary)' }}>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <WelcomeScreen />;
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
            income={totalIncome} 
            expense={totalExpense} 
            transactions={transactions} 
            budgets={budgets}
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
        <Groups uid={user?.uid} userName={userName} />
      )}

      <AddTransactionModal 
        isOpen={isModalOpen} 
        initialData={modalInitialData}
        onClose={() => setIsModalOpen(false)} 
        onAdd={addTransaction} 
        onEdit={updateTransaction}
      />
    </Layout>
  );
}

export default App;
