import { createContext, useContext, useState } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

export const DialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    message: '',
    title: '',
    type: 'confirm', // 'confirm' | 'alert'
    onConfirm: () => {},
    onCancel: () => {}
  });

  /** options.confirmText: texto del botón (por defecto "Confirmar"); options.destructive: false para una confirmación que no es de borrado. */
  const confirm = (message, title = 'Confirmar', options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        message,
        title,
        type: 'confirm',
        confirmText: options.confirmText,
        destructive: options.destructive !== false,
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const alert = (message, title = 'Aviso') => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        message,
        title,
        type: 'alert',
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });
    });
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
        confirmText={dialogState.type === 'confirm' ? dialogState.confirmText || 'Confirmar' : 'Entendido'}
        confirmVariant={dialogState.type === 'confirm' && dialogState.destructive !== false ? 'danger' : 'primary'}
        hideCancel={dialogState.type === 'alert'}
      />
    </DialogContext.Provider>
  );
};
