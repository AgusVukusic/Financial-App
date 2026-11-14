import { useRef, useState } from 'react';
import { Landmark, Smartphone, Wallet, CreditCard } from 'lucide-react';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Field from '../ui/Field';
import Input from '../ui/Input';
import Sheet from '../ui/Sheet';
import { useToast } from '../ui/ToastContext';
import { useDialog } from '../../contexts/DialogContext';
import { useRequestId } from '../../hooks/useRequestId';
import styles from '../FormSheet.module.css';

export const ACCOUNT_TYPES = [
  { id: 'bank', label: 'Banco', icon: Landmark },
  { id: 'wallet', label: 'Billetera virtual', icon: Smartphone },
  { id: 'cash', label: 'Efectivo', icon: Wallet },
  { id: 'credit', label: 'Tarjeta de crédito', icon: CreditCard },
];

/** Formulario de cuenta; se monta solo con la hoja abierta (el estado inicial sale de las props). */
const AccountForm = ({ onClose, onAdd, onEdit, onDelete, initialData }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const { getId, reset: resetRequestId } = useRequestId();
  const nameRef = useRef(null);
  const isEdit = Boolean(initialData && initialData.id);

  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || 'bank');
  const [initialBalance, setInitialBalance] = useState(initialData ? initialData.initialBalance?.toString() || '0' : '');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setNameError('Ponele un nombre a la cuenta.');
      nameRef.current?.focus();
      return;
    }
    setNameError('');

    const data = { name, type, initialBalance: parseFloat(initialBalance || 0) };

    setSaving(true);
    try {
      if (isEdit && onEdit) {
        await onEdit(initialData.id, data);
        showToast('Cuenta actualizada', 'success');
      } else {
        await onAdd({ ...data, requestId: getId(data) });
        showToast('Cuenta creada', 'success');
      }
      resetRequestId();
      onClose();
    } catch (error) {
      showToast('Error al guardar la cuenta: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    const isConfirmed = await confirm(`¿Eliminar la cuenta "${initialData.name}"?`);
    if (!isConfirmed) return;
    try {
      await onDelete(initialData.id);
      showToast('Cuenta eliminada', 'success');
      onClose();
    } catch (error) {
      showToast('Error al eliminar: ' + error.message, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <Field label="Nombre de la cuenta" error={nameError}>
        {(p) => (
          <Input
            {...p}
            ref={nameRef}
            type="text"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Mercado Pago"
            maxLength={25}
            data-autofocus={isEdit ? undefined : true}
          />
        )}
      </Field>

      <div>
        <p className={styles.groupLabel} id="tipo-cuenta-label">
          Tipo
        </p>
        <div role="group" aria-labelledby="tipo-cuenta-label" className={styles.group}>
          {ACCOUNT_TYPES.map((t) => (
            <Chip key={t.id} pressed={type === t.id} onClick={() => setType(t.id)} icon={<t.icon size={16} aria-hidden="true" />}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      <Field label="Saldo inicial ($)" hint={isEdit ? 'El saldo inicial de una cuenta existente no se puede editar.' : undefined}>
        {(p) => (
          <Input
            {...p}
            type="number"
            inputMode="decimal"
            step="0.01"
            fullWidth
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            placeholder="0"
            disabled={isEdit}
          />
        )}
      </Field>

      <div className={styles.submit}>
        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cuenta'}
        </Button>
        {isEdit && (
          <Button type="button" variant="danger" size="lg" onClick={handleDelete}>
            Eliminar
          </Button>
        )}
      </div>
    </form>
  );
};

/** Hoja para crear o editar una cuenta. Props sin cambios respecto de la versión anterior. */
const AddAccountModal = ({ isOpen, onClose, onAdd, onEdit, onDelete, initialData }) => (
  <Sheet open={isOpen} onClose={onClose} title={initialData ? 'Editar cuenta' : 'Nueva cuenta'}>
    <AccountForm onClose={onClose} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} initialData={initialData} />
  </Sheet>
);

export default AddAccountModal;
