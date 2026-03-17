'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import styles from './not-found.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('System Error:', error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Image
            src="/logo-vb.png"
            alt="VB Assessoria"
            width={180}
            height={60}
            priority
          />
        </div>
        <h1 className={`${styles.title} ${styles.errorTitle}`}>500</h1>
        <h2 className={styles.subtitle}>Ocorreu um Erro Inesperado</h2>
        <p className={styles.message}>
          Lamentamos, mas não foi possível processar sua solicitação agora.
          {error.message && (
            <code className={styles.errorCode}>
              {error.digest ? `ID do Erro: ${error.digest}` : error.message}
            </code>
          )}
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button onClick={() => reset()} className={styles.button}>
            Tentar Novamente
          </button>
          <a href="/dashboard" className={`${styles.button} ${styles.secondaryButton}`}>
            Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  );
}
