import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export function LoadingSpinner({
  message = 'Carregando...',
  size = 'medium',
}: LoadingSpinnerProps) {
  return (
    <div className={styles.container}>
      <img src="/logo-vb.png" alt="Logo" style={{ width: 56, height: 56, marginBottom: 16 }} />
      <div className={`${styles.spinner} ${styles[size]}`}></div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
