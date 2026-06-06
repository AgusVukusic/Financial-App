import React from 'react';
import { Home, PlusCircle, PieChart, User } from 'lucide-react';
import './Layout.css';

const Layout = ({ children, activeTab, onTabChange, onAddClick }) => {
  return (
    <div className="layout-container">
      <main className="main-content">
        {children}
      </main>
      
      <nav className="bottom-nav glass-panel">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => onTabChange('home')}
        >
          <Home size={24} />
          <span>Inicio</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => onTabChange('reports')}
        >
          <PieChart size={24} />
          <span>Reportes</span>
        </button>
        
        <div className="nav-fab-container">
          <button className="fab" onClick={onAddClick}>
            <PlusCircle size={32} color="#fff" />
          </button>
        </div>
        
        <button 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => onTabChange('profile')}
        >
          <User size={24} />
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
