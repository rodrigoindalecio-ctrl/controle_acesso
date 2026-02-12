'use client';

import React, { useMemo } from 'react';
import styles from './CategoryAttendance.module.css';

interface Guest {
  id: string;
  fullName: string;
  checkedInAt: string | null;
  category?: string;
  tableNumber?: string | null;
}

interface CategoryAttendanceProps {
  guests: Guest[];
}

interface CategoryStats {
  category: string;
  total: number;
  checkedIn: number;
  percentage: number;
}

export default function CategoryAttendance({ guests }: CategoryAttendanceProps) {
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; checkedIn: number }> = {};

    guests.forEach((guest) => {
      const category = guest.category || 'Sem categoria';
      if (!stats[category]) {
        stats[category] = { total: 0, checkedIn: 0 };
      }
      stats[category].total += 1;
      if (guest.checkedInAt) {
        stats[category].checkedIn += 1;
      }
    });

    return Object.entries(stats)
      .map(([category, { total, checkedIn }]) => ({
        category,
        total,
        checkedIn,
        percentage: total === 0 ? 0 : Math.round((checkedIn / total) * 100),
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [guests]);

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Resumo por Categoria</h3>
      <div className={styles.categoryList}>
        {categoryStats.map((cat) => (
          <div key={cat.category} className={styles.categoryRow}>
            <span className={styles.categoryName}>{cat.category}</span>
            
            <span className={styles.categoryCount}>
              {cat.checkedIn} <span className={styles.separator}>/</span> {cat.total}
            </span>
            
            <div className={styles.barSection}>
              <div className={styles.progressBarContainer}>
                <div 
                  className={styles.progressBar}
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
