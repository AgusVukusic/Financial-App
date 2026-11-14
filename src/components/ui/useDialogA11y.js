import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

let scrollLocks = 0;

/**
 * Comportamiento accesible de un diálogo modal: foco adentro (en [data-autofocus] o el primer control),
 * Tab atrapado, Escape cierra, el fondo no se desplaza y el foco vuelve a donde estaba.
 * `containerRef` apunta al nodo con role="dialog".
 */
export const useDialogA11y = ({ open, onClose, containerRef }) => {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const node = containerRef.current;
    if (!node) return undefined;

    const previous = document.activeElement;
    scrollLocks += 1;
    if (scrollLocks === 1) document.body.style.overflow = 'hidden';

    const first = node.querySelector('[data-autofocus]') || node.querySelector(FOCUSABLE);
    (first || node).focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = [...node.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      scrollLocks -= 1;
      if (scrollLocks === 0) document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open, containerRef]);
};
