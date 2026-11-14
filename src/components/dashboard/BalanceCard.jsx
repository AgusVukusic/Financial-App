import { ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { splitBalance } from '../../utils/dashboardFormat';
import Card from '../ui/Card';
import Odometer from '../ui/Odometer';
import styles from './BalanceCard.module.css';

// Doto es una fuente de puntos: solo se lee bien grande. Pasada esta cantidad de caracteres se usa mono nítida.
const MAX_DOT_CHARS = 12;

/**
 * Saldo total en grande (lo primero que se ve) y lo que entró y salió del mes.
 * Entró/salió llevan signo y flecha además de color; el saldo negativo lleva el signo −.
 */
const BalanceCard = ({ netWorth, balance, income, expense }) => {
  const total = netWorth !== undefined ? netWorth : balance;
  const { negative, digits } = splitBalance(total);
  const text = `${negative ? '−' : ''}${digits}`;
  const long = text.length > MAX_DOT_CHARS;

  return (
    <Card variant="dotted" className={styles.card} aria-label="Saldo total">
      <p className={styles.label}>Saldo total</p>
      <div className={styles.balance} style={{ '--chars': text.length }}>
        <span className={styles.currency} aria-hidden="true">
          $
        </span>
        <Odometer value={text} className={long ? styles.valueMono : styles.value} />
      </div>

      <div className={styles.io}>
        <div className={styles.cell}>
          <span className={styles.cellLabel}>
            <ArrowUp size={12} aria-hidden="true" />
            Entró
          </span>
          <b className={styles.in}>+{formatCurrency(income)}</b>
        </div>
        <div className={styles.cell}>
          <span className={styles.cellLabel}>
            <ArrowDown size={12} aria-hidden="true" />
            Salió
          </span>
          <b>&minus;{formatCurrency(expense)}</b>
        </div>
      </div>
    </Card>
  );
};

export default BalanceCard;
