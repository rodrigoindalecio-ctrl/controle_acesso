'use client';

import React, { useState, useEffect } from 'react';
import styles from './EventModal.module.css';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  isEditing?: boolean;
  initialData?: EventFormData;
  eventId?: string;
  isLoading?: boolean;
}

export interface EventFormData {
  name: string;
  date: string;
  description?: string;
  status: string;
}

type Collaborator = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type SystemUser = {
  id: string;
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collabError, setCollabError] = useState<string | null>(null);
  const [collabLoading, setCollabLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        date: '',
        description: '',
        status: 'PENDING'
      });
    }
    setErrors({});
    setCollabError(null);
    setAllUsers([]);
    setUserDropdownOpen(false);
  }, [isOpen, initialData]);

  useEffect(() => {
    const loadCollaborators = async () => {
      if (!isOpen || !isEditing || !eventId) return;
      setCollabLoading(true);
      setCollabError(null);
      try {
        // Load all available users (collaborators cadastrados)
        const usersRes = await fetch('/api/users', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!usersRes.ok) {
          const body = await usersRes.json().catch(() => ({}));
          throw new Error(body?.error || 'Erro ao carregar usuários');
        }

        const usersJson = await usersRes.json();
        setAllUsers(Array.isArray(usersJson?.users) ? usersJson.users : []);

        const res = await fetch(`/api/events/${eventId}/collaborators`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || 'Erro ao carregar colaboradores');
        }

        const json = await res.json();
        setCollaborators(Array.isArray(json?.collaborators) ? json.collaborators : []);
      } catch (e) {
        setCollaborators([]);
        setAllUsers([]);
        setCollabError(e instanceof Error ? e.message : 'Erro ao carregar colaboradores');
      } finally {
        setCollabLoading(false);
      }
    };

    loadCollaborators();
  }, [isOpen, isEditing, eventId]);

  const handleRemoveCollaborator = async (userId: string) => {
    if (!eventId) return;

    setCollabLoading(true);
    setCollabError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/collaborators`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Erro ao remover colaborador');
      }

      setCollaborators((prev) => prev.filter((c) => c.id !== userId));
    } catch (e) {
      setCollabError(e instanceof Error ? e.message : 'Erro ao remover colaborador');
    } finally {
      setCollabLoading(false);
    }
  };

  const handleToggleCollaborator = async (u: SystemUser, checked: boolean) => {
    if (!eventId) return;

    setCollabLoading(true);
    setCollabError(null);
    try {
      if (checked) {
        const res = await fetch(`/api/events/${eventId}/collaborators`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: u.email })
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || 'Erro ao adicionar colaborador');
        }

        const json = await res.json();
        const newCollab = json?.collaborator as Collaborator | undefined;
        if (newCollab?.id) {
          setCollaborators((prev) => {
            if (prev.some((c) => c.id === newCollab.id)) return prev;
            return [...prev, newCollab];
          });
        }
      } else {
        await handleRemoveCollaborator(u.id);
      }
    } catch (e) {
      setCollabError(e instanceof Error ? e.message : 'Erro ao atualizar colaborador');
    } finally {
      setCollabLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    } else {
      const selectedDate = new Date(formData.date);
      if (isNaN(selectedDate.getTime())) {
        newErrors.date = 'Data inválida';
      }
    }

    const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(formData.status)) {
      newErrors.status = 'Status inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      date: '',
      description: '',
      status: 'PENDING'
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{isEditing ? 'Editar Evento' : 'Criar Novo Evento'}</h2>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nome do Evento *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="Ex: Casamento Ana & João"
              disabled={isLoading}
              className={errors.name ? styles.inputError : ''}
            />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="date">Data do Evento *</label>
            <input
              id="date"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => {
                setFormData({ ...formData, date: e.target.value });
                if (errors.date) setErrors({ ...errors, date: '' });
              }}
              disabled={isLoading}
              className={errors.date ? styles.inputError : ''}
            />
            {errors.date && <span className={styles.error}>{errors.date}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Descrição</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detalhes do evento (opcional)"
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              disabled={isLoading}
            >
              <option value="PENDING">Pendente</option>
              <option value="ACTIVE">Ativo</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          {isEditing && eventId && (
            <div className={styles.formGroup}>
              <label>Colaboradores do evento</label>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setUserDropdownOpen((v) => !v)}
                disabled={isLoading || collabLoading}
                aria-expanded={userDropdownOpen}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>Selecionar colaboradores</span>
                <span>{userDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {userDropdownOpen && (
                <div
                  style={{
                    marginTop: 8,
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: 10,
                    maxHeight: 220,
                    overflowY: 'auto',
                    background: 'var(--color-bg-lighter)'
                  }}
                >
                  {collabLoading && allUsers.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Carregando usuários…</span>
                  ) : allUsers.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum colaborador cadastrado.</span>
                  ) : (
                    allUsers.map((u) => {
                      const isChecked = collaborators.some((c) => c.id === u.id);
                      return (
                        <label
                          key={u.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 6px',
                            borderBottom: '1px solid var(--border-color)'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isLoading || collabLoading}
                            onChange={(e) => handleToggleCollaborator(u, e.target.checked)}
                            aria-label={`Habilitar ${u.email}`}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              )}

              {collabError && <span className={styles.error}>{collabError}</span>}

              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {collabLoading && collaborators.length === 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Carregando colaboradores…</span>
                ) : collaborators.length === 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum colaborador vinculado.</span>
                ) : (
                  collaborators.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={() => handleRemoveCollaborator(c.id)}
                        disabled={isLoading || collabLoading}
                        style={{ padding: '8px 12px' }}
                        aria-label={`Remover ${c.email}`}
                      >
                        Remover
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
