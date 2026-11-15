import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Input from '../ui/Input';
import Sheet from '../ui/Sheet';
import { useToast } from '../ui/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { parseAmountInput, formatAmountInput } from '../../utils/amountInput';
import { hasLimit } from '../../utils/reportsData';
import formStyles from '../FormSheet.module.css';
import styles from './BudgetSheet.module.css';

/** Formulario del tope; se monta solo con la hoja abierta (el estado inicial sale de las props). */
const BudgetForm = ({ category, limit, updateBudget, onClose }) => {
  const { showToast } = useToast();
  // El "Quitar tope" depende de si había tope al abrir, no de lo que llegue después del guardado.
  const [hadLimit] = useState(() => hasLimit(limit));
  const [value, setValue] = useState(() => (hasLimit(limit) ? formatAmountInput(limit) : ''));
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (amount, message) => {
    setSaving(true);
    setServerError('');
    try {
      await updateBudget(category, amount);
      showToast(message, 'success');
      onClose();
    } catch (err) {
      setServerError(err?.message || 'No se pudo guardar el tope. Probá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving) return;
    if (value.trim() === '') {
      setError('Escribí cuánto querés gastar como máximo en el mes.');
      return;
    }
    const amount = parseAmountInput(value);
    if (amount === null) {
      setError('Escribí un monto válido, por ejemplo 50000 o 1.500,50.');
      return;
    }
    if (amount <= 0) {
      setError('El tope tiene que ser mayor a cero.');
      return;
    }
    if (Math.round(amount * 100) > Number.MAX_SAFE_INTEGER) {
      setError('Ese monto es demasiado grande.');
      return;
    }
    setError('');
    save(amount, `Tope de ${category}: ${formatCurrency(amount)}`);
  };

  const handleRemove = () => {
    if (saving) return;
    setError('');
    save(0, `Tope de ${category} quitado`);
  };

  return (
    <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
      <Field label="Máximo para gastar por mes ($)" error={error} hint="Se aplica a cada mes. Podés escribir 50000 o 50.000.">
        {(p) => (
          <Input
            {...p}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            fullWidth
            className={formStyles.amount}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            data-autofocus
          />
        )}
      </Field>

      {serverError && (
        <p role="alert" className={styles.serverError}>
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{serverError}</span>
        </p>
      )}

      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="lg" block disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar tope'}
        </Button>
        {hadLimit && (
          <Button type="button" variant="key" size="lg" block disabled={saving} onClick={handleRemove}>
            Quitar tope
          </Button>
        )}
      </div>
    </form>
  );
};

/** Hoja para poner, cambiar o quitar el tope de una categoría. `category` no se borra al cerrar (la hoja anima su salida). */
const BudgetSheet = ({ open, onClose, category, limit, updateBudget }) => (
  <Sheet open={open} onClose={onClose} title={category ? `Tope de ${category}` : ''}>
    {category && <BudgetForm key={category} category={category} limit={limit} updateBudget={updateBudget} onClose={onClose} />}
  </Sheet>
);

export default BudgetSheet;
