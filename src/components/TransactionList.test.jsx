import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TransactionList from './TransactionList';

const ACCOUNTS = [
  { id: 'mp', name: 'Mercado Pago' },
  { id: 'ah', name: 'Ahorros USD (en pesos)' },
];

const tx = (over = {}) => ({ id: 't1', type: 'expense', amount: 29800, category: 'Comida', description: 'Supermercado Día', accountId: 'mp', date: '2026-11-13T12:00:00.000Z', ...over });

describe('TransactionList', () => {
  it('cada movimiento es un solo botón que abre la edición, con un nombre que dice qué es', () => {
    const onEdit = vi.fn();
    const t = tx();
    render(<TransactionList transactions={[t]} accounts={ACCOUNTS} onEdit={onEdit} />);
    const row = screen.getByRole('button', { name: /Gasto: Supermercado Día, −\$\s?29\.800/ });
    expect(row).toHaveAccessibleName(/Editar$/);
    fireEvent.click(row);
    expect(onEdit).toHaveBeenCalledWith(t);
    expect(screen.getAllByRole('button')).toHaveLength(1); // ya no hay dos íconos chicos por fila
  });

  it('el gasto lleva signo menos y el ingreso signo más', () => {
    render(
      <TransactionList
        transactions={[tx(), tx({ id: 't2', type: 'income', amount: 1850000, description: 'Sueldo', category: 'Ingreso' })]}
        accounts={ACCOUNTS}
      />,
    );
    expect(screen.getByRole('button', { name: /Gasto:/ })).toHaveTextContent('−$');
    expect(screen.getByRole('button', { name: /Ingreso: Sueldo, \+\$/ })).toHaveTextContent('+$');
  });

  it('la transferencia muestra origen → destino con los nombres de las cuentas', () => {
    render(
      <TransactionList
        transactions={[tx({ id: 't3', type: 'transfer', amount: 200000, description: 'Ahorro del mes', category: 'Transferencia', transferToAccountId: 'ah' })]}
        accounts={ACCOUNTS}
      />,
    );
    const row = screen.getByRole('button', { name: /Transferencia: Ahorro del mes/ });
    expect(within(row).getByText(/Mercado Pago → Ahorros USD \(en pesos\)/)).toBeInTheDocument();
  });

  it('sin descripción usa la categoría como título', () => {
    render(<TransactionList transactions={[tx({ description: '' })]} accounts={ACCOUNTS} />);
    expect(screen.getByRole('button', { name: /Gasto: Comida,/ })).toBeInTheDocument();
  });

  it('una descripción larguísima no rompe el renglón', () => {
    const long = 'Regalo de cumpleaños para la abuela Margarita (librería del centro) '.repeat(4).trim();
    render(<TransactionList transactions={[tx({ description: long })]} accounts={ACCOUNTS} />);
    expect(screen.getByText(long)).toBeInTheDocument();
  });

  it('muestra 20 y ofrece ver el resto', () => {
    const many = Array.from({ length: 27 }, (_, i) => tx({ id: `t${i}`, description: `Gasto ${i}` }));
    render(<TransactionList transactions={many} accounts={ACCOUNTS} />);
    expect(screen.getAllByRole('button', { name: /^Gasto:/ })).toHaveLength(20);
    fireEvent.click(screen.getByRole('button', { name: 'Ver los 7 restantes' }));
    expect(screen.getAllByRole('button', { name: /^Gasto:/ })).toHaveLength(27);
    expect(screen.queryByRole('button', { name: /restantes/ })).toBeNull();
  });

  it('sin movimientos invita a anotar el primero', () => {
    const onOpenAdd = vi.fn();
    render(<TransactionList transactions={[]} accounts={ACCOUNTS} onOpenAdd={onOpenAdd} />);
    fireEvent.click(screen.getByRole('button', { name: 'Anotar el primero' }));
    expect(onOpenAdd).toHaveBeenCalledTimes(1);
  });

  it('con cuentas borradas no rompe', () => {
    render(<TransactionList transactions={[tx({ accountId: 'borrada' })]} accounts={ACCOUNTS} />);
    expect(screen.getByRole('button', { name: /Gasto:/ })).toBeInTheDocument();
  });
});
