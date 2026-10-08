import type { ReactNode } from 'react';

import styles from '@/components/Modal.module.css';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ title, isOpen, onClose, children, footer }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
          {onClose ? (
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              ×
            </button>
          ) : null}
        </header>
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>
  );
}
