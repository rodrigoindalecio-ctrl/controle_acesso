'use client';

import styles from './AboutModal.module.css';

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Sobre</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.logoSection}>
            <h1 className={styles.appTitle}>✨ Controle de Acesso</h1>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoItem}>
              <label>Versão</label>
              <p>2.0.0</p>
            </div>

            <div className={styles.infoItem}>
              <label>Tipo</label>
              <p>Sistema de Gerenciamento de Eventos</p>
            </div>

            <div className={styles.infoItem}>
              <label>Desenvolvido por</label>
              <p>Google Gravity</p>
            </div>

            <div className={styles.infoItem}>
              <label>Ano</label>
              <p>2026</p>
            </div>
          </div>

          <div className={styles.descriptionSection}>
            <h3>Sobre o Sistema</h3>
            <p>
              O Controle de Acesso é uma plataforma completa para gerenciamento de 
              eventos, check-in de convidados e controle de acesso. Desenvolvido com 
              as melhores práticas de design e segurança.
            </p>
          </div>

          <div className={styles.featuresSection}>
            <h3>Recursos Principais</h3>
            <ul>
              <li>📅 Gerenciamento de Eventos</li>
              <li>✅ Check-in de Convidados</li>
              <li>📊 Relatórios e Estatísticas</li>
              <li>🔐 Autenticação Segura</li>
              <li>📱 Interface Responsiva</li>
              <li>🎨 Design Moderno</li>
            </ul>
          </div>

          <div className={styles.linksSection}>
            <h3>Links</h3>
            <a href="#" className={styles.link}>
              📖 Documentação
            </a>
            <a href="#" className={styles.link}>
              🐛 Reportar Problema
            </a>
            <a href="#" className={styles.link}>
              💬 Suporte
            </a>
          </div>

          <p className={styles.copyright}>
            © 2026 Google Gravity - Todos os direitos reservados
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
