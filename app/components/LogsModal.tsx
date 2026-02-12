'use client';

import React from 'react';
import styles from './LogsModal.module.css';
import btn from '../../lib/buttons.module.css';
import AuditLog from './AuditLog';

interface AuditLogEntry {
  id: string;
  userId: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  justification?: string;
  ip?: string;
  userAgent?: string;
  created_at: string;
}

interface LogsModalProps {
  isOpen: boolean;
  title: string;
  logs: AuditLogEntry[];
  loading: boolean;
  error?: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function LogsModal({
  isOpen,
  title,
  logs,
  loading,
  error,
  onClose,
  onRefresh
}: LogsModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>🧾 {title}</h2>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${btn.btn} ${btn['btn--secondary']} ${btn['btn--sm']}`}
              onClick={onRefresh}
              disabled={loading}
            >
              Atualizar
            </button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">✕</button>
          </div>
        </header>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}
          {loading ? (
            <p className={styles.loading}>Carregando logs...</p>
          ) : (
            <AuditLog logs={logs} />
          )}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={`${btn.btn} ${btn['btn--secondary']}`}
            onClick={onClose}
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
