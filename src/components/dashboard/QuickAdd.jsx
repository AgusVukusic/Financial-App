import { useRef } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { localDateString } from '../../utils/frequentExpenses';
import { newRequestId } from '../../services/api';
import { useToast } from '../ui/ToastContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import styles from './QuickAdd.module.css';

/**
 * "Anotar rápido": un toque registra un gasto frecuente. Siempre se puede deshacer: el aviso trae "Deshacer",
 * que anula el movimiento con el mismo requestId (es el id del documento; ver ADR 001).
 *
 * Un gasto por toque: mientras uno está en vuelo se ignoran los toques siguientes, así un doble toque
 * accidental no carga dos veces.
 */
const QuickAdd = ({ items, enabled, onAddTransaction, onDeleteTransaction, onOpenAdd }) => {
  const { showToast } = useToast();
  const busy = useRef(false);

  const handlePick = async (item) => {
    if (busy.current) return;
    busy.current = true;
    const requestId = newRequestId();
    try {
      await onAddTransaction({
        type: 'expense',
        amount: item.amount,
        accountId: item.accountId,
        category: item.category,
        description: item.description,
        date: localDateString(),
        requestId,
      });
      showToast(`Registrado: ${item.label} ${formatCurrency(item.amount)}`, 'success', 8000, {
        action: {
          label: 'Deshacer',
          onClick: async () => {
            try {
              await onDeleteTransaction(requestId);
              showToast('Gasto deshecho', 'info');
            } catch (error) {
              showToast(`No se pudo deshacer: ${error.message}`, 'error', 6000);
            }
          },
        },
      });
    } catch (error) {
      showToast(`No se pudo registrar: ${error.message}`, 'error', 6000);
    } finally {
      busy.current = false;
    }
  };

  return (
    <section aria-label="Anotar rápido">
      <SectionHeader index="00" title="Anotar rápido" meta={enabled && items.length > 0 ? 'Un toque' : undefined} />
      {!enabled ? (
        <Card variant="dashed" className={styles.empty}>
          Los frecuentes se usan en el mes actual. Volvé al mes de hoy para anotar de un toque.
        </Card>
      ) : items.length === 0 ? (
        <Card variant="dashed" className={styles.empty}>
          <span>Cuando cargues gastos, los que más repetís aparecen acá para anotarlos de un toque.</span>
          <Button variant="key" onClick={onOpenAdd}>
            Anotar un gasto
          </Button>
        </Card>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <Button
              key={item.key}
              variant="key"
              className={styles.chip}
              onClick={() => handlePick(item)}
              aria-label={`Registrar ${item.label} por ${formatCurrency(item.amount)}`}
            >
              <span className={styles.name}>{item.label}</span>
              <span className={styles.amount}>{formatCurrency(item.amount)}</span>
            </Button>
          ))}
        </div>
      )}
    </section>
  );
};

export default QuickAdd;
