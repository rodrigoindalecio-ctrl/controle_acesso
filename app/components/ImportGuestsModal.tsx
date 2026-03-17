"use client";

import React, { useEffect, useRef, useState } from 'react';
import styles from './ImportGuestsModal.module.css';
import ImportPreviewTable from './ImportPreviewTable';
import ImportSummary from './ImportSummary';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/app/lib/context/ToastContext';

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
  const toast = useToast();
  const [open, setOpen] = useState(isOpen);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validateResult, setValidateResult] = useState<ValidateResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
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
      toast.error(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = async () => {
    if (!strategy) {
      toast.error('Selecione uma estratégia para duplicados');
      return;
    }

    if (!validateResult) {
      toast.error('Dados de validação não encontrados. Refaça o upload do arquivo.');
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
      table_number: guest.table_number,
      is_staff: guest.is_staff === 'Sim' || guest.is_staff === true
    });

    const guests = [...(validateResult.data.valid || []), ...(validateResult.data.duplicates || [])]
      .map(pickGuestFields)
      .filter((g) => typeof g.full_name === 'string' && g.full_name.trim().length > 0);

    if (guests.length === 0) {
      toast.error('Nenhum convidado válido para importar. Verifique o arquivo ou baixe o CSV de erros.');
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
      toast.success(`Importação concluída: ${json?.summary?.created || 0} criados, ${json?.summary?.updated || 0} atualizados, ${json?.summary?.skipped || 0} ignorados`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao confirmar');
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

                    {/* Sugestão de Duplicados Inteligente */}
                    {validateResult.summary.duplicates > 0 ? (
                      <div 
                        style={{ 
                          background: '#fff9f0', 
                          border: '1px solid #ffcc80', 
                          padding: '1.25rem', 
                          borderRadius: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#ffa726', color: 'white', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#663c00', fontWeight: 'bold' }}>
                              Detectamos {validateResult.summary.duplicates} convidados já cadastrados
                            </h4>
                            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#8d5d00' }}>
                              Escolha como deseja prosseguir com eles:
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => setStrategy('ignore')}
                            style={{
                              flex: 1,
                              padding: '0.75rem',
                              borderRadius: '12px',
                              border: strategy === 'ignore' ? '2px solid #7b2d3d' : '2px solid #ddd',
                              background: strategy === 'ignore' ? '#fcf8f9' : 'white',
                              color: strategy === 'ignore' ? '#7b2d3d' : '#666',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span style={{ fontSize: '0.95rem' }}>Manter atuais</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8 }}>Ignora os dados da planilha</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setStrategy('update')}
                            style={{
                              flex: 1,
                              padding: '0.75rem',
                              borderRadius: '12px',
                              border: strategy === 'update' ? '2px solid #7b2d3d' : '2px solid #ddd',
                              background: strategy === 'update' ? '#fcf8f9' : 'white',
                              color: strategy === 'update' ? '#7b2d3d' : '#666',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span style={{ fontSize: '0.95rem' }}>Atualizar dados</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8 }}>Sobrescreve com a planilha</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Se não houver duplicados, não precisa mostrar as opções, mas mantemos o estado 'ignore' por padrão
                      <div style={{ padding: '0.5rem', color: '#666', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Nenhum duplicado detectado. Pronto para importar.
                      </div>
                    )}

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
