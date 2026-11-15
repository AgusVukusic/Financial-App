import { useRef, useState } from 'react';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Sheet from '../ui/Sheet';
import { useToast } from '../ui/ToastContext';
import { useDialog } from '../../contexts/DialogContext';
import { useRequestId } from '../../hooks/useRequestId';
import { parseAmountInput, formatAmountInput } from '../../utils/amountInput';
import { REPORT_CATEGORIES as CATEGORIES } from '../../utils/reportsData';
import formStyles from '../FormSheet.module.css';
import styles from './SubscriptionSheet.module.css';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/** Formulario de gasto fijo; se monta solo con la hoja abierta (el estado inicial sale de las props). */
const SubscriptionForm = ({ sub, accounts, onClose, onAdd, onEdit, onDelete }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const { getId, reset: resetRequestId } = useRequestId();
  const descriptionRef = useRef(null);
  const amountRef = useRef(null);
  const accountRef = useRef(null);
  const isEdit = Boolean(sub && sub.id);

  // Las categorías son las mismas 6 de toda la app (topes y Reportes). Un gasto fijo viejo con otra categoría
  // ("Entretenimiento", "Software"…) se muestra como "Otros" y se actualiza al guardar.
  const storedCategory = sub?.category || 'Servicios';
  const legacyCategory = CATEGORIES.includes(storedCategory) ? null : storedCategory;
  const initialCategory = legacyCategory ? 'Otros' : storedCategory;

  const [description, setDescription] = useState(sub?.description || '');
  const [amount, setAmount] = useState(sub ? formatAmountInput(sub.amount) : '');
  const [dueDate, setDueDate] = useState(String(sub?.dueDate || 1));
  const [cycle, setCycle] = useState(sub?.cycle || 'monthly');
  const [category, setCategory] = useState(initialCategory);
  const [accountId, setAccountId] = useState(sub?.accountId || (accounts.length === 1 ? accounts[0].id : ''));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const parsedAmount = parseAmountInput(amount);
    const next = {};
    if (!description.trim()) next.description = 'Ponele un nombre al gasto fijo.';
    if (parsedAmount === null || parsedAmount <= 0) next.amount = 'Ingresá un monto mayor a cero.';
    if (!accountId) next.accountId = 'Elegí la cuenta desde la que se paga.';
    setErrors(next);
    if (next.description) return descriptionRef.current?.focus();
    if (next.amount) return amountRef.current?.focus();
    if (next.accountId) return accountRef.current?.focus();

    const data = {
      description: description.trim(),
      amount: parsedAmount,
      category,
      dueDate: parseInt(dueDate, 10),
      cycle,
      accountId,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await onEdit(sub.id, data);
        showToast('Cambios guardados', 'success');
      } else {
        await onAdd({ ...data, requestId: getId(data) });
        showToast('Gasto fijo guardado', 'success');
      }
      resetRequestId();
      onClose();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || saving) return;
    const ok = await confirm(
      `¿Eliminar "${sub.description}"? Los pagos que ya registraste no se borran.`,
      'Eliminar gasto fijo',
      { confirmText: 'Eliminar' },
    );
    if (!ok) return;
    try {
      await onDelete(sub.id);
      showToast('Gasto fijo eliminado', 'success');
      onClose();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
      <Field label="Descripción" error={errors.description}>
        {(p) => (
          <Input
            {...p}
            ref={descriptionRef}
            type="text"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Netflix"
            maxLength={80}
            data-autofocus={isEdit ? undefined : true}
          />
        )}
      </Field>

      <Field label="Monto ($)" error={errors.amount}>
        {(p) => (
          <Input
            {...p}
            ref={amountRef}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        )}
      </Field>

      <Field label="Día del mes en que vence">
        {(p) => (
          <Select {...p} fullWidth value={dueDate} onChange={(e) => setDueDate(e.target.value)}>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Frecuencia">
        {(p) => (
          <Select {...p} fullWidth value={cycle} onChange={(e) => setCycle(e.target.value)}>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </Select>
        )}
      </Field>

      <Field
        label="Categoría"
        hint={legacyCategory ? `Antes era "${legacyCategory}". Elegí una de las categorías de la app.` : undefined}
      >
        {(p) => (
          <Select {...p} fullWidth value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Cuenta de pago" error={errors.accountId}>
        {(p) => (
          <Select {...p} ref={accountRef} fullWidth value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="" disabled>
              Elegí una cuenta
            </option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {isEdit && (
        <Button type="button" variant="danger" block onClick={handleDelete} disabled={saving}>
          Eliminar gasto fijo
        </Button>
      )}

      <div className={formStyles.submit}>
        <Button type="submit" variant="primary" size="lg" block disabled={saving}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
};

/** Sin cuentas no hay de dónde pagar: se explica y se lleva a crear una. */
const NoAccounts = ({ onCreateAccount }) => (
  <div className={styles.empty}>
    <p>Para anotar un gasto fijo primero necesitás una cuenta.</p>
    <Button variant="primary" size="lg" block onClick={onCreateAccount}>
      Crear una cuenta
    </Button>
  </div>
);

/** Hoja para crear o editar un gasto fijo. */
const SubscriptionSheet = ({ open, onClose, sub, accounts, onAdd, onEdit, onDelete, onAddAccountClick }) => (
  <Sheet open={open} onClose={onClose} title={sub ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}>
    {accounts.length === 0 ? (
      <NoAccounts
        onCreateAccount={() => {
          onClose();
          onAddAccountClick?.();
        }}
      />
    ) : (
      <SubscriptionForm
        key={sub?.id ?? 'new'}
        sub={sub}
        accounts={accounts}
        onClose={onClose}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )}
  </Sheet>
);

export default SubscriptionSheet;
