"use client";

import React, { useState } from 'react';
import styles from './AddGuestModal.module.css';

interface ConfirmAddAndCheckModalProps {
  eventId: string;
  name: string;
  isOpen: boolean;
  onClose: () => void;
  onGuestAdded: (guest: {
    id: string;
    fullName: string;
    checkedInAt: string;
    category?: string | null;
    tableNumber?: number | null;
  }) => void;
}

export default function ConfirmAddAndCheckModal({ eventId, name, isOpen, onClose, onGuestAdded }: ConfirmAddAndCheckModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (loading) return; // block double clicks
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/events/${eventId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name }),
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Erro ao adicionar convidado');
      }

      const guest = data.guest || {
        id: `guest-${Date.now()}`,
        fullName: name,
        checkedInAt: new Date().toISOString(),
        category: null,
        tableNumber: null,
      };

      onGuestAdded(guest);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao adicionar convidado';
      setError(msg);
      console.error('Confirm add error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h3>Adicionar novo convidado?</h3>
          <button className={styles.close} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className={styles.body}>
          {error && <div className={styles.error}>{error}</div>}

          <p>
            O convidado '<strong>{name}</strong>' não está na lista.
            Deseja adicioná-lo e confirmar a entrada agora?
          </p>

          <div className={styles.actions} style={{ marginTop: 12 }}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? '...' : 'Adicionar e confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
