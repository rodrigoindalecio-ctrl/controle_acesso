'use client';

import React, { useState, useEffect } from 'react';
import styles from './EventModal.module.css';

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

type Collaborator = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type SystemUser = {
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
      setFormData({ name: '', date: '', description: '', status: 'PENDING' });
    }
    setErrors({});
    setCollabError(null);
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
      } catch (e) {
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
    } catch (e) {
      setCollabError('Erro ao atualizar colaborador');
    } finally {
      setCollabLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date) return;
    await onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{isEditing ? 'Editar Evento' : 'Criar Novo Evento'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Nome *</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className={styles.formGroup}>
            <label>Data *</label>
            <input type="datetime-local" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
          </div>
          {isEditing && (
            <div className={styles.formGroup}>
              <label>Colaboradores</label>
              <div className={styles.collabList}>
                {allUsers.map(u => (
                  <label key={u.id}>
                    <input type="checkbox" checked={collaborators.some(c => c.id === u.id)} onChange={e => handleToggleCollaborator(u, e.target.checked)} />
                    {u.name} ({u.email})
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className={styles.actions}>
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
