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

  const confirm = (message, title = 'Confirmar') => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        message,
        title,
        type: 'confirm',
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
        confirmText={dialogState.type === 'confirm' ? 'Confirmar' : 'Entendido'}
        confirmVariant={dialogState.type === 'confirm' ? 'danger' : 'primary'}
        hideCancel={dialogState.type === 'alert'}
      />
    </DialogContext.Provider>
  );
};
