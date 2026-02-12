'use client';

import { useState } from 'react';
import styles from './CorrectionModal.module.css';

interface GuestData {
  id: string;
  fullName: string;
  phone?: string;
  category: string;
  notes?: string;
}

interface CorrectionModalProps {
  guest: GuestData;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    fullName?: string;
    phone?: string;
    category?: string;
    notes?: string;
    justification: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CorrectionModal({
  guest,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: CorrectionModalProps) {
  const [formData, setFormData] = useState({
    fullName: guest.fullName,
    phone: guest.phone || '',
    category: guest.category,
    notes: guest.notes || '',
    justification: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'form'>('preview');

  const hasChanges = 
    formData.fullName !== guest.fullName ||
    formData.phone !== (guest.phone || '') ||
    formData.category !== guest.category ||
    formData.notes !== (guest.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.justification.trim()) {
      setError('Motivo da correção é obrigatório');
      return;
    }

    if (formData.justification.length < 5) {
      setError('Motivo deve ter pelo menos 5 caracteres');
      return;
    }

    try {
      await onConfirm(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao corrigir convidado');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2>Corrigir Dados do Convidado</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isLoading}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
            onClick={() => setActiveTab('preview')}
            disabled={isLoading}
          >
            Preview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'form' ? styles.active : ''}`}
            onClick={() => setActiveTab('form')}
            disabled={isLoading}
          >
            Editar
          </button>
        </div>

        {/* Content */}
        <form className={styles.content} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.errorBox} role="alert">
              ⚠️ {error}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className={styles.preview}>
              <div className={styles.comparison}>
                <div className={styles.column}>
                  <h3>Antes</h3>
                  <div className={styles.field}>
                    <label>Nome</label>
                    <p className={styles.value}>{guest.fullName}</p>
                  </div>
                  <div className={styles.field}>
                    <label>Telefone</label>
                    <p className={styles.value}>{guest.phone || '—'}</p>
                  </div>
                  <div className={styles.field}>
                    <label>Categoria</label>
                    <p className={styles.value}>{guest.category}</p>
                  </div>
                  <div className={styles.field}>
                    <label>Notas</label>
                    <p className={styles.value}>{guest.notes || '—'}</p>
                  </div>
                </div>

                <div className={styles.arrow}>→</div>

                <div className={styles.column}>
                  <h3>Depois</h3>
                  <div className={styles.field}>
                    <label>Nome</label>
                    <p className={`${styles.value} ${formData.fullName !== guest.fullName ? styles.changed : ''}`}>
                      {formData.fullName}
                    </p>
                  </div>
                  <div className={styles.field}>
                    <label>Telefone</label>
                    <p className={`${styles.value} ${formData.phone !== (guest.phone || '') ? styles.changed : ''}`}>
                      {formData.phone || '—'}
                    </p>
                  </div>
                  <div className={styles.field}>
                    <label>Categoria</label>
                    <p className={`${styles.value} ${formData.category !== guest.category ? styles.changed : ''}`}>
                      {formData.category}
                    </p>
                  </div>
                  <div className={styles.field}>
                    <label>Notas</label>
                    <p className={`${styles.value} ${formData.notes !== (guest.notes || '') ? styles.changed : ''}`}>
                      {formData.notes || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'form' && (
            <div className={styles.fields}>
              <div className={styles.formGroup}>
                <label htmlFor="fullName">Nome Completo</label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={isLoading}
                  minLength={2}
                  maxLength={255}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">Telefone</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isLoading}
                  maxLength={20}
                  placeholder="Opcional"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category">Categoria</label>
                <input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="notes">Notas</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isLoading}
                  maxLength={500}
                  rows={3}
                  placeholder="Informações adicionais"
                />
              </div>
            </div>
          )}

          {/* Justification - sempre visível */}
          <div className={styles.justificationBox}>
            <label htmlFor="justification">
              <span className={styles.required}>*</span> Motivo da Correção
            </label>
            <textarea
              id="justification"
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              disabled={isLoading}
              required
              minLength={5}
              maxLength={255}
              placeholder="Ex: Corrigir nome digitado errado, adicionar telefone..."
              rows={3}
              className={styles.required}
            />
            <small>Mínimo 5 caracteres. Será registrado na auditoria.</small>
          </div>

          {/* Status de alterações */}
          {!hasChanges && (
            <div className={styles.infoBox}>
              ℹ️ Nenhuma alteração foi feita. Atualize algum campo para continuar.
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.confirmBtn}
              disabled={isLoading || !hasChanges || !formData.justification.trim()}
            >
              {isLoading ? 'Corrigindo...' : 'Confirmar Correção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
