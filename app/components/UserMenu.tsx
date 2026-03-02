'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './UserMenu.module.css';
import ChangePasswordModal from './ChangePasswordModal';
import UserProfileModal from './UserProfileModal';
import PreferencesModal from './PreferencesModal';
import AboutModal from './AboutModal';
import { User as UserIcon, Lock, Settings, HelpCircle, Info, Download, Trash2, LogOut } from 'lucide-react';

interface User {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

interface UserMenuProps {
  user: User;
  onLogout: () => void;
  eventId?: string;
  onImportComplete?: () => void;
  onExport?: () => void;
  onDeleteAll?: () => void;
  isAdmin?: boolean;
}

export default function UserMenu({ user, onLogout, onExport, onDeleteAll, isAdmin }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (modal: string) => {
    setActiveModal(modal);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await onLogout();
  };

  return (
    <>
      <div className={styles.userMenuContainer} ref={menuRef}>
        <button
          className={styles.hamburgerButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu de usuário"
          title="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.userInfo}>
              <p className={styles.userEmail}>{user.email}</p>
              <p className={styles.userRole}>
                {user.role === 'ADMIN' ? '👑 Administrador' : '👤 Colaborador'}
              </p>
            </div>

            <div className={styles.divider}></div>

            <button
              className={styles.menuItem}
              onClick={() => handleMenuClick('profile')}
            >
              <UserIcon size={18} strokeWidth={1.5} />
              <span>Perfil</span>
            </button>

            <button
              className={styles.menuItem}
              onClick={() => handleMenuClick('password')}
            >
              <Lock size={18} strokeWidth={1.5} />
              <span>Editar Senha</span>
            </button>

            <button
              className={styles.menuItem}
              onClick={() => handleMenuClick('preferences')}
            >
              <Settings size={18} strokeWidth={1.5} />
              <span>Preferências</span>
            </button>

            <button
              className={styles.menuItem}
              onClick={() => handleMenuClick('help')}
            >
              <HelpCircle size={18} strokeWidth={1.5} />
              <span>Ajuda & Suporte</span>
            </button>

            <button
              className={styles.menuItem}
              onClick={() => handleMenuClick('about')}
            >
              <Info size={18} strokeWidth={1.5} />
              <span>Sobre</span>
            </button>

            <div className={styles.divider}></div>

            {/* Ações do evento — só aparecem na página de evento */}
            {onExport && (
              <button
                className={styles.menuItem}
                onClick={() => { onExport(); setIsOpen(false); }}
              >
                <Download size={18} strokeWidth={1.5} />
                <span>Exportar Lista</span>
              </button>
            )}
            {onDeleteAll && isAdmin && (
              <button
                className={`${styles.menuItem} ${styles.danger}`}
                onClick={() => { onDeleteAll(); setIsOpen(false); }}
              >
                <Trash2 size={18} strokeWidth={1.5} />
                <span>Excluir Todos</span>
              </button>
            )}

            <div className={styles.divider}></div>

            <button
              className={`${styles.menuItem} ${styles.logout}`}
              onClick={handleLogout}
            >
              <LogOut size={18} strokeWidth={1.5} />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>

      {/* Modais */}
      {activeModal === 'profile' && (
        <UserProfileModal
          user={user}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'password' && (
        <ChangePasswordModal
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'preferences' && (
        <PreferencesModal
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'about' && (
        <AboutModal
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}
