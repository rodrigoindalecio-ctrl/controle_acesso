'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from './UsersModal.module.css';
import btn from '@/lib/buttons.module.css';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import LogsModal from '@/app/components/LogsModal';
import EditUserModal from '@/app/components/EditUserModal';
import AdminChangePasswordModal from '@/app/components/AdminChangePasswordModal';
import CreateUserModal from '@/app/components/CreateUserModal';

type Role = 'ADMIN' | 'USER';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  justification?: string;
  ip?: string;
  userAgent?: string;
  created_at: string;
}

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsersModal({ isOpen, onClose }: UsersModalProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [logsModalOpen, setLogsModalOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !q.trim() ||
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, q, roleFilter]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao carregar usuários');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserAuditLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      setLogsError('');
      const params = new URLSearchParams();
      params.set('entityType', 'User');
      params.set('limit', '50');

      const res = await fetch(`/api/audit?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as any));
        throw new Error(body.error || body.message || 'Erro ao carregar logs');
      }
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadUsers();
    }
  }, [isOpen, loadUsers]);

  useEffect(() => {
    if (!isOpen) {
      setQ('');
      setRoleFilter('');
      setError('');
    }
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !createModalOpen && !editingUser && !passwordUser && !deleteConfirm && !logsModalOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, createModalOpen, editingUser, passwordUser, deleteConfirm, logsModalOpen]);

  const openLogsModal = () => {
    setLogsModalOpen(true);
    void loadUserAuditLogs();
  };

  const handleCreateUser = async (data: { name: string; email: string; password: string; role: Role }) => {
    try {
      setIsCreating(true);
      setError('');

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao criar usuário');
      }

      setCreateModalOpen(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (u: AdminUser) => {
    setEditingUser(u);
  };

  const saveEdit = async (data: { name: string; email: string; role: Role }) => {
    if (!editingUser) return;
    try {
      setIsSavingEdit(true);
      setError('');

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao salvar alterações');
      }

      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const savePassword = async (newPassword: string) => {
    if (!passwordUser) return;
    try {
      setIsSavingPassword(true);
      setError('');
      const res = await fetch(`/api/admin/users/${passwordUser.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao alterar senha');
      }
      setPasswordUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const confirmDelete = (u: AdminUser) => {
    setDeleteConfirm({ id: u.id, email: u.email });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeleting(true);
      setError('');
      const res = await fetch(`/api/admin/users/${deleteConfirm.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao excluir usuário');
      }
      setDeleteConfirm(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>👥 Usuários</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Filtros */}
          <div className={styles.filterRow}>
            <div className={styles.filterFields}>
              <div className={styles.field}>
                <label className={styles.label}>Buscar</label>
                <input
                  className={styles.input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nome ou email"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Papel</label>
                <select
                  className={styles.select}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as Role | '')}
                >
                  <option value="">Todos</option>
                  <option value="USER">Usuário</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className={styles.filterActions}>
              <button
                type="button"
                className={`${btn.btn} ${btn['btn--primary']} ${btn['btn--sm']}`}
                onClick={() => setCreateModalOpen(true)}
              >
                ➕ Criar
              </button>
              <button
                type="button"
                className={`${btn.btn} ${btn['btn--secondary']} ${btn['btn--sm']}`}
                onClick={openLogsModal}
              >
                🧾 Logs
              </button>
              <button
                type="button"
                className={`${btn.btn} ${btn['btn--secondary']} ${btn['btn--sm']}`}
                onClick={loadUsers}
                disabled={loading}
              >
                ↻
              </button>
            </div>
          </div>

          <span className={styles.filterCount}>
            {loading ? 'Carregando...' : `${filteredUsers.length} usuário(s)`}
          </span>

          {/* Tabela */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Papel</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td data-label="Nome">{u.name}</td>
                    <td data-label="Email">{u.email}</td>
                    <td data-label="Papel">{u.role === 'ADMIN' ? '👑 ADMIN' : '👤 USER'}</td>
                    <td data-label="Ações">
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={`${btn.btn} ${btn['btn--secondary']} ${btn['btn--sm']}`}
                          onClick={() => startEdit(u)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`${btn.btn} ${btn['btn--ghost']} ${btn['btn--sm']}`}
                          onClick={() => setPasswordUser(u)}
                        >
                          Senha
                        </button>
                        <button
                          type="button"
                          className={`${btn.btn} ${btn['btn--danger']} ${btn['btn--sm']}`}
                          onClick={() => confirmDelete(u)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <CreateUserModal
          isOpen={createModalOpen}
          isCreating={isCreating}
          onCreate={handleCreateUser}
          onClose={() => setCreateModalOpen(false)}
        />

        <EditUserModal
          isOpen={!!editingUser}
          user={editingUser}
          isSaving={isSavingEdit}
          onSave={saveEdit}
          onClose={() => setEditingUser(null)}
        />

        <AdminChangePasswordModal
          isOpen={!!passwordUser}
          userEmail={passwordUser?.email || ''}
          isSaving={isSavingPassword}
          onSave={savePassword}
          onClose={() => setPasswordUser(null)}
        />

        <ConfirmDialog
          isOpen={!!deleteConfirm}
          title="Excluir usuário"
          message={deleteConfirm ? `Tem certeza que deseja excluir o usuário ${deleteConfirm.email}?` : ''}
          confirmText="Excluir"
          cancelText="Cancelar"
          isDangerous
          isLoading={isDeleting}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={handleConfirmDelete}
        />

        <LogsModal
          isOpen={logsModalOpen}
          title="Logs de Usuários"
          logs={auditLogs}
          loading={logsLoading}
          error={logsError}
          onClose={() => setLogsModalOpen(false)}
          onRefresh={loadUserAuditLogs}
        />
      </div>
    </div>
  );
}
