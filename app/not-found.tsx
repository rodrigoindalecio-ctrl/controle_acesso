'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './not-found.module.css';

export default function NotFound() {
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
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Página Não Encontrada</h2>
        <p className={styles.message}>
          Ops! Parece que o caminho que você tentou acessar não existe ou foi removido.
        </p>
        <Link href="/dashboard" className={styles.button}>
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
