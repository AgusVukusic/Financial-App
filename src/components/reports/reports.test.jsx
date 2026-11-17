import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider } from '../ui/ToastContext';
import Reports from '../Reports';
import BudgetAlerts from '../dashboard/BudgetAlerts';

// El hook importa firebase (no hay variables en CI): se reemplaza y cada prueba define los movimientos.
const { txs } = vi.hoisted(() => ({ txs: { current: [] } }));
vi.mock('../../hooks/useAllTransactions', () => ({ useAllTransactions: () => txs.current }));

const MONTH = 'Noviembre 2026';
const SHORT_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const setup = (props = {}) => {
  const updateBudget = props.updateBudget || vi.fn().mockResolvedValue(undefined);
  render(
    <ToastProvider>
      <Reports uid="u1" expensesByCategory={{}} budgets={{}} monthLabel={MONTH} {...props} updateBudget={updateBudget} />
    </ToastProvider>,
  );
  return { updateBudget };
};

const row = (category) => screen.getByRole('button', { name: new RegExp(`^${category}:`) });
const openSheet = async (category) => {
  fireEvent.click(row(category));
  return screen.findByRole('dialog', { name: `Tope de ${category}` });
};

beforeEach(() => {
  txs.current = [];
});

describe('Topes del mes', () => {
  it('muestra las 6 categorías aunque no haya gastos ni topes', () => {
    setup();
    ['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros'].forEach((c) => expect(row(c)).toBeInTheDocument());
    expect(screen.getAllByText('Sin tope')).toHaveLength(6);
    expect(screen.getAllByText('Poné un tope')).toHaveLength(6);
    expect(screen.queryAllByRole('meter')).toHaveLength(0); // sin tope no hay medidor, hay una línea punteada
  });

  it('cada renglón es un solo botón con el estado en palabras', () => {
    setup({
      expensesByCategory: { Comida: 58581, Compras: 187499, Hogar: 50000, Transporte: 93000, Servicios: 10 },
      budgets: { Comida: 100000, Compras: 100000, Hogar: 50000, Transporte: 100000, Servicios: 0 },
    });
    expect(screen.getByText(/Quedan \$\s41\.419/)).toBeInTheDocument();
    expect(screen.getByText(/Superado por \$\s87\.499/)).toBeInTheDocument();
    expect(screen.getByText('Llegaste al tope')).toBeInTheDocument();
    expect(screen.getByText('Cerca del límite · 93%')).toBeInTheDocument();
    expect(row('Comida')).toHaveAccessibleName(/^Comida: \$\s58\.581 de \$\s100\.000\. Quedan \$\s41\.419\. Editar tope$/);
    expect(row('Servicios')).toHaveAccessibleName(/Sin tope|sin tope/); // un tope de 0 es "sin tope"
    expect(screen.getByRole('meter', { name: /Comida: Quedan/ })).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: /Compras: Superado por/ })).toBeInTheDocument();
  });

  it('el medidor coincide con el texto aunque la suma traiga ruido de decimales', () => {
    setup({ expensesByCategory: { Comida: 0.1 + 0.2 + 99.7, Hogar: -50 }, budgets: { Comida: 100, Hogar: 100 } });
    expect(screen.getByText('Llegaste al tope')).toBeInTheDocument();
    const full = screen.getByRole('meter', { name: /Comida: Llegaste al tope/ });
    expect(full).toHaveAttribute('aria-valuenow', '100');
    expect(full.querySelectorAll('i')).toHaveLength(10); // sin segmento de exceso
    expect(screen.getByRole('meter', { name: /Hogar: Quedan/ })).toHaveAttribute('aria-valuenow', '0');
  });

  it('abrir la hoja, escribir "1.500" y guardar llama updateBudget con 1500 y avisa', async () => {
    const { updateBudget } = setup();
    const dialog = await openSheet('Comida');
    const input = within(dialog).getByLabelText(/Máximo para gastar/);
    expect(input).toHaveAttribute('inputmode', 'decimal');
    expect(input).not.toHaveAttribute('type', 'number');
    fireEvent.change(input, { target: { value: '1.500' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar tope' }));

    await waitFor(() => expect(updateBudget).toHaveBeenCalledWith('Comida', 1500));
    expect(await screen.findByText(/Tope de Comida: \$\s1\.500/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('con un tope puesto, el campo arranca con su valor y ofrece "Quitar tope"', async () => {
    const { updateBudget } = setup({ budgets: { Comida: 50000 } });
    const dialog = await openSheet('Comida');
    expect(within(dialog).getByLabelText(/Máximo para gastar/)).toHaveValue('50000');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Quitar tope' }));
    await waitFor(() => expect(updateBudget).toHaveBeenCalledWith('Comida', 0));
    expect(await screen.findByText('Tope de Comida quitado')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('sin tope no ofrece "Quitar tope"', async () => {
    setup({ budgets: { Comida: 0 } });
    const dialog = await openSheet('Comida');
    expect(within(dialog).queryByRole('button', { name: 'Quitar tope' })).toBeNull();
  });

  it.each([
    ['', /Escribí cuánto/],
    ['abc', /monto válido/],
    ['0', /mayor a cero/],
    ['-500', /mayor a cero/],
    ['1.5.5', /monto válido/],
  ])('el valor "%s" es inválido: muestra el error y no llama', async (value, message) => {
    const { updateBudget } = setup();
    const dialog = await openSheet('Hogar');
    const input = within(dialog).getByLabelText(/Máximo para gastar/);
    fireEvent.change(input, { target: { value } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar tope' }));
    expect(await within(dialog).findByText(message)).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(updateBudget).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('un error del servidor se muestra dentro de la hoja y no la cierra', async () => {
    const { updateBudget } = setup({ updateBudget: vi.fn().mockRejectedValue(new Error('Máximo 50 categorías con presupuesto.')) });
    const dialog = await openSheet('Comida');
    fireEvent.change(within(dialog).getByLabelText(/Máximo para gastar/), { target: { value: '2000' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar tope' }));

    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent('Máximo 50 categorías con presupuesto.');
    expect(updateBudget).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Guardar tope' })).toBeEnabled());
  });

  it('mientras guarda, los botones quedan deshabilitados y un segundo envío se ignora', async () => {
    let finish;
    const updateBudget = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    setup({ updateBudget, budgets: { Comida: 100 } });
    const dialog = await openSheet('Comida');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar tope' }));
    const saving = await within(dialog).findByRole('button', { name: 'Guardando…' });
    expect(saving).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Quitar tope' })).toBeDisabled();
    fireEvent.submit(dialog.querySelector('form'));
    expect(updateBudget).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('Resumen de alertas', () => {
  it('con plurales: "2 topes superados · 1 cerca del límite"', () => {
    render(
      <BudgetAlerts
        budgets={{ Comida: 100, Compras: 100, Hogar: 100 }}
        expensesByCategory={{ Comida: 200, Compras: 101, Hogar: 85 }}
        onSeeBudgets={() => {}}
      />,
    );
    expect(screen.getByText(/2 topes superados/)).toBeInTheDocument();
    expect(screen.getByText(/1 cerca del límite/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver topes' })).toBeInTheDocument();
  });

  it('en singular: "1 tope superado"; llegar justo al tope cuenta como cerca, no como superado', () => {
    const { rerender } = render(<BudgetAlerts budgets={{ Comida: 100 }} expensesByCategory={{ Comida: 150 }} />);
    expect(screen.getByText(/^1 tope superado$/)).toBeInTheDocument();
    expect(screen.queryByText(/cerca del límite/)).toBeNull();
    rerender(<BudgetAlerts budgets={{ Comida: 100 }} expensesByCategory={{ Comida: 100 }} />);
    expect(screen.queryByText(/superado/)).toBeNull();
    expect(screen.getByText(/1 cerca del límite/)).toBeInTheDocument();
  });

  it('no renderiza nada si no hay qué avisar', () => {
    const { container } = render(<BudgetAlerts budgets={{ Comida: 100, Hogar: 0 }} expensesByCategory={{ Comida: 10, Hogar: 999 }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('"Ver topes" lleva el foco a la sección de topes', () => {
    setup({ budgets: { Comida: 100 }, expensesByCategory: { Comida: 300 } });
    fireEvent.click(screen.getByRole('button', { name: 'Ver topes' }));
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Topes del mes' }));
  });
});

describe('En qué se fue', () => {
  const region = () => screen.getByRole('region', { name: 'En qué se fue' });

  it('lista de mayor a menor con monto y porcentaje, y suma lo desconocido a Otros', () => {
    setup({ expensesByCategory: { Comida: 380, Hogar: 250, Compras: 300, Mascotas: 50, Otros: 20 } });
    const items = within(region()).getAllByRole('listitem');
    expect(items.map((li) => li.textContent.replace(/\s/g, ' '))).toEqual([
      'Comida$ 38038%',
      'Compras$ 30030%',
      'Hogar$ 25025%',
      'Otros$ 707%',
    ]);
    const bar = within(region()).getByRole('img');
    expect(bar).toHaveAccessibleName(/Noviembre 2026 por categoría: Comida 38%, Compras 30%, Hogar 25%, Otros 7%/);
    expect(within(region()).getByRole('heading', { name: 'En qué se fue' })).toBeInTheDocument();
  });

  it('el encabezado resume el total del mes', () => {
    setup({ expensesByCategory: { Comida: 1000, Hogar: 500 } });
    expect(region()).toHaveTextContent(/\$\s1\.500\s·\sNoviembre 2026/);
  });

  it('sin gastos: estado vacío con el mes', () => {
    setup({ expensesByCategory: { Comida: 0 } });
    expect(screen.getByText('Todavía no hay gastos en Noviembre 2026.')).toBeInTheDocument();
    expect(within(region()).queryByRole('img')).toBeNull();
  });

});

describe('Últimos 6 meses', () => {
  const NOW = new Date();
  const mid = (monthsAgo) => new Date(NOW.getFullYear(), NOW.getMonth() - monthsAgo, 15, 12).toISOString();

  it('con movimientos muestra el gráfico, la leyenda y la tabla de 6 meses', () => {
    txs.current = [
      { id: '1', type: 'income', amount: 1850000, category: 'Ingreso', date: mid(0) },
      { id: '2', type: 'expense', amount: 200000, category: 'Comida', date: mid(0) },
      { id: '3', type: 'transfer', amount: 999999, category: 'Transferencia', date: mid(0) },
      { id: '4', type: 'expense', amount: 5000, category: 'Hogar', date: mid(5) },
      { id: '5', type: 'expense', amount: 77777, category: 'Hogar', date: mid(6) },
    ];
    setup();
    const section = screen.getByRole('region', { name: 'Últimos 6 meses' });

    const chart = within(section).getByRole('img');
    expect(chart).toHaveAccessibleName(/Entró y salió por mes, de .* a .*Más gasto: .*Más ingresos: /);
    expect(within(chart).getByText('$ 2 M')).toBeInTheDocument(); // eje: máximo redondo
    expect(within(chart).getByText('$ 1 M')).toBeInTheDocument();
    expect(within(chart).getByText('$ 0')).toBeInTheDocument();
    const legend = within(section).getByRole('list');
    expect(within(legend).getByText('Entró')).toBeInTheDocument();
    expect(within(legend).getByText('Salió')).toBeInTheDocument();

    const table = within(section).getByRole('table', { hidden: true });
    expect(within(table).getByText('Entró y salió por mes')).toBeInTheDocument(); // caption
    const rows = within(table).getAllByRole('row', { hidden: true });
    expect(rows).toHaveLength(7); // encabezado + 6 meses
    const last = rows[6];
    expect(within(last).getByRole('rowheader', { hidden: true })).toHaveTextContent(SHORT_MONTHS[NOW.getMonth()]);
    const cells = within(last).getAllByRole('cell', { hidden: true }).map((c) => c.textContent.replace(/\s/g, ' '));
    expect(cells).toEqual(['$ 1.850.000', '$ 200.000']); // la transferencia no suma a "Salió"
    expect(within(table).queryByText(/77\.777/)).toBeNull(); // 7 meses atrás queda fuera
    expect(within(section).getByText('Ver en tabla')).toBeInTheDocument();
  });

  it('sin movimientos en los 6 meses: estado vacío en vez del gráfico', () => {
    setup();
    const section = screen.getByRole('region', { name: 'Últimos 6 meses' });
    expect(within(section).getByText('Todavía no hay movimientos en los últimos 6 meses.')).toBeInTheDocument();
    expect(within(section).queryByRole('img')).toBeNull();
    expect(within(section).queryByRole('table', { hidden: true })).toBeNull();
  });

  it('montos de 15 dígitos no rompen la pantalla ni el eje', () => {
    txs.current = [{ id: '1', type: 'income', amount: 999999999999999, category: 'Ingreso', date: mid(0) }];
    setup({ expensesByCategory: { Comida: 999999999999999 }, budgets: { Comida: 999999999999999 } });
    expect(screen.getByText('Llegaste al tope')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Últimos 6 meses' })).getByRole('table', { hidden: true })).toHaveTextContent(/999\.999\.999\.999\.999/);
  });
});

describe('Ritmo del mes', () => {
  // Hoy = 15 de noviembre de 2026 (30 días): con topes por 300.000 corresponden 150.000.
  beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 15, 12) }));
  afterEach(() => vi.useRealTimers());

  const budgets = { Comida: 200000, Hogar: 100000 };
  const pace = () => screen.queryByRole('group', { name: 'Ritmo del mes' });

  it('en el mes en curso con topes muestra el estado en palabras y el medidor', () => {
    setup({ budgets, expensesByCategory: { Comida: 200000 }, month: 10, year: 2026 });
    const card = within(pace());
    expect(card.getByText('Vas más rápido de lo esperado')).toBeInTheDocument();
    expect(card.getByText('Día 15 de 30')).toBeInTheDocument();
    expect(card.getByText(/^\$\s200\.000$/)).toBeInTheDocument();
    expect(card.getByText(/^\$\s150\.000$/)).toBeInTheDocument();
    expect(card.getByRole('meter', { name: /Vas más rápido de lo esperado: llevás gastado/ })).toBeInTheDocument();
  });

  it('"en ritmo" y "más lento" también se dicen con palabras', () => {
    const { unmount } = render(
      <ToastProvider>
        <Reports uid="u1" budgets={budgets} expensesByCategory={{ Comida: 150000 }} monthLabel={MONTH} month={10} year={2026} updateBudget={vi.fn()} />
      </ToastProvider>,
    );
    expect(within(pace()).getByText('En ritmo')).toBeInTheDocument();
    unmount();
    setup({ budgets, expensesByCategory: { Comida: 10000 }, month: 10, year: 2026 });
    expect(within(pace()).getByText('Vas más lento de lo esperado')).toBeInTheDocument();
  });

  it('en "en ritmo" el medidor no muestra el segmento de exceso aunque se haya gastado hasta un 10 % de más', () => {
    setup({ budgets, expensesByCategory: { Comida: 160000 }, month: 10, year: 2026 });
    const meter = within(pace()).getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '150000');
    expect(meter.querySelectorAll('i')).toHaveLength(10);
  });

  it('no aparece en otro mes, sin topes ni sin mes elegido', () => {
    const { unmount } = render(
      <ToastProvider>
        <Reports uid="u1" budgets={budgets} expensesByCategory={{}} monthLabel="Octubre 2026" month={9} year={2026} updateBudget={vi.fn()} />
      </ToastProvider>,
    );
    expect(pace()).toBeNull();
    unmount();
    setup({ budgets: {}, month: 10, year: 2026 });
    expect(pace()).toBeNull();
  });

  it('no aparece los primeros días del mes', () => {
    vi.setSystemTime(new Date(2026, 10, 2, 12));
    setup({ budgets, expensesByCategory: { Comida: 200000 }, month: 10, year: 2026 });
    expect(pace()).toBeNull();
  });
});
