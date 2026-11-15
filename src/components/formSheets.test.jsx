import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider } from './ui/ToastContext';
import { DialogProvider } from '../contexts/DialogContext';
import AddTransactionModal from './AddTransactionModal';
import AddAccountModal from './Accounts/AddAccountModal';
import { localDateString } from '../utils/frequentExpenses';

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

  const typeEntry = (value) => fireEvent.change(screen.getByLabelText('Qué y cuánto'), { target: { value } });
  // Las cuentas son botones dentro de un grupo con nombre (Cuenta, Desde, Hacia).
  const accountButton = (group, name) => within(screen.getByRole('group', { name: group })).getByRole('button', { name });
  const pickAccount = (group, name) => fireEvent.click(accountButton(group, name));
  const expectPicked = (group, name) => expect(accountButton(group, name)).toHaveAttribute('aria-pressed', 'true');
  const yesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return localDateString(d);
  };

  it('es un diálogo modal con el foco en "Qué y cuánto"', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: 'Nuevo movimiento' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.activeElement).toBe(screen.getByLabelText('Qué y cuánto'));
  });

  it('se anota escribiendo: no pide un monto aparte y la fecha queda plegada', () => {
    setup();
    expect(screen.queryByLabelText('Monto ($)')).toBeNull();
    expect(screen.queryByLabelText('Descripción (opcional)')).toBeNull();
    expect(screen.getByLabelText('Qué y cuánto')).toHaveAttribute('autocapitalize', 'off');
    expect(screen.getByText(/Escribí qué y cuánto/)).toBeInTheDocument();
    expect(screen.getByText(/^Fecha ·/).closest('details')).not.toHaveAttribute('open');
  });

  it('"café 3500" guarda un gasto con monto, descripción, categoría y cuenta, y muestra lo que entendió', async () => {
    const { onAdd, onClose } = setup();
    typeEntry('café 3500');
    expect(screen.getByText(/Leí/).textContent).toMatch(/\$\s?3\.500 · Café · Comida/);
    expect(screen.getByRole('button', { name: 'Comida' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /^Guardar gasto · \$\s?3\.500$/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toMatchObject({ type: 'expense', amount: 3500, description: 'Café', category: 'Comida', accountId: 'a1' });
    expect(onAdd.mock.calls[0][0].requestId).toBeTruthy();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('con Enter en el campo también se guarda', async () => {
    const { onAdd } = setup();
    typeEntry('nafta 8000');
    fireEvent.submit(screen.getByLabelText('Qué y cuánto').closest('form'));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toMatchObject({ amount: 8000, category: 'Transporte' });
  });

  it('una categoría elegida a mano manda sobre la del texto, aunque se siga escribiendo', async () => {
    const { onAdd } = setup();
    typeEntry('café 3500');
    fireEvent.click(screen.getByRole('button', { name: 'Hogar' }));
    typeEntry('café con amigos 3500');
    expect(screen.getByRole('button', { name: 'Hogar' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /^Guardar gasto/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toMatchObject({ category: 'Hogar', description: 'Café con amigos' });
  });

  it('sin pistas la categoría es "Otros"', async () => {
    const { onAdd } = setup();
    typeEntry('cosas 1000');
    expect(screen.getByRole('button', { name: 'Otros' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /^Guardar gasto/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0].category).toBe('Otros');
  });

  it.each([
    ['café 1.500', 1500],
    ['café 3,5', 3.5],
    ['café 2.500,50', 2500.5],
    ['café $ 12.000', 12000],
    ['café 3k', 3000],
    ['café 30 mil', 30000],
  ])('"%s" se guarda como %s (miles con punto, centavos con coma, k y mil)', async (typed, expected) => {
    const { onAdd } = setup();
    typeEntry(typed);
    fireEvent.click(screen.getByRole('button', { name: /^Guardar gasto/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0].amount).toBe(expected);
  });

  it('explica cómo leyó el monto cuando puede haber dudas ("1.500" son mil quinientos)', () => {
    setup();
    typeEntry('café 1.500');
    expect(screen.getByText(/el punto separa miles/)).toBeInTheDocument();
    typeEntry('nafta 3,5k');
    expect(screen.getByText(/k o mil multiplica por 1\.000/)).toBeInTheDocument();
  });

  it('mientras se escribe la descripción solo orienta (sin rojo ni alerta); al guardar sin monto, avisa con ícono y texto', async () => {
    const { onAdd } = setup();
    typeEntry('café');
    expect(screen.getByText(/Falta el monto/)).toBeInTheDocument();
    expect(screen.queryByText(/No encuentro un monto/)).toBeNull();
    expect(screen.getByLabelText('Qué y cuánto')).not.toHaveAttribute('aria-invalid', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar gasto' }));
    expect(await screen.findByText(/No encuentro un monto/)).toBeInTheDocument();
    expect(screen.getByLabelText('Qué y cuánto')).toHaveAttribute('aria-invalid', 'true');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('la confirmación muestra los centavos tal como se guardan ($ 3,5, no $ 4)', async () => {
    const { onAdd } = setup();
    typeEntry('café 3,5');
    expect(screen.getByText(/Leí/).textContent).toMatch(/\$\s?3,5\b/);
    expect(screen.getByRole('button', { name: /^Guardar gasto · \$\s?3,5$/ })).toBeInTheDocument();
    typeEntry('farmacia 1.250,75');
    expect(screen.getByText(/Leí/).textContent).toMatch(/\$\s?1\.250,75/);
    fireEvent.click(screen.getByRole('button', { name: /^Guardar gasto · \$\s?1\.250,75$/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0].amount).toBe(1250.75);
  });

  it('con el campo vacío no guarda y lo explica junto al campo', async () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar gasto' }));
    expect(await screen.findByText(/No encuentro un monto/)).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('una palabra como "sueldo" lo pasa a ingreso, sin categorías de gasto; se puede volver a gasto', async () => {
    const { onAdd } = setup();
    typeEntry('sueldo 1.850.000');
    expect(screen.getByRole('button', { name: 'Ingreso' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: 'Comida' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Guardar ingreso/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0]).toMatchObject({ type: 'income', amount: 1850000, category: 'Ingreso', description: 'Sueldo' });
  });

  it('el tipo elegido a mano manda sobre el del texto', async () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Gasto' }));
    typeEntry('sueldo 1000');
    expect(screen.getByRole('button', { name: 'Gasto' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /^Guardar gasto/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0].type).toBe('expense');
  });

  it('reconoce la cuenta y la fecha del texto y las saca de la descripción', async () => {
    const { onAdd } = setup();
    typeEntry('uber 4500 efectivo ayer');
    expectPicked('Cuenta', 'Efectivo');
    expect(screen.getByText(/Leí/).textContent).toMatch(/Uber · Transporte · Efectivo · /);
    fireEvent.click(screen.getByRole('button', { name: /^Guardar gasto/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0]).toMatchObject({ amount: 4500, description: 'Uber', category: 'Transporte', accountId: 'a2', date: yesterday() });
  });

  it('la cuenta elegida a mano manda sobre la del texto', async () => {
    const { onAdd } = setup();
    pickAccount('Cuenta', 'Mercado Pago');
    typeEntry('uber 4500 efectivo');
    expectPicked('Cuenta', 'Mercado Pago');
    fireEvent.click(screen.getByRole('button', { name: /^Guardar gasto/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0].accountId).toBe('a1');
  });

  it('las cuentas son botones (no una lista desplegable) y uno solo queda elegido', () => {
    setup();
    const group = screen.getByRole('group', { name: 'Cuenta' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Mercado Pago', 'Efectivo']);
    expect(buttons.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
    expectPicked('Cuenta', 'Mercado Pago');
    expect(screen.queryByRole('combobox')).toBeNull(); // ya no hay una lista desplegable
  });

  it('con una cuenta de nombre larguísimo el botón la muestra entera para quien la lee, aunque se acorte a la vista', () => {
    const largo = 'Caja de Ahorro Banco Provincia de Buenos Aires S.A.';
    setup({ accounts: [{ id: 'l1', name: largo }, ...ACCOUNTS] });
    expect(accountButton('Cuenta', largo)).toHaveAttribute('title', largo);
  });

  it('una descripción de más de 30 letras se recorta y lo avisa', async () => {
    const { onAdd } = setup();
    typeEntry('compra grande del mes en el mayorista de zona 45000');
    expect(screen.getByText(/se recorta a 30 letras/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Guardar gasto/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0].description.length).toBeLessThanOrEqual(30);
  });

  it('una transferencia pide origen y destino distintos', async () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Transferencia' }));
    typeEntry('retiro 500');
    pickAccount('Hacia', 'Mercado Pago');
    fireEvent.click(screen.getByRole('button', { name: /^Guardar transferencia/ }));
    expect(await screen.findByText(/tienen que ser distintas/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('tienen que ser distintas');
    expect(onAdd).not.toHaveBeenCalled();

    pickAccount('Hacia', 'Efectivo');
    fireEvent.click(screen.getByRole('button', { name: /^Guardar transferencia/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0]).toMatchObject({ type: 'transfer', amount: 500, accountId: 'a1', transferToAccountId: 'a2', category: 'Transferencia', description: 'Retiro' });
  });

  it('en una transferencia el texto no elige la cuenta (¿origen o destino?) y la palabra queda en la descripción', async () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Transferencia' }));
    typeEntry('retiro 60000 efectivo');
    expectPicked('Desde', 'Mercado Pago');
    expectPicked('Hacia', 'Efectivo');
    fireEvent.click(screen.getByRole('button', { name: /^Guardar transferencia/ }));
    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onAdd.mock.calls[0][0]).toMatchObject({ type: 'transfer', accountId: 'a1', transferToAccountId: 'a2', description: 'Retiro efectivo' });
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
    typeEntry('café 10');
    fireEvent.click(screen.getByRole('button', { name: /^Guardar gasto/ }));
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
