'use client';

import React, { useState, useEffect } from 'react';
import styles from './EditUserModal.module.css';
import btn from '../../lib/buttons.module.css';

type Role = 'ADMIN' | 'USER';

interface EditUserModalProps {
  isOpen: boolean;
  user: { id: string; name: string; email: string; role: Role } | null;
  isSaving: boolean;
  onSave: (data: { name: string; email: string; role: Role }) => Promise<void>;
  onClose: () => void;
}

export default function EditUserModal({
  isOpen,
  user,
  isSaving,
  onSave,
  onClose
}: EditUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('USER');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || 'USER');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name, email, role });
  };

  if (!isOpen || !user) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>✏️ Editar Usuário</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">✕</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
            <div className={styles.field}>
              <label className={styles.label}>Nome</label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do usuário"
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
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${btn.btn} ${btn['btn--primary']} ${isSaving ? btn['is-loading'] : ''}`}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className={btn['btn__spinner']} aria-hidden="true" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
