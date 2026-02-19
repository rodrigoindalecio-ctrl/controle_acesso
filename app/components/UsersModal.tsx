'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from './UsersModal.module.css';
import btn from '@/lib/buttons.module.css';
import ConfirmDialog from '@/app/components/ConfirmDialog';

type Role = 'ADMIN' | 'USER';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsersModal({ isOpen, onClose }: UsersModalProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; email: string } | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadUsers();
  }, [isOpen, loadUsers]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await fetch(`/api/admin/users/${deleteConfirm.id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      loadUsers();
    } catch (err) {
      setError('Erro ao excluir usuário');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>👥 Usuários</h2>
          <button onClick={onClose}>×</button>
        </div>
        <div className={styles.content}>
          {loading ? <p>Carregando...</p> : (
            <table className={styles.table}>
              <thead><tr><th>Nome</th><th>Email</th><th>Ações</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <button className={btn['btn--danger']} onClick={() => setDeleteConfirm({ id: u.id, email: u.email })}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          title="Excluir Usuário"
          message={`Confirmar exclusão de ${deleteConfirm?.email}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      </div>
    </div>
  );
}
