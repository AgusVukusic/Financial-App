import { useMemo, useRef } from 'react';
import { useAllTransactions } from '../hooks/useAllTransactions';
import { monthlySeries } from '../utils/reportsData';
import BudgetAlerts from './dashboard/BudgetAlerts';
import BudgetsSection from './reports/BudgetsSection';
import DistributionSection from './reports/DistributionSection';
import MonthlyChart from './reports/MonthlyChart';
import styles from './Reports.module.css';

/**
 * Reportes: resumen de alertas, topes del mes (00), en qué se fue el gasto (01) y los últimos 6 meses (02).
 * `expensesByCategory` y `budgets` son { categoría: pesos } del mes elegido; `monthLabel` es el texto del mes
 * ("Noviembre 2026"). `updateBudget(categoría, pesos)` es async y lanza un Error con mensaje para mostrar.
 */
const Reports = ({ uid, expensesByCategory = {}, budgets = {}, updateBudget, monthLabel }) => {
  const allTransactions = useAllTransactions(uid);
  const series = useMemo(() => monthlySeries(allTransactions), [allTransactions]);
  const budgetsRef = useRef(null);

  const handleSeeBudgets = () => {
    const el = budgetsRef.current;
    if (!el) return;
    el.scrollIntoView?.({ block: 'start' });
    el.focus({ preventScroll: true });
  };

  return (
    <div className={styles.page}>
      <BudgetAlerts budgets={budgets} expensesByCategory={expensesByCategory} onSeeBudgets={handleSeeBudgets} />
      <BudgetsSection budgets={budgets} expensesByCategory={expensesByCategory} updateBudget={updateBudget} sectionRef={budgetsRef} />
      <DistributionSection expensesByCategory={expensesByCategory} monthLabel={monthLabel} />
      <MonthlyChart series={series} />
    </div>
  );
};

export default Reports;
