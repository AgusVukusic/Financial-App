import { Check, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import Card from '../ui/Card';
import Meter from '../ui/Meter';
import styles from './PaceCard.module.css';

const ICONS = { fast: TrendingUp, on: Check, slow: TrendingDown };

/**
 * "Ritmo del mes": lo gastado en las categorías con tope frente a lo que correspondería a esta altura del mes
 * (`pace` sale de `paceStatus`). El estado va en palabras con ícono; solo "más rápido" usa --warn. En "en ritmo"
 * el medidor no pasa de lleno aunque se haya gastado hasta un 10 % de más: así no muestra el segmento de
 * exceso rayado mientras el texto dice que va bien.
 */
const PaceCard = ({ pace }) => {
  if (!pace) return null;
  const { state, text, spent, expected, day, days } = pace;
  const Icon = ICONS[state];
  const used = state === 'fast' ? spent : Math.min(spent, expected);
  const label = `${text}: llevás gastado ${formatCurrency(spent)} y a esta altura del mes corresponden ${formatCurrency(expected)}`;

  return (
    <Card className={styles.card} role="group" aria-label="Ritmo del mes">
      <div className={styles.top}>
        <span className={styles.kicker}>Ritmo del mes</span>
        <span className={styles.day}>
          Día {day} de {days}
        </span>
      </div>
      <p className={`${styles.status} ${state === 'fast' ? styles.warn : ''}`.trim()}>
        <Icon size={18} aria-hidden="true" />
        <span>{text}</span>
      </p>
      <Meter used={used} limit={expected} label={label} />
      <dl className={styles.figures}>
        <div className={styles.fig}>
          <dt>Llevás gastado</dt>
          <dd>{formatCurrency(spent)}</dd>
        </div>
        <div className={styles.fig}>
          <dt>Corresponde al día {day}</dt>
          <dd>{formatCurrency(expected)}</dd>
        </div>
      </dl>
      <p className={styles.note}>Cuenta solo las categorías que tienen tope.</p>
    </Card>
  );
};

export default PaceCard;
