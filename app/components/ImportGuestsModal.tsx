"use client";

import React, { useEffect, useRef, useState } from 'react';
import styles from './ImportGuestsModal.module.css';
import ImportPreviewTable from './ImportPreviewTable';
import ImportSummary from './ImportSummary';
import { useAuth } from '@/lib/hooks/useAuth';

interface Props {
  eventId: string;
  isAdminOnly?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onImportComplete?: () => void;
}

type ValidateResponse = {
  summary: { total: number; valid: number; invalid: number; duplicates: number };
  data: {
    valid: any[];
    invalid: any[];
    duplicates: any[];
  };
  errorCSV?: string | null;
};

export default function ImportGuestsModal({ eventId, isAdminOnly = true, isOpen = false, onOpenChange, onImportComplete }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(isOpen);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validateResult, setValidateResult] = useState<ValidateResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<'ignore' | 'update' | 'mark'>('ignore');

  const buildApiErrorMessage = (body: any, fallback: string) => {
    const base = body?.message || body?.error || fallback;
    const details = Array.isArray(body?.details) ? body.details : [];
    if (!details.length) return base;

    const formatted = details
      .slice(0, 8)
      .map((d: any) => {
        const path = typeof d?.path === 'string' && d.path.trim().length > 0 ? d.path : 'campo';
        const msg = typeof d?.message === 'string' && d.message.trim().length > 0 ? d.message : 'inválido';
        return `${path}: ${msg}`;
      })
      .join(' | ');

    const suffix = details.length > 8 ? ` | +${details.length - 8}…` : '';
    return `${base} (${formatted}${suffix})`;
  };

  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (authLoading) return null;
  if (isAdminOnly && !user) return null;
  if (isAdminOnly && user?.role !== 'ADMIN') return null;

  const onDrop = async (files: FileList | null) => {
    setDragOver(false);
    if (!files || files.length === 0) return;
    const file = files[0];
    await handleFile(file);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    try {
      // Upload to validate endpoint
      setIsValidating(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('eventId', eventId);

      const res = await fetch('/api/guests/import/validate', {
        method: 'POST',
        body: fd
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(buildApiErrorMessage(body, 'Erro ao validar arquivo'));
      }

      const json = await res.json();
      setValidateResult(json as ValidateResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = async () => {
    if (!strategy) {
      setError('Selecione uma estratégia para duplicados');
      return;
    }

    if (!validateResult) {
      setError('Dados de validação não encontrados. Refaça o upload do arquivo.');
      return;
    }

    // Envia tanto os registros "valid" quanto os "duplicates".
    // Se o arquivo tiver apenas duplicados (ex.: atualização), enviar só "valid"
    // resulta em guests vazio e a API rejeita com "Payload inválido".
    const pickGuestFields = (guest: any) => ({
      full_name: guest.full_name,
      category: guest.category,
      phone: guest.phone,
      notes: guest.notes,
      table_number: guest.table_number
    });

    const guests = [...(validateResult.data.valid || []), ...(validateResult.data.duplicates || [])]
      .map(pickGuestFields)
      .filter((g) => typeof g.full_name === 'string' && g.full_name.trim().length > 0);

    if (guests.length === 0) {
      setError('Nenhum convidado válido para importar. Verifique o arquivo ou baixe o CSV de erros.');
      return;
    }

    setIsConfirming(true);
    try {
      const res = await fetch('/api/guests/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, guests, duplicateStrategy: strategy })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(buildApiErrorMessage(body, 'Erro ao confirmar importação'));
      }

      const json = await res.json();
      // success: call callback
      onImportComplete?.();
      setOpen(false);
      // show simple browser alert for success (could be replaced with toasts)
      alert(`Importação concluída: ${json?.summary?.created || 0} criados, ${json?.summary?.updated || 0} atualizados, ${json?.summary?.skipped || 0} ignorados, ${json?.summary?.failed || 0} falharam`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar');
    } finally {
      setIsConfirming(false);
    }
  };

  const downloadErrorCSV = () => {
    if (!validateResult?.errorCSV) return;
    const blob = new Blob([validateResult.errorCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    // Download template XLSX from server
    fetch('/api/guests/import/template').then(async (r) => {
      if (!r.ok) return;
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_convidados.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }).catch(() => {
      // if endpoint missing, generate small inline sample CSV
      const sample = 'Nome Completo,Categoria,Mesa\nJoão Silva,Convidado,1\n';
      const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_convidados.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <>
      {open && (
        <div className={styles.overlay} ref={overlayRef} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <header className={styles.header}>
              <h2>Importar Convidados</h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className={styles.closeBtn}>✕</button>
            </header>

            <div className={styles.body}>
              {!validateResult ? (
                <div>
                  <div
                    className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
                  >
                    <p>Arraste e solte o arquivo aqui</p>
                    <p>ou</p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={(e) => onDrop(e.target.files)}
                      aria-label="Selecionar arquivo CSV ou XLSX"
                    />
                    <div className={styles.actionsRow}>
                      <button type="button" onClick={downloadTemplate} className={styles.linkBtn}>📥 Baixar modelo XLSX</button>
                      {fileName && <span className={styles.fileName}>{fileName}</span>}
                    </div>
                  </div>
                  {isValidating && <div className={styles.loading}>Validando arquivo…</div>}
                  {error && <div className={styles.error}>{error}</div>}
                </div>
              ) : (
                <div>
                  <ImportSummary summary={validateResult.summary} />
                  <div className={styles.previewSection}>
                    <ImportPreviewTable data={validateResult.data} />
                  </div>

                  <div className={styles.actionsFooter}>
                    {validateResult.errorCSV && (
                      <button className={styles.secondaryBtn} onClick={downloadErrorCSV}>Baixar CSV de erros/duplicados</button>
                    )}

                    <div className={styles.strategyRow}>
                      <label>
                        <input type="radio" name="strategy" value="ignore" checked={strategy === 'ignore'} onChange={() => setStrategy('ignore')} /> Ignorar duplicados
                      </label>
                      <label>
                        <input type="radio" name="strategy" value="update" checked={strategy === 'update'} onChange={() => setStrategy('update')} /> Atualizar convidados existentes
                      </label>
                      <label>
                        <input type="radio" name="strategy" value="mark" checked={strategy === 'mark'} onChange={() => setStrategy('mark')} /> Marcar duplicados
                      </label>
                    </div>

                    <div className={styles.confirmRow}>
                      <button className={styles.cancelBtn} onClick={() => setValidateResult(null)}>Voltar</button>
                      <button
                        className={styles.confirmBtn}
                        disabled={!strategy || isConfirming}
                        onClick={handleConfirm}
                      >
                        {isConfirming ? 'Importando…' : 'Confirmar importação'}
                      </button>
                    </div>
                    {error && <div className={styles.error}>{error}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
