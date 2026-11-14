import { Plus } from 'lucide-react';
import AccountCard from './AccountCard';
import Button from '../ui/Button';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import styles from './AccountList.module.css';

/** Cuentas en una lista vertical: todos los saldos se ven sin deslizar de costado. */
const AccountList = ({ accounts, balances, onAddClick, onEditClick }) => (
  <section aria-label="Cuentas">
    <SectionHeader
      index="02"
      title="Cuentas"
      meta={
        <Button variant="key" size="sm" onClick={onAddClick}>
          <Plus size={16} aria-hidden="true" />
          Nueva
        </Button>
      }
    />

    {accounts.length === 0 ? (
      <Card variant="dashed" className={styles.empty}>
        Todavía no tenés cuentas. Creá la primera para empezar a anotar movimientos.
      </Card>
    ) : (
      <ul className={styles.list}>
        {accounts.map((acc) => (
          <li key={acc.id}>
            <AccountCard account={acc} balance={balances[acc.id] || 0} onClick={onEditClick} />
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default AccountList;
