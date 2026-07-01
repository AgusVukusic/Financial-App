import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import Card from './Card';
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="confirm-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="confirm-wrapper"
        >
          <Card className="confirm-content">
            <h2 className="confirm-title">{title}</h2>
            <p className="confirm-message">{message}</p>
            
            <div className="confirm-actions">
              <Button variant="outline" onClick={onCancel} style={{ flex: 1 }}>
                {cancelText}
              </Button>
              <Button variant="danger" onClick={onConfirm} style={{ flex: 1 }}>
                {confirmText}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmDialog;
