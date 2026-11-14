import styles from './Meter.module.css';

/**
 * Medidor de presupuesto de 10 segmentos. Lo gastado llena segmentos; si se pasa del tope aparece un segmento
 * rayado aparte. Sin tope (limit nulo o 0) es una línea punteada. El estado en palabras ("Superado por $ 87.499")
 * lo escribe quien lo usa: el medidor es la mitad gráfica, y la forma (rayado) no depende del color.
 */
const Meter = ({ used, limit, segments = 10, label, className = '' }) => {
  const hasLimit = Number.isFinite(limit) && limit > 0;

  if (!hasLimit) {
    return <div className={`${styles.meter} ${styles.nolim} ${className}`.trim()} role="img" aria-label={label || 'Sin tope'} />;
  }

  const ratio = used / limit;
  const over = used > limit;
  const filled = over ? segments : used > 0 ? Math.max(1, Math.round(ratio * segments)) : 0;

  return (
    <div
      className={`${styles.meter} ${className}`.trim()}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={Math.min(used, limit)}
      aria-valuetext={label}
      aria-label={label}
    >
      {Array.from({ length: segments }, (_, i) => (
        <i key={i} className={i < filled ? styles.on : undefined} />
      ))}
      {over && <i className={styles.ex} />}
    </div>
  );
};

export default Meter;
