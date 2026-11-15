import { useState, useEffect, useRef, useCallback } from 'react';
import Button from './ui/Button';
import AuthShell from './auth/AuthShell';
import shared from './auth/auth.module.css';

const GENERIC_ERROR = 'No pudimos activar tu cuenta. Revisá tu conexión e intentá de nuevo.';

/**
 * Se muestra a usuarios autenticados y verificados cuyo perfil users/{uid} no está activo.
 * Intenta la activación automáticamente al montar (la función es idempotente).
 */
const ActivationScreen = ({ email, onActivate, onSignOut, connectionError = false }) => {
  const [state, setState] = useState(connectionError ? 'error' : 'activating');
  const [message, setMessage] = useState(connectionError ? GENERIC_ERROR : '');
  const startedRef = useRef(false);

  const runActivation = useCallback(async () => {
    try {
      await onActivate();
      // Éxito: el snapshot de users/{uid} pasa a 'active' y App desmonta esta pantalla.
    } catch (err) {
      console.error('Error activando la cuenta:', err);
      if (err?.code === 'functions/permission-denied') {
        setState('denied');
        setMessage(err.message);
      } else {
        setState('error');
        setMessage(GENERIC_ERROR);
      }
    }
  }, [onActivate]);

  useEffect(() => {
    // Evita la doble llamada de StrictMode en desarrollo
    if (connectionError || startedRef.current) return;
    startedRef.current = true;
    runActivation();
  }, [connectionError, runActivation]);

  const handleRetry = () => {
    if (connectionError) {
      window.location.reload();
      return;
    }
    setState('activating');
    setMessage('');
    runActivation();
  };

  return (
    <AuthShell>
      <div className={shared.stack} role="status" aria-live="polite">
        <p className={shared.kicker}>Beta por invitación</p>

        {state === 'activating' && (
          <>
            <h1 className={shared.heading}>Activando tu cuenta…</h1>
            <p className={shared.muted}>Estamos verificando tu invitación a la Beta.</p>
          </>
        )}

        {state === 'denied' && (
          <>
            <h1 className={shared.heading}>Tu correo no está invitado</h1>
            <p className={shared.muted}>{message}</p>
            {email && <p className={shared.mono}>Cuenta: {email}</p>}
            <p className={shared.muted}>Pedile a quien te invitó que sume este correo.</p>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className={shared.heading}>Algo salió mal</h1>
            <p className={shared.muted}>{message}</p>
          </>
        )}
      </div>

      {state !== 'activating' && (
        <div className={shared.actions}>
          {state === 'error' && (
            <Button variant="primary" size="lg" block onClick={handleRetry}>
              Reintentar
            </Button>
          )}
          <Button variant="key" block onClick={onSignOut}>
            Cerrar sesión
          </Button>
        </div>
      )}
    </AuthShell>
  );
};

export default ActivationScreen;
