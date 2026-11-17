import { Home, PieChart, Plus, User } from 'lucide-react';
import './Layout.css';

/**
 * Estructura de la app: contenido + navegación principal.
 * Celular: barra inferior anclada al borde (nunca flota sobre el contenido). Escritorio: riel lateral.
 * La navegación va antes del contenido en el DOM (ambas están `fixed`): el riel de la izquierda es lo primero que alcanza Tab.
 * "Gastos fijos" es una vista dentro de Inicio, así que Inicio queda marcado como actual.
 */
const Layout = ({ children, activeTab, onTabChange, onAddClick }) => {
  const current = activeTab === 'subscriptions' ? 'home' : activeTab;
  // Inicio, Reportes y Gastos fijos se parten en dos columnas desde 1024 px y necesitan más ancho; Perfil sigue en una.
  const wide = activeTab !== 'profile';

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

      <nav className="layout__nav" aria-label="Navegación principal">
        {item('home', 'Inicio', Home)}
        {item('reports', 'Reportes', PieChart)}
        <button type="button" className="layout__add" onClick={onAddClick}>
          <Plus size={26} strokeWidth={2.6} aria-hidden="true" />
          <span>Anotar</span>
        </button>
        {item('profile', 'Perfil', User)}
      </nav>

      <main className={wide ? 'layout__main layout__main--wide' : 'layout__main'} id="contenido" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
