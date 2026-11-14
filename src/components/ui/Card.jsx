import styles from './Card.module.css';

/**
 * Superficie con filete. `variant="dotted"` suma la trama de puntos del panel (para cabeceras);
 * `variant="dashed"` es un hueco o algo ya resuelto (por ejemplo, un gasto fijo pagado).
 */
const Card = ({ children, className = '', noPadding = false, variant = 'plain', ...props }) => {
  const classes = [
    styles.card,
    variant === 'dotted' ? styles.dotted : '',
    variant === 'dashed' ? styles.dashed : '',
    noPadding ? '' : styles.withPadding,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
