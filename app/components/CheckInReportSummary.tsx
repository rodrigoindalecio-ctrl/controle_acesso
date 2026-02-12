/**
 * P4.2: Componente de Resumo do Check-in
 * Exibe 4 cards: Total, CheckedIn, NotCheckedIn, Undone
 */

'use client';

import React from 'react';
import styles from './CheckInReportSummary.module.css';
import cardStyles from '@/lib/cards.module.css';
import { CheckInReport } from '@/lib/report/generateCheckInReport';
import { exportCheckInCSV } from '@/lib/report/exportCheckInCSV';

interface CheckInReportSummaryProps {
  report: CheckInReport | null;
  loading: boolean;
  isAdmin: boolean;
  eventSlug?: string;
}

export default function CheckInReportSummary({
  report,
  loading,
  isAdmin,
  eventSlug = 'evento',
}: CheckInReportSummaryProps) {
  const handleExportCSV = () => {
    if (!report) return;
    exportCheckInCSV(report);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonRow}>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📊</span>
          <p className={styles.emptyText}>Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  // Calcular percentual de presença
  const total = report.summary.total;
  const presentes = report.summary.checkedIn;
  const ausentes = report.summary.notCheckedIn;
  const presenca = total > 0 ? Math.round((presentes / total) * 100) : 0;

  return (
    <div className={styles.slimContainer}>
      <div className={styles.slimRow}>
        <span className={styles.slimItem}>Total - <b>{total}</b></span>
        <span className={styles.slimItem}>Presentes - <b>{presentes}</b></span>
        <span className={styles.slimItem}>Ausentes - <b>{ausentes}</b></span>
        <span className={styles.slimItem}>Presença <b>{presenca}%</b></span>
        {isAdmin && (
          <button
            className={styles.slimExportButton}
            onClick={handleExportCSV}
            type="button"
            title="Exportar relatório em CSV"
            aria-label="Exportar relatório"
          >
            Exportar CSV
          </button>
        )}
      </div>
    </div>
  );
}
