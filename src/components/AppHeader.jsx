import { ArrowLeft, Moon, Sun } from 'lucide-react';
import Button from './ui/Button';
import styles from './AppHeader.module.css';

const EYEBROW = { home: 'Resumen', reports: 'Reportes', profile: 'Perfil' };

/**
 * Encabezado de la app: saludo + cambio de tema. En "Gastos fijos" (una vista dentro de Inicio) muestra
 * un botón para volver en lugar del saludo, y el título de la pantalla queda como h1 para lectores de pantalla.
 */
const AppHeader = ({ userName, activeTab, theme, onToggleTheme, onBack }) => (
  <header className={styles.header}>
    {activeTab === 'subscriptions' ? (
      <>
        <h1 className={styles.srOnly}>Gastos fijos</h1>
        <Button variant="key" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Inicio
        </Button>
      </>
    ) : (
      <div className={styles.titles}>
        <p className={styles.eyebrow}>{EYEBROW[activeTab]}</p>
        <h1 className={styles.title}>Hola, {userName}</h1>
      </div>
    )}

    <Button
      variant="ghost"
      isIcon
      onClick={onToggleTheme}
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      {theme === 'dark' ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}
    </Button>
  </header>
);

export default AppHeader;
