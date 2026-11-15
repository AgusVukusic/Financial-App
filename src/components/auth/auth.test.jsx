import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const fb = vi.hoisted(() => ({
  signIn: vi.fn(),
  create: vi.fn(),
  updateProfile: vi.fn(),
  sendVerification: vi.fn(),
  signOut: vi.fn(),
}));
const pwa = vi.hoisted(() => ({ value: {} }));

vi.mock('../../firebase', () => ({ auth: { name: 'auth' } }));
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: fb.signIn,
  createUserWithEmailAndPassword: fb.create,
  updateProfile: fb.updateProfile,
  sendEmailVerification: fb.sendVerification,
  signOut: fb.signOut,
}));
vi.mock('../../hooks/usePWA', () => ({ usePWA: () => pwa.value }));

import LandingPage from '../LandingPage';
import WelcomeScreen from '../WelcomeScreen';
import { ToastProvider } from '../ui/ToastContext';

const authErr = (code) => Object.assign(new Error(`Firebase: Error (${code}).`), { code });
const unverified = { user: { emailVerified: false } };
const verified = { user: { emailVerified: true } };

describe('LandingPage', () => {
  beforeEach(() => {
    pwa.value = { isInstallable: false, isIOS: false, isStandalone: false, installPWA: vi.fn() };
  });

  const withUserAgent = (userAgent, maxTouchPoints = 0) => {
    vi.stubGlobal('navigator', { userAgent, maxTouchPoints });
    return () => vi.unstubAllGlobals();
  };

  it('"Instalar la app" es la acción principal y "Ingresar" llama onLoginClick', () => {
    const onLoginClick = vi.fn();
    render(<LandingPage onLoginClick={onLoginClick} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Finanzas Personales' })).toBeInTheDocument();
    const install = screen.getByRole('button', { name: 'Instalar la app' });
    const login = screen.getByRole('button', { name: 'Ingresar' });
    expect(install.className).toMatch(/btn-primary/);
    expect(login.className).toMatch(/btn-key/);
    expect(install.compareDocumentPosition(login) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('Queda en tu pantalla de inicio, como cualquier otra app.')).toBeInTheDocument();
    fireEvent.click(login);
    expect(onLoginClick).toHaveBeenCalled();
  });

  it('en modo standalone solo está "Ingresar", como acción principal', () => {
    pwa.value.isStandalone = true;
    const onLoginClick = vi.fn();
    render(<LandingPage onLoginClick={onLoginClick} />);
    expect(screen.queryByRole('button', { name: /Instalar la app/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/pantalla de inicio/i)).not.toBeInTheDocument();
    const login = screen.getByRole('button', { name: 'Ingresar' });
    expect(login.className).toMatch(/btn-primary/);
    fireEvent.click(login);
    expect(onLoginClick).toHaveBeenCalled();
  });

  it('si es instalable llama installPWA', () => {
    pwa.value.isInstallable = true;
    render(<LandingPage onLoginClick={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Instalar la app/i }));
    expect(pwa.value.installPWA).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('si no es instalable abre la hoja con la guía del dispositivo, otras guías y "Entendido"', async () => {
    const restore = withUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      5,
    );
    try {
      render(<LandingPage onLoginClick={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /Instalar la app/i }));
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveTextContent('iPhone o iPad (Safari)');
      expect(dialog.querySelector('ol').querySelectorAll('li')).toHaveLength(3);
      expect(dialog).not.toHaveTextContent(/menú del navegador/i);
      expect(dialog.querySelector('details summary')).toHaveTextContent('Tengo otro celular o navegador');
      expect(pwa.value.installPWA).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    } finally {
      restore();
    }
  });

  it('en Android con Chrome muestra los tres puntitos', async () => {
    const restore = withUserAgent(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.99 Mobile Safari/537.36',
      5,
    );
    try {
      render(<LandingPage onLoginClick={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /Instalar la app/i }));
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveTextContent('Celular Android (Chrome)');
      expect(dialog.querySelector('ol li')).toHaveTextContent('tres puntitos');
    } finally {
      restore();
    }
  });
});

describe('WelcomeScreen', () => {
  const setup = (props = {}) =>
    render(
      <ToastProvider>
        <WelcomeScreen {...props} />
      </ToastProvider>,
    );

  const fill = (email = 'a@b.com', password = 'secreta1') => {
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: email } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } });
  };
  const submit = () => fireEvent.click(screen.getByRole('button', { name: /^(Ingresar|Crear cuenta)$/ }));

  beforeEach(() => {
    Object.values(fb).forEach((f) => f.mockReset());
    fb.signOut.mockResolvedValue();
    fb.sendVerification.mockResolvedValue();
    fb.updateProfile.mockResolvedValue();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('ingreso sin verificar: cierra sesión y muestra el aviso con "Reenviar correo"', async () => {
    fb.signIn.mockResolvedValue(unverified);
    setup();
    fill();
    submit();
    expect(await screen.findByText(/todavía no está verificado/i)).toBeInTheDocument();
    expect(fb.signOut).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Reenviar correo/i })).toBeInTheDocument();
  });

  it('después, ingreso verificado: no cierra sesión y el aviso desaparece', async () => {
    fb.signIn.mockResolvedValueOnce(unverified).mockResolvedValueOnce(verified);
    setup();
    fill();
    submit();
    await screen.findByText(/todavía no está verificado/i);
    fb.signOut.mockClear();

    submit();
    await waitFor(() => expect(fb.signIn).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText(/todavía no está verificado/i)).not.toBeInTheDocument());
    expect(fb.signOut).not.toHaveBeenCalled();
  });

  it('reenviar: vuelve a ingresar, manda el correo y cierra sesión', async () => {
    fb.signIn.mockResolvedValue(unverified);
    setup();
    fill();
    submit();
    await screen.findByText(/todavía no está verificado/i);
    fb.signOut.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /Reenviar correo/i }));
    expect(await screen.findByText('Te reenviamos el correo de verificación.')).toBeInTheDocument();
    expect(fb.signIn).toHaveBeenCalledTimes(2);
    expect(fb.sendVerification).toHaveBeenCalledWith(unverified.user);
    expect(fb.signOut).toHaveBeenCalledTimes(1);
  });

  it('reenviar cuando ya está verificado: no manda correo ni cierra sesión', async () => {
    fb.signIn.mockResolvedValueOnce(unverified).mockResolvedValueOnce(verified);
    setup();
    fill();
    submit();
    await screen.findByText(/todavía no está verificado/i);
    fb.signOut.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /Reenviar correo/i }));
    await waitFor(() => expect(fb.signIn).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText(/todavía no está verificado/i)).not.toBeInTheDocument());
    expect(fb.sendVerification).not.toHaveBeenCalled();
    expect(fb.signOut).not.toHaveBeenCalled();
  });

  it('credenciales malas: texto humano, nunca "Firebase:"', async () => {
    fb.signIn.mockRejectedValue(authErr('auth/invalid-credential'));
    setup();
    fill();
    submit();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('El correo o la contraseña no coinciden.');
    expect(document.body.textContent).not.toMatch(/Firebase:/);
  });

  it('sin conexión', async () => {
    fb.signIn.mockRejectedValue(authErr('auth/network-request-failed'));
    setup();
    fill();
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión. Revisá internet y probá de nuevo.');
  });

  it('validaciones inline con foco en el primer error y sin llamar a Firebase', () => {
    setup();
    submit();
    expect(screen.getByText('Ingresá tu correo.')).toBeInTheDocument();
    expect(screen.getByText('Ingresá tu contraseña.')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo')).toHaveFocus();

    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'sin-arroba' } });
    submit();
    expect(screen.getByText(/le falta la @/i)).toBeInTheDocument();
    expect(fb.signIn).not.toHaveBeenCalled();
  });

  it('en registro exige nombre y contraseña de 6 o más', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Creá una/i }));
    fill('a@b.com', '123');
    submit();
    expect(screen.getByText('Ponete un nombre.')).toBeInTheDocument();
    expect(screen.getByText('Usá al menos 6 caracteres.')).toBeInTheDocument();
    expect(screen.getByLabelText('Tu nombre')).toHaveFocus();
    expect(fb.create).not.toHaveBeenCalled();
  });

  it('mostrar/ocultar contraseña cambia el type', () => {
    setup();
    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');
    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('autocomplete correcto por modo', () => {
    setup();
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByLabelText('Correo')).toHaveAttribute('autocomplete', 'email');
    fireEvent.click(screen.getByRole('button', { name: /Creá una/i }));
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText('Tu nombre')).toHaveAttribute('autocomplete', 'nickname');
  });

  it('registro OK: aviso con el correo y vuelve al modo ingreso', async () => {
    fb.create.mockResolvedValue({ user: { uid: 'u1' } });
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Creá una/i }));
    fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: 'Ana' } });
    fill('ana@ej.com', 'secreta1');
    submit();

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Te enviamos un correo a ana@ej.com.');
    expect(fb.sendVerification).toHaveBeenCalled();
    expect(fb.signOut).toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: 'Ingresá' })).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
  });

  it('cambiar de modo limpia avisos y errores', async () => {
    fb.signIn.mockResolvedValue(unverified);
    setup();
    fill();
    submit();
    await screen.findByText(/todavía no está verificado/i);
    fireEvent.click(screen.getByRole('button', { name: /Creá una/i }));
    expect(screen.queryByText(/todavía no está verificado/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ya tenés cuenta/i }));
    fb.signIn.mockRejectedValue(authErr('auth/wrong-password'));
    submit();
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: /Creá una/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra "Volver" solo con onBack', () => {
    const onBack = vi.fn();
    const { unmount } = setup({ onBack });
    fireEvent.click(screen.getByRole('button', { name: /Volver/i }));
    expect(onBack).toHaveBeenCalled();
    unmount();
    setup();
    expect(screen.queryByRole('button', { name: /Volver/i })).not.toBeInTheDocument();
  });
});
