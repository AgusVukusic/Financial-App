import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import Card from '../ui/Card';

const BalanceCard = ({ balance, income, expense }) => {
  return (
    <Card className="balance-card">
      <div className="balance-header">
        <span className="text-secondary">Balance Total</span>
        <Wallet size={20} className="text-secondary" />
      </div>
      <h1 className="balance-amount">{formatCurrency(balance)}</h1>
      
      <div className="balance-stats">
        <div className="stat-item income">
          <div className="stat-icon bg-success">
            <ArrowDownRight size={16} />
          </div>
          <div>
            <div className="stat-label">Ingresos</div>
            <div className="stat-value text-success">{formatCurrency(income)}</div>
          </div>
        </div>
        
        <div className="stat-item expense">
          <div className="stat-icon bg-danger">
            <ArrowUpRight size={16} />
          </div>
          <div>
            <div className="stat-label">Gastos</div>
            <div className="stat-value text-danger">{formatCurrency(expense)}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BalanceCard;
