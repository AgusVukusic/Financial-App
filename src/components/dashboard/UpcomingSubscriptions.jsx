import React from 'react';
import { getSubscriptionStatus } from '../../utils/subscriptionUtils';
import { formatCurrency } from '../../utils/formatters';
import { Bell, ChevronRight, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const UpcomingSubscriptions = ({ subscriptions, onNavigate }) => {
  // Filter subscriptions that are overdue or due soon (within 7 days)
  const upcoming = (subscriptions || []).map(sub => ({
    ...sub,
    statusObj: getSubscriptionStatus(sub)
  })).filter(s => s.statusObj.status === 'overdue' || s.statusObj.status === 'due_soon')
  .sort((a, b) => a.statusObj.nextPayment - b.statusObj.nextPayment)
  .slice(0, 3); // Show top 3

  return (
    <Card style={{ marginBottom: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: upcoming.length > 0 ? 'var(--spacing-md)' : '0' }}>
        <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Bell size={18} color={upcoming.length > 0 ? "var(--warning)" : "var(--text-secondary)"} />
          Gastos Fijos
        </h3>
        <Button variant="ghost" onClick={onNavigate} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Gestionar <ChevronRight size={16} />
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {upcoming.map(sub => (
          <div key={sub.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: 'var(--spacing-sm)',
            background: 'var(--bg-glass)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: `3px solid ${sub.statusObj.status === 'overdue' ? 'var(--danger)' : 'var(--warning)'}`
          }}>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: '500', fontSize: '0.9rem' }}>{sub.description}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} />
                {sub.statusObj.status === 'overdue' 
                  ? `Venció hace ${sub.statusObj.days} días` 
                  : `Vence en ${sub.statusObj.days} días`}
              </p>
            </div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
              {formatCurrency(sub.amount)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default UpcomingSubscriptions;
