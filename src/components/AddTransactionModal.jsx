import { useRef, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Button from './ui/Button';
import Chip from './ui/Chip';
import Field from './ui/Field';
import Input from './ui/Input';
import Select from './ui/Select';
import Sheet from './ui/Sheet';
import { useToast } from './ui/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { useRequestId } from '../hooks/useRequestId';
import { localDateString } from '../utils/frequentExpenses';
import { parseAmountInput, formatAmountInput } from '../utils/amountInput';
import styles from './FormSheet.module.css';

const CATEGORIES = ['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros'];
const TYPES = [
  { id: 'expense', label: 'Gasto', save: 'Guardar gasto' },
  { id: 'income', label: 'Ingreso', save: 'Guardar ingreso' },
  { id: 'transfer', label: 'Transferencia', save: 'Guardar transferencia' },
];

/** 'YYYY-MM-DD' -> "Hoy" o "14/11/2026" (para el resumen del bloque plegado). */
const dateSummary = (value) => {
  if (!value) return '';
  if (value === localDateString()) return 'Hoy';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Formulario de movimiento. Se monta solo mientras la hoja está abierta, así que el estado inicial sale de las props
 * y no hace falta sincronizarlo con efectos.
 */
const TransactionForm = ({ onClose, onAdd, onEdit, onDelete, initialData, accounts }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const { getId, reset: resetRequestId } = useRequestId();
  const isEdit = Boolean(initialData && initialData.id);
  const firstAccount = accounts[0]?.id || '';
  const amountRef = useRef(null);

  const [type, setType] = useState(initialData?.type || 'expense');
  const [amount, setAmount] = useState(formatAmountInput(initialData?.amount));
  const [category, setCategory] = useState(initialData?.category && CATEGORIES.includes(initialData.category) ? initialData.category : CATEGORIES[0]);
  const [accountId, setAccountId] = useState(initialData?.accountId || firstAccount);
  const [transferToAccountId, setTransferToAccountId] = useState(initialData?.transferToAccountId || accounts[1]?.id || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date ? initialData.date.split('T')[0] : localDateString());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const typeInfo = TYPES.find((t) => t.id === type) || TYPES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const next = {};
    // Acepta 3500, 3,5 y 1.500 (miles): un type="number" leería "1.500" como 1,5.
    const parsedAmount = parseAmountInput(amount);
    if (parsedAmount === null || parsedAmount <= 0) next.amount = 'Ingresá un monto mayor a cero.';
    if (type === 'transfer' && accountId === transferToAccountId) next.accounts = 'La cuenta de origen y la de destino tienen que ser distintas.';
    if (!date) next.date = 'Elegí una fecha.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      if (next.amount) amountRef.current?.focus();
      return;
    }

    const data = { type, amount: parsedAmount, accountId, description, date };
    if (type === 'expense') {
      data.category = category;
    } else if (type === 'income') {
      data.category = 'Ingreso';
    } else {
      data.transferToAccountId = transferToAccountId;
      data.category = 'Transferencia';
    }

    // Mismo requestId mientras el contenido no cambie: un reintento tras un error de red no duplica el movimiento.
    data.requestId = getId({ ...data, editing: initialData?.id || null });

    setSaving(true);
    try {
      if (isEdit && onEdit) {
        await onEdit(initialData.id, data);
        showToast('Movimiento editado', 'success');
      } else {
        await onAdd(data);
        showToast('Movimiento añadido', 'success');
      }
      resetRequestId();
      onClose();
    } catch (error) {
      showToast('Error al guardar el movimiento: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !onDelete) return;
    const ok = await confirm('Se elimina este movimiento y el saldo de la cuenta vuelve a como estaba. No se puede deshacer.', 'Eliminar movimiento', { confirmText: 'Eliminar' });
    if (!ok) return;
    try {
      await onDelete(initialData.id);
      showToast('Movimiento eliminado', 'success');
      onClose();
    } catch (error) {
      showToast('Error al eliminar: ' + error.message, 'error');
    }
  };

  if (accounts.length === 0) {
    return <p className={styles.note}>Creá al menos una cuenta antes de anotar movimientos.</p>;
  }

  const accountOptions = accounts.map((acc) => (
    <option key={acc.id} value={acc.id}>
      {acc.name}
    </option>
  ));

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <div role="group" aria-label="Tipo de movimiento" className={styles.types}>
        {TYPES.filter((t) => t.id !== 'transfer' || accounts.length > 1).map((t) => (
          <Chip
            key={t.id}
            pressed={type === t.id}
            onClick={() => {
              setType(t.id);
              setErrors({});
            }}
            icon={t.id === 'transfer' ? <ArrowRightLeft size={16} aria-hidden="true" /> : undefined}
          >
            {t.label}
          </Chip>
        ))}
      </div>

      <Field label="Monto ($)" error={errors.amount}>
        {(p) => (
          <Input
            {...p}
            ref={amountRef}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            fullWidth
            className={styles.amount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            data-autofocus={isEdit ? undefined : true}
          />
        )}
      </Field>

      {type === 'expense' && (
        <div>
          <p className={styles.groupLabel} id="categoria-label">
            Categoría
          </p>
          <div role="group" aria-labelledby="categoria-label" className={styles.group}>
            {CATEGORIES.map((c) => (
              <Chip key={c} pressed={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {type !== 'transfer' ? (
        <Field label="Cuenta">
          {(p) => (
            <Select {...p} fullWidth value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accountOptions}
            </Select>
          )}
        </Field>
      ) : (
        <>
          <Field label="Desde">
            {(p) => (
              <Select {...p} fullWidth value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {accountOptions}
              </Select>
            )}
          </Field>
          <Field label="Hacia" error={errors.accounts}>
            {(p) => (
              <Select {...p} fullWidth value={transferToAccountId} onChange={(e) => setTransferToAccountId(e.target.value)}>
                {accountOptions}
              </Select>
            )}
          </Field>
        </>
      )}

      <details className={styles.more} open={isEdit || Boolean(errors.date)}>
        <summary>Fecha y descripción · {dateSummary(date)}</summary>
        <div className={styles.moreBody}>
          <Field label="Fecha" error={errors.date}>
            {(p) => <Input {...p} type="date" fullWidth value={date} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          <Field label="Descripción (opcional)">
            {(p) => <Input {...p} type="text" fullWidth value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Cena con amigos" maxLength={30} />}
          </Field>
        </div>
      </details>

      <div className={styles.submit}>
        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? 'Guardando…' : typeInfo.save}
        </Button>
        {isEdit && onDelete && (
          <Button type="button" variant="danger" size="lg" onClick={handleDelete} disabled={saving}>
            Eliminar
          </Button>
        )}
      </div>
    </form>
  );
};

/** Hoja para anotar o editar un movimiento. Props sin cambios respecto de la versión anterior. */
const AddTransactionModal = ({ isOpen, onClose, onAdd, onEdit, onDelete, initialData, accounts = [] }) => (
  <Sheet open={isOpen} onClose={onClose} title={initialData && initialData.id ? 'Editar movimiento' : 'Nuevo movimiento'}>
    <TransactionForm onClose={onClose} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} initialData={initialData} accounts={accounts} />
  </Sheet>
);

export default AddTransactionModal;
