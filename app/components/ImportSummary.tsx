"use client";

import React from 'react';
import styles from './ImportSummary.module.css';

interface Props {
  summary: { total: number; valid: number; invalid: number; duplicates: number };
}

export default function ImportSummary({ summary }: Props) {
  return (
    <div className={styles.summary}>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Total</div>
        <div className={styles.cardValue}>{summary.total}</div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Válidos</div>
        <div className={styles.cardValue}>{summary.valid}</div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Duplicados</div>
        <div className={styles.cardValue}>{summary.duplicates}</div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Inválidos</div>
        <div className={styles.cardValue}>{summary.invalid}</div>
      </div>
    </div>
  );
}
