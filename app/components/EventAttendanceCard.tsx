'use client';

import React, { useMemo } from 'react';
import styles from './EventAttendanceCard.module.css';

interface EventAttendanceCardProps {
  checkedIn: number;
  total: number;
  pending: number;
}

export default function EventAttendanceCard({
  checkedIn,
  total,
  pending
}: EventAttendanceCardProps) {
  const attendancePercentage = useMemo(() => {
    if (total === 0) return 0;
    return Math.round((checkedIn / total) * 100);
  }, [checkedIn, total]);

  const circumference = 2 * Math.PI * 45; // radius = 45px
  const strokeDashoffset = circumference - (attendancePercentage / 100) * circumference;

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3>Presença</h3>
        </div>

        <div className={styles.chartContainer}>
          <svg className={styles.chart} viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="45"
              className={styles.chartBg}
            />

            {/* Progress circle - Green to Bordô gradient */}
            <defs>
              <linearGradient id="attendanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6ba583" />
                <stop offset="100%" stopColor="#7b2d3d" />
              </linearGradient>
            </defs>

            <circle
              cx="60"
              cy="60"
              r="45"
              className={styles.chartProgress}
              style={{
                strokeDashoffset
              }}
              stroke="url(#attendanceGradient)"
            />
          </svg>

          {/* Center text */}
          <div className={styles.chartText}>
            <div className={styles.percentage}>{attendancePercentage}%</div>
            <div className={styles.label}>presença</div>
          </div>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: '#6ba583' }}></div>
            <span>Presente ({checkedIn})</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: '#ff5252' }}></div>
            <span>Ausente ({pending})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
