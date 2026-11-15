import { AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { budgetStatus, categoryKind, hasLimit } from '../../utils/reportsData';
import Meter from '../ui/Meter';
import Swatch from './Swatch';
import styles from './BudgetRow.module.css';

// Mismo redondeo a centavos que budgetStatus, para que el medidor y el texto no discrepen por ruido de decimales.
const meterValue = (n) => Math.max(0, Math.round((Number.isFinite(n) ? n : 0) * 100) / 100);

const STATUS_ICON = { over: AlertTriangle, full: AlertCircle, warn: AlertCircle };
const STATUS_CLASS = { none: styles.none, over: styles.over, full: styles.warn, warn: styles.warn };

/**
 * Renglón de una categoría: un solo botón que abre la hoja del tope. Muestra gastado / tope, el medidor y el
 * estado en palabras con ícono (superado y cerca del límite nunca van solo en color). El gasto va en tinta neutra.
 */
const BudgetRow = ({ category, spent, limit, onOpen }) => {
  const limited = hasLimit(limit);
  const status = budgetStatus(spent, limit);
  const Icon = STATUS_ICON[status.state];
  const spentText = formatCurrency(spent);

  const summary = limited ? `${spentText} de ${formatCurrency(limit)}. ${status.text}` : `${spentText} gastado, sin tope. Poné un tope`;

  return (
    <button type="button" className={styles.row} onClick={() => onOpen(category)} aria-label={`${category}: ${summary}. Editar tope`}>
      <Swatch kind={categoryKind(category)} />
      <span className={styles.body}>
        <span className={styles.top}>
          <span className={styles.name}>{category}</span>
          <span className={styles.figures}>
            {spentText}
            {limited && ` / ${formatCurrency(limit)}`}
          </span>
        </span>
        <Meter used={meterValue(spent)} limit={meterValue(limit)} label={`${category}: ${status.text}`} />
        <span className={styles.bottom}>
          <span className={`${styles.status} ${STATUS_CLASS[status.state] || ''}`.trim()}>
            {Icon && <Icon size={14} aria-hidden="true" />}
            <span>{status.text}</span>
          </span>
          {!limited && <span className={styles.invite}>Poné un tope</span>}
        </span>
      </span>
      <ChevronRight size={18} className={styles.chevron} aria-hidden="true" />
    </button>
  );
};

export default BudgetRow;
