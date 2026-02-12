'use client';

import { useState } from 'react';
import styles from './AuditLog.module.css';

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

interface AuditLogProps {
  logs: AuditLogEntry[];
}

export default function AuditLog({ logs }: AuditLogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      CORRECT_GUEST: '✏️ Corrigir Convidado',
      CHECK_IN: '✅ Check-in',
      UNCHECK: '🔄 Desfazer Check-in',
      CREATE_EVENT: '➕ Criar Evento',
      EDIT_EVENT: '✏️ Editar Evento',
      DELETE_EVENT: '🗑️ Deletar Evento',
      IMPORT_GUESTS: '📥 Importar Convidados',
      LOGIN: '🔓 Login',
      CREATE_USER: '➕ Criar Usuário',
      UPDATE_USER: '✏️ Editar Usuário',
      DELETE_USER: '🗑️ Excluir Usuário',
      CHANGE_USER_PASSWORD: '🔐 Alterar Senha (Admin)'
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string): string => {
    if (action.includes('CORRECT') || action.includes('EDIT')) return 'warning';
    if (action.includes('DELETE')) return 'danger';
    if (action.includes('CREATE') || action.includes('IMPORT')) return 'success';
    if (action.includes('CHECK')) return 'info';
    return 'default';
  };

  const formatDate = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
  };

  const getChanges = (before?: Record<string, any>, after?: Record<string, any>): Array<{ field: string; oldValue: any; newValue: any }> => {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    
    if (!before || !after) return changes;
    
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    
    allKeys.forEach(key => {
      if (before[key] !== after[key]) {
        changes.push({
          field: key,
          oldValue: before[key],
          newValue: after[key]
        });
      }
    });
    
    return changes;
  };

  if (logs.length === 0) {
    return (
      <div className={styles.empty}>
        <p>📭 Nenhum log de auditoria encontrado</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.timeline}>
        {logs.map((log, index) => {
          const isExpanded = expandedId === log.id;
          const changes = getChanges(log.before, log.after);
          const actionColor = getActionColor(log.action);

          return (
            <div key={log.id} className={styles.entry}>
              <div className={styles.entryContent} data-color={actionColor}>
                  <div className={styles.entryTop}>
                    <span className={`${styles.actionBadge} ${styles[`action-${actionColor}`]}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className={styles.timestamp}>{formatDate(log.created_at)}</span>
                  </div>

                  <div className={styles.entryMeta}>
                    <span className={styles.metaItem}>
                      <span className={styles.metaIcon}>👤</span>
                      <span className={styles.metaLabel}>Usuário:</span>
                      <span className={styles.metaValue}>{log.userId.substring(0, 12)}...</span>
                    </span>
                    <span className={styles.metaSeparator}>•</span>
                    <span className={styles.metaItem}>
                      <span className={`${styles.metaValue} ${styles[`role-${log.role}`]}`}>
                        {log.role === 'ADMIN' ? '👑 Admin' : '👤 User'}
                      </span>
                    </span>
                    <span className={styles.metaSeparator}>•</span>
                    <span className={styles.metaItem}>
                      <span className={styles.metaLabel}>Entidade:</span>
                      <span className={styles.metaValue}>{log.entityType}</span>
                    </span>
                    {log.ip && (
                      <>
                        <span className={styles.metaSeparator}>•</span>
                        <span className={styles.metaItem}>
                          <span className={styles.metaLabel}>IP:</span>
                          <span className={styles.metaValue}>{log.ip}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {log.justification && (
                    <div className={styles.justification}>
                      <span className={styles.justificationLabel}>💬 Motivo:</span>
                      <span className={styles.justificationText}>{log.justification}</span>
                    </div>
                  )}

                  {changes.length > 0 && (
                    <button
                      className={styles.expandButton}
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      type="button"
                    >
                      {isExpanded ? '▼ Ocultar mudanças' : '▶ Ver mudanças'} ({changes.length})
                    </button>
                  )}

                  {isExpanded && changes.length > 0 && (
                    <div className={styles.changes}>
                      <h4 className={styles.changesTitle}>Alterações:</h4>
                      <div className={styles.changesList}>
                        {changes.map((change, idx) => (
                          <div key={idx} className={styles.changeItem}>
                            <div className={styles.fieldName}>{change.field}</div>
                            <div className={styles.changeComparison}>
                              <div className={styles.oldValue}>
                                <span className={styles.changeLabel}>Antes:</span>
                                <code>{JSON.stringify(change.oldValue)}</code>
                              </div>
                              <div className={styles.arrow}>→</div>
                              <div className={styles.newValue}>
                                <span className={styles.changeLabel}>Depois:</span>
                                <code>{JSON.stringify(change.newValue)}</code>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
