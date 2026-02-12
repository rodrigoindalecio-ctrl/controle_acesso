/**
 * P4.3: Modal/Drawer para exibir histórico de check-in do convidado
 */

'use client';

import React from 'react';
import styles from './GuestHistoryDrawer.module.css';
import cardStyles from '@/lib/cards.module.css';
import { useGuestHistory } from '@/lib/hooks/useGuestHistory';
import { GuestHistoryResponse } from '@/app/api/events/[id]/guests/[guestId]/history/route';

interface GuestHistoryDrawerProps {
  eventId: string;
  guestId: string | null;
  guestName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Formata timestamp para formato local
 */
function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (e) {
    return isoString;
  }
}

/**
 * Formata hora curta (HH:MM)
 */
function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return isoString;
  }
}

export default function GuestHistoryDrawer({
  eventId,
  guestId,
  guestName,
  isOpen,
  onClose,
}: GuestHistoryDrawerProps) {
  const { history, loading, error } = useGuestHistory(eventId, isOpen ? guestId : null);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <div className={`${styles.drawer} ${cardStyles.cardBase}`} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Histórico: {guestName}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.skeleton}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} style={{ width: '80%' }} />
            </div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : history && history.history.length > 0 ? (
            <div className={styles.timeline}>
              {history.history.map((entry, index) => {
                const isRecent = index === history.history.length - 1;
                const isCheckIn = entry.type === 'checkin';

                return (
                  <div
                    key={`${entry.type}-${entry.timestamp}`}
                    className={`${styles.timelineItem} ${isRecent ? cardStyles.cardHighlight : cardStyles.cardSoft}`}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`${styles.dot} ${isCheckIn ? styles.dot_success : styles.dot_undo}`}
                      title={isCheckIn ? 'Check-in' : 'Desfeito'}
                    >
                      {isCheckIn ? '✓' : '↶'}
                    </div>

                    {/* Content */}
                    <div className={styles.itemContent}>
                      <div className={styles.itemAction}>
                        {isCheckIn ? '✅ Check-in' : '↩️ Desfazer'}
                      </div>

                      <div className={styles.itemTime}>
                        {formatTimestamp(entry.timestamp)}
                      </div>

                      {entry.userId && (
                        <div className={styles.itemUser}>
                          Por: {entry.userId}
                        </div>
                      )}

                      {entry.reason && (
                        <div className={styles.itemReason}>
                          Motivo: {entry.reason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📋</div>
              <p className={styles.emptyText}>Nenhum histórico registrado</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.closeButtonFooter}
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
}
