import { useRef, useCallback } from 'react';
import { newRequestId } from '../services/api';

/**
 * ID de idempotencia por acción del usuario.
 *
 * `getId(payload)` devuelve el mismo ID mientras el contenido no cambie, así un reintento
 * tras un error de red no duplica el movimiento. Si el usuario modifica algo, se genera uno
 * nuevo (de lo contrario el servidor devolvería el resultado del intento anterior).
 * Llamar `reset()` cuando la acción terminó bien o el formulario se reinicia.
 */
export const useRequestId = () => {
  const ref = useRef({ id: null, fingerprint: null });

  const getId = useCallback((payload) => {
    const fingerprint = JSON.stringify(payload);
    if (!ref.current.id || ref.current.fingerprint !== fingerprint) {
      ref.current = { id: newRequestId(), fingerprint };
    }
    return ref.current.id;
  }, []);

  const reset = useCallback(() => {
    ref.current = { id: null, fingerprint: null };
  }, []);

  return { getId, reset };
};
