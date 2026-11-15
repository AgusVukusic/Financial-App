import { formatCurrency } from '../../utils/formatters';
import { formatCompact, niceMax } from '../../utils/reportsData';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import styles from './MonthlyChart.module.css';

const ratio = (value, max) => (value > 0 && max > 0 ? Math.max(value / max, 0.02) : 0);

const summarize = (series) => {
  const top = (field) => series.reduce((best, m) => (m[field] > best[field] ? m : best), series[0]);
  const spend = top('expense');
  const earn = top('income');
  const parts = [`Entró y salió por mes, de ${series[0].label} a ${series[series.length - 1].label}.`];
  if (spend.expense > 0) parts.push(`Más gasto: ${spend.label}, ${formatCurrency(spend.expense)}.`);
  if (earn.income > 0) parts.push(`Más ingresos: ${earn.label}, ${formatCurrency(earn.income)}.`);
  return parts.join(' ');
};

/**
 * "Últimos 6 meses": barras agrupadas hechas en HTML/CSS (entró sólida en --in, salió con trama rayada en tinta,
 * para no depender del color), leyenda en texto y una tabla real con los montos completos.
 */
const MonthlyChart = ({ series }) => {
  const clamped = series.map((m) => ({ ...m, expense: Math.max(0, m.expense), income: Math.max(0, m.income) }));
  const peak = Math.max(...clamped.map((m) => Math.max(m.income, m.expense)));

  if (!(peak > 0)) {
    return (
      <section aria-label="Últimos 6 meses">
        <SectionHeader index="02" title="Últimos 6 meses" />
        <Card variant="dashed" className={styles.empty}>
          Todavía no hay movimientos en los últimos 6 meses.
        </Card>
      </section>
    );
  }

  const max = niceMax(peak);
  const ticks = [max, max / 2, 0];

  return (
    <section aria-label="Últimos 6 meses">
      <SectionHeader index="02" title="Últimos 6 meses" />

      <ul className={styles.legend}>
        <li>
          <span className={`${styles.key} ${styles.in}`} aria-hidden="true" />
          Entró
        </li>
        <li>
          <span className={`${styles.key} ${styles.out}`} aria-hidden="true" />
          Salió
        </li>
      </ul>

      <div className={styles.chart} role="img" aria-label={summarize(clamped)}>
        <div className={styles.yaxis}>
          {ticks.map((t) => (
            <span key={t}>{formatCompact(t)}</span>
          ))}
        </div>
        <div className={styles.plot}>
          <span className={`${styles.grid} ${styles.gridTop}`} />
          <span className={`${styles.grid} ${styles.gridMid}`} />
          <div className={styles.groups}>
            {clamped.map((m) => (
              <div key={m.key} className={styles.group}>
                <span className={`${styles.bar} ${styles.in}`} style={{ '--h': ratio(m.income, max) }} />
                <span className={`${styles.bar} ${styles.out}`} style={{ '--h': ratio(m.expense, max) }} />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.xaxis}>
          {clamped.map((m) => (
            <span key={m.key}>{m.label}</span>
          ))}
        </div>
      </div>

      <details className={styles.details}>
        <summary className={styles.summary}>Ver en tabla</summary>
        <table className={styles.table}>
          <caption className={styles.caption}>Entró y salió por mes</caption>
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">Entró</th>
              <th scope="col">Salió</th>
            </tr>
          </thead>
          <tbody>
            {clamped.map((m) => (
              <tr key={m.key}>
                <th scope="row">{m.label}</th>
                <td>{formatCurrency(m.income)}</td>
                <td>{formatCurrency(m.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
};

export default MonthlyChart;
