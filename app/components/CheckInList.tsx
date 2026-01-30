'use client';

import React, { useEffect, useState, useMemo } from 'react';
import styles from './CheckInList.module.css';

interface Guest {
  id: string;
  fullName: string;
  checkedInAt: string | null;
}

interface Stats {
  checkedIn: number;
  total: number;
  pending: number;
}

interface Toast {
  message: string;
  type: 'success' | 'warning' | 'error';
  id: string;
}

interface CheckInListProps {
  eventId: string;
}

export default function CheckInList({ eventId }: CheckInListProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<Stats>({ checkedIn: 0, total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'notCheckedIn'>('notCheckedIn');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loadingGuests, setLoadingGuests] = useState<Set<string>>(new Set());

  // Fetch guests on mount
  useEffect(() => {
    loadGuests();
  }, [eventId]);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/guests`);
      if (response.ok) {
        const data = await response.json();
        setGuests(data.guests);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading guests:', error);
      showToast('Erro ao carregar convidados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter guests by status first, then by search (status filter before search for predictable UX)
  const filteredGuests = useMemo(() => {
    const statusFiltered = guests.filter((guest) => {
      if (filterMode === 'notCheckedIn') {
        return !guest.checkedInAt;
      }
      return true;
    });

    if (!searchTerm.trim()) return statusFiltered;
    const query = searchTerm.toLowerCase();
    return statusFiltered.filter((guest) => guest.fullName.toLowerCase().includes(query));
  }, [guests, searchTerm, filterMode]);

  const visibleCount = filteredGuests.length;

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Handle check-in
  const handleCheckIn = async (guestId: string, guestName: string) => {
    setLoadingGuests((prev) => new Set([...prev, guestId]));

    try {
      const response = await fetch(`/api/events/${eventId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update guest in list
        setGuests((prev) =>
          prev.map((g) =>
            g.id === guestId ? { ...g, checkedInAt: new Date().toISOString() } : g
          )
        );

        // Update stats
        setStats((prev) => ({
          ...prev,
          checkedIn: prev.checkedIn + 1,
          pending: prev.pending - 1,
        }));

        showToast(`✅ ${guestName} entrou com sucesso`, 'success');
      } else if (data.alreadyCheckedIn) {
        showToast(`⚠️ ${guestName} já entrou`, 'warning');
      } else {
        showToast(`Erro: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error checking in guest:', error);
      showToast('Erro ao confirmar entrada', 'error');
    } finally {
      setLoadingGuests((prev) => {
        const updated = new Set(prev);
        updated.delete(guestId);
        return updated;
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⏳</div>
          <p className={styles.emptyStateText}>Carregando convidados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Check-in do Evento</h1>

        {/* Stats */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <p className={styles.statValue}>{stats.checkedIn}</p>
            <p className={styles.statLabel}>Entraram</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue} style={{ color: '#ff9800' }}>
              {stats.pending}
            </p>
            <p className={styles.statLabel}>Pendentes</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue} style={{ color: '#2196f3' }}>
              {stats.total}
            </p>
            <p className={styles.statLabel}>Total</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="🔍 Digite o nome do convidado"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          aria-label="Buscar convidado por nome"
        />
      </div>

      {/* Filter toggle + visible count */}
      <div className={styles.filterToggle}>
        <button
          className={filterMode === 'notCheckedIn' ? styles.active : ''}
          onClick={() => setFilterMode('notCheckedIn')}
          type="button"
        >
          Não entraram
        </button>

        <button
          className={filterMode === 'all' ? styles.active : ''}
          onClick={() => setFilterMode('all')}
          type="button"
        >
          Todos
        </button>
      </div>

      <div style={{ marginBottom: 12, color: '#666', fontWeight: 600 }}>
        Mostrando {visibleCount} convidado(s) {filterMode === 'notCheckedIn' ? '(Não entraram)' : ''}
      </div>

      {/* Guest List */}
      {filteredGuests.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            {searchTerm.trim() ? '🔍' : '👥'}
          </div>
          <p className={styles.emptyStateText}>
            {searchTerm.trim()
              ? `Nenhum convidado encontrado com "${searchTerm}"`
              : 'Nenhum convidado para este evento'}
          </p>
        </div>
      ) : (
        <div className={styles.guestList}>
          {filteredGuests.map((guest) => {
            const isCheckedIn = guest.checkedInAt !== null;
            const isLoading = loadingGuests.has(guest.id);

            return (
              <div key={guest.id} className={styles.guestRow}>
                <div className={styles.guestInfo}>
                  <h3 className={styles.guestName}>{guest.fullName}</h3>
                  <div className={styles.guestMeta}>

                    <div
                      className={`${styles.statusBadge} ${
                        isCheckedIn ? styles.statusBadge_checkedIn : styles.statusBadge_pending
                      }`}
                    >
                      {isCheckedIn ? '✅ Entrou' : '⊘ Não entrou'}
                    </div>
                    {isCheckedIn && guest.checkedInAt && (
                      <div className={styles.checkInTime}>
                        {new Date(guest.checkedInAt).toLocaleTimeString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.actionGroup}>
                  {isCheckedIn ? (
                    // Undo button for already checked-in guests
                    <button
                      className={styles.undoButton}
                      onClick={async () => {
                        if (isLoading) return;
                        const ok = window.confirm(`Deseja desfazer o check-in de ${guest.fullName}?`);
                        if (!ok) return;
                        setLoadingGuests((prev) => new Set([...prev, guest.id]));
                        try {
                          const res = await fetch(`/api/events/${eventId}/check-in/undo`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ guestId: guest.id }),
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            // Update local state
                            setGuests((prev) => prev.map((g) => (g.id === guest.id ? { ...g, checkedInAt: null } : g)));
                            setStats((prev) => ({ ...prev, checkedIn: Math.max(0, prev.checkedIn - 1), pending: prev.pending + 1 }));
                            showToast('🟡 Check-in desfeito com sucesso', 'warning');
                          } else if (res.status === 409) {
                            showToast(data.error || 'Este convidado ainda não realizou check-in.', 'error');
                          } else {
                            showToast(data.error || 'Erro ao desfazer check-in', 'error');
                          }
                        } catch (err) {
                          console.error(err);
                          showToast('Erro ao desfazer check-in', 'error');
                        } finally {
                          setLoadingGuests((prev) => {
                            const updated = new Set(prev);
                            updated.delete(guest.id);
                            return updated;
                          });
                        }
                      }}
                      disabled={isLoading}
                      aria-label={`Desfazer entrada de ${guest.fullName}`}
                    >
                      🔁 Desfazer entrada
                    </button>
                  ) : (
                    <button
                      className={`${styles.checkInButton} ${isLoading ? styles.checkInButton_loading : ''}`}
                      onClick={() => handleCheckIn(guest.id, guest.fullName)}
                      disabled={isLoading}
                      aria-label={`Confirmar entrada de ${guest.fullName}`}
                    >
                      {isLoading ? '...' : 'Confirmar entrada'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toasts */}
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
