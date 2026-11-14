import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider } from '../ui/ToastContext';
import Dashboard from '../Dashboard';
import QuickAdd from './QuickAdd';
import BalanceCard from './BalanceCard';
import AccountList from '../Accounts/AccountList';

// services/api inicializa Firebase al importarse; acá solo hace falta un generador de ids con el mismo formato.
vi.mock('../../services/api', () => ({ newRequestId: () => crypto.randomUUID() }));

const wrap = (ui) => render(<ToastProvider>{ui}</ToastProvider>);
const ITEM = { key: 'k', label: 'Café', amount: 3500, category: 'Comida', accountId: 'efectivo', description: 'Café', count: 3 };

describe('QuickAdd', () => {
  const setup = (over = {}) => {
    const onAddTransaction = vi.fn().mockResolvedValue(undefined);
    const onDeleteTransaction = vi.fn().mockResolvedValue(undefined);
    const onOpenAdd = vi.fn();
    wrap(<QuickAdd items={[ITEM]} enabled onAddTransaction={onAddTransaction} onDeleteTransaction={onDeleteTransaction} onOpenAdd={onOpenAdd} {...over} />);
    return { onAddTransaction, onDeleteTransaction, onOpenAdd };
  };

  it('un toque registra un gasto con el monto, cuenta, categoría y un requestId nuevo', async () => {
    const { onAddTransaction } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Registrar Café por/ }));
    await waitFor(() => expect(onAddTransaction).toHaveBeenCalledTimes(1));
    const payload = onAddTransaction.mock.calls[0][0];
    expect(payload).toMatchObject({ type: 'expense', amount: 3500, accountId: 'efectivo', category: 'Comida', description: 'Café' });
    expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof payload.requestId).toBe('string');
    expect(payload.requestId.length).toBeGreaterThanOrEqual(8);
    expect(payload.requestId).not.toContain('_'); // el servidor reserva "_" para ids derivados
  });

  it('el aviso ofrece Deshacer y anula con el mismo requestId', async () => {
    const { onAddTransaction, onDeleteTransaction } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Registrar Café por/ }));
    const undo = await screen.findByRole('button', { name: 'Deshacer' });
    fireEvent.click(undo);
    await waitFor(() => expect(onDeleteTransaction).toHaveBeenCalledTimes(1));
    expect(onDeleteTransaction).toHaveBeenCalledWith(onAddTransaction.mock.calls[0][0].requestId);
  });

  it('ignora un segundo toque mientras el primero está en vuelo', async () => {
    let finish;
    const onAddTransaction = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    wrap(<QuickAdd items={[ITEM]} enabled onAddTransaction={onAddTransaction} onDeleteTransaction={vi.fn()} onOpenAdd={vi.fn()} />);
    const chip = screen.getByRole('button', { name: /Registrar Café por/ });
    fireEvent.click(chip);
    fireEvent.click(chip);
    expect(onAddTransaction).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    fireEvent.click(chip);
    expect(onAddTransaction).toHaveBeenCalledTimes(2);
  });

  it('si el servidor rechaza, avisa el error y no ofrece Deshacer', async () => {
    const { onAddTransaction } = setup({ onAddTransaction: vi.fn().mockRejectedValue(new Error('Cuenta inexistente')) });
    expect(onAddTransaction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Registrar Café por/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo registrar: Cuenta inexistente');
    expect(screen.queryByRole('button', { name: 'Deshacer' })).toBeNull();
  });

  it('sin frecuentes invita a anotar el primero y abre la hoja', () => {
    const { onOpenAdd } = setup({ items: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Anotar un gasto' }));
    expect(onOpenAdd).toHaveBeenCalledTimes(1);
  });

  it('fuera del mes actual explica por qué no hay frecuentes', () => {
    setup({ enabled: false });
    expect(screen.getByText(/Volvé al mes de hoy/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Registrar/ })).toBeNull();
  });
});

describe('BalanceCard', () => {
  it('muestra el saldo total completo para lectores de pantalla y entró/salió con signo', () => {
    render(<BalanceCard netWorth={15373721} income={1970000} expense={1003710} />);
    expect(screen.getByRole('img', { name: '15.373.721' })).toBeInTheDocument();
    expect(screen.getByText(/^\+\$/)).toHaveTextContent('1.970.000');
    expect(screen.getByText(/^−\$/)).toHaveTextContent('1.003.710');
  });

  it('un saldo negativo lleva el signo menos', () => {
    render(<BalanceCard netWorth={-500} income={0} expense={0} />);
    expect(screen.getByRole('img', { name: '−500' })).toBeInTheDocument();
  });

  it('con una cifra muy larga no se rompe', () => {
    render(<BalanceCard netWorth={123456789012345} income={0} expense={0} />);
    expect(screen.getByRole('img', { name: '123.456.789.012.345' })).toBeInTheDocument();
  });
});

describe('AccountList', () => {
  const accounts = [
    { id: 'a', name: 'Visa Santander Platinum Internacional con un nombre larguísimo', type: 'credit' },
    { id: 'b', name: 'Efectivo', type: 'cash' },
  ];

  it('lista todas las cuentas con su saldo y rotula la deuda de tarjeta', () => {
    const onEditClick = vi.fn();
    render(<AccountList accounts={accounts} balances={{ a: -387499, b: 86500 }} onAddClick={() => {}} onEditClick={onEditClick} />);
    expect(screen.getByText('Deuda')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Editar cuenta Efectivo, saldo/ }));
    expect(onEditClick).toHaveBeenCalledWith(accounts[1]);
  });

  it('sin cuentas muestra el estado vacío con la acción Nueva', () => {
    const onAddClick = vi.fn();
    render(<AccountList accounts={[]} balances={{}} onAddClick={onAddClick} onEditClick={() => {}} />);
    expect(screen.getByText(/Todavía no tenés cuentas/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Nueva/ }));
    expect(onAddClick).toHaveBeenCalledTimes(1);
  });
});

describe('Dashboard', () => {
  it('arma los frecuentes con los movimientos y descarta cuentas que ya no existen', () => {
    const transactions = [
      { type: 'expense', amount: 3500, description: 'Café', category: 'Comida', accountId: 'efectivo', date: '2026-11-05T12:00:00.000Z' },
      { type: 'expense', amount: 9000, description: 'Taxi', category: 'Transporte', accountId: 'borrada', date: '2026-11-05T12:00:00.000Z' },
    ];
    wrap(
      <Dashboard
        netWorth={100}
        income={0}
        expense={0}
        transactions={transactions}
        accounts={[{ id: 'efectivo', name: 'Efectivo', type: 'cash' }]}
        accountBalances={{ efectivo: 100 }}
        subscriptions={[]}
        onAddTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Registrar Café/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Registrar Taxi/ })).toBeNull();
  });
});
