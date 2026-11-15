import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider } from '../ui/ToastContext';
import { DialogProvider } from '../../contexts/DialogContext';
import SubscriptionsManager from '../SubscriptionsManager';

// services/api inicializa Firebase al importarse; acá solo hace falta un generador de ids.
vi.mock('../../services/api', () => ({ newRequestId: () => crypto.randomUUID() }));

// "Hoy" es el 15/11/2026 al mediodía; solo se falsea Date para que waitFor y los avisos sigan andando.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 15, 12, 0, 0));
});
afterEach(() => {
  vi.useRealTimers();
});

const ACCOUNTS = [
  { id: 'a1', name: 'Mercado Pago' },
  { id: 'a2', name: 'Efectivo' },
];

const sub = (over) => ({
  category: 'Servicios',
  cycle: 'monthly',
  accountId: 'a1',
  lastPaidDate: null,
  ...over,
});

const NETFLIX = sub({ id: 's-netflix', description: 'Netflix', amount: 1500, dueDate: 14, category: 'Servicios' }); // venció ayer
const ALQUILER = sub({ id: 's-alquiler', description: 'Alquiler', amount: 100000, dueDate: 15, category: 'Hogar' }); // hoy
const GAS = sub({ id: 's-gas', description: 'Gas', amount: 12000, dueDate: 18 }); // en 3 días
const INTERNET = sub({ id: 's-internet', description: 'Internet', amount: 30000, dueDate: 28 }); // faltan 13 días, sin pagar
const SEGURO = sub({
  id: 's-seguro',
  description: 'Seguro',
  amount: 24000,
  dueDate: 25,
  cycle: 'yearly',
  lastPaidDate: new Date(2026, 10, 5, 12).toISOString(), // pagado este mes
});
// Desordenados a propósito: la pantalla los ordena por vencimiento.
const ALL = [SEGURO, INTERNET, GAS, ALQUILER, NETFLIX];

const setup = (over = {}) => {
  const props = {
    subscriptions: ALL,
    accounts: ACCOUNTS,
    addSubscription: vi.fn().mockResolvedValue(undefined),
    editSubscription: vi.fn().mockResolvedValue(undefined),
    deleteSubscription: vi.fn().mockResolvedValue(undefined),
    paySubscription: vi.fn().mockResolvedValue(undefined),
    onDeleteTransaction: vi.fn().mockResolvedValue(undefined),
    onAddAccountClick: vi.fn(),
    ...over,
  };
  render(
    <ToastProvider>
      <DialogProvider>
        <SubscriptionsManager {...props} />
      </DialogProvider>
    </ToastProvider>,
  );
  return props;
};

const rowOf = (name) => screen.getByRole('button', { name: new RegExp(`^${name}`) }).closest('li');
const clickPay = (name) => fireEvent.click(screen.getByRole('button', { name: `Pagar ${name}` }));
const confirmPay = async () => {
  const dialog = await screen.findByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Pagar' }));
  return dialog;
};

describe('Gastos fijos: lista', () => {
  it('muestra el gasto mensual estimado y la cantidad', () => {
    setup();
    expect(screen.getByText('Gasto mensual estimado')).toBeInTheDocument();
    // 1.500 + 100.000 + 12.000 + 30.000 + 24.000 / 12 (anual) = 145.500
    expect(screen.getByRole('img', { name: /^\$\s*145\.500$/ })).toBeInTheDocument();
    expect(screen.getByText('5 gastos fijos')).toBeInTheDocument();
  });

  it('ordena por próximo vencimiento', () => {
    setup();
    const names = screen.getAllByRole('listitem').map((li) => li.querySelector('button').textContent);
    expect(names.map((t) => t.match(/^[A-Za-zñ]+/)[0])).toEqual(['Netflix', 'Alquiler', 'Gas', 'Internet', 'Seguro']);
  });

  it('un vencido dice "Venció hace 1 día" con la fecha, y ofrece Pagar', () => {
    setup();
    expect(within(rowOf('Netflix')).getByText('Venció hace 1 día')).toBeInTheDocument();
    expect(within(rowOf('Netflix')).getByText('el 14/11')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagar Netflix' })).toBeInTheDocument();
  });

  it('el que vence hoy y el que vence en 3 días tienen estado en palabras y Pagar', () => {
    setup();
    expect(within(rowOf('Alquiler')).getByText('Vence hoy')).toBeInTheDocument();
    expect(within(rowOf('Gas')).getByText('Vence en 3 días')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagar Alquiler' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagar Gas' })).toBeInTheDocument();
  });

  it('un gasto que faltan más de 5 días y no se pagó este mes NO dice "Pagado": solo "Vence el 28/11"', () => {
    setup();
    const row = rowOf('Internet');
    expect(within(row).getByText('Vence el 28/11')).toBeInTheDocument();
    expect(within(row).queryByText(/Pagado/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pagar Internet' })).toBeNull();
  });

  it('solo dice "Pagado este mes" si el último pago cae en este mes', () => {
    setup();
    const row = rowOf('Seguro');
    expect(within(row).getByText('Pagado este mes')).toBeInTheDocument();
    expect(within(row).getByText('/año')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pagar Seguro' })).toBeNull();
    expect(screen.getAllByText('Pagado este mes')).toHaveLength(1);
  });

  it('un pago del mes pasado no cuenta como pagado este mes', () => {
    setup({ subscriptions: [{ ...INTERNET, lastPaidDate: new Date(2026, 9, 28, 12).toISOString() }] });
    expect(screen.queryByText('Pagado este mes')).toBeNull();
    expect(screen.getByText('Vence el 28/11')).toBeInTheDocument();
  });

  it('estado vacío: texto y botón para anotar el primero', async () => {
    setup({ subscriptions: [] });
    expect(screen.getByText(/Todavía no anotaste ningún gasto fijo/)).toBeInTheDocument();
    expect(screen.getByText('0 gastos fijos')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Anotá tu primer gasto fijo' }));
    expect(await screen.findByRole('dialog', { name: 'Nuevo gasto fijo' })).toBeInTheDocument();
  });
});

describe('Gastos fijos: pagar', () => {
  it('pide una confirmación que no es destructiva y paga con el id del gasto fijo y un requestId, sin segundo diálogo', async () => {
    const { paySubscription } = setup();
    clickPay('Netflix');
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('¿Pagar Netflix por');
    expect(dialog).toHaveTextContent('Mercado Pago');
    const payBtn = within(dialog).getByRole('button', { name: 'Pagar' });
    expect(payBtn.className).not.toMatch(/danger/);
    fireEvent.click(payBtn);

    await waitFor(() => expect(paySubscription).toHaveBeenCalledTimes(1));
    expect(paySubscription).toHaveBeenCalledWith('s-netflix', expect.any(String));
    expect(paySubscription.mock.calls[0][1].length).toBeGreaterThanOrEqual(8);
    expect(paySubscription.mock.calls[0][1]).not.toContain('_');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    // El resultado se avisa con un toast, no con otro diálogo.
    expect(await screen.findByText(/Pagado: Netflix\s+\$\s*1\.500/)).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('el aviso ofrece Deshacer y anula con el mismo requestId del pago', async () => {
    const { paySubscription, onDeleteTransaction } = setup();
    clickPay('Netflix');
    await confirmPay();
    const undo = await screen.findByRole('button', { name: 'Deshacer' });
    fireEvent.click(undo);
    await waitFor(() => expect(onDeleteTransaction).toHaveBeenCalledTimes(1));
    expect(onDeleteTransaction).toHaveBeenCalledWith(paySubscription.mock.calls[0][1]);
    expect(await screen.findByText('Pago deshecho')).toBeInTheDocument();
  });

  it('si Deshacer falla, lo dice', async () => {
    setup({ onDeleteTransaction: vi.fn().mockRejectedValue(new Error('Sin conexión')) });
    clickPay('Netflix');
    await confirmPay();
    fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }));
    expect(await screen.findByText('No se pudo deshacer: Sin conexión')).toBeInTheDocument();
  });

  it('sin onDeleteTransaction no ofrece Deshacer', async () => {
    const { paySubscription } = setup({ onDeleteTransaction: undefined });
    clickPay('Netflix');
    await confirmPay();
    await screen.findByText(/Pagado: Netflix/);
    expect(paySubscription).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Deshacer' })).toBeNull();
  });

  it('después de Deshacer, un pago nuevo usa un requestId distinto', async () => {
    const { paySubscription } = setup();
    clickPay('Netflix');
    await confirmPay();
    fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }));
    await screen.findByText('Pago deshecho');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pagar Netflix' })).toBeEnabled());

    clickPay('Netflix');
    await confirmPay();
    await waitFor(() => expect(paySubscription).toHaveBeenCalledTimes(2));
    expect(paySubscription.mock.calls[1][1]).not.toBe(paySubscription.mock.calls[0][1]);
  });

  it('cancelar la confirmación no paga', async () => {
    const { paySubscription } = setup();
    clickPay('Netflix');
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(paySubscription).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Pagar Netflix' })).toBeEnabled();
  });

  it('un doble toque no paga dos veces: el botón queda deshabilitado mientras el pago está en curso', async () => {
    let finish;
    const paySubscription = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    setup({ paySubscription });
    const btn = screen.getByRole('button', { name: 'Pagar Netflix' });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(await screen.findAllByRole('alertdialog')).toHaveLength(1);
    await confirmPay();
    await waitFor(() => expect(paySubscription).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Pagar Netflix' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Pagar Netflix' }));
    expect(paySubscription).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pagar Netflix' })).toBeEnabled());
    expect(paySubscription).toHaveBeenCalledTimes(1);
  });

  it('si el pago falla avisa y el reintento usa el mismo requestId', async () => {
    const paySubscription = vi.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue(undefined);
    setup({ paySubscription });
    clickPay('Netflix');
    await confirmPay();
    expect(await screen.findByText('Sin conexión')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pagar Netflix' })).toBeEnabled());

    clickPay('Netflix');
    await confirmPay();
    await waitFor(() => expect(paySubscription).toHaveBeenCalledTimes(2));
    expect(paySubscription.mock.calls[1][1]).toBe(paySubscription.mock.calls[0][1]);
  });
});

describe('Gastos fijos: hoja de alta y edición', () => {
  const openNew = async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo gasto fijo' }));
    return screen.findByRole('dialog', { name: 'Nuevo gasto fijo' });
  };
  const openEdit = async (name) => {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
    return screen.findByRole('dialog', { name: 'Editar gasto fijo' });
  };
  const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it('el alta usa campos de texto con teclado decimal, no type=number', async () => {
    setup();
    await openNew();
    expect(screen.getByLabelText('Monto ($)')).toHaveAttribute('inputmode', 'decimal');
    expect(screen.getByLabelText('Monto ($)')).not.toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('Descripción')).toHaveAttribute('maxlength', '80');
    const day = screen.getByLabelText('Día del mes en que vence');
    expect(day.tagName).toBe('SELECT');
    expect(within(day).getAllByRole('option')).toHaveLength(31);
    expect(screen.queryByRole('button', { name: 'Eliminar gasto fijo' })).toBeNull();
  });

  it('guarda con "1.500" como 1500, con los demás campos y un requestId', async () => {
    const { addSubscription } = setup();
    await openNew();
    fill('Descripción', 'Spotify');
    fill('Monto ($)', '1.500');
    fill('Día del mes en que vence', '20');
    fill('Frecuencia', 'yearly');
    fill('Cuenta de pago', 'a2');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(addSubscription).toHaveBeenCalledTimes(1));
    expect(addSubscription.mock.calls[0][0]).toMatchObject({
      description: 'Spotify',
      amount: 1500,
      category: 'Servicios',
      dueDate: 20,
      cycle: 'yearly',
      accountId: 'a2',
    });
    expect(addSubscription.mock.calls[0][0].requestId).toBeTruthy();
    expect(await screen.findByText('Gasto fijo guardado')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('un error al guardar avisa y deja la hoja abierta; el reintento conserva el requestId', async () => {
    const addSubscription = vi.fn().mockRejectedValueOnce(new Error('Falló')).mockResolvedValue(undefined);
    setup({ addSubscription });
    await openNew();
    fill('Descripción', 'Spotify');
    fill('Monto ($)', '3500');
    fill('Cuenta de pago', 'a1');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Falló')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Nuevo gasto fijo' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(addSubscription).toHaveBeenCalledTimes(2));
    expect(addSubscription.mock.calls[1][0].requestId).toBe(addSubscription.mock.calls[0][0].requestId);
  });

  it('valida: todo vacío marca descripción, monto y cuenta, y no guarda', async () => {
    const { addSubscription } = setup();
    await openNew();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Ponele un nombre al gasto fijo.')).toBeInTheDocument();
    expect(screen.getByText('Ingresá un monto mayor a cero.')).toBeInTheDocument();
    expect(screen.getByText('Elegí la cuenta desde la que se paga.')).toBeInTheDocument();
    expect(addSubscription).not.toHaveBeenCalled();
  });

  it.each([['12abc'], ['0'], ['-5'], ['']])('el monto "%s" se rechaza', async (typed) => {
    const { addSubscription } = setup();
    await openNew();
    fill('Descripción', 'Spotify');
    fill('Monto ($)', typed);
    fill('Cuenta de pago', 'a1');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Ingresá un monto mayor a cero.')).toBeInTheDocument();
    expect(addSubscription).not.toHaveBeenCalled();
  });

  it('sin cuenta elegida no guarda', async () => {
    const { addSubscription } = setup();
    await openNew();
    fill('Descripción', 'Spotify');
    fill('Monto ($)', '3500');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Elegí la cuenta desde la que se paga.')).toBeInTheDocument();
    expect(addSubscription).not.toHaveBeenCalled();
  });

  it('una descripción en blanco no se acepta', async () => {
    const { addSubscription } = setup();
    await openNew();
    fill('Descripción', '   ');
    fill('Monto ($)', '3500');
    fill('Cuenta de pago', 'a1');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Ponele un nombre al gasto fijo.')).toBeInTheDocument();
    expect(addSubscription).not.toHaveBeenCalled();
  });

  it('al editar precarga los valores y el monto con formatAmountInput (coma decimal)', async () => {
    setup({ subscriptions: [{ ...NETFLIX, amount: 1500.5 }] });
    await openEdit('Netflix');
    expect(screen.getByLabelText('Descripción')).toHaveValue('Netflix');
    expect(screen.getByLabelText('Monto ($)')).toHaveValue('1500,5');
    expect(screen.getByLabelText('Día del mes en que vence')).toHaveValue('14');
    expect(screen.getByLabelText('Frecuencia')).toHaveValue('monthly');
    expect(screen.getByLabelText('Categoría')).toHaveValue('Servicios');
    expect(screen.getByLabelText('Cuenta de pago')).toHaveValue('a1');
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
  });

  it('al editar guarda con editSubscription(id, datos), sin requestId', async () => {
    const { editSubscription, addSubscription } = setup();
    await openEdit('Netflix');
    fill('Monto ($)', '2.000');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(editSubscription).toHaveBeenCalledTimes(1));
    expect(editSubscription).toHaveBeenCalledWith('s-netflix', {
      description: 'Netflix',
      amount: 2000,
      category: 'Servicios',
      dueDate: 14,
      cycle: 'monthly',
      accountId: 'a1',
    });
    expect(addSubscription).not.toHaveBeenCalled();
    expect(await screen.findByText('Cambios guardados')).toBeInTheDocument();
  });

  it('un gasto fijo con una categoría vieja se muestra como "Otros", avisa y se actualiza al guardar', async () => {
    const { editSubscription } = setup({ subscriptions: [{ ...NETFLIX, category: 'Entretenimiento' }] });
    await openEdit('Netflix');
    const select = screen.getByLabelText('Categoría');
    expect(within(select).getAllByRole('option')).toHaveLength(6);
    expect(within(select).queryByRole('option', { name: 'Entretenimiento' })).toBeNull();
    expect(select).toHaveValue('Otros');
    expect(screen.getByText(/Antes era "Entretenimiento"/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(editSubscription).toHaveBeenCalledTimes(1));
    expect(editSubscription.mock.calls[0][1].category).toBe('Otros');
  });

  it('las categorías de Gastos fijos son las 6 de la app y no avisan nada si ya son válidas', async () => {
    setup();
    await openEdit('Netflix');
    const select = screen.getByLabelText('Categoría');
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros']);
    expect(screen.queryByText(/Antes era/)).toBeNull();
  });

  it('eliminar pide confirmación (destructiva), aclara que los pagos no se borran y borra por id', async () => {
    const { deleteSubscription } = setup();
    await openEdit('Netflix');
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar gasto fijo' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('Netflix');
    expect(dialog).toHaveTextContent('no se borran');
    const del = within(dialog).getByRole('button', { name: 'Eliminar' });
    expect(del.className).toMatch(/danger/);
    fireEvent.click(del);
    await waitFor(() => expect(deleteSubscription).toHaveBeenCalledWith('s-netflix'));
    expect(await screen.findByText('Gasto fijo eliminado')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('cancelar la confirmación no borra', async () => {
    const { deleteSubscription } = setup();
    await openEdit('Netflix');
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar gasto fijo' }));
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(deleteSubscription).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Editar gasto fijo' })).toBeInTheDocument();
  });

  it('sin cuentas explica por qué y lleva a crear una', async () => {
    const { onAddAccountClick, addSubscription } = setup({ accounts: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo gasto fijo' }));
    expect(await screen.findByText('Para anotar un gasto fijo primero necesitás una cuenta.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Descripción')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Crear una cuenta' }));
    expect(onAddAccountClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(addSubscription).not.toHaveBeenCalled();
  });
});
