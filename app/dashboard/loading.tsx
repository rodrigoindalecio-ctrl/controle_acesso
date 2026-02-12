'use client';

import Image from 'next/image';
import styles from '../loading.module.css';

export default function DashboardLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <Image
            src="/logo-vb.png"
            alt="VB Assessoria"
            width={180}
            height={55}
            priority
            className={styles.logo}
          />
        </div>
        <div className={styles.spinner} />
        <p className={styles.text}>Carregando...</p>
      </div>
    </div>
  );
}
