import styles from './Odometer.module.css';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Cifra que rueda como un odómetro cuando cambia `value` (texto ya formateado, por ejemplo "15.373.721").
 * Cada dígito es una ventana de 1 em con la pila 0-9 desplazada con transform (solo composición). Con movimiento
 * reducido, cambia de golpe. Los dígitos van ocultos a lectores de pantalla; el valor completo se anuncia
 * por aria-label.
 */
const Odometer = ({ value, className = '', ...props }) => {
  const text = String(value);
  return (
    <span className={`${styles.od} ${className}`.trim()} role="img" aria-label={text} {...props}>
      {Array.from(text).map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className={styles.d} aria-hidden="true">
            <span className={styles.s} style={{ transform: `translateY(-${Number(ch) * 10}%)` }}>
              {DIGITS.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} className={styles.c} aria-hidden="true">
            {ch === ' ' ? ' ' : ch}
          </span>
        ),
      )}
    </span>
  );
};

export default Odometer;
