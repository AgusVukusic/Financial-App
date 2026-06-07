import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <AnimatePresence>
        {dialogState.isOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, padding: 'var(--spacing-lg)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel"
              style={{
                width: '100%', maxWidth: '400px', padding: 'var(--spacing-xl)',
                display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'
              }}
            >
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{dialogState.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                {dialogState.message}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                {dialogState.type === 'confirm' && (
                  <button onClick={dialogState.onCancel} style={{
                    background: 'transparent', border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'
                  }}>
                    Cancelar
                  </button>
                )}
                <button onClick={dialogState.onConfirm} style={{
                  background: 'var(--accent-primary)', border: 'none',
                  color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500'
                }}>
                  {dialogState.type === 'confirm' ? 'Confirmar' : 'Entendido'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};
