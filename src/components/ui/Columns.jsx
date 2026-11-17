import styles from './Columns.module.css';

/**
 * Dos columnas desde 1024 px de ancho (escritorio); por debajo no existen: los hijos se apilan como si los
 * contenedores no estuvieran (`display: contents`), así que el celular y la tablet no cambian.
 * El orden del DOM es el orden de Tab: primera columna entera, después la segunda.
 */
export const Columns = ({ children, className = '' }) => <div className={`${styles.cols} ${className}`.trim()}>{children}</div>;

/** Una columna de `Columns`: sus secciones se apilan con el espacio de siempre entre secciones. */
export const Column = ({ children, className = '' }) => <div className={`${styles.col} ${className}`.trim()}>{children}</div>;
