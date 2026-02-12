'use client';

import React, { useState, useEffect } from 'react';
import styles from './EditUserModal.module.css';
import btn from '../../lib/buttons.module.css';

type Role = 'ADMIN' | 'USER';

interface CreateUserModalProps {
  isOpen: boolean;
  isCreating: boolean;
  onCreate: (data: { name: string; email: string; password: string; role: Role }) => Promise<void>;
  onClose: () => void;
}

export default function CreateUserModal({
  isOpen,
  isCreating,
  onCreate,
  onClose
}: CreateUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('USER');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setRole('USER');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    await onCreate({ name, email, password, role });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>➕ Criar Usuário</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">✕</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
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
              <label className={styles.label}>Nome</label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do usuário"
                autoComplete="name"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Senha</label>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Papel</label>
              <select
                className={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              className={`${btn.btn} ${btn['btn--secondary']}`}
              onClick={onClose}
              disabled={isCreating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${btn.btn} ${btn['btn--primary']} ${isCreating ? btn['is-loading'] : ''}`}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <span className={btn['btn__spinner']} aria-hidden="true" />
                  Criando...
                </>
              ) : (
                'Criar'
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
