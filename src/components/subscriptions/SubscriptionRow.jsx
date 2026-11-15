import { AlertTriangle, Check, Clock } from 'lucide-react';
import { getSubscriptionStatus } from '../../utils/subscriptionUtils';
import { formatCurrency } from '../../utils/formatters';
import { dueText } from '../../utils/dashboardFormat';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Tag from '../ui/Tag';
import styles from './SubscriptionRow.module.css';

const shortDate = (date) => `${date.getDate()}/${date.getMonth() + 1}`;

/** ¿El último pago de este gasto fijo cae en el mes y año de `now`? */
const isPaidThisMonth = (sub, now = new Date()) => {
  if (!sub.lastPaidDate) return false;
  const paid = new Date(sub.lastPaidDate);
  return paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth();
};

/**
 * Un gasto fijo: dos botones hermanos dentro del renglón. El principal abre la edición; "Pagar" solo aparece
 * cuando está vencido o vence en 5 días o menos. El estado va en palabras con ícono, nunca solo en color.
 *
 * Ojo: el estado "paid" de `getSubscriptionStatus` solo quiere decir "faltan más de 5 días", no "pagado".
 * "Pagado este mes" se afirma únicamente si `lastPaidDate` cae en el mes en curso.
 */
const SubscriptionRow = ({ sub, paying = false, onEdit, onPay }) => {
  const statusObj = getSubscriptionStatus(sub);
  const { status, days, nextPayment } = statusObj;
  const overdue = status === 'overdue';
  const payable = overdue || status === 'due_soon';
  const paidThisMonth = isPaidThisMonth(sub);
  const date = shortDate(nextPayment);

  let state;
  if (overdue) {
    state = (
      <>
        <Tag tone="bad" icon={<AlertTriangle size={12} aria-hidden="true" />}>
          {dueText(status, days)}
        </Tag>
        <span className={styles.date}>el {date}</span>
      </>
    );
  } else if (status === 'due_soon') {
    state = (
      <>
        <Tag tone="warn" icon={<Clock size={12} aria-hidden="true" />}>
          {dueText(status, days)}
        </Tag>
        <span className={styles.date}>el {date}</span>
      </>
    );
  } else if (paidThisMonth) {
    state = (
      <Tag tone="ok" icon={<Check size={12} aria-hidden="true" />}>
        Pagado este mes
      </Tag>
    );
  } else {
    state = <span className={styles.date}>Vence el {date}</span>;
  }

  return (
    <li className={styles.item}>
      <Card variant={paidThisMonth && !payable ? 'dashed' : 'plain'} noPadding className={styles.card}>
        <button type="button" className={styles.main} onClick={() => onEdit(sub)} aria-haspopup="dialog">
          <span className={styles.top}>
            <span className={styles.name}>{sub.description}</span>
            <span className={styles.amount}>
              {formatCurrency(sub.amount)}
              <small className={styles.cycle}>/{sub.cycle === 'yearly' ? 'año' : 'mes'}</small>
            </span>
          </span>
          <span className={styles.state}>{state}</span>
        </button>
        {payable && (
          <Button
            variant="key"
            size="sm"
            className={styles.pay}
            disabled={paying}
            onClick={() => onPay(sub)}
            aria-label={`Pagar ${sub.description}`}
          >
            Pagar
          </Button>
        )}
      </Card>
    </li>
  );
};

export default SubscriptionRow;
