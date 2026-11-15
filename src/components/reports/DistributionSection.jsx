import { formatCurrency } from '../../utils/formatters';
import { distribution } from '../../utils/reportsData';
import Card from '../ui/Card';
import { DitherBar } from '../ui/Dither';
import SectionHeader from '../ui/SectionHeader';
import Swatch from './Swatch';
import styles from './DistributionSection.module.css';

/**
 * "En qué se fue": barra de tramas con el reparto del gasto del mes y, debajo, la leyenda en texto
 * (trama, nombre, monto y porcentaje), de mayor a menor. Las categorías desconocidas se suman a "Otros".
 */
const DistributionSection = ({ expensesByCategory, monthLabel }) => {
  const { items, total } = distribution(expensesByCategory);
  const month = monthLabel || 'este mes';

  if (items.length === 0) {
    return (
      <section aria-label="En qué se fue">
        <SectionHeader index="01" title="En qué se fue" />
        <Card variant="dashed" className={styles.empty}>
          Todavía no hay gastos en {month}.
        </Card>
      </section>
    );
  }

  const label = `Gasto de ${month} por categoría: ${items.map((i) => `${i.name} ${i.pct}%`).join(', ')}.`;

  return (
    <section aria-label="En qué se fue">
      <SectionHeader index="01" title="En qué se fue" meta={<span className={styles.meta}>{`${formatCurrency(total)}${monthLabel ? ` · ${monthLabel}` : ''}`}</span>} />
      <DitherBar items={items} label={label} />
      <ul className={styles.legend}>
        {items.map((item) => (
          <li key={item.name} className={styles.item}>
            <Swatch kind={item.kind} />
            <span className={styles.name}>{item.name}</span>
            <span className={styles.amount}>{formatCurrency(item.value)}</span>
            <span className={styles.pct}>{item.pct}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default DistributionSection;
