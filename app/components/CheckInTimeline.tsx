/**
 * P4.2: Timeline Operacional de Check-in
 * Exibe check-ins agrupados por hora com visualização simples
 */

'use client';

import React from 'react';
import styles from './CheckInTimeline.module.css';
import cardStyles from '@/lib/cards.module.css';
import { CheckInReport } from '@/lib/report/generateCheckInReport';

interface CheckInTimelineProps {
  report: CheckInReport | null;
  loading: boolean;
}

export default function CheckInTimeline({
  report,
  loading,
}: CheckInTimelineProps) {
  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Timeline</h3>
        <div className={styles.skeletonList}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      </div>
    );
  }

  if (!report || report.timeline.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Timeline</h3>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Nenhum check-in registrado</p>
        </div>
      </div>
    );
  }

  // Encontrar máximo para escala da barra
  const maxCount = Math.max(...report.timeline.map((t) => t.count));

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Timeline por Hora</h3>
      <div className={styles.list}>
        {report.timeline.map(({ hour, count }) => {
          const percentage = (count / maxCount) * 100;

          return (
            <div key={hour} className={`${styles.item} ${cardStyles.cardSoft}`}>
              <div className={styles.hour}>{hour}</div>
              <div className={styles.barContainer}>
                <div
                  className={styles.bar}
                  style={{ width: `${Math.max(percentage, 3)}%` }}
                  title={`${count} check-ins`}
                />
              </div>
              <div className={styles.count}>{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
