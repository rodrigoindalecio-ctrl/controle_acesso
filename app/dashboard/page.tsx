'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';
import cardStyles from '@/lib/cards.module.css';
import Link from 'next/link';
import EventModal, { EventFormData } from '@/app/components/EventModal';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import UserMenu from '@/app/components/UserMenu';
import ReportsModal from '@/app/components/ReportsModal';
import UsersModal from '@/app/components/UsersModal';
import { translateStatus } from '@/lib/statusUtils';

interface User {
  userId: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
}

interface Event {
  id: number;
  name: string;
  date: string;
  description?: string;
  status: string;
}

interface DashboardStats {
  totalEvents: number;
  totalGuests: number;
  nextEvent: {
    id: number;
    name: string;
    date: string;
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ eventId: string; eventName: string } | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.user) {
        setUser(data.user);
        await loadEvents(data.user);
        if (data.user.role === 'ADMIN') {
          await loadStats();
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (currentUser: User) => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setError('Erro ao carregar eventos');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Erro ao carregar estatísticas:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setIsLoggingOut(false);
    }
  };

  const handleCreateClick = () => {
    setSelectedEvent(null);
    setIsEditingEvent(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, event: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedEvent(event);
    setIsEditingEvent(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, eventId: string, eventName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ eventId, eventName });
  };

  const handleModalSubmit = async (formData: EventFormData) => {
    setIsSubmittingModal(true);
    try {
      const url = isEditingEvent
        ? `/api/events/${selectedEvent?.id}`
        : '/api/events';
      
      const method = isEditingEvent ? 'PUT' : 'POST';

      let dateToSend = formData.date;
      if (formData.date && !formData.date.includes('T')) {
        dateToSend = new Date(formData.date).toISOString();
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          date: dateToSend,
          description: formData.description || null,
          status: formData.status
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar evento');
      }

      const successData = await response.json();
      
      if (isEditingEvent) {
        setEvents(events.map(e => 
          e.id === selectedEvent?.id 
            ? { ...successData.event, date: new Date(successData.event.date).toISOString() }
            : e
        ));
      } else {
        setEvents([...events, { ...successData.event, date: new Date(successData.event.date).toISOString() }]);
      }

      // Refresh stats after event change
      loadStats();

      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar evento');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeletingEvent(true);
    try {
      const response = await fetch(`/api/events/${deleteConfirm.eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar evento');
      }

      setEvents(events.filter(e => e.id !== deleteConfirm.eventId));
      setDeleteConfirm(null);
      // Refresh stats after event deletion
      loadStats();
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      setError(error instanceof Error ? error.message : 'Erro ao deletar evento');
      setDeleteConfirm(null);
    } finally {
      setIsDeletingEvent(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <Image
                src="/logo-vb.png"
                alt="VB Assessoria"
                width={180}
                height={50}
                priority
              />
            </div>

            <div className={styles.userInfo}>
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.container}>
          {/* Banner de Boas-vindas */}
          <div className={styles.welcomeBanner}>
            <div className={styles.welcomeContent}>
              <h2 className={styles.welcomeTitle}>
                Olá, {user.name || user.email.split('@')[0]}! 👋
              </h2>
              <p className={styles.welcomeSubtitle}>
                {user.role === 'ADMIN' 
                  ? `Você tem ${events.length} evento${events.length !== 1 ? 's' : ''} para gerenciar`
                  : `Você está vinculado a ${events.length} evento${events.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            <div className={styles.welcomeDecoration} />
          </div>

          {user.role === 'ADMIN' ? (
            <>
              {/* Estatísticas Rápidas - Admin */}
              {stats && (
                <div className={styles.quickStats}>
                  <div className={styles.quickStatCard}>
                    <span className={styles.quickStatValue}>{stats.totalEvents}</span>
                    <span className={styles.quickStatLabel}>Total de Eventos</span>
                  </div>
                  <div className={styles.quickStatCard}>
                    <span className={styles.quickStatValue}>
                      {stats.nextEvent 
                        ? new Date(stats.nextEvent.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                        : '—'
                      }
                    </span>
                    <span className={styles.quickStatLabel}>
                      {stats.nextEvent ? stats.nextEvent.name : 'Sem eventos próximos'}
                    </span>
                  </div>
                  <div className={styles.quickStatCard}>
                    <span className={styles.quickStatValue}>{stats.totalGuests}</span>
                    <span className={styles.quickStatLabel}>Total de Convidados</span>
                  </div>
                </div>
              )}

              {/* Cards de Acesso Rápido - Admin */}
              <div className={styles.quickAccessCards}>
                <div
                  className={styles.quickCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsUsersModalOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsUsersModalOpen(true);
                    }
                  }}
                >
                  <h3>👥 Usuários</h3>
                  <p className={styles.cardSubtitle}>Gerenciar usuários do sistema</p>
                </div>
                <div
                  className={styles.quickCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsReportsOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsReportsOpen(true);
                    }
                  }}
                >
                  <h3>📈 Relatórios</h3>
                  <p className={styles.cardSubtitle}>Visualizar relatórios gerais</p>
                </div>
              </div>

              <section className={styles.eventsSection}>
              <div className={styles.sectionHeader}>
                <h3>Todos os Eventos</h3>
                <button
                  onClick={handleCreateClick}
                  className={styles.createButton}
                >
                  + Criar Evento
                </button>
              </div>
              
              {error && (
                <div className={styles.error}>{error}</div>
              )}

              {events.length === 0 ? (
                <div className={styles.emptyStateElegant}>
                  <div className={styles.emptyIllustration}>
                    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="16" y="24" width="64" height="48" rx="12" fill="#f5e8eb" stroke="#7b2d3d" strokeWidth="2"/>
                      <rect x="28" y="36" width="40" height="24" rx="6" fill="#fff" stroke="#7b2d3d" strokeWidth="1.5"/>
                      <circle cx="48" cy="48" r="6" fill="#7b2d3d"/>
                    </svg>
                  </div>
                  <h3 className={styles.emptyTitle}>Nenhum evento cadastrado</h3>
                  <p className={styles.emptySubtitle}>Crie seu primeiro evento para começar a organizar!</p>
                  <button className={styles.emptyAction} onClick={handleCreateClick}>
                    + Criar Evento
                  </button>
                </div>
              ) : (
                <div className={styles.eventsList}>
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className={styles.eventCardWrapper}
                      style={{ animationDelay: `${0.08 * events.indexOf(event)}s` }}
                    >
                      <div className={styles.eventCardWithMenu}>
                        <Link href={`/events/${event.id}`} className={styles.eventCard}>
                          <div className={styles.eventHeader}>
                            <h4>{event.name}</h4>
                            <span
                              className={styles.eventStatus}
                              data-status={event.status.toLowerCase()}
                            >
                              {translateStatus(event.status)}
                            </span>
                          </div>
                          <p className={styles.eventDate}>
                            {new Date(event.date).toLocaleDateString('pt-BR')}
                          </p>
                          {event.description && (
                            <p className={styles.eventDescription}>{event.description}</p>
                          )}
                        </Link>
                        <div className={styles.menuWrapper}>
                          <button
                            className={styles.menuButton}
                            title="Mais ações"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedEvent(selectedEvent && selectedEvent.id === event.id ? null : event);
                            }}
                          >
                            ⋮
                          </button>
                          {selectedEvent && selectedEvent.id === event.id && (
                            <div className={styles.menuDropdown}>
                              <button
                                className={styles.menuItem}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditClick(e, event);
                                  setSelectedEvent(null);
                                }}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                className={styles.menuItemDanger}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteClick(e, event.id, event.name);
                                  setSelectedEvent(null);
                                }}
                              >
                                🗑️ Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            </>
          ) : (
            <section className={styles.eventsSection}>
              <div className={styles.sectionHeader}>
                <h3>Meus Eventos</h3>
              </div>
              {events.length === 0 ? (
                <p className={styles.emptyState}>Você não está vinculado a nenhum evento</p>
              ) : (
                <div className={styles.eventsList}>
                  {events.map((event) => (
                    <Link key={event.id} href={`/events/${event.id}/checkin`} className={styles.eventCard}>
                      <div className={styles.eventHeader}>
                        <h4>{event.name}</h4>
                        <span
                          className={styles.eventStatus}
                          data-status={event.status.toLowerCase()}
                        >
                          {translateStatus(event.status)}
                        </span>
                      </div>
                      <p className={styles.eventDate}>
                        {new Date(event.date).toLocaleDateString('pt-BR')}
                      </p>
                      {event.description && (
                        <p className={styles.eventDescription}>{event.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>&copy; 2026 VB Assessoria e Cerimonial - Todos os direitos reservados | v1.0 Beta</p>
        </div>
      </footer>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
          setIsEditingEvent(false);
        }}
        onSubmit={handleModalSubmit}
        isEditing={isEditingEvent}
        eventId={isEditingEvent ? selectedEvent?.id : undefined}
        initialData={selectedEvent ? {
          name: selectedEvent.name,
          date: new Date(selectedEvent.date).toISOString().slice(0, 16),
          description: selectedEvent.description,
          status: selectedEvent.status
        } : undefined}
        isLoading={isSubmittingModal}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Deletar Evento"
        message={`Tem certeza que deseja deletar o evento "${deleteConfirm?.eventName}"?`}
        isLoading={isDeletingEvent}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ReportsModal
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
        events={events}
      />

      <UsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
      />
    </div>
  );
}
