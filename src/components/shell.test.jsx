import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Layout from './Layout';
import AppHeader from './AppHeader';
import MonthSelector from './MonthSelector';
import { Column, Columns } from './ui/Columns';

describe('Layout', () => {
  const setup = (activeTab = 'home') => {
    const onTabChange = vi.fn();
    const onAddClick = vi.fn();
    render(
      <Layout activeTab={activeTab} onTabChange={onTabChange} onAddClick={onAddClick}>
        <p>contenido</p>
      </Layout>,
    );
    return { onTabChange, onAddClick };
  };

  it('tiene una navegación principal con los cuatro destinos, todos con rótulo visible', () => {
    setup();
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav).toHaveTextContent('Inicio');
    expect(nav).toHaveTextContent('Reportes');
    expect(nav).toHaveTextContent('Anotar');
    expect(nav).toHaveTextContent('Perfil');
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('marca la pestaña actual con aria-current y solo esa', () => {
    setup('reports');
    expect(screen.getByRole('button', { name: 'Reportes' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('Gastos fijos cuenta como Inicio', () => {
    setup('subscriptions');
    expect(screen.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  });

  it('cambia de pestaña y abre Anotar', () => {
    const { onTabChange, onAddClick } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Perfil' }));
    expect(onTabChange).toHaveBeenCalledWith('profile');
    fireEvent.click(screen.getByRole('button', { name: 'Anotar' }));
    expect(onAddClick).toHaveBeenCalledTimes(1);
  });

  it('Inicio, Reportes y Gastos fijos usan el ancho de dos columnas; Perfil sigue en una', () => {
    const main = () => document.getElementById('contenido');
    ['home', 'reports', 'subscriptions'].forEach((tab) => {
      const { unmount } = render(
        <Layout activeTab={tab} onTabChange={vi.fn()} onAddClick={vi.fn()}>
          <p>contenido</p>
        </Layout>,
      );
      expect(main()).toHaveClass('layout__main--wide');
      unmount();
    });
    setup('profile');
    expect(main()).not.toHaveClass('layout__main--wide');
  });

  it('ofrece saltar al contenido y el contenido tiene ese destino', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#contenido');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido');
  });
});

describe('AppHeader', () => {
  it('saluda con el nombre y cambia de tema con un botón nombrado', () => {
    const onToggleTheme = vi.fn();
    render(<AppHeader userName="ana" activeTab="home" theme="dark" onToggleTheme={onToggleTheme} onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Hola, ana' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a tema claro' }));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('el nombre del botón de tema depende del tema actual', () => {
    render(<AppHeader userName="ana" activeTab="home" theme="light" onToggleTheme={() => {}} onBack={() => {}} />);
    expect(screen.getByRole('button', { name: 'Cambiar a tema oscuro' })).toBeInTheDocument();
  });

  it('en Gastos fijos muestra Volver y deja el título como h1', () => {
    const onBack = vi.fn();
    render(<AppHeader userName="ana" activeTab="subscriptions" theme="dark" onToggleTheme={() => {}} onBack={onBack} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Gastos fijos' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Inicio' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('MonthSelector', () => {
  it('muestra el mes y cambia con botones nombrados', () => {
    const onChange = vi.fn();
    render(<MonthSelector label="Noviembre 2026" onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Mes' })).toHaveTextContent('Noviembre 2026');
    fireEvent.click(screen.getByRole('button', { name: 'Mes anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    expect(onChange).toHaveBeenNthCalledWith(1, -1);
    expect(onChange).toHaveBeenNthCalledWith(2, 1);
  });
});

describe('Columns', () => {
  it('deja los hijos en el orden del DOM (primera columna entera, después la segunda)', () => {
    render(
      <Columns>
        <Column>
          <button type="button">A1</button>
          <button type="button">A2</button>
        </Column>
        <Column>
          <button type="button">B1</button>
        </Column>
      </Columns>,
    );
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['A1', 'A2', 'B1']);
  });

  it('no agrega roles ni regiones: son contenedores sin semántica', () => {
    const { container } = render(
      <Columns>
        <Column>
          <p>uno</p>
        </Column>
      </Columns>,
    );
    expect(container.querySelector('[role]')).toBeNull();
    expect(screen.getByText('uno')).toBeInTheDocument();
  });
});
