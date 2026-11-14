import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info };
const LABELS = { success: 'Listo', error: 'Error', info: 'Aviso' };

/**
 * showToast(mensaje, tipo = 'info', duración = 3000, opciones)
 *  - duración 0 = no se cierra solo.
 *  - opciones.action = { label, onClick }: botón dentro del aviso (por ejemplo "Deshacer"). Con acción, el aviso
 *    dura al menos 8 s para que alcance a tocarse.
 * El tipo se comunica con ícono y texto, no solo con color.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info', duration = 3000, options = {}) => {
      seq.current += 1;
      const id = `${Date.now()}-${seq.current}`;
      const action = options.action || null;
      setToasts((prev) => [...prev, { id, message, type, action }].slice(-2));

      const ms = action && duration > 0 ? Math.max(duration, 8000) : duration;
      if (ms > 0) setTimeout(() => removeToast(id), ms);
      return id;
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className={styles.container}>
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type] || Info;
            return (
              <motion.div
                key={toast.id}
                role={toast.type === 'error' ? 'alert' : 'status'}
                className={styles.toast}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2, ease: [0.2, 0.9, 0.25, 1] }}
              >
                <Icon size={20} className={styles.icon} aria-hidden="true" />
                <p className={styles.message}>
                  <span className={styles.sr}>{LABELS[toast.type] || LABELS.info}: </span>
                  {toast.message}
                </p>
                {toast.action && (
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => {
                      removeToast(toast.id);
                      toast.action.onClick?.();
                    }}
                  >
                    {toast.action.label}
                  </button>
                )}
                <button type="button" className={styles.close} onClick={() => removeToast(toast.id)} aria-label="Cerrar aviso">
                  <X size={18} aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
