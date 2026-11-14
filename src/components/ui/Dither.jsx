import styles from './Dither.module.css';

/**
 * Tramas en tinta (puntos, rayas, sólido) para distinguir categorías sin depender del color:
 * 0 puntos finos, 1 puntos gruesos, 2 diagonal, 3 vertical, 4 horizontal, 5 sólido.
 */
export const Dither = ({ kind = 0, className = '', style, ...props }) => (
  <span className={`${styles.pat} ${styles[`p${kind % 6}`]} ${className}`.trim()} style={style} aria-hidden="true" {...props} />
);

/**
 * Barra apilada de partes de un todo. `items`: [{ kind, value }]. `label` describe el gráfico completo para
 * lectores de pantalla (la leyenda con nombres y porcentajes va aparte, en texto).
 */
export const DitherBar = ({ items, label, className = '' }) => (
  <div className={`${styles.stack} ${className}`.trim()} role="img" aria-label={label}>
    {items
      .filter((item) => item.value > 0)
      .map((item) => (
        <Dither key={item.kind} kind={item.kind} style={{ flex: `${item.value} 1 0` }} />
      ))}
  </div>
);
