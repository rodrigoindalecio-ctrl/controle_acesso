'use client';

import React from 'react';
import styles from './ConfirmDialog.module.css';
import btn from '../../lib/buttons.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Erro ao confirmar:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>{isDangerous ? '⚠️' : '❓'} {title}</h2>
          <button className={styles.closeBtn} onClick={onCancel} aria-label="Fechar">✕</button>
        </header>

        <div className={styles.content}>
          <p>{message}</p>
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.cancelBtn} ${btn.btn} ${btn['btn--secondary']}`}
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`${styles.confirmBtn} ${btn.btn} ${isDangerous ? btn['btn--danger'] : btn['btn--primary']} ${
              isLoading ? btn['is-loading'] : ''
            }`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={btn['btn__spinner']} aria-hidden="true" />
                <span>Processando...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
