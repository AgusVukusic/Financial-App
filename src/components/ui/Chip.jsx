import styles from './Chip.module.css';

/**
 * Chip tocable de 44 px (categorías, cuentas, gastos frecuentes). Con `pressed` es un interruptor:
 * el estado activo se ve invertido y con tilde, no solo con otro color.
 */
const Chip = ({ pressed, icon = null, className = '', children, ...props }) => (
  <button
    type="button"
    className={`${styles.chip} ${className}`.trim()}
    {...(pressed === undefined ? {} : { 'aria-pressed': pressed })}
    {...props}
  >
    {icon}
    {children}
  </button>
);

export default Chip;
