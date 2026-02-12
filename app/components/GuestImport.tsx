'use client';

import { useState } from 'react';
import styles from './GuestImport.module.css';

interface ImportResponse {
  imported: number;
  skipped: number;
  total: number;
  errors: string[];
}

interface GuestImportProps {
  eventId: string;
}

export default function GuestImport({ eventId }: GuestImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx'))) {
      setFile(selectedFile);
      setError('');
    } else if (selectedFile) {
      setError('Por favor, selecione um arquivo XLSX ou CSV válido');
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Selecione um arquivo CSV');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/events/${eventId}/guests/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Erro ao importar convidados';
        setError(errorMessage);
        // Se houver erros de validação, mostrar junto
        if (data.errors && data.errors.length > 0) {
          setResult({
            imported: data.imported || 0,
            skipped: data.skipped || 0,
            total: (data.imported || 0) + (data.skipped || 0),
            errors: data.errors || []
          });
        }
        return;
      }

      setResult(data);
      setFile(null);
      // Reset input
      const input = document.getElementById('csvFile') as HTMLInputElement;
      if (input) input.value = '';
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3>📥 Importar Convidados</h3>
        <p className={styles.subtitle}>Faça upload de um arquivo CSV</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fileInput}>
            <input
              id="csvFile"
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              disabled={loading}
              className={styles.input}
            />
            <label htmlFor="csvFile" className={styles.label}>
              {file ? `📄 ${file.name}` : 'Selecione um arquivo CSV...'}
            </label>
          </div>

          {error && (
            <div className={styles.error}>
              <div>{error}</div>
              {result && result.errors && result.errors.length > 0 && (
                <div className={styles.errorList}>
                  <p style={{ marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>Detalhes:</p>
                  <ul>
                    {result.errors.slice(0, 10).map((err, i) => (
                      <li key={i} className={styles.errorItem}>
                        {err}
                      </li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>... e mais {result.errors.length - 10} erro(s)</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className={styles.result}>
              <div className={styles.summary}>
                <div className={styles.stat}>
                  <span className={styles.label}>✅ Importados</span>
                  <span className={styles.value}>{result.imported}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>⏭️ Pulados</span>
                  <span className={styles.value}>{result.skipped}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>📊 Total</span>
                  <span className={styles.value}>{result.total}</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className={styles.errorList}>
                  <h4>⚠️ Erros ({result.errors.length})</h4>
                  <ul>
                    {result.errors.map((err, i) => (
                      <li key={i} className={styles.errorItem}>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className={styles.button}
          >
            {loading ? 'Importando...' : 'Importar CSV'}
          </button>
        </form>

        <div className={styles.help}>
          <h4>📋 Formato esperado do XLSX/CSV:</h4>
          <pre>{`full_name,phone,category,table_number,notes
João Silva,11999999999,familia_noiva,A01,Noivo
Maria Santos,11988888888,familia_noivo,A02,Noiva`}</pre>
          <p>
            <strong>Categorias válidas:</strong> familia_noiva, familia_noivo, padrinhos, amigos, vip, outros
          </p>
        </div>
      </div>
    </div>
  );
}
