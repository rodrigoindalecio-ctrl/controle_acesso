/**
 * P5.1: Modal de Confirmação de Undo com Justificativa Obrigatória
 */

'use client';

import React, { useState } from 'react';
import styles from './UndoReasonModal.module.css';
import btn from '../../lib/buttons.module.css';

interface UndoReasonModalProps {
  isOpen: boolean;
  guestName: string;
  isLoading: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

const MIN_LENGTH = 5;
const MAX_LENGTH = 255;

export default function UndoReasonModal({
  isOpen,
  guestName,
  isLoading,
  onConfirm,
  onCancel,
}: UndoReasonModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isValid = reason.trim().length >= MIN_LENGTH;
  const charCount = reason.length;
  const isOverLimit = charCount > MAX_LENGTH;

  const handleConfirm = async () => {
    setError(null);

    if (!reason.trim()) {
      setError('Justificativa é obrigatória');
      return;
    }

    if (reason.trim().length < MIN_LENGTH) {
      setError(`Mínimo ${MIN_LENGTH} caracteres`);
      return;
    }

    if (charCount > MAX_LENGTH) {
      setError(`Máximo ${MAX_LENGTH} caracteres`);
      return;
    }

    try {
      await onConfirm(reason.trim());
      // Only reset if successful (no error thrown)
      setReason('');
      // Note: onCancel is called from parent after state update
    } catch (err) {
      // Error is already shown as toast in parent, just display here too
      setError('Erro ao processar. Tente novamente.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && isValid && !isLoading) {
      handleConfirm();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={() => !isLoading && onCancel()}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2 className={styles.title}>Desf azer Check-in</h2>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            Você está prestes a desfazer o check-in de <strong>{guestName}</strong>.
          </p>
          <p className={styles.subtext}>
            Por favor, indique o motivo para esta alteração:
          </p>

          <textarea
            className={`${styles.textarea} ${isOverLimit ? styles.textarea_error : ''}`}
            placeholder="Ex: Saída antecipada do evento, erro de registro, convidado duplicado..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-label="Motivo do undo"
            maxLength={MAX_LENGTH + 50} // Permite digitar um pouco além do limite para UX
          />

          <div className={styles.footer_meta}>
            <span
              className={`${styles.charCount} ${
                isOverLimit ? styles.charCount_error : ''
              }`}
            >
              {charCount} / {MAX_LENGTH}
            </span>
            {isOverLimit && (
              <span className={styles.warning}>Limite excedido</span>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.cancelButton} ${btn.btn} ${btn['btn--secondary']}`}
            onClick={onCancel}
            disabled={isLoading}
            type="button"
          >
            Cancelar
          </button>

          <button
            className={`${styles.confirmButton} ${btn.btn} ${btn['btn--primary']} ${
              isLoading ? btn['is-loading'] : ''
            }`}
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            type="button"
          >
            {isLoading ? (
              <>
                <span className={btn['btn__spinner']} aria-hidden="true" />
                <span>Processando...</span>
              </>
            ) : (
              'Confirmar Undo'
            )}
          </button>
        </div>

        <div className={styles.hint}>
          💡 Use Ctrl+Enter para confirmar rapidamente
        </div>
      </div>
    </>
  );
}
