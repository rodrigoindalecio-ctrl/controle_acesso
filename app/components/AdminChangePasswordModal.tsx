'use client';

import React, { useState, useEffect } from 'react';
import styles from './EditUserModal.module.css';
import btn from '../../lib/buttons.module.css';

interface AdminChangePasswordModalProps {
  isOpen: boolean;
  userEmail: string;
  isSaving: boolean;
  onSave: (newPassword: string) => Promise<void>;
  onClose: () => void;
}

export default function AdminChangePasswordModal({
  isOpen,
  userEmail,
  isSaving,
  onSave,
  onClose
}: AdminChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    await onSave(newPassword);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>🔐 Alterar Senha</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">✕</button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.content}>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              Alterando senha do usuário: <strong>{userEmail}</strong>
            </p>

            {error && (
              <div style={{
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#c33',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Nova Senha</label>
              <input
                className={styles.input}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Confirmar Senha</label>
              <input
                className={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              className={`${btn.btn} ${btn['btn--secondary']}`}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${btn.btn} ${btn['btn--primary']} ${isSaving ? btn['is-loading'] : ''}`}
              disabled={isSaving || newPassword.length < 6}
            >
              {isSaving ? (
                <>
                  <span className={btn['btn__spinner']} aria-hidden="true" />
                  Salvando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
