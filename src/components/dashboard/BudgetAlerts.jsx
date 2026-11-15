import { AlertCircle, AlertTriangle } from 'lucide-react';
import { alertSummary } from '../../utils/reportsData';
import Button from '../ui/Button';
import styles from './BudgetAlerts.module.css';

/**
 * Resumen de topes en una sola línea ("2 topes superados · 1 cerca del límite") con un botón que lleva a la
 * sección de topes. No renderiza nada si no hay nada que avisar. Cada aviso lleva ícono y palabra, no solo color.
 */
const BudgetAlerts = ({ budgets = {}, expensesByCategory = {}, onSeeBudgets }) => {
  const { over, near } = alertSummary(budgets, expensesByCategory);
  if (over === 0 && near === 0) return null;

  return (
    <div className={styles.summary}>
      <p className={styles.text}>
        {over > 0 && (
          <span className={`${styles.part} ${styles.over}`}>
            <AlertTriangle size={16} aria-hidden="true" />
            {over} {over === 1 ? 'tope superado' : 'topes superados'}
          </span>
        )}
        {over > 0 && near > 0 && (
          <span className={styles.sep} aria-hidden="true">
            ·
          </span>
        )}
        {near > 0 && (
          <span className={`${styles.part} ${styles.near}`}>
            <AlertCircle size={16} aria-hidden="true" />
            {near} cerca del límite
          </span>
        )}
      </p>
      {onSeeBudgets && (
        <Button type="button" variant="key" size="sm" onClick={onSeeBudgets}>
          Ver topes
        </Button>
      )}
    </div>
  );
};

export default BudgetAlerts;
