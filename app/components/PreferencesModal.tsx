'use client';

import { useState } from 'react';
import styles from './PreferencesModal.module.css';

interface PreferencesModalProps {
  onClose: () => void;
}

interface Preferences {
  notifications: boolean;
  emailNotifications: boolean;
  theme: string;
  language: string;
}

export default function PreferencesModal({ onClose }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    notifications: true,
    emailNotifications: true,
    theme: 'light',
    language: 'pt-BR',
  });

  const handleToggle = (key: keyof Preferences) => {
    const currentValue = preferences[key];
    if (typeof currentValue === 'boolean') {
      setPreferences({
        ...preferences,
        [key]: !currentValue,
      });
    }
  };

  const handleSelectChange = (key: keyof Preferences, value: string) => {
    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  const handleSave = () => {
    // Aqui seria salvo as preferências
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Preferências</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>🔔 Notificações</h3>

            <label className={styles.toggleOption}>
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={() => handleToggle('notifications')}
              />
              <span className={styles.toggleLabel}>
                Notificações Push
              </span>
            </label>

            <label className={styles.toggleOption}>
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
              />
              <span className={styles.toggleLabel}>
                Notificações por Email
              </span>
            </label>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.section}>
            <h3>🎨 Aparência</h3>

            <div className={styles.formGroup}>
              <label htmlFor="theme">Tema</label>
              <select
                id="theme"
                value={preferences.theme}
                onChange={(e) => handleSelectChange('theme', e.target.value)}
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.section}>
            <h3>🌍 Idioma</h3>

            <div className={styles.formGroup}>
              <label htmlFor="language">Idioma</label>
              <select
                id="language"
                value={preferences.language}
                onChange={(e) => handleSelectChange('language', e.target.value)}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          <p className={styles.note}>
            ℹ️ Suas preferências serão salvas localmente no seu navegador.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
          >
            Salvar Preferências
          </button>
        </div>
      </div>
    </div>
  );
}
