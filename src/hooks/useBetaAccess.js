import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { invokeFn } from '../services/api';

/**
 * Puerta de acceso de la Beta (ADR 002).
 * Observa users/{uid} y expone `activate()`, que llama a la Callable `activateBetaUser`.
 *
 * status: 'signed-out' | 'checking' | 'active' | 'inactive' | 'error'
 */
export const useBetaAccess = (uid) => {
  // Se guarda el uid junto al estado para no hacer setState síncrono en el efecto:
  // si el uid cambió y todavía no llegó el snapshot, el estado derivado es 'checking'.
  const [snapshotState, setSnapshotState] = useState({ uid: null, status: 'checking' });

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        const isActive = snap.exists() && snap.data().active === true;
        setSnapshotState({ uid, status: isActive ? 'active' : 'inactive' });
      },
      (error) => {
        console.error('Error leyendo el perfil de usuario:', error);
        setSnapshotState({ uid, status: 'error' });
      }
    );
    return () => unsubscribe();
  }, [uid]);

  const activate = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No hay una sesión activa.');
    // Forzar token nuevo: el claim email_verified puede estar desactualizado
    await currentUser.getIdToken(true);
    return invokeFn('activateBetaUser');
  }, []);

  let status;
  if (!uid) status = 'signed-out';
  else if (snapshotState.uid !== uid) status = 'checking';
  else status = snapshotState.status;

  return { status, activate };
};
