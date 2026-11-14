import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useDialogA11y } from './useDialogA11y';
import styles from './Sheet.module.css';

const SheetPanel = ({ title, onClose, children, className }) => {
  const ref = useRef(null);
  const titleId = useId();
  useDialogA11y({ open: true, onClose, containerRef: ref });

  return (
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${styles.sheet} ${className}`.trim()}
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ duration: 0.28, ease: [0.2, 0.9, 0.25, 1] }}
      >
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </motion.div>
    </>
  );
};

/**
 * Hoja inferior modal. Siempre tiene un botón "Cerrar" visible (arrastrar no es la única forma de salir),
 * se cierra con Escape o tocando el fondo, y atrapa el foco mientras está abierta.
 */
const Sheet = ({ open, onClose, title, children, className = '' }) =>
  createPortal(
    <AnimatePresence>
      {open && (
        <SheetPanel key="sheet" title={title} onClose={onClose} className={className}>
          {children}
        </SheetPanel>
      )}
    </AnimatePresence>,
    document.body,
  );

export default Sheet;
