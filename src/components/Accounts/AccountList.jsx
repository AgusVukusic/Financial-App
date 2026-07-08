import React from 'react';
import AccountCard from './AccountCard';
import Button from '../ui/Button';
import { Plus } from 'lucide-react';

const AccountList = ({ accounts, balances, onAddClick, onEditClick }) => {
  return (
    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Mis Cuentas</h3>
        <Button variant="ghost" onClick={onAddClick} style={{ padding: '4px 8px', fontSize: '14px' }}>
          <Plus size={16} style={{ marginRight: '4px' }} /> Nueva
        </Button>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: 'var(--spacing-md)', 
        overflowX: 'auto', 
        paddingBottom: 'var(--spacing-sm)',
        scrollbarWidth: 'none' // Firefox
      }}>
        {accounts.map(acc => (
          <AccountCard 
            key={acc.id} 
            account={acc} 
            balance={balances[acc.id] || 0} 
            onClick={onEditClick}
          />
        ))}
        {accounts.length === 0 && (
          <div style={{ padding: 'var(--spacing-xl)', color: 'var(--text-tertiary)', textAlign: 'center', width: '100%', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
            No tienes cuentas configuradas.
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountList;
