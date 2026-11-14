import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider } from './ui/ToastContext';
import { DialogProvider } from '../contexts/DialogContext';
import AddTransactionModal from './AddTransactionModal';
import AddAccountModal from './Accounts/AddAccountModal';

// services/api inicializa Firebase al importarse; acá solo hace falta un generador de ids.
vi.mock('../services/api', () => ({ newRequestId: () => crypto.randomUUID() }));

const wrap = (ui) =>
  render(
    <ToastProvider>
      <DialogProvider>{ui}</DialogProvider>
    </ToastProvider>,
  );

const ACCOUNTS = [
  { id: 'a1', name: 'Mercado Pago' },
  { id: 'a2', name: 'Efectivo' },
];

describe('AddTransactionModal (hoja)', () => {
  const setup = (over = {}) => {
    const onClose = vi.fn();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const onEdit = vi.fn().mockResolvedValue(undefined);
    wrap(<AddTransactionModal isOpen onClose={onClose} onAdd={onAdd} onEdit={onEdit} accounts={ACCOUNTS} initialData={null} {...over} />);
    return { onClose, onAdd, onEdit };
  };

  it('es un diálogo modal con el foco en el monto', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: 'Nuevo movimiento' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.activeElement).toBe(screen.getByLabelText('Monto ($)'));
  });

  it('usa un teclado decimal y no pide cinco campos: fecha y descripción quedan plegadas', () => {
    setup();
    expect(screen.getByLabelText('Monto ($)')).toHaveAttribute('inputmode', 'decimal');
    expect(screen.getByText(/Fecha y descripción/).closest('details')).not.toHaveAttribute('open');
  });

  it('guarda un gasto con monto, categoría elegida y un requestId', async () => {
    const { onAdd, onClose } = setup();
    fireEvent.change(screen.getByLabelText('Monto ($)'), { target: { value: '3500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Transporte' }));
    expect(screen.getByRole('button', { name: 'Transporte' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar gasto' }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toMatchObject({ type: 'expense', amount: 3500, category: 'Transporte', accountId: 'a1' });
    expect(onAdd.mock.calls[0][0].requestId).toBeTruthy();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it.each([
    ['1.500', 1500],
    ['3,5', 3.5],
    ['2.500,50', 2500.5],
    ['$ 12.000', 12000],
  ])('el monto %s se guarda como %s (miles con punto, centavos con coma)', async (typed, expected) => {
    const { onAdd } = setup();
    fireEvent.change(screen.getByLabelText('Monto ($)'), { target: { value: typed } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar gasto' }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0].amount).toBe(expected);
  });

  it('un monto que no es un número se rechaza con el mismo mensaje', async () => {
    const { onAdd } = setup();
    fireEvent.change(screen.getByLabelText('Monto ($)'), { target: { value: '12abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar gasto' }));
    expect(await screen.findByText('Ingresá un monto mayor a cero.')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('no guarda un monto vacío y lo explica junto al campo', async () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar gasto' }));
    expect(await screen.findByText('Ingresá un monto mayor a cero.')).toBeInTheDocument();
    expect(screen.getByLabelText('Monto ($)')).toHaveAttribute('aria-invalid', 'true');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('un ingreso lleva la categoría Ingreso y no muestra categorías de gasto', async () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Ingreso' }));
    expect(screen.queryByRole('button', { name: 'Comida' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Monto ($)'), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar ingreso' }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0]).toMatchObject({ type: 'income', category: 'Ingreso' });
  });

  it('una transferencia pide origen y destino distintos', async () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Transferencia' }));
    fireEvent.change(screen.getByLabelText('Monto ($)'), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText('Hacia'), { target: { value: 'a1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar transferencia' }));
    expect(await screen.findByText(/tienen que ser distintas/)).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Hacia'), { target: { value: 'a2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar transferencia' }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0]).toMatchObject({ type: 'transfer', accountId: 'a1', transferToAccountId: 'a2', category: 'Transferencia' });
  });

  it('la transferencia solo aparece si hay más de una cuenta', () => {
    setup({ accounts: [ACCOUNTS[0]] });
    expect(screen.queryByRole('button', { name: 'Transferencia' })).toBeNull();
  });

  it('al editar usa el mismo flujo de reemplazo y abre los detalles', async () => {
    const initialData = { id: 'tx1', type: 'expense', amount: 1200, category: 'Hogar', accountId: 'a2', description: 'Ferretería', date: '2026-11-10T12:00:00.000Z' };
    const { onEdit, onAdd } = setup({ initialData });
    expect(screen.getByRole('dialog', { name: 'Editar movimiento' })).toBeInTheDocument();
    expect(screen.getByLabelText('Monto ($)')).toHaveValue('1200');
    expect(screen.getByText(/Fecha y descripción/).closest('details')).toHaveAttribute('open');
    fireEvent.change(screen.getByLabelText('Monto ($)'), { target: { value: '1500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar gasto' }));
    await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1));
    expect(onEdit.mock.calls[0][0]).toBe('tx1');
    expect(onEdit.mock.calls[0][1]).toMatchObject({ amount: 1500, category: 'Hogar', accountId: 'a2' });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('al editar ofrece Eliminar, pide confirmación y borra por id; al crear no lo ofrece', async () => {
    const initialData = { id: 'tx9', type: 'expense', amount: 800, category: 'Comida', accountId: 'a1', description: 'Café', date: '2026-11-10T12:00:00.000Z' };
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { onClose } = setup({ initialData, onDelete });
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    const confirmDialog = await screen.findByRole('alertdialog');
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('tx9'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('cancelar la confirmación no borra', async () => {
    const initialData = { id: 'tx9', type: 'expense', amount: 800, category: 'Comida', accountId: 'a1', description: 'Café', date: '2026-11-10T12:00:00.000Z' };
    const onDelete = vi.fn();
    setup({ initialData, onDelete });
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    const confirmDialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('un movimiento nuevo no tiene botón Eliminar', () => {
    setup({ onDelete: vi.fn() });
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull();
  });

  it('si el servidor falla, avisa y no cierra', async () => {
    const { onClose } = setup({ onAdd: vi.fn().mockRejectedValue(new Error('Sin conexión')) });
    fireEvent.change(screen.getByLabelText('Monto ($)'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar gasto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Error al guardar el movimiento: Sin conexión');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sin cuentas explica qué hacer', () => {
    setup({ accounts: [] });
    expect(screen.getByText(/Creá al menos una cuenta/)).toBeInTheDocument();
  });

  it('se cierra con Escape y con el botón Cerrar', async () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('AddAccountModal (hoja)', () => {
  const setup = (over = {}) => {
    const onClose = vi.fn();
    const onAdd = vi.fn().mockResolvedValue('id');
    const onEdit = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    wrap(<AddAccountModal isOpen onClose={onClose} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} initialData={null} {...over} />);
    return { onClose, onAdd, onEdit, onDelete };
  };

  it('crea una cuenta con nombre, tipo y saldo inicial', async () => {
    const { onAdd } = setup();
    expect(screen.getByRole('dialog', { name: 'Nueva cuenta' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nombre de la cuenta'), { target: { value: 'Ualá' } });
    fireEvent.click(screen.getByRole('button', { name: 'Billetera virtual' }));
    fireEvent.change(screen.getByLabelText('Saldo inicial ($)'), { target: { value: '1.500,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cuenta' }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toMatchObject({ name: 'Ualá', type: 'wallet', initialBalance: 1500.5 });
    expect(onAdd.mock.calls[0][0].requestId).toBeTruthy();
  });

  it('exige un nombre y lo dice junto al campo', async () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cuenta' }));
    expect(await screen.findByText('Ponele un nombre a la cuenta.')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('al editar bloquea el saldo inicial, lo explica y ofrece Eliminar con confirmación', async () => {
    const initialData = { id: 'c1', name: 'Efectivo', type: 'cash', initialBalance: 100 };
    const { onDelete, onEdit } = setup({ initialData });
    expect(screen.getByRole('dialog', { name: 'Editar cuenta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Saldo inicial ($)')).toBeDisabled();
    expect(screen.getByText(/no se puede editar/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cuenta' }));
    await waitFor(() => expect(onEdit).toHaveBeenCalledWith('c1', expect.objectContaining({ name: 'Efectivo', type: 'cash' })));

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    const confirmDialog = await screen.findByRole('alertdialog');
    expect(confirmDialog).toHaveTextContent('Efectivo');
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('c1'));
  });

  it('Escape sobre la confirmación cierra solo la confirmación, no la hoja', async () => {
    const initialData = { id: 'c1', name: 'Efectivo', type: 'cash', initialBalance: 0 };
    const { onClose } = setup({ initialData });
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await screen.findByRole('alertdialog');
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Editar cuenta' })).toBeInTheDocument();
  });
});
