import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { Chip, ConfirmDialog, Field, Input, Meter, Odometer, Sheet, Tag, ToastProvider, useToast } from './index';

describe('Meter', () => {
  it('describe el nivel y marca el exceso con un segmento rayado aparte', () => {
    const { container } = render(<Meter used={387499} limit={300000} label="Compras: superado por $ 87.499" />);
    const meter = screen.getByRole('meter', { name: /superado/i });
    expect(meter).toHaveAttribute('aria-valuemax', '300000');
    expect(meter).toHaveAttribute('aria-valuenow', '300000');
    expect(container.querySelectorAll('i')).toHaveLength(11); // 10 segmentos + el de exceso
  });

  it('llena segmentos proporcionales al uso y deja al menos uno cuando hay gasto', () => {
    const { container, rerender } = render(<Meter used={138581} limit={180000} label="Comida" />);
    expect(container.querySelectorAll('i[class*="on"]')).toHaveLength(8); // 77 %
    rerender(<Meter used={100} limit={180000} label="Comida" />);
    expect(container.querySelectorAll('i[class*="on"]')).toHaveLength(1);
  });

  it('sin tope es una imagen etiquetada, no un medidor', () => {
    render(<Meter used={33000} limit={null} />);
    expect(screen.getByRole('img', { name: 'Sin tope' })).toBeInTheDocument();
    expect(screen.queryByRole('meter')).toBeNull();
  });
});

describe('Odometer', () => {
  it('anuncia el valor completo y oculta los dígitos sueltos', () => {
    const { container } = render(<Odometer value="15.373.721" />);
    const root = screen.getByRole('img', { name: '15.373.721' });
    expect(root).toBeInTheDocument();
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(8);
  });

  it('desplaza cada pila de dígitos con transform al cambiar el valor', () => {
    const { container, rerender } = render(<Odometer value="10" />);
    const stack = () => container.querySelectorAll('span[style]')[1];
    expect(stack().style.transform).toBe('translateY(-0%)');
    rerender(<Odometer value="13" />);
    expect(stack().style.transform).toBe('translateY(-30%)');
  });
});

describe('Chip', () => {
  it('con pressed funciona como interruptor accesible', () => {
    const onClick = vi.fn();
    render(
      <Chip pressed onClick={onClick}>
        Comida
      </Chip>,
    );
    const chip = screen.getByRole('button', { name: 'Comida' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sin pressed no declara aria-pressed', () => {
    render(<Chip>Café</Chip>);
    expect(screen.getByRole('button', { name: 'Café' })).not.toHaveAttribute('aria-pressed');
  });
});

describe('Tag', () => {
  it('lleva texto e ícono, no solo color', () => {
    render(
      <Tag tone="bad" icon={<svg data-testid="ico" />}>
        Vencido
      </Tag>,
    );
    expect(screen.getByText('Vencido')).toBeInTheDocument();
    expect(screen.getByTestId('ico')).toBeInTheDocument();
  });
});

describe('Field', () => {
  it('conecta etiqueta, ayuda y error con el control', () => {
    render(
      <Field label="Monto" hint="En pesos" error="Ingresá un monto mayor a cero.">
        {(p) => <Input {...p} />}
      </Field>,
    );
    const input = screen.getByLabelText('Monto');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const described = input.getAttribute('aria-describedby').split(' ');
    expect(described).toHaveLength(2);
    expect(screen.getByText('Ingresá un monto mayor a cero.')).toBeInTheDocument();
  });

  it('sin error no marca el control como inválido', () => {
    render(<Field label="Nombre">{(p) => <Input {...p} />}</Field>);
    expect(screen.getByLabelText('Nombre')).not.toHaveAttribute('aria-invalid');
  });
});

describe('Sheet', () => {
  const Harness = () => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button type="button">afuera</button>
        <Sheet open={open} onClose={() => setOpen(false)} title="Anotar gasto">
          <input aria-label="Qué y cuánto" />
        </Sheet>
      </>
    );
  };

  it('es un diálogo modal con título y el foco adentro', () => {
    render(<Harness />);
    const dialog = screen.getByRole('dialog', { name: 'Anotar gasto' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('se cierra con Escape y con el botón Cerrar visible', async () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('atrapa el foco con Tab dentro de la hoja', () => {
    render(<Harness />);
    const close = screen.getByRole('button', { name: 'Cerrar' });
    const input = screen.getByLabelText('Qué y cuánto');
    input.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
  });
});

describe('ConfirmDialog', () => {
  it('es un alertdialog y enfoca primero la opción segura (Cancelar)', () => {
    render(<ConfirmDialog isOpen title="Anular" message="No se puede deshacer." onConfirm={() => {}} onCancel={() => {}} confirmText="Anular" />);
    const dialog = screen.getByRole('alertdialog', { name: 'Anular' });
    expect(dialog).toHaveAccessibleDescription('No se puede deshacer.');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }));
  });

  it('con hideCancel es un aviso de un solo botón', () => {
    render(<ConfirmDialog isOpen title="Aviso" message="Listo." onConfirm={() => {}} onCancel={() => {}} confirmText="Entendido" hideCancel />);
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Entendido' })).toBeInTheDocument();
  });
});

describe('Toast', () => {
  const Trigger = ({ onUndo }) => {
    const { showToast } = useToast();
    return (
      <button type="button" onClick={() => showToast('Gasto registrado', 'success', 3000, { action: { label: 'Deshacer', onClick: onUndo } })}>
        mostrar
      </button>
    );
  };

  it('muestra el aviso con una acción Deshacer que se ejecuta una vez', async () => {
    const onUndo = vi.fn();
    render(
      <ToastProvider>
        <Trigger onUndo={onUndo} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'mostrar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Gasto registrado');
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('los errores usan role=alert', () => {
    const ErrorTrigger = () => {
      const { showToast } = useToast();
      return (
        <button type="button" onClick={() => showToast('Sin conexión', 'error')}>
          error
        </button>
      );
    };
    render(
      <ToastProvider>
        <ErrorTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'error' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión');
  });
});
