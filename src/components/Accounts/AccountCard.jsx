import React from 'react';
import Card from '../ui/Card';
import { Landmark, Smartphone, Wallet, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ACCOUNT_TYPES } from './AddAccountModal';

const AccountCard = ({ account, balance, onClick }) => {
  const accountType = ACCOUNT_TYPES.find(t => t.id === account.type) || ACCOUNT_TYPES[0];
  const Icon = accountType.icon;

  return (
    <Card 
      onClick={() => onClick(account)}
      style={{ 
        minWidth: '200px', 
        cursor: 'pointer', 
        transition: 'transform 0.2s',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--spacing-md)'
      }}
      className="hover-lift"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
        <Icon size={20} />
        <span style={{ fontSize: '14px', fontWeight: '500' }}>{account.name}</span>
      </div>
      <div>
        <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          {formatCurrency(balance)}
        </h3>
      </div>
    </Card>
  );
};

export default AccountCard;
