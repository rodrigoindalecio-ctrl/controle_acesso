'use client';

import { useState } from 'react';
import styles from './EventDetailsModal.module.css';
import GuestImport from './GuestImport';
import { translateStatus } from '@/lib/statusUtils';

interface Event {
  id: string;
  name: string;
  date: string;
  description?: string;
  status: string;
}

interface EventDetailsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'ADMIN' | 'USER';
  guestCount?: number;
}

export default function EventDetailsModal({
  event,
  isOpen,
  onClose,
  userRole,
  guestCount = 0
}: EventDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'guests'>('details');

  if (!isOpen || !event) return null;

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{event.name}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'details' ? styles.active : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Detalhes
          </button>
          {userRole === 'ADMIN' && (
            <button
              className={`${styles.tab} ${activeTab === 'guests' ? styles.active : ''}`}
              onClick={() => setActiveTab('guests')}
            >
              👥 Convidados
            </button>
          )}
        </div>

        <div className={styles.content}>
          {activeTab === 'details' && (
            <div>
              <div className={styles.detail}>
                <span className={styles.label}>📅 Data:</span>
                <span>{formattedDate}</span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>📝 Descrição:</span>
                <span>{event.description || 'Sem descrição'}</span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>🎯 Status:</span>
                <span className={styles.status} style={{
                  background: event.status === 'ACTIVE' ? '#dffcf0' : 
                             event.status === 'COMPLETED' ? '#e0e7ff' :
                             event.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7',
                  color: event.status === 'ACTIVE' ? '#065f46' : 
                         event.status === 'COMPLETED' ? '#3730a3' :
                         event.status === 'CANCELLED' ? '#991b1b' : '#92400e'
                }}>
                  {event.status === 'ACTIVE' ? '✅' : 
                   event.status === 'COMPLETED' ? '🏁' :
                   event.status === 'CANCELLED' ? '❌' : '⏳'} {translateStatus(event.status)}
                </span>
              </div>

              <div className={styles.detail}>
                <span className={styles.label}>👥 Convidados:</span>
                <span>{guestCount} convidados</span>
              </div>
            </div>
          )}

          {activeTab === 'guests' && userRole === 'ADMIN' && (
            <GuestImport eventId={event.id} />
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.closeButton} onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
