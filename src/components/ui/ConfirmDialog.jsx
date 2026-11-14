import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';
import { useDialogA11y } from './useDialogA11y';
import styles from './ConfirmDialog.module.css';

const DialogPanel = ({ title, message, onConfirm, onCancel, confirmText, cancelText, confirmVariant, hideCancel }) => {
  const ref = useRef(null);
  const titleId = useId();
  const messageId = useId();
  useDialogA11y({ open: true, onClose: onCancel, containerRef: ref });

  return (
    <div className={styles.overlay}>
      <motion.div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        className={styles.dialog}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.18 }}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={messageId} className={styles.message}>
          {message}
        </p>
        <div className={styles.actions}>
          {!hideCancel && (
            <Button variant="key" onClick={onCancel} style={{ flex: 1 }} data-autofocus>
              {cancelText}
            </Button>
          )}
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            style={{ flex: 1 }}
            {...(hideCancel ? { 'data-autofocus': true } : {})}
          >
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Diálogo de confirmación centrado. El foco arranca en "Cancelar" (la opción segura); con `hideCancel`
 * es un aviso con un solo botón.
 */
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'danger',
  hideCancel = false,
}) =>
  createPortal(
    <AnimatePresence>
      {isOpen && (
        <DialogPanel
          key="dialog"
          title={title}
          message={message}
          onConfirm={onConfirm}
          onCancel={onCancel}
          confirmText={confirmText}
          cancelText={cancelText}
          confirmVariant={confirmVariant}
          hideCancel={hideCancel}
        />
      )}
    </AnimatePresence>,
    document.body,
  );

export default ConfirmDialog;
