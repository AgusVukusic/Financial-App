import { useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowRightLeft } from 'lucide-react';
import Button from './ui/Button';
import Chip from './ui/Chip';
import Field from './ui/Field';
import Input from './ui/Input';
import Sheet from './ui/Sheet';
import { useToast } from './ui/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { useRequestId } from '../hooks/useRequestId';
import { localDateString } from '../utils/frequentExpenses';
import { parseAmountInput, formatAmountInput } from '../utils/amountInput';
import { parseEntry } from '../utils/naturalEntry';

// En el texto natural la confirmación muestra exactamente lo que se guarda, centavos incluidos (las listas redondean a pesos).
const exactMoney = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 });
import styles from './FormSheet.module.css';

const CATEGORIES = ['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros'];
const TYPES = [
  { id: 'expense', label: 'Gasto', save: 'Guardar gasto' },
  { id: 'income', label: 'Ingreso', save: 'Guardar ingreso' },
  { id: 'transfer', label: 'Transferencia', save: 'Guardar transferencia' },
];
const MAX_DESCRIPTION = 30;
const NO_AMOUNT = 'No encuentro un monto. Sumá un número, por ejemplo "café 3500".';
const MISSING_AMOUNT = 'Falta el monto: sumá un número, por ejemplo "café 3500".';

/** 'YYYY-MM-DD' -> "Hoy" o "14/11/2026" (para el resumen del bloque plegado). */
const dateSummary = (value) => {
  if (!value) return '';
  if (value === localDateString()) return 'Hoy';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
};

/** Qué entendió el analizador de cómo está escrito el monto ("1.500", "3,5", "3k"): ayuda a detectar una lectura equivocada. */
const amountHints = (token) => {
  if (!token) return [];
  const raw = token.text.replace(/\s*(k|mil|lucas?)$/i, '').replace(/^\$\s*/, '');
  const hints = [];
  if (/^\d{1,3}(\.\d{3})+$/.test(raw)) hints.push('el punto separa miles');
  else if (raw.includes(',')) hints.push('la coma es decimal');
  if (token.thousands) hints.push('k o mil multiplica por 1.000');
  return hints;
};

/** Cuentas como botones: un toque elige. El nombre largo se acorta con "…" (el nombre completo es el del botón). */
const AccountChips = ({ id, label, accounts, value, onChange, error }) => (
  <div>
    <p className={styles.groupLabel} id={id}>
      {label}
    </p>
    <div role="group" aria-labelledby={id} className={styles.group}>
      {accounts.map((acc) => (
        <Chip key={acc.id} pressed={value === acc.id} onClick={() => onChange(acc.id)} className={styles.accountChip} title={acc.name}>
          <span className={styles.accountName}>{acc.name}</span>
        </Chip>
      ))}
    </div>
    {error && (
      <p className={styles.groupError} role="alert">
        <AlertCircle size={16} aria-hidden="true" />
        <span>{error}</span>
      </p>
    )}
  </div>
);

/**
 * Formulario de movimiento. Se monta solo mientras la hoja está abierta, así que el estado inicial sale de las props
 * y no hace falta sincronizarlo con efectos.
 *
 * Un movimiento nuevo se anota escribiendo ("café 3500", "nafta 3,5k", "sueldo 1.850.000 ayer"): la hoja entiende monto,
 * descripción, categoría, tipo, cuenta y fecha, y los muestra para corregirlos con un toque. Lo que la persona toca
 * a mano manda sobre lo que se entendió del texto. Al editar un movimiento existente se usa el formulario completo.
 */
const TransactionForm = ({ onClose, onAdd, onEdit, onDelete, initialData, accounts }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const { getId, reset: resetRequestId } = useRequestId();
  const isEdit = Boolean(initialData && initialData.id);
  const natural = !isEdit;
  const firstAccount = accounts[0]?.id || '';
  const amountRef = useRef(null);
  const textRef = useRef(null);

  const [typeChoice, setTypeChoice] = useState(initialData?.type || 'expense');
  const [amount, setAmount] = useState(formatAmountInput(initialData?.amount));
  const [categoryChoice, setCategoryChoice] = useState(initialData?.category && CATEGORIES.includes(initialData.category) ? initialData.category : CATEGORIES[0]);
  const [accountChoice, setAccountChoice] = useState(initialData?.accountId || firstAccount);
  const [transferToAccountId, setTransferToAccountId] = useState(initialData?.transferToAccountId || accounts[1]?.id || '');
  const [descriptionChoice, setDescriptionChoice] = useState(initialData?.description || '');
  const [dateChoice, setDateChoice] = useState(initialData?.date ? initialData.date.split('T')[0] : localDateString());
  const [text, setText] = useState('');
  const [touched, setTouched] = useState({ type: false, category: false, account: false, date: false });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // En una transferencia la cuenta del texto es ambigua (¿origen o destino?): no se interpreta y la palabra queda en la descripción.
  const transferMode = touched.type && typeChoice === 'transfer';
  const parsed = useMemo(
    () => (natural ? parseEntry(text, { accounts: transferMode ? [] : accounts, today: new Date() }) : null),
    [natural, text, accounts, transferMode],
  );
  const touch = (key) => setTouched((prev) => ({ ...prev, [key]: true }));

  // Valores finales: en un movimiento nuevo, lo tocado a mano manda y lo demás sale del texto.
  const type = natural && !touched.type && parsed.type ? parsed.type : typeChoice;
  const category = natural && !touched.category ? parsed.category || 'Otros' : categoryChoice;
  const accountId = natural && !touched.account && parsed.accountId ? parsed.accountId : accountChoice;
  const date = natural && !touched.date && parsed.date ? parsed.date : dateChoice;
  const parsedAmount = natural ? (parsed.ok ? parsed.amount : null) : parseAmountInput(amount);
  const fullDescription = natural ? parsed.description : descriptionChoice;
  const description = natural ? fullDescription.slice(0, MAX_DESCRIPTION).trim() : fullDescription;
  const cut = natural && fullDescription.length > MAX_DESCRIPTION;

  const typeInfo = TYPES.find((t) => t.id === type) || TYPES[0];
  const accountName = (id) => accounts.find((a) => a.id === id)?.name || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const next = {};
    // Acepta 3500, 3,5 y 1.500 (miles): un type="number" leería "1.500" como 1,5.
    if (parsedAmount === null || parsedAmount <= 0) next.amount = natural ? NO_AMOUNT : 'Ingresá un monto mayor a cero.';
    if (type === 'transfer' && accountId === transferToAccountId) next.accounts = 'La cuenta de origen y la de destino tienen que ser distintas.';
    if (!date) next.date = 'Elegí una fecha.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      if (next.amount) (natural ? textRef : amountRef).current?.focus();
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

  const hints = natural && parsed.ok ? amountHints(parsed.amountToken) : [];
  const token = natural && parsed.ok ? parsed.amountToken : null;

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <div role="group" aria-label="Tipo de movimiento" className={styles.types}>
        {TYPES.filter((t) => t.id !== 'transfer' || accounts.length > 1).map((t) => (
          <Chip
            key={t.id}
            pressed={type === t.id}
            onClick={() => {
              setTypeChoice(t.id);
              touch('type');
              setErrors({});
            }}
            icon={t.id === 'transfer' ? <ArrowRightLeft size={16} aria-hidden="true" /> : undefined}
          >
            {t.label}
          </Chip>
        ))}
      </div>

      {natural ? (
        <div>
          <Field label="Qué y cuánto" hint={text.trim() ? undefined : 'Escribí qué y cuánto: "café 3500", "nafta 3,5k" o "super 30 mil".'} error={errors.amount}>
            {(p) => (
              <Input
                {...p}
                ref={textRef}
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                fullWidth
                className={styles.entry}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (errors.amount) setErrors({});
                }}
                placeholder="Ej. café 3500"
                data-autofocus
              />
            )}
          </Field>
          <div className={styles.read} aria-live="polite">
            {text.trim() && !parsed.ok && !errors.amount && <p className={styles.readHint}>{MISSING_AMOUNT}</p>}
            {parsed.ok && (
              <>
                <p className={styles.echo} aria-hidden="true">
                  {text.slice(0, token.index)}
                  <mark>{token.text}</mark>
                  {text.slice(token.index + token.text.length)}
                </p>
                <p className={styles.readLine}>
                  Leí <b>{exactMoney.format(parsed.amount)}</b>
                  {description ? ` · ${description}` : ''}
                  {type === 'income' ? ' · ingreso' : null}
                  {type === 'expense' ? (
                    <>
                      {' · '}
                      <b>{category}</b>
                    </>
                  ) : null}
                  {parsed.accountId && !touched.account ? ` · ${accountName(parsed.accountId)}` : ''}
                  {parsed.date && !touched.date ? ` · ${dateSummary(parsed.date)}` : ''}
                </p>
                {(hints.length > 0 || cut) && (
                  <p className={styles.readHint}>
                    {[...hints.map((h) => `"${token.text}": ${h}`), ...(cut ? [`La descripción se recorta a ${MAX_DESCRIPTION} letras.`] : [])].join(' · ')}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
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
            />
          )}
        </Field>
      )}

      {type === 'expense' && (
        <div>
          <p className={styles.groupLabel} id="categoria-label">
            Categoría
          </p>
          <div role="group" aria-labelledby="categoria-label" className={styles.group}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                pressed={category === c}
                onClick={() => {
                  setCategoryChoice(c);
                  touch('category');
                }}
              >
                {c}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {type !== 'transfer' ? (
        <AccountChips
          id="cuenta-label"
          label="Cuenta"
          accounts={accounts}
          value={accountId}
          onChange={(id) => {
            setAccountChoice(id);
            touch('account');
          }}
        />
      ) : (
        <>
          <AccountChips
            id="desde-label"
            label="Desde"
            accounts={accounts}
            value={accountId}
            onChange={(id) => {
              setAccountChoice(id);
              touch('account');
            }}
          />
          <AccountChips id="hacia-label" label="Hacia" accounts={accounts} value={transferToAccountId} onChange={setTransferToAccountId} error={errors.accounts} />
        </>
      )}

      <details className={styles.more} open={isEdit || Boolean(errors.date)}>
        <summary>{natural ? 'Fecha' : 'Fecha y descripción'} · {dateSummary(date)}</summary>
        <div className={styles.moreBody}>
          <Field label="Fecha" error={errors.date}>
            {(p) => (
              <Input
                {...p}
                type="date"
                fullWidth
                value={date}
                onChange={(e) => {
                  setDateChoice(e.target.value);
                  touch('date');
                }}
              />
            )}
          </Field>
          {!natural && (
            <Field label="Descripción (opcional)">
              {(p) => <Input {...p} type="text" fullWidth value={descriptionChoice} onChange={(e) => setDescriptionChoice(e.target.value)} placeholder="Ej. Cena con amigos" maxLength={MAX_DESCRIPTION} />}
            </Field>
          )}
        </div>
      </details>

      <div className={styles.submit}>
        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? 'Guardando…' : `${typeInfo.save}${natural && parsedAmount ? ` · ${exactMoney.format(parsedAmount)}` : ''}`}
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
