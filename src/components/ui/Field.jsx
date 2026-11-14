import { useId } from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './Field.module.css';

/**
 * Campo de formulario con etiqueta, ayuda y error ya conectados (for/id, aria-describedby, aria-invalid).
 * `children` es una función que recibe esos props para pasárselos al control:
 *   <Field label="Monto" hint="En pesos" error={error}>{(p) => <Input type="number" {...p} />}</Field>
 * El error lleva ícono y texto, no solo color.
 */
const Field = ({ label, hint, error, className = '', children }) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`${styles.field} ${className}`.trim()}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          <AlertTriangle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};

export default Field;
