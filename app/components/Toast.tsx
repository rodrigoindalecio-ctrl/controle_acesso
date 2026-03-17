"use client";

import React, { useEffect, useState } from 'react';
import styles from './Toast.module.css';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className={styles.icon} />;
      case 'error': return <AlertCircle className={styles.icon} />;
      case 'warning': return <AlertTriangle className={styles.icon} />;
      default: return <Info className={styles.icon} />;
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exit : ''}`} role="alert">
      <div className={styles.iconContainer}>{getIcon()}</div>
      <div className={styles.message}>{message}</div>
      <button onClick={handleClose} className={styles.closeBtn} aria-label="Fechar">
        <X size={18} />
      </button>
    </div>
  );
}
