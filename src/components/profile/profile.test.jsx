import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../ui/ToastContext';
import { DialogProvider } from '../../contexts/DialogContext';
import Profile from '../Profile';

// El hook importa Firebase: acá solo importa la lista que devuelve.
const state = vi.hoisted(() => ({ list: [] }));
vi.mock('../../hooks/useAllTransactions', () => ({ useAllTransactions: () => state.list }));
vi.mock('../../utils/formatters', () => ({
  exportToCSV: vi.fn(() => 'mis_finanzas_2026-11-15.csv'),
  exportToPDF: vi.fn(() => 'mis_finanzas_2026-11-15.pdf'),
}));
import { exportToCSV, exportToPDF } from '../../utils/formatters';

const tx = (id, date) => ({ id, date, type: 'expense', category: 'Comida', amount: 100, description: id });
const LONG_EMAIL = `${'a'.repeat(40)}.${'b'.repeat(10)}@dominio-muy-largo.example.com`;

const setup = (props = {}, list = [tx('viejo', '2026-01-01T12:00:00Z'), tx('nuevo', '2026-10-01T12:00:00Z'), tx('medio', '2026-05-01T12:00:00Z')]) => {
  state.list = list;
  const onClearData = vi.fn();
  render(
    <ToastProvider>
      <DialogProvider>
        <Profile userName="Agustín" email="agus@example.com" uid="u1" onClearData={onClearData} {...props} />
      </DialogProvider>
    </ToastProvider>,
  );
  return { onClearData };
};

beforeEach(() => {
  vi.clearAllMocks();
  exportToCSV.mockImplementation(() => 'mis_finanzas_2026-11-15.csv');
  exportToPDF.mockImplementation(() => 'mis_finanzas_2026-11-15.pdf');
});

describe('Perfil: cuenta', () => {
  it('muestra nombre, email y el sello de beta, sin "Plan Cloud"', () => {
    setup();
    expect(screen.getByText('Agustín')).toBeInTheDocument();
    expect(screen.getByText('agus@example.com')).toBeInTheDocument();
    expect(screen.getByText('Beta por invitación')).toBeInTheDocument();
    expect(screen.queryByText(/Plan Cloud/i)).toBeNull();
  });

  it('un email larguísimo está entero en el DOM', () => {
    setup({ email: LONG_EMAIL });
    expect(screen.getByText(LONG_EMAIL)).toBeInTheDocument();
  });

  it('sin email no hay renglón de email', () => {
    setup({ email: undefined });
    expect(screen.queryByText(/@/)).toBeNull();
  });
});

describe('Perfil: exportar', () => {
  it('cuenta los movimientos en plural y singular', () => {
    setup();
    expect(screen.getByText('3 movimientos')).toBeInTheDocument();
  });

  it('singular con un solo movimiento', () => {
    setup({}, [tx('a', '2026-01-01T12:00:00Z')]);
    expect(screen.getByText('1 movimiento')).toBeInTheDocument();
  });

  it('sin movimientos deshabilita los botones y lo explica', () => {
    setup({}, []);
    expect(screen.getByText('Todavía no hay movimientos para exportar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Descargar PDF/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Descargar CSV/ })).toBeDisabled();
  });

  it('exporta la lista ordenada del más nuevo al más viejo y avisa con un toast', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Descargar CSV/ }));
    await waitFor(() => expect(exportToCSV).toHaveBeenCalledTimes(1));
    expect(exportToCSV.mock.calls[0][0].map((t) => t.id)).toEqual(['nuevo', 'medio', 'viejo']);
    expect(await screen.findByText('Se descargó mis_finanzas_2026-11-15.csv')).toBeInTheDocument();
    // La lista original no se reordena.
    expect(state.list.map((t) => t.id)).toEqual(['viejo', 'nuevo', 'medio']);
  });

  it('el PDF usa su exportador y su nombre', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Descargar PDF/ }));
    await waitFor(() => expect(exportToPDF).toHaveBeenCalledTimes(1));
    expect(exportToCSV).not.toHaveBeenCalled();
    expect(await screen.findByText('Se descargó mis_finanzas_2026-11-15.pdf')).toBeInTheDocument();
  });

  it('si la exportación falla, muestra el aviso de error', async () => {
    exportToPDF.mockImplementation(() => {
      throw new Error('boom');
    });
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Descargar PDF/ }));
    expect(await screen.findByText('No se pudo exportar. Probá de nuevo.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /Descargar PDF/ })).toBeEnabled());
  });
});

describe('Perfil: sesión', () => {
  const openConfirm = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    return screen.findByRole('alertdialog');
  };

  it('pide una confirmación que no es destructiva', async () => {
    setup();
    const dialog = await openConfirm();
    expect(dialog).toHaveTextContent('¿Cerrar sesión? Tus datos quedan guardados en tu cuenta.');
    const btn = within(dialog).getByRole('button', { name: 'Cerrar sesión' });
    expect(btn.className).not.toMatch(/danger/);
  });

  it('cancelar no cierra la sesión', async () => {
    const { onClearData } = setup();
    const dialog = await openConfirm();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(onClearData).not.toHaveBeenCalled();
  });

  it('confirmar cierra la sesión', async () => {
    const { onClearData } = setup();
    const dialog = await openConfirm();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar sesión' }));
    await waitFor(() => expect(onClearData).toHaveBeenCalledTimes(1));
  });
});
