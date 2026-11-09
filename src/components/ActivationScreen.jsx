import { useState, useEffect, useRef, useCallback } from 'react';
import Button from './ui/Button';

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
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 'var(--spacing-xl)'
    }}>
      <div className="glass-panel" role="status" aria-live="polite" style={{
        padding: 'var(--spacing-xl)', maxWidth: '400px', width: '100%',
        textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)'
      }}>
        {state === 'activating' && (
          <>
            <h1 style={{ fontSize: '1.4rem' }}>Activando tu cuenta…</h1>
            <p className="text-secondary">Estamos verificando tu invitación a la Beta.</p>
          </>
        )}

        {state === 'denied' && (
          <>
            <h1 style={{ fontSize: '1.4rem' }}>Acceso no habilitado</h1>
            <p className="text-secondary">{message}</p>
            {email && <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Cuenta: {email}</p>}
          </>
        )}

        {state === 'error' && (
          <>
            <h1 style={{ fontSize: '1.4rem' }}>Algo salió mal</h1>
            <p className="text-secondary">{message}</p>
          </>
        )}

        {state !== 'activating' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {state === 'error' && <Button onClick={handleRetry}>Reintentar</Button>}
            <Button variant="ghost" onClick={onSignOut}>Cerrar sesión</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivationScreen;
