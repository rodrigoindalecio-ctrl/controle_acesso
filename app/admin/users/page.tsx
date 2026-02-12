'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import cardStyles from '@/lib/cards.module.css';
import btn from '@/lib/buttons.module.css';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import UserMenu from '@/app/components/UserMenu';
import LogsModal from '@/app/components/LogsModal';
import EditUserModal from '@/app/components/EditUserModal';
import AdminChangePasswordModal from '@/app/components/AdminChangePasswordModal';
import CreateUserModal from '@/app/components/CreateUserModal';
import { useAuth } from '@/lib/hooks/useAuth';

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

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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

  const canUsePage = useMemo(() => {
    if (authLoading) return false;
    return user?.role === 'ADMIN';
  }, [user, authLoading]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !q.trim() ||
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, q, roleFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!canUsePage) return;
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUsePage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
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
  };

  const loadUserAuditLogs = async () => {
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
  };

  const openLogsModal = () => {
    setLogsModalOpen(true);
    void loadUserAuditLogs();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
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
      await loadUserAuditLogs();
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
      await loadUserAuditLogs();
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
      await loadUserAuditLogs();
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
      await loadUserAuditLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.container}>
            <p className={styles.subtle}>Carregando...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <h1>✨ Controle de Acesso</h1>
            </div>
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.topRow}>
            <button
              type="button"
              className={`${btn.btn} ${btn['btn--secondary']} ${btn['btn--sm']}`}
              onClick={() => router.push('/dashboard')}
            >
              ← Voltar
            </button>
            <h2 className={styles.title}>👥 Usuários</h2>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.grid}>
            <section className={cardStyles.card}>
              <div className={styles.sectionHeader}>
                <h2>📋 Lista de usuários</h2>
              </div>

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
                  <div className={styles.filterActions}>
                    <button
                      type="button"
                      className={`${btn.btn} ${btn['btn--primary']}`}
                      onClick={() => setCreateModalOpen(true)}
                    >
                      ➕ Criar
                    </button>
                    <button
                      type="button"
                      className={`${btn.btn} ${btn['btn--secondary']}`}
                      onClick={openLogsModal}
                    >
                      🧾 Logs
                    </button>
                    <button
                      type="button"
                      className={`${btn.btn} ${btn['btn--secondary']}`}
                      onClick={loadUsers}
                      disabled={loading}
                    >
                      Atualizar
                    </button>
                  </div>
                </div>
                <span className={styles.filterCount}>{loading ? 'Carregando...' : `${filteredUsers.length} usuário(s)`}</span>
              </div>

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
            </section>
          </div>
        </div>
      </main>

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
  );
}
