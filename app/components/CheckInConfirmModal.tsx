'use client';

import React, { useState } from 'react';
import styles from './CheckInConfirmModal.module.css';

interface CheckInConfirmModalProps {
  guestName: string;
  isOpen: boolean;
  onConfirm: (isNonPaying: boolean, isStaff: boolean) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CheckInConfirmModal({
  guestName,
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
}: CheckInConfirmModalProps) {
  const [isNonPaying, setIsNonPaying] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(isNonPaying, isStaff);
    setIsNonPaying(false); // Reset para próximo uso
    setIsStaff(false);
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Confirmar Entrada</h2>
          <button className={styles.closeBtn} onClick={onCancel} aria-label="Fechar">✕</button>
        </div>
        <p className={styles.guestName}>{guestName}</p>

        <div className={styles.checkboxContainer}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isNonPaying}
              onChange={(e) => {
                setIsNonPaying(e.target.checked);
                if (e.target.checked) setIsStaff(false);
              }}
              disabled={isLoading}
              className={styles.checkbox}
            />
            <span>Convidado não Pagante</span>
          </label>
        </div>

        <div className={styles.checkboxContainer}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isStaff}
              onChange={(e) => {
                setIsStaff(e.target.checked);
                if (e.target.checked) setIsNonPaying(false);
              }}
              disabled={isLoading}
              className={styles.checkbox}
            />
            <span>Convidado Staff</span>
          </label>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnConfirm}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Confirmando...' : 'Confirmar Entrada'}
          </button>
        </div>
      </div>
    </div>
  );
}
