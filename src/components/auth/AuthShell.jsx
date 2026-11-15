import styles from './AuthShell.module.css';

/** Base de las pantallas previas al ingreso: página a alto completo, columna centrada, sin tapar los avisos. */
const AuthShell = ({ children, className = '', ...props }) => (
  <main className={styles.page} {...props}>
    <div className={`${styles.column} ${className}`.trim()}>{children}</div>
  </main>
);

export default AuthShell;
