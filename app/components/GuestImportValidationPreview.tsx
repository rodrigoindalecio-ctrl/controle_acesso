'use client';

import React from 'react';
import styles from './GuestImportValidationPreview.module.css';

interface ValidationResult {
  full_name: string;
  category?: string;
  phone?: string;
  notes?: string;
  table_number?: string;
  status: 'novo' | 'duplicado' | 'erro';
  error?: string;
}

interface ValidateResponse {
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
  data: {
    valid: ValidationResult[];
    invalid: ValidationResult[];
    duplicates: ValidationResult[];
  };
  errorCSV?: string;
}

interface GuestImportValidationPreviewProps {
  validationData: ValidateResponse;
  onConfirm: () => Promise<void>;
  onGoBack: () => void;
  isLoading: boolean;
}

export default function GuestImportValidationPreview({
  validationData,
  onConfirm,
  onGoBack,
  isLoading
}: GuestImportValidationPreviewProps) {
  const { summary, data } = validationData;
  const hasErrors = summary.invalid > 0;

  const allRows = [
    ...data.valid.map((r) => ({
      ...r,
      status: 'novo' as const,
      error: undefined
    })),
    ...data.duplicates.map((r) => ({
      ...r,
      status: 'duplicado' as const,
      error: undefined
    })),
    ...data.invalid.map((r) => ({
      ...r,
      status: 'erro' as const,
      error: r.error || 'Dados inválidos'
    }))
  ];

  const getStatusBadge = (status: string, error?: string) => {
    switch (status) {
      case 'novo':
        return <span className={`${styles.badge} ${styles.novo}`}>✓ OK</span>;
      case 'duplicado':
        return <span className={`${styles.badge} ${styles.duplicado}`}>⚠ Duplicado</span>;
      case 'erro':
        return <span className={`${styles.badge} ${styles.erro}`}>✗ Erro</span>;
      default:
        return <span className={styles.badge}>?</span>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3>📋 Preview de Importação</h3>

        {/* Summary Stats */}
        <div className={styles.summary}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Total</div>
            <div className={styles.statValue}>{summary.total}</div>
          </div>
          <div className={`${styles.stat} ${styles.valid}`}>
            <div className={styles.statLabel}>Válidos</div>
            <div className={styles.statValue}>{summary.valid}</div>
          </div>
          <div className={`${styles.stat} ${styles.duplicate}`}>
            <div className={styles.statLabel}>Duplicados</div>
            <div className={styles.statValue}>{summary.duplicates}</div>
          </div>
          <div className={`${styles.stat} ${styles.invalid}`}>
            <div className={styles.statLabel}>Erros</div>
            <div className={styles.statValue}>{summary.invalid}</div>
          </div>
        </div>

        {/* Warning if there are errors */}
        {hasErrors && (
          <div className={styles.warning}>
            <strong>⚠ Atenção:</strong> Há {summary.invalid} linha(s) com erro. Corrija antes de confirmar.
          </div>
        )}

        {/* Preview Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Mesa</th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`${styles.row} ${styles[`row-${row.status}`]}`}
                >
                  <td className={styles.statusCell}>
                    {getStatusBadge(row.status, row.error)}
                    {row.error && (
                      <div className={styles.errorMessage}>{row.error}</div>
                    )}
                  </td>
                  <td>{row.full_name}</td>
                  <td>{row.category || '—'}</td>
                  <td>{row.table_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {allRows.length > 100 && (
          <div className={styles.note}>
            Mostrando os primeiros 100 registros. Total: {allRows.length}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            onClick={onGoBack}
            disabled={isLoading}
            className={styles.backButton}
          >
            ← Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || hasErrors}
            className={styles.confirmButton}
            title={hasErrors ? 'Corrija os erros antes de confirmar' : 'Confirmar importação'}
          >
            {isLoading ? 'Importando...' : 'Confirmar importação'}
          </button>
        </div>

        {hasErrors && (
          <div className={styles.disabledHint}>
            ℹ Você precisa corrigir os erros no arquivo antes de confirmar
          </div>
        )}
      </div>
    </div>
  );
}
