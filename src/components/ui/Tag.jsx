import styles from './Tag.module.css';

/**
 * Sello de estado: rótulo chico en mayúsculas mono. El tono nunca va solo: lleva texto y, para
 * vencido/superado/aviso, un ícono (`icon`). Tonos: neutral, accent (novedad), dashed (hueco, deuda),
 * ok, warn, bad.
 */
const Tag = ({ tone = 'neutral', icon = null, className = '', children, ...props }) => (
  <span className={`${styles.tag} ${styles[tone] || ''} ${className}`.trim()} {...props}>
    {icon}
    {children}
  </span>
);

export default Tag;
