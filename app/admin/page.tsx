'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import AuditLog from '@/app/components/AuditLog';
import UserMenu from '@/app/components/UserMenu';
import AdminEventGuests from './AdminEventGuests';

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

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    // Verificar se é admin
    if (!authLoading && user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchAuditLogs();
    }
  }, [user, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(
        `/api/audit?${params.toString()}`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        if (response.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem acessar.');
        }
        throw new Error('Erro ao carregar logs de auditoria');
      }

      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <h1>📊 Auditoria do Sistema</h1>
          </div>
          <div className={styles.userInfo}>
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Exemplo: Passe o eventId e eventName corretos conforme sua lógica de eventos */}
        <AdminEventGuests eventId={"EVENT_ID_AQUI"} eventName={"Nome do Evento"} />
        {/* ...outros componentes, como AuditLog, podem ser mantidos abaixo... */}
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>&copy; 2026 Controle de Acesso - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}
