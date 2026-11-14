import styles from './SectionHeader.module.css';

/**
 * Cabecera de sección del panel: numeral en naranja, título en mayúsculas mono, resumen a la derecha y
 * filete grueso debajo. `as` define el nivel de encabezado (por defecto h2).
 */
const SectionHeader = ({ index, title, meta, as: Heading = 'h2', className = '' }) => (
  <div className={`${styles.head} ${className}`.trim()}>
    {index != null && (
      <span className={styles.index} aria-hidden="true">
        {index}
      </span>
    )}
    <Heading className={styles.title}>{title}</Heading>
    {meta != null && <span className={styles.meta}>{meta}</span>}
  </div>
);

export default SectionHeader;
