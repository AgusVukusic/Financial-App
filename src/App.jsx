import React, { useState } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useTheme } from './hooks/useTheme';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import Reports from './components/Reports';
import Profile from './components/Profile';
import { exportToCSV } from './utils/formatters';
import { Moon, Sun } from 'lucide-react';
import './App.css';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  const { transactions, allTransactions, addTransaction, deleteTransaction, totalIncome, totalExpense, balance } = useTransactions(selectedMonth, selectedYear);
  const { theme, toggleTheme } = useTheme();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  const handleClearData = () => {
    window.localStorage.removeItem('financial_app_transactions');
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

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onAddClick={handleOpenModal}
    >
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Hola, Agustín 👋</h2>
          <p className="text-secondary">
            {activeTab === 'home' && "Aquí está tu resumen financiero"}
            {activeTab === 'reports' && "Analiza en qué estás gastando"}
            {activeTab === 'profile' && "Gestiona tu cuenta y datos"}
          </p>
        </div>
        
        <button onClick={toggleTheme} className="theme-toggle" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px' }}>
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </header>

      {(activeTab === 'home' || activeTab === 'reports') && (
        <div className="date-filter glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-sm) var(--spacing-md)', marginBottom: 'var(--spacing-md)', borderRadius: 'var(--radius-full)' }}>
          <button onClick={() => handleMonthChange(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>&larr;</button>
          <span style={{ fontWeight: '500' }}>{monthNames[selectedMonth]} {selectedYear}</span>
          <button onClick={() => handleMonthChange(1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>&rarr;</button>
        </div>
      )}

      {activeTab === 'home' && (
        <>
          <Dashboard 
            balance={balance} 
            income={totalIncome} 
            expense={totalExpense} 
            transactions={transactions} 
          />
          <TransactionList 
            transactions={transactions} 
            onDelete={deleteTransaction} 
          />
        </>
      )}

      {activeTab === 'reports' && (
        <Reports transactions={transactions} />
      )}

      {activeTab === 'profile' && (
        <Profile 
          onClearData={handleClearData} 
          onExportData={handleExportData} 
          onPaySubscription={handlePaySubscription}
        />
      )}

      <AddTransactionModal 
        isOpen={isModalOpen} 
        initialData={modalInitialData}
        onClose={() => setIsModalOpen(false)} 
        onAdd={addTransaction} 
      />
    </Layout>
  );
}

export default App;
