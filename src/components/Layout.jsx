import { Home, PieChart, Plus, User } from 'lucide-react';
import './Layout.css';

/**
 * Estructura de la app: contenido + navegación principal.
 * Celular: barra inferior anclada al borde (nunca flota sobre el contenido). Escritorio: riel lateral.
 * "Gastos fijos" es una vista dentro de Inicio, así que Inicio queda marcado como actual.
 */
const Layout = ({ children, activeTab, onTabChange, onAddClick }) => {
  const current = activeTab === 'subscriptions' ? 'home' : activeTab;

  const item = (id, label, Icon) => (
    <button
      type="button"
      className="layout__item"
      aria-current={current === id ? 'page' : undefined}
      onClick={() => onTabChange(id)}
    >
      <Icon size={22} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="layout">
      <a className="layout__skip" href="#contenido">
        Saltar al contenido
      </a>
      <main className="layout__main" id="contenido" tabIndex={-1}>
        {children}
      </main>

      <nav className="layout__nav" aria-label="Navegación principal">
        {item('home', 'Inicio', Home)}
        {item('reports', 'Reportes', PieChart)}
        <button type="button" className="layout__add" onClick={onAddClick}>
          <Plus size={26} strokeWidth={2.6} aria-hidden="true" />
          <span>Anotar</span>
        </button>
        {item('profile', 'Perfil', User)}
      </nav>
    </div>
  );
};

export default Layout;
