'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LogOut, Check, X, Users, Loader2, LayoutGrid } from 'lucide-react';
import styles from './page.module.css';
import TablesModal from '@/app/components/TablesModal';

interface Guest {
    id: string;
    fullName: string;
    category: string;
    tableNumber?: string;
    checkedInAt?: string | null;
    isPaying: boolean;
}

export default function AssistantDashboard() {
    const router = useRouter();
    const [guests, setGuests] = useState<Guest[]>([]);
    const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ name: string, eventId: number } | null>(null);
    const [eventName, setEventName] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isTablesModalOpen, setIsTablesModalOpen] = useState(false);

    const checkAuth = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.user && data.user.role === 'TEMP_STAFF') {
                setUser({ name: data.user.name, eventId: data.user.eventId });
                return data.user.eventId;
            } else {
                router.push('/');
                return null;
            }
        } catch (err) {
            router.push('/');
            return null;
        }
    }, [router]);

    const fetchGuests = useCallback(async (eventId: number) => {
        try {
            const res = await fetch(`/api/events/${eventId}/guests`);
            if (res.ok) {
                const data = await res.json();
                setGuests(data.guests || []);
                setFilteredGuests(data.guests || []);
            }
        } catch (err) {
            console.error('Error fetching guests:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEventName = useCallback(async (eventId: number) => {
        try {
            const res = await fetch(`/api/events/${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setEventName(data.event?.name || 'Evento');
            }
        } catch (err) { }
    }, []);

    useEffect(() => {
        const init = async () => {
            const eventId = await checkAuth();
            if (eventId) {
                await fetchEventName(eventId);
                await fetchGuests(eventId);
            } else {
                setLoading(false);
            }
        };
        init();
    }, [checkAuth, fetchEventName, fetchGuests]);

    useEffect(() => {
        const filtered = guests.filter(g =>
            g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredGuests(filtered);
    }, [searchTerm, guests]);

    const handleCheckIn = async (guestId: string) => {
        if (!user) return;
        setProcessingId(guestId);
        try {
            const res = await fetch(`/api/events/${user.eventId}/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestId, isPaying: true })
            });

            if (res.ok) {
                setGuests(prev => prev.map(g =>
                    g.id === guestId ? { ...g, checkedInAt: new Date().toISOString() } : g
                ));
            }
        } catch (err) {
            alert('Erro ao realizar check-in');
        } finally {
            setProcessingId(null);
        }
    };

    const handleUndo = async (guestId: string) => {
        if (!user) return;
        setProcessingId(guestId);
        try {
            const res = await fetch(`/api/events/${user.eventId}/check-in/undo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestId, undoReason: 'Correção pelo ajudante' })
            });

            if (res.ok) {
                setGuests(prev => prev.map(g =>
                    g.id === guestId ? { ...g, checkedInAt: null } : g
                ));
            }
        } catch (err) {
            alert('Erro ao desfazer check-in');
        } finally {
            setProcessingId(null);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spinner} size={48} />
                <p>Carregando lista de convidados...</p>
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <h1 className={styles.title}>{eventName}</h1>
                        <p className={styles.helperName}>Ajudante: {user?.name}</p>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            onClick={() => setIsTablesModalOpen(true)}
                            className={styles.tablesBtn}
                            title="Visualizar Mesas"
                        >
                            <LayoutGrid size={20} />
                            <span>Mesas</span>
                        </button>
                        <button onClick={handleLogout} className={styles.logoutBtn} title="Sair">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                <div className={styles.searchContainer}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou mesa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                        autoFocus
                    />
                    {searchTerm && (
                        <button
                            className={styles.clearSearchBtn}
                            onClick={() => setSearchTerm('')}
                            title="Limpar busca"
                            type="button"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </header>

            <main className={styles.content}>
                <div className={styles.quickStats}>
                    <div className={styles.stat}>
                        <Users size={16} />
                        <span>{filteredGuests.length} encontrados</span>
                    </div>
                    <div className={styles.stat}>
                        <Check size={16} />
                        <span>{guests.filter(g => g.checkedInAt).length} presentes</span>
                    </div>
                </div>

                <div className={styles.guestList}>
                    {filteredGuests.length > 0 ? (
                        filteredGuests.map(guest => (
                            <div key={guest.id} className={`${styles.guestCard} ${guest.checkedInAt ? styles.checkedIn : ''}`}>
                                <div className={styles.guestInfo}>
                                    <h3 className={styles.guestName}>{guest.fullName}</h3>
                                    <div className={styles.guestMeta}>
                                        <span className={styles.category}>{guest.category}</span>
                                        {guest.tableNumber && <span className={styles.table}>Mesa {guest.tableNumber}</span>}
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    {guest.checkedInAt ? (
                                        <div className={styles.checkedInStatus}>
                                            <Check size={18} />
                                            <span>Presente</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleCheckIn(guest.id)}
                                            disabled={!!processingId}
                                            className={styles.checkInBtn}
                                        >
                                            {processingId === guest.id ? <Loader2 className={styles.btnSpinner} /> : <Check size={20} />}
                                            <span>Check-in</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <p>Nenhum convidado encontrado com "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </main>

            {user && (
                <TablesModal
                    isOpen={isTablesModalOpen}
                    onClose={() => setIsTablesModalOpen(false)}
                    eventId={String(user.eventId)}
                />
            )}
        </div>
    );
}
