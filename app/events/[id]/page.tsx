'use client';

import { useEffect, useState, useRef } from 'react';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import GuestManagement from '@/app/components/GuestManagement';
import UserMenu from '@/app/components/UserMenu';
import styles from './event.module.css';
import buttonStyles from '@/lib/buttons.module.css';
import BottomNavigation from '@/app/components/BottomNavigation';
import UserProfileModal from '@/app/components/UserProfileModal';
import ReportsModal from '@/app/components/ReportsModal';
import QuickAccessModal from '@/app/components/QuickAccessModal';
import { QrCode } from 'lucide-react';


interface Event {
  id: number;
  name: string;
  date: string;
  description?: string;
  status: string;
}

export default function EventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  const [eventsForReports, setEventsForReports] = useState<any[]>([]);

  // Refs para acionar funções internas do GuestManagement pelo UserMenu
  const exportRef = useRef<(() => void) | null>(null);
  const deleteAllRef = useRef<(() => void) | null>(null);
  const addGuestRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`);

        if (response.status === 403) {
          // Acesso negado
          router.push('/dashboard');
          return;
        }

        if (!response.ok) {
          throw new Error('Evento não encontrado');
        }

        const data = await response.json();
        setEvent(data.event);
      } catch (err) {
        console.error('Erro ao carregar evento:', err);
        setError('Erro ao carregar evento');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();

    // Load events for the reports modal (needed if triggered from bottom nav)
    const loadAllEvents = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          setEventsForReports(data.events || []);
        }
      } catch (err) { }
    };
    loadAllEvents();
  }, [eventId, router]);

  if (loading) {
    return <LoadingSpinner message="Carregando..." />;
  }

  if (error || !event) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error || 'Evento não encontrado'}
        </div>
        <button
          className={buttonStyles.btn + ' ' + buttonStyles['btn--ghost']}
          onClick={() => router.push('/dashboard')}
          title="Voltar ao Dashboard"
        >
          ← Dashboard
        </button>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className={styles.eventContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button
              className={buttonStyles.btn + ' ' + buttonStyles['btn--ghost'] + ' ' + styles.backButton}
              onClick={() => router.push('/dashboard')}
              title="Voltar ao Dashboard"
            >
              <span className={styles.backIcon}>←</span>
              <span className={styles.backText}>Dashboard</span>
            </button>
            {isAdmin && (
              <button
                className={buttonStyles.btn + ' ' + buttonStyles['btn--secondary'] + ' ' + styles.quickAccessButton}
                onClick={() => setIsQuickAccessOpen(true)}
                title="Acesso Rápido (Ajudantes)"
              >
                <QrCode size={18} strokeWidth={1.5} />
                <span className={styles.btnText}>Ajudante</span>
              </button>
            )}
          </div>
          <h1 className={styles.title}>{event.name}</h1>
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              {user && <UserMenu
                user={user}
                onLogout={handleLogout}
                eventId={eventId}
                onExport={() => exportRef.current?.()}
                onDeleteAll={() => deleteAllRef.current?.()}
                isAdmin={isAdmin}
              />}
            </div>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>

        <div className={styles.content}>
          {isAdmin && event && (
            <>
              <GuestManagement
                eventId={eventId}
                eventName={event.name}
                eventDate={event.date}
                eventDescription={event.description}
                eventStatus={event.status}
                exportRef={exportRef}
                deleteAllRef={deleteAllRef}
                addGuestRef={addGuestRef}
                key={refreshKey}
              />
            </>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>&copy; 2026 Controle de Acesso - Todos os direitos reservados</p>
        </div>
      </footer>

      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        events={eventsForReports.length > 0 ? eventsForReports : (event ? [event] : [])}
      />

      {isProfileOpen && (
        <UserProfileModal
          user={user!}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      <QuickAccessModal
        isOpen={isQuickAccessOpen}
        onClose={() => setIsQuickAccessOpen(false)}
        eventId={eventId}
      />

      <BottomNavigation
        onOpenReports={() => setIsReportsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdd={() => addGuestRef.current?.()}
      />
    </div>
  );
}

