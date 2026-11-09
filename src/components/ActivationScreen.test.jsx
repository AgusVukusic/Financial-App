import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActivationScreen from './ActivationScreen';

const fnError = (code, message) => Object.assign(new Error(message), { code });

describe('ActivationScreen', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('intenta activar al montar y muestra el estado de carga', () => {
    const onActivate = vi.fn(() => new Promise(() => {}));
    render(<ActivationScreen email="a@b.com" onActivate={onActivate} onSignOut={vi.fn()} />);
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Activando tu cuenta/i)).toBeInTheDocument();
  });

  it('muestra el mensaje del servidor si el usuario no está invitado', async () => {
    const onActivate = vi.fn().mockRejectedValue(
      fnError('functions/permission-denied', 'Tu correo no se encuentra en la lista de invitados para la Beta.')
    );
    const onSignOut = vi.fn();
    render(<ActivationScreen email="a@b.com" onActivate={onActivate} onSignOut={onSignOut} />);

    expect(await screen.findByText(/lista de invitados/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reintentar/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cerrar sesión/i }));
    expect(onSignOut).toHaveBeenCalled();
  });

  it('permite reintentar ante errores genéricos', async () => {
    const onActivate = vi.fn()
      .mockRejectedValueOnce(fnError('functions/internal', 'x'))
      .mockReturnValue(new Promise(() => {}));
    render(<ActivationScreen email="a@b.com" onActivate={onActivate} onSignOut={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: /Reintentar/i }));
    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/Activando tu cuenta/i)).toBeInTheDocument();
  });

  it('con error de conexión no llama a la función', () => {
    const onActivate = vi.fn();
    render(<ActivationScreen onActivate={onActivate} onSignOut={vi.fn()} connectionError />);
    expect(onActivate).not.toHaveBeenCalled();
    expect(screen.getByText(/Algo salió mal/i)).toBeInTheDocument();
  });
});
