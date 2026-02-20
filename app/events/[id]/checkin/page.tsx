'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import GuestManagement from '@/app/components/GuestManagement';
import UserMenu from '@/app/components/UserMenu';
import styles from './checkin.module.css';
import buttonStyles from '@/lib/buttons.module.css';

export default function CheckInPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [eventName, setEventName] = useState('Evento');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStatus, setEventStatus] = useState('');

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          const event = data.event || {};
          setEventName(event.name || 'Evento');
          setEventDescription(event.description || '');
          setEventDate(event.date || '');
          // Se existir campo location, use; senão, extraia do description
          setEventLocation(event.location || '');
          setEventStatus(event.status || '');
        } else {
          console.error('Failed to fetch event:', res.status);
        }
      } catch (err) {
        console.error('Erro ao buscar dados do evento:', err);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  if (authLoading) {
    return <div className={styles.container}><p>Carregando...</p></div>;
  }

  if (!user?.userId) {
    router.push('/login');
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className={styles.checkinContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button
              className={buttonStyles.btn + ' ' + buttonStyles['btn--ghost']}
              onClick={() => router.push('/dashboard')}
              title="Voltar ao Dashboard"
            >
              ← Dashboard
            </button>
          </div>
          <h1 className={styles.title}>{eventName}</h1>
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <UserMenu user={user} onLogout={handleLogout} eventId={eventId} />
            </div>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <GuestManagement
          eventId={eventId}
          eventName={eventName}
          eventDate={eventDate}
          eventDescription={eventDescription}
          eventStatus={eventStatus}
        />
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>&copy; 2026 Controle de Acesso - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}

