import { AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import { getSubscriptionStatus } from '../../utils/subscriptionUtils';
import { formatCurrency } from '../../utils/formatters';
import { dueText } from '../../utils/dashboardFormat';
import Button from '../ui/Button';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Tag from '../ui/Tag';
import styles from './UpcomingSubscriptions.module.css';

/**
 * "Para pagar": gastos fijos vencidos o por vencer (5 días), los más urgentes primero.
 * El estado va en palabras con ícono (vencido o por vencer), no solo en color. Pagar se hace en Gestionar.
 */
const UpcomingSubscriptions = ({ subscriptions, onNavigate }) => {
  const upcoming = (subscriptions || [])
    .map((sub) => ({ ...sub, statusObj: getSubscriptionStatus(sub) }))
    .filter((s) => s.statusObj.status === 'overdue' || s.statusObj.status === 'due_soon')
    .sort((a, b) => a.statusObj.nextPayment - b.statusObj.nextPayment)
    .slice(0, 3);

  return (
    <section aria-label="Para pagar">
      <SectionHeader
        index="01"
        title="Para pagar"
        meta={
          <Button variant="key" size="sm" onClick={onNavigate}>
            Gestionar
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        }
      />

      {upcoming.length === 0 ? (
        <Card variant="dashed" className={styles.empty}>
          Nada vence en los próximos 5 días.
        </Card>
      ) : (
        <ul className={styles.list}>
          {upcoming.map((sub) => {
            const overdue = sub.statusObj.status === 'overdue';
            return (
              <li key={sub.id} className={styles.item}>
                <div className={styles.main}>
                  <span className={styles.name}>{sub.description}</span>
                  <Tag
                    tone={overdue ? 'bad' : 'warn'}
                    icon={overdue ? <AlertTriangle size={12} aria-hidden="true" /> : <Clock size={12} aria-hidden="true" />}
                  >
                    {dueText(sub.statusObj.status, sub.statusObj.days)}
                  </Tag>
                </div>
                <b className={styles.amount}>{formatCurrency(sub.amount)}</b>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default UpcomingSubscriptions;
