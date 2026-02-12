'use client';

import React, { useRef } from 'react';
import styles from './GuestImportUpload.module.css';

interface GuestImportUploadProps {
  onFileSelect: (file: File) => void;
  onValidate: () => Promise<void>;
  isLoading: boolean;
  file: File | null;
  error: string;
}

export default function GuestImportUpload({
  onFileSelect,
  onValidate,
  isLoading,
  file,
  error
}: GuestImportUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isCSV = selectedFile.name.endsWith('.csv');
    const isXLSX = selectedFile.name.endsWith('.xlsx');

    if (!isCSV && !isXLSX) {
      return; // Error handled by parent
    }

    onFileSelect(selectedFile);
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3>📥 Importar Convidados</h3>
        <p className={styles.subtitle}>
          Carregue um arquivo CSV ou XLSX para adicionar ou atualizar convidados
        </p>

        <div className={styles.uploadArea}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            disabled={isLoading}
            className={styles.hiddenInput}
            aria-label="Selecionar arquivo CSV ou XLSX"
          />

          {!file ? (
            <button
              type="button"
              onClick={handleClick}
              disabled={isLoading}
              className={styles.uploadButton}
            >
              <span className={styles.icon}>📎</span>
              <span>Clique para selecionar arquivo</span>
              <span className={styles.hint}>(CSV ou XLSX)</span>
            </button>
          ) : (
            <div className={styles.fileInfo}>
              <div className={styles.fileIcon}>✅</div>
              <div className={styles.fileDetails}>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileSize}>
                  {(file.size / 1024).toFixed(2)} KB
                </div>
              </div>
              <button
                type="button"
                onClick={handleClick}
                disabled={isLoading}
                className={styles.changeButton}
              >
                Trocar arquivo
              </button>
            </div>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          onClick={onValidate}
          disabled={!file || isLoading}
          className={styles.validateButton}
        >
          {isLoading ? 'Validando...' : 'Validar arquivo'}
        </button>
      </div>
    </div>
  );
}
