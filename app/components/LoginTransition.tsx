'use client';

import Image from 'next/image';
import styles from './LoginTransition.module.css';

interface LoginTransitionProps {
  onComplete?: () => void;
}

export default function LoginTransition({ onComplete }: LoginTransitionProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <Image
            src="/logo-vb.png"
            alt="VB Assessoria"
            width={200}
            height={60}
            priority
            className={styles.logo}
          />
        </div>
        
        <div className={styles.progressContainer}>
          <div className={styles.progressBar} onAnimationEnd={onComplete} />
        </div>
        
        <p className={styles.text}>Entrando...</p>
      </div>
    </div>
  );
}
