import { Dither } from '../ui/Dither';
import styles from './Swatch.module.css';

/** Muestra de trama de una categoría (decorativa: el nombre siempre va al lado en texto). */
const Swatch = ({ kind }) => (
  <span className={styles.swatch} aria-hidden="true">
    <Dither kind={kind} />
  </span>
);

export default Swatch;
