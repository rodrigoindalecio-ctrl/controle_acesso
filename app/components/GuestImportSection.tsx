'use client';

import { useState } from 'react';
import styles from './GuestImportSection.module.css';
import GuestImportUpload from './GuestImportUpload';
import GuestImportValidationPreview from './GuestImportValidationPreview';
import GuestImportConfirmation from './GuestImportConfirmation';

type ImportStep = 'upload' | 'validating' | 'preview' | 'confirming' | 'success';

interface ValidateResponse {
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
  data: {
    valid: any[];
    invalid: any[];
    duplicates: any[];
  };
  errorCSV?: string;
}

interface ConfirmResponse {
  message: string;
  summary: {
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  results: any[];
  timestamp: string;
}

interface GuestImportSectionProps {
  eventId: string;
  onImportSuccess?: () => void;
}

export default function GuestImportSection({ eventId, onImportSuccess }: GuestImportSectionProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationData, setValidationData] = useState<ValidateResponse | null>(null);
  const [confirmData, setConfirmData] = useState<ConfirmResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

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

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const isCSV = file.name.endsWith('.csv');
    const isXLSX = file.name.endsWith('.xlsx');

    if (!isCSV && !isXLSX) {
      setError('Por favor, selecione um arquivo XLSX ou CSV válido');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  // Validate file
  const handleValidate = async () => {
    if (!selectedFile) {
      setError('Nenhum arquivo selecionado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('eventId', eventId);

      const response = await fetch('/api/guests/import/validate', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data: ValidateResponse = await response.json();

      if (!response.ok) {
        throw new Error(buildApiErrorMessage(data as any, 'Erro ao validar arquivo'));
      }

      setValidationData(data);
      setStep('preview');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao validar arquivo';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm import
  const handleConfirm = async () => {
    if (!validationData) {
      setError('Erro: dados de validação não encontrados');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Monta payload apenas com os campos usados pela API,
      // ignorando metadados (id, status, row, etc.).
      // Importante: inclui também "duplicates" para permitir atualizar/ignorar/marcar
      // convidados já existentes (caso contrário, pode enviar guests vazio e falhar).
      const pickGuestFields = (guest: any) => ({
        full_name: guest.full_name,
        category: guest.category,
        phone: guest.phone,
        notes: guest.notes,
        table_number: guest.table_number
      });

      const guests = [...(validationData.data.valid || []), ...(validationData.data.duplicates || [])]
        .map(pickGuestFields)
        .filter((g) => typeof g.full_name === 'string' && g.full_name.trim().length > 0);

      if (guests.length === 0) {
        setError('Nenhum convidado válido para importar. Verifique o arquivo ou baixe o CSV de erros.');
        return;
      }

      const response = await fetch('/api/guests/import/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId,
          guests,
          duplicateStrategy: 'update'
        }),
        credentials: 'include'
      });

      const data: ConfirmResponse = await response.json();

      if (!response.ok) {
        throw new Error(buildApiErrorMessage(data as any, 'Erro ao confirmar importação'));
      }

      setConfirmData(data);
      setStep('success');

      // Call callback after success
      if (onImportSuccess) {
        setTimeout(onImportSuccess, 500);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao confirmar importação';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Go back to upload
  const handleGoBack = () => {
    setStep('upload');
    setSelectedFile(null);
    setValidationData(null);
    setError(null);
  };

  // Reset for new import
  const handleCloseSuccess = () => {
    setStep('upload');
    setSelectedFile(null);
    setValidationData(null);
    setConfirmData(null);
    setError(null);
  };

  // Export guests list
  const handleExport = async () => {
    setExportLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/guests/export?eventId=${eventId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao exportar lista de convidados');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'convidados.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao exportar lista';
      setError(message);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className={styles.importSection}>
      {error && (
        <div className={styles.globalError}>
          <span className={styles.errorIcon}>❌</span>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className={styles.closeError}
            aria-label="Fechar erro"
          >
            ✕
          </button>
        </div>
      )}

      {exportSuccess && (
        <div className={styles.globalSuccess}>
          <span className={styles.successIcon}>✅</span>
          <span>Lista de convidados exportada com sucesso!</span>
          <button
            onClick={() => setExportSuccess(false)}
            className={styles.closeSuccess}
            aria-label="Fechar mensagem"
          >
            ✕
          </button>
        </div>
      )}

      {step === 'upload' && (
        <GuestImportUpload
          file={selectedFile}
          onFileSelect={handleFileSelect}
          onValidate={handleValidate}
          isLoading={loading}
          error={error || ''}
        />
      )}

      {step === 'preview' && validationData && (
        <GuestImportValidationPreview
          validationData={validationData}
          onConfirm={handleConfirm}
          onGoBack={handleGoBack}
          isLoading={loading}
        />
      )}

      {step === 'success' && confirmData && (
        <GuestImportConfirmation
          confirmData={confirmData}
          onClose={handleCloseSuccess}
        />
      )}
    </div>
  );
}
