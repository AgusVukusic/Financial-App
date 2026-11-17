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
  // Desde 1024 px el contenido mide 1120 px (Inicio, Reportes y Gastos fijos van en dos columnas). Perfil sigue en una columna de 880 px,
  // pero alineada a la izquierda: así el encabezado no se corre al cambiar de pestaña.
  const narrow = activeTab === 'profile';

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

      <main className={narrow ? 'layout__main layout__main--narrow' : 'layout__main'} id="contenido" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
