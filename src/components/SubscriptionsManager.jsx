import { useRef, useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { splitBalance } from '../utils/dashboardFormat';
import { getSubscriptionStatus, calculateTotalMonthlySubscriptions } from '../utils/subscriptionUtils';
import { newRequestId } from '../services/api';
import { useDialog } from '../contexts/DialogContext';
import Button from './ui/Button';
import Card from './ui/Card';
import { Column, Columns } from './ui/Columns';
import SectionHeader from './ui/SectionHeader';
import { useToast } from './ui/ToastContext';
import SubscriptionRow from './subscriptions/SubscriptionRow';
import SubscriptionSheet from './subscriptions/SubscriptionSheet';
import styles from './subscriptions/SubscriptionsManager.module.css';

/**
 * Gastos fijos: resumen del gasto mensual, lista por vencimiento y hoja de alta/edición.
 * Pagar crea el gasto en el servidor con un requestId por gasto fijo; el aviso trae Deshacer, que anula ese
 * mismo movimiento (el id del documento es el requestId) y el servidor devuelve lastPaidAt a como estaba.
 */
const SubscriptionsManager = ({
  subscriptions,
  addSubscription,
  deleteSubscription,
  editSubscription,
  paySubscription,
  onDeleteTransaction,
  onAddAccountClick,
  accounts = [],
}) => {
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const payRequestIds = useRef({}); // un requestId por gasto fijo hasta que el pago se confirma
  const payingRef = useRef(false); // guarda síncrona: dos toques en el mismo tick no pagan dos veces
  const [payingId, setPayingId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const totalMonthly = calculateTotalMonthlySubscriptions(subscriptions);
  const sorted = [...subscriptions].sort((a, b) => getSubscriptionStatus(a).nextPayment - getSubscriptionStatus(b).nextPayment);

  const openNew = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (sub) => {
    setEditing(sub);
    setSheetOpen(true);
  };

  const handlePay = async (sub) => {
    if (payingRef.current) return;
    payingRef.current = true;
    setPayingId(sub.id);
    try {
      const accountName = accounts.find((a) => a.id === sub.accountId)?.name || 'la cuenta asociada';
      const ok = await confirm(
        `¿Pagar ${sub.description} por ${formatCurrency(sub.amount)} desde ${accountName}?`,
        'Pagar gasto fijo',
        { confirmText: 'Pagar', destructive: false },
      );
      if (!ok) return;

      // El servidor crea el gasto, descuenta la cuenta y marca el pago en una sola operación.
      // Si el pago falla, el reintento reutiliza el requestId: no cobra dos veces.
      const requestId = payRequestIds.current[sub.id] ?? (payRequestIds.current[sub.id] = newRequestId());
      try {
        await paySubscription(sub.id, requestId);
      } catch (error) {
        showToast(error.message, 'error');
        return;
      }
      // Pago hecho: el próximo pago (o uno tras Deshacer) necesita un id nuevo, porque este ya es un documento.
      delete payRequestIds.current[sub.id];

      const options = onDeleteTransaction
        ? {
            action: {
              label: 'Deshacer',
              onClick: async () => {
                try {
                  await onDeleteTransaction(requestId);
                  showToast('Pago deshecho', 'info');
                } catch (error) {
                  showToast(`No se pudo deshacer: ${error.message}`, 'error', 6000);
                }
              },
            },
          }
        : {};
      showToast(`Pagado: ${sub.description} ${formatCurrency(sub.amount)}`, 'success', 8000, options);
    } finally {
      payingRef.current = false;
      setPayingId(null);
    }
  };

  const count = subscriptions.length;
  const totalText = formatCurrency(totalMonthly);
  // Misma cifra de puntos (Doto) que el saldo del Inicio; pasados los 12 caracteres, mono nítida.
  const totalDigits = splitBalance(totalMonthly).digits;
  const totalLong = totalDigits.length > 12;

  return (
    <div className={styles.screen}>
      <Columns>
      <Column>
      <section aria-label="Resumen">
        <SectionHeader index="00" title="Resumen" />
        <Card variant="dotted" className={styles.summary}>
          <p className={styles.label}>Gasto mensual estimado</p>
          <div className={styles.total} role="img" aria-label={totalText} style={{ '--chars': totalDigits.length }}>
            <span className={styles.currency} aria-hidden="true">
              $
            </span>
            <span className={totalLong ? styles.valueMono : styles.value} aria-hidden="true">
              {totalDigits}
            </span>
          </div>
          <p className={styles.count}>{count === 1 ? '1 gasto fijo' : `${count} gastos fijos`}</p>
        </Card>
        <Button variant="primary" size="lg" block className={styles.add} onClick={openNew}>
          Nuevo gasto fijo
        </Button>
      </section>
      </Column>

      <Column>
      <section aria-label="Vencimientos">
        <SectionHeader index="01" title="Vencimientos" meta={count > 0 ? 'Por fecha' : undefined} />
        {count === 0 ? (
          <Card variant="dashed" className={styles.empty}>
            <span>Todavía no anotaste ningún gasto fijo. Sumá alquiler, servicios o suscripciones para ver qué vence y pagarlos desde acá.</span>
            <Button variant="key" onClick={openNew}>
              Anotá tu primer gasto fijo
            </Button>
          </Card>
        ) : (
          <ul className={styles.list}>
            {sorted.map((sub) => (
              <SubscriptionRow key={sub.id} sub={sub} paying={payingId === sub.id} onEdit={openEdit} onPay={handlePay} />
            ))}
          </ul>
        )}
      </section>
      </Column>
      </Columns>

      <SubscriptionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        sub={editing}
        accounts={accounts}
        onAdd={addSubscription}
        onEdit={editSubscription}
        onDelete={deleteSubscription}
        onAddAccountClick={onAddAccountClick}
      />
    </div>
  );
};

export default SubscriptionsManager;
