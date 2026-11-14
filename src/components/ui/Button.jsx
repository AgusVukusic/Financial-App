import styles from './Button.module.css';

/**
 * Tecla del panel. Variantes: primary (acento, la acción principal de la pantalla), key (neutra, por defecto
 * para acciones secundarias), outline (plana), ghost (sin borde), danger y success (solo texto de estado).
 * Todas miden 44 px o más de alto. `isIcon` la deja cuadrada de 44 × 44: pasale un aria-label.
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isIcon = false,
  block = false,
  ...props
}) => {
  const classes = [
    styles.btn,
    styles[`btn-${variant}`] || styles['btn-primary'],
    styles[`size-${size}`] || styles['size-md'],
    isIcon ? styles.iconBtn : '',
    block ? styles.block : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
