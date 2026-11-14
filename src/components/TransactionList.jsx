import { useState } from 'react';
import { ArrowRightLeft, ArrowUp, Car, Coffee, DollarSign, Home, ShoppingBag, Zap } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import Button from './ui/Button';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import styles from './TransactionList.module.css';

const CATEGORY_ICONS = { Comida: Coffee, Compras: ShoppingBag, Hogar: Home, Transporte: Car, Servicios: Zap, Otros: DollarSign };
const PAGE = 20;
// El mes ya está en el encabezado y el selector: en el renglón alcanza con día y mes ("14 nov").
const SHORT_DATE = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });
const shortDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : SHORT_DATE.format(d).replace('.', '');
};

/** Texto accesible del tipo de movimiento (el signo y el ícono no se leen solos). */
const TYPE_TEXT = { income: 'Ingreso', expense: 'Gasto', transfer: 'Transferencia' };

/**
 * Movimientos del mes. Cada renglón es un solo botón que abre la edición (editar y eliminar viven en la hoja);
 * gasto en tinta neutra con signo −, ingreso con +, transferencia con ⇄ y "origen → destino".
 * Muestra 20 y el resto bajo demanda para que la pantalla no sea interminable.
 */
const TransactionList = ({ transactions, accounts = [], onEdit, onOpenAdd }) => {
  const [expanded, setExpanded] = useState(false);
  const accountName = (id) => accounts.find((a) => a.id === id)?.name || '';

  if (transactions.length === 0) {
    return (
      <section aria-label="Movimientos">
        <SectionHeader index="03" title="Movimientos" />
        <Card variant="dashed" className={styles.empty}>
          <span>Todavía no hay movimientos en este mes.</span>
          {onOpenAdd && (
            <Button variant="key" onClick={onOpenAdd}>
              Anotar el primero
            </Button>
          )}
        </Card>
      </section>
    );
  }

  const visible = expanded ? transactions : transactions.slice(0, PAGE);
  const hidden = transactions.length - visible.length;

  return (
    <section aria-label="Movimientos">
      <SectionHeader index="03" title="Movimientos" meta={`${transactions.length} en el mes`} />
      <ul className={styles.list}>
        {visible.map((t) => {
          const isTransfer = t.type === 'transfer';
          const isIncome = t.type === 'income';
          const Icon = isTransfer ? ArrowRightLeft : isIncome ? ArrowUp : CATEGORY_ICONS[t.category] || DollarSign;
          const title = t.description || t.category || TYPE_TEXT[t.type];
          const amount = formatCurrency(t.amount);
          const sign = isIncome ? '+' : isTransfer ? '' : '−';
          const meta = isTransfer
            ? `${accountName(t.accountId) || 'Cuenta'} → ${accountName(t.transferToAccountId) || 'Cuenta'}`
            : [t.description ? t.category : '', accountName(t.accountId)].filter(Boolean).join(' · ');

          return (
            <li key={t.id}>
              <button
                type="button"
                className={styles.row}
                onClick={() => onEdit && onEdit(t)}
                aria-label={`${TYPE_TEXT[t.type] || 'Movimiento'}: ${title}, ${sign}${amount}, ${formatDate(t.date)}. Editar`}
              >
                <span className={styles.icon}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className={styles.info}>
                  <span className={styles.title}>{title}</span>
                  <span className={styles.meta}>
                    {shortDate(t.date)}
                    {meta ? ` · ${meta}` : ''}
                  </span>
                </span>
                <b className={`${styles.amount} ${isIncome ? styles.in : ''}`}>
                  {isTransfer && (
                    <ArrowRightLeft size={13} aria-hidden="true" />
                  )}
                  {sign}
                  {amount}
                </b>
              </button>
            </li>
          );
        })}
      </ul>

      {hidden > 0 && (
        <Button variant="key" block className={styles.more} onClick={() => setExpanded(true)}>
          Ver los {hidden} restantes
        </Button>
      )}
    </section>
  );
};

export default TransactionList;
