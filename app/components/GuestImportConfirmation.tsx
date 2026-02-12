 'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './GuestImportConfirmation.module.css';

interface ImportResultItem {
  full_name: string;
  normalizedName: string;
  action: 'created' | 'updated' | 'skipped' | 'marked' | 'failed';
  reason?: string;
  guestId?: string;
}

interface ConfirmResponse {
  message: string;
  summary: {
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  results: ImportResultItem[];
  timestamp: string;
}

interface GuestImportConfirmationProps {
  confirmData: ConfirmResponse;
  onClose: () => void;
}

type FilterKey = 'all' | 'created' | 'updated' | 'skipped' | 'failed';

export default function GuestImportConfirmation({ confirmData, onClose }: GuestImportConfirmationProps) {
  const { summary, results } = confirmData;
  const [filter, setFilter] = useState<FilterKey>('all');
  const [exporting, setExporting] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [highlight, setHighlight] = useState(false);

  // Auto-scroll to results and highlight when component mounts
  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 1800);
      return () => clearTimeout(t);
    }
  }, []);

  const filteredResults = useMemo(() => {
    if (filter === 'all') return results;
    return results.filter((r) => {
      if (filter === 'created') return r.action === 'created';
      if (filter === 'updated') return r.action === 'updated';
      if (filter === 'skipped') return r.action === 'skipped';
      if (filter === 'failed') return r.action === 'failed';
      return true;
    });
  }, [filter, results]);

  const quickSummary = `${summary.created} criados · ${summary.updated} atualizados · ${summary.skipped} ignorados · ${summary.failed} com erro`;

  const getActionLabel = (action: ImportResultItem['action']) => {
    switch (action) {
      case 'created':
        return 'Criado';
      case 'updated':
        return 'Atualizado';
      case 'skipped':
        return 'Ignorado';
      case 'marked':
        return 'Marcado (duplicado)';
      case 'failed':
        return 'Erro';
      default:
        return action;
    }
  };

  const getActionBadge = (action: ImportResultItem['action']) => {
    const baseClass = styles.badge;
    const actionClass = styles[`badge-${action}`] || '';
    return `${baseClass} ${actionClass}`;
  };

  // Export filtered results to XLSX using existing layout (same columns as main export)
  const handleExportFiltered = async (type: 'errors' | 'ignored' | 'all') => {
    setExporting(true);
    try {
      const XLSX = (await import('xlsx')) as typeof import('xlsx');

      const rows: (string | number)[][] = [];
      // Header same as standard export
      rows.push(['Nome completo', 'Categoria', 'Mesa', 'Status']);

      const toExport = type === 'errors' ? results.filter(r => r.action === 'failed') : type === 'ignored' ? results.filter(r => r.action === 'skipped') : filteredResults;

      for (const r of toExport) {
        // We only have name + action/reason from results; keep other cols blank
        const statusMap: Record<ImportResultItem['action'], string> = {
          created: 'importado',
          updated: 'atualizado',
          skipped: 'ignorado',
          marked: 'marcado',
          failed: 'erro'
        };

        rows.push([
          r.full_name,
          '', // category unknown in results
          '', // table
          statusMap[r.action] || r.action
        ]);
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);

      // column widths
      const maxLen = (arr: (string | number)[][], ci: number) => Math.max(...arr.map(row => row[ci] ? String(row[ci]).length : 0));
      const cols = rows[0].map((_, ci) => ({ wch: Math.max(12, Math.min(45, maxLen(rows, ci) + 2)) }));
      type WorkSheetWithCols = import('xlsx').WorkSheet & { '!cols'?: { wch?: number }[] };
      (ws as WorkSheetWithCols)['!cols'] = cols;

      XLSX.utils.book_append_sheet(wb, ws, 'Convidados');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = type === 'errors' ? 'erros' : type === 'ignored' ? 'ignorados' : 'todos';
      a.download = `convidados_${suffix}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro exportando XLSX:', err);
      // graceful: no UI changes beyond console; parent handles UX errors
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${highlight ? styles.highlight : ''}`} ref={resultsRef}>
        <div className={styles.header}>
          <h2>✅ Importação Concluída</h2>
          <p className={styles.timestamp}>{new Date(confirmData.timestamp).toLocaleString('pt-BR')}</p>
        </div>

        {/* Summary Cards */}
        <div className={styles.summaryGrid}>
          <div className={`${styles.summaryCard} ${styles.created}`}>
            <div className={styles.icon}>➕</div>
            <div className={styles.summaryContent}>
              <div className={styles.label}>Criados</div>
              <div className={styles.value}>{summary.created}</div>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.updated}`}>
            <div className={styles.icon}>✏️</div>
            <div className={styles.summaryContent}>
              <div className={styles.label}>Atualizados</div>
              <div className={styles.value}>{summary.updated}</div>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.skipped}`}>
            <div className={styles.icon}>⊘</div>
            <div className={styles.summaryContent}>
              <div className={styles.label}>Ignorados</div>
              <div className={styles.value}>{summary.skipped}</div>
            </div>
          </div>

          <div className={`${styles.summaryCard} ${styles.failed}`}>
            <div className={styles.icon}>❌</div>
            <div className={styles.summaryContent}>
              <div className={styles.label}>Com Erro</div>
              <div className={styles.value}>{summary.failed}</div>
            </div>
          </div>
        </div>

        {/* Human-friendly quick summary */}
        <div className={styles.quickSummary}>{quickSummary}</div>

        {/* Filters + Export Buttons */}
        <div className={styles.controls}>
          <div className={styles.tabs} role="tablist" aria-label="Filtros de resultados">
            {(['all','created','updated','skipped','failed'] as FilterKey[]).map(k => (
              <button
                key={k}
                role="tab"
                aria-selected={filter === k}
                className={`${styles.tab} ${filter === k ? styles.tabActive : ''}`}
                onClick={() => setFilter(k)}
                type="button"
              >
                {k === 'all' ? 'Todos' : k === 'created' ? 'Criados' : k === 'updated' ? 'Atualizados' : k === 'skipped' ? 'Ignorados' : 'Erros'}
              </button>
            ))}
          </div>

          <div className={styles.exportButtons}>
            <button className={styles.smallButton} onClick={() => handleExportFiltered('errors')} disabled={exporting || summary.failed===0}>
              {exporting ? 'Gerando...' : 'Baixar erros (.xlsx)'}
            </button>
            <button className={styles.smallButton} onClick={() => handleExportFiltered('ignored')} disabled={exporting || summary.skipped===0}>
              {exporting ? 'Gerando...' : 'Baixar ignorados (.xlsx)'}
            </button>
            <button className={styles.smallOutline} onClick={() => handleExportFiltered('all')} disabled={exporting || results.length===0}>
              {exporting ? 'Gerando...' : 'Baixar tudo (.xlsx)'}
            </button>
          </div>
        </div>

        {/* Detailed Results Table */}
        <div className={styles.tableSection}>
          <h3>📊 Detalhes da Importação</h3>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome Original</th>
                  <th>Nome Normalizado</th>
                  <th>Ação</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result, idx) => (
                  <tr key={idx} className={`${styles.row} ${styles[`row-${result.action}`]}`}>
                    <td className={styles.originalName}>{result.full_name}</td>
                    <td className={styles.normalizedName}>{result.normalizedName || '—'}</td>
                    <td>
                      <span className={getActionBadge(result.action)}>{getActionLabel(result.action)}</span>
                    </td>
                    <td className={styles.reason}>{result.reason ? <span className={styles.reasonText}>{result.reason}</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredResults.length > 100 && (
            <div className={styles.note}>Mostrando os primeiros 100 registros. Total: {filteredResults.length}</div>
          )}
        </div>

        {/* Close Button */}
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.closeButton}>Fechar e Voltar</button>
        </div>
      </div>
    </div>
  );
}
