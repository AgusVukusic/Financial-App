import { formatCurrency } from '../../utils/formatters';
import Tag from '../ui/Tag';
import { ACCOUNT_TYPES } from './AddAccountModal';
import styles from './AccountList.module.css';

/**
 * Fila de una cuenta (todo el renglón es un botón que abre la edición). La deuda de tarjeta se rotula "Deuda":
 * el saldo negativo no se distingue solo por el signo. Los nombres largos se cortan con puntos suspensivos.
 */
const AccountCard = ({ account, balance, onClick }) => {
  const accountType = ACCOUNT_TYPES.find((t) => t.id === account.type) || ACCOUNT_TYPES[0];
  const Icon = accountType.icon;
  const isDebt = account.type === 'credit' && balance < 0;

  return (
    <button
      type="button"
      className={styles.row}
      onClick={() => onClick(account)}
      aria-label={`Editar cuenta ${account.name}, saldo ${formatCurrency(balance)}${isDebt ? ', deuda' : ''}`}
    >
      <span className={styles.icon}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{account.name}</span>
        {isDebt && <Tag tone="dashed">Deuda</Tag>}
      </span>
      <b className={styles.amount}>{formatCurrency(balance)}</b>
    </button>
  );
};

export default AccountCard;
