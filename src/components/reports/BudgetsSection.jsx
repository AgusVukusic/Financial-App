import { useState } from 'react';
import { REPORT_CATEGORIES } from '../../utils/reportsData';
import SectionHeader from '../ui/SectionHeader';
import BudgetRow from './BudgetRow';
import BudgetSheet from './BudgetSheet';
import PaceCard from './PaceCard';
import styles from './BudgetsSection.module.css';

/**
 * "Topes del mes": las 6 categorías fijas, siempre visibles (también en un mes sin gastos, para poder poner un
 * tope antes de gastar). Cada renglón abre la hoja de edición. `sectionRef` deja que "Ver topes" lleve el foco acá.
 * `pace` (de `paceStatus`) suma el termómetro de ritmo arriba de la lista; si es null no se muestra.
 */
const BudgetsSection = ({ budgets = {}, expensesByCategory = {}, updateBudget, sectionRef, pace = null }) => {
  const [category, setCategory] = useState(null);
  const [open, setOpen] = useState(false);

  const openFor = (name) => {
    setCategory(name);
    setOpen(true);
  };

  return (
    <section ref={sectionRef} tabIndex={-1} aria-label="Topes del mes" className={styles.section}>
      <SectionHeader index="00" title="Topes del mes" />
      <PaceCard pace={pace} />
      <p className={styles.hint}>Tocá una categoría para ponerle o cambiarle el tope.</p>
      <ul className={styles.list}>
        {REPORT_CATEGORIES.map((name) => (
          <li key={name}>
            <BudgetRow category={name} spent={expensesByCategory?.[name] || 0} limit={budgets?.[name] || 0} onOpen={openFor} />
          </li>
        ))}
      </ul>

      <BudgetSheet open={open} onClose={() => setOpen(false)} category={category} limit={budgets?.[category] || 0} updateBudget={updateBudget} />
    </section>
  );
};

export default BudgetsSection;
