import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import styles from '@/components/theme-d/Modal.module.css';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
  /** Đợt 4: optional object-shell variants — extra classes for the
   *  dialog / header / body so a caller can make the dialog itself take
   *  the shape of a physical object (awning, chest, clipboard, ledger).
   *  All optional; omitted = the original wood-frame + paper body. */
  shellClass?: string;
  headerClass?: string;
  bodyClass?: string;
  titleClass?: string;
}

/** Theme D modal — wood-framed dialog on a paper body (Kế hoạch 1, Phần 2.2). */
export function Modal({ open, title, children, onClose, closeLabel, shellClass, headerClass, bodyClass, titleClass }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Lock the page behind the modal: wheel/touch scroll belongs to
    // the dialog's own body, never to the page underneath.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  // Portal vào document.body: thoát stacking/transform context của GameShell
  // (motion.div có transform khiến position:fixed bị neo theo hộp nội dung,
  // và HUD sticky z-50 vẽ đè lên tiêu đề modal ở mobile).
  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={shellClass ? `${styles.dialog} ${shellClass}` : styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={headerClass ? `${styles.header} ${headerClass}` : styles.header}>
          <h2 className={titleClass ? `${styles.title} ${titleClass}` : styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </div>
        <div className={bodyClass ? `${styles.body} ${bodyClass}` : styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
