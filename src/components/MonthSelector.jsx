import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './ui/Button';
import styles from './MonthSelector.module.css';

/** Selector de mes: dos botones de 44 px y el mes en el medio, anunciado a lectores de pantalla al cambiar. */
const MonthSelector = ({ label, onChange }) => (
  <div className={styles.wrap} role="group" aria-label="Mes">
    <Button variant="ghost" isIcon onClick={() => onChange(-1)} aria-label="Mes anterior">
      <ChevronLeft size={22} aria-hidden="true" />
    </Button>
    <span className={styles.label} aria-live="polite">
      {label}
    </span>
    <Button variant="ghost" isIcon onClick={() => onChange(1)} aria-label="Mes siguiente">
      <ChevronRight size={22} aria-hidden="true" />
    </Button>
  </div>
);

export default MonthSelector;
