'use client';

import React, { useState, useEffect } from 'react';
import styles from './EventModal.module.css';
import btn from '../../lib/buttons.module.css';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  isEditing?: boolean;
  initialData?: EventFormData;
  eventId?: number;
  isLoading?: boolean;
}

export interface EventFormData {
  name: string;
  date: string;
  description?: string;
  status: string;
}

type SystemUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type Collaborator = {
  id: number;
  email: string;
  name: string;
  role: string;
};

export default function EventModal({
  isOpen,
  onClose,
  onSubmit,
  isEditing = false,
  initialData,
  eventId,
  isLoading = false
}: EventModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: '',
    description: '',
    status: 'PENDING'
  });

  // Campos separados de data e hora (evita o picker nativo datetime-local ficar bloqueando)
  const [datePart, setDatePart] = useState('');
  const [timePart, setTimePart] = useState('18:00');

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabError, setCollabError] = useState<string | null>(null);
  const [collabOpen, setCollabOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Extrair date e time do valor ISO / datetime-local
      if (initialData.date) {
        const dt = initialData.date.slice(0, 16); // 'YYYY-MM-DDTHH:mm'
        setDatePart(dt.slice(0, 10));
        setTimePart(dt.slice(11, 16));
      } else {
        setDatePart('');
        setTimePart('18:00');
      }
    } else {
      setFormData({ name: '', date: '', description: '', status: 'PENDING' });
      setDatePart('');
      setTimePart('18:00');
    }
    setCollabError(null);
    setCollabOpen(false);
  }, [isOpen, initialData]);

  useEffect(() => {
    const loadCollaborators = async () => {
      if (!isOpen || !isEditing || !eventId) return;
      setCollabLoading(true);
      try {
        const usersRes = await fetch('/api/admin/users');
        const usersJson = await usersRes.json();
        setAllUsers(usersJson.users || []);

        const res = await fetch(`/api/events/${eventId}/collaborators`);
        const json = await res.json();
        setCollaborators(json.collaborators || []);
      } catch {
        setCollabError('Erro ao carregar colaboradores');
      } finally {
        setCollabLoading(false);
      }
    };
    loadCollaborators();
  }, [isOpen, isEditing, eventId]);

  const handleToggleCollaborator = async (u: SystemUser, checked: boolean) => {
    if (!eventId) return;
    setCollabLoading(true);
    try {
      if (checked) {
        await fetch(`/api/events/${eventId}/collaborators`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: u.email })
        });
        setCollaborators([...collaborators, { ...u }]);
      } else {
        await fetch(`/api/events/${eventId}/collaborators`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: u.id })
        });
        setCollaborators(collaborators.filter(c => c.id !== u.id));
      }
    } catch {
      setCollabError('Erro ao atualizar colaborador');
    } finally {
      setCollabLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Combina data + hora em formato ISO
    const combined = datePart && timePart ? `${datePart}T${timePart}` : '';
    const finalData = { ...formData, date: combined };
    if (!finalData.name || !finalData.date) return;
    await onSubmit(finalData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <header className={styles.header}>
          <h2>{isEditing ? '✏️ Editar Evento' : '➕ Criar Evento'}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar"
            disabled={isLoading}
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.content}>

            <div className={styles.field}>
              <label className={styles.label}>Nome do Evento *</label>
              <input
                className={styles.input}
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Casamento Ana & João"
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.dateTimeRow}>
              <div className={styles.field}>
                <label className={styles.label}>Data *</label>
                <input
                  className={styles.input}
                  type="date"
                  value={datePart}
                  onChange={e => setDatePart(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Hora *</label>
                <input
                  className={styles.input}
                  type="time"
                  value={timePart}
                  onChange={e => setTimePart(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Descrição</label>
              <textarea
                className={styles.textarea}
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional do evento"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.select}
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                disabled={isLoading}
              >
                <option value="PENDING">Pendente</option>
                <option value="ACTIVE">Ativo</option>
                <option value="COMPLETED">Concluído</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            {isEditing && (
              <div className={styles.field}>
                {/* Colaboradores em accordion */}
                <div className={styles.collabAccordion}>
                  <button
                    type="button"
                    className={styles.collabToggle}
                    onClick={() => setCollabOpen(o => !o)}
                    disabled={collabLoading}
                  >
                    <span>
                      👥 Colaboradores
                      {collabLoading && <span className={styles.collabLoading}> (carregando...)</span>}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {collaborators.length > 0 && (
                        <span className={styles.collabBadge}>{collaborators.length}</span>
                      )}
                      <span className={`${styles.collabToggleIcon} ${collabOpen ? styles.open : ''}`}>▼</span>
                    </span>
                  </button>

                  {collabError && <p className={styles.collabError}>{collabError}</p>}

                  <div className={`${styles.collabPanel} ${collabOpen ? styles.open : ''}`}>
                    {allUsers.map(u => (
                      <label key={u.id} className={styles.collabItem}>
                        <input
                          type="checkbox"
                          checked={collaborators.some(c => c.id === u.id)}
                          onChange={e => handleToggleCollaborator(u, e.target.checked)}
                          disabled={collabLoading}
                        />
                        <span className={styles.collabName}>{u.name}</span>
                        <span className={styles.collabEmail}>{u.email}</span>
                      </label>
                    ))}
                    {allUsers.length === 0 && !collabLoading && (
                      <p className={styles.noCollab}>Nenhum usuário disponível</p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              className={`${btn.btn} ${btn['btn--secondary']}`}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${btn.btn} ${btn['btn--primary']} ${isLoading ? btn['is-loading'] : ''}`}
              disabled={isLoading || !formData.name || !formData.date}
            >
              {isLoading ? (
                <>
                  <span className={btn['btn__spinner']} aria-hidden="true" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Criar Evento'
              )}
            </button>
          </footer>
        </form>

      </div>
    </div>
  );
}
