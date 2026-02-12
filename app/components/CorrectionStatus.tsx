'use client';

import { useState } from 'react';
import styles from './CorrectionStatus.module.css';

interface Correction {
  correctedAt: string;
  correctedBy: string;
  justification: string;
}

interface CorrectionStatusProps {
  isCorrected: boolean;
  correction?: Correction;
}

export function CorrectionStatus({ isCorrected, correction }: CorrectionStatusProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isCorrected) {
    return (
      <span className={styles.statusNormal} title="Check-in confirmado normalmente">
        ✔
      </span>
    );
  }

  return (
    <div className={styles.container}>
      <span
        className={styles.statusCorrected}
        title="Presença foi corrigida"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        ⚠
      </span>

      {showTooltip && correction && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipContent}>
            <div className={styles.title}>Presença Corrigida</div>
            <div className={styles.detail}>
              <strong>Motivo:</strong> {correction.justification}
            </div>
            <div className={styles.detail}>
              <strong>Corrigido em:</strong>{' '}
              {new Date(correction.correctedAt).toLocaleString('pt-BR')}
            </div>
            <div className={styles.detail}>
              <strong>Corrigido por:</strong> {correction.correctedBy}
            </div>
          </div>
          <div className={styles.arrow}></div>
        </div>
      )}
    </div>
  );
}
