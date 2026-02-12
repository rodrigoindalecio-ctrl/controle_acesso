'use client';

import styles from './UserProfileModal.module.css';

interface User {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
}

export default function UserProfileModal({ user, onClose }: UserProfileModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Perfil do Usuário</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.profileSection}>
            <div className={styles.avatar}>👤</div>
            
            <div className={styles.infoGroup}>
              <label>ID do Usuário</label>
              <p className={styles.value}>{user.userId}</p>
            </div>

            <div className={styles.infoGroup}>
              <label>Email</label>
              <p className={styles.value}>{user.email}</p>
            </div>

            <div className={styles.infoGroup}>
              <label>Função</label>
              <p className={styles.value}>
                {user.role === 'ADMIN' ? '👑 Administrador' : '👤 Colaborador'}
              </p>
            </div>

            <div className={styles.infoGroup}>
              <label>Data de Cadastro</label>
              <p className={styles.value}>
                {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <p className={styles.note}>
            ℹ️ Para editar seus dados de perfil, entre em contato com um administrador.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.closeButtonAction}
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
