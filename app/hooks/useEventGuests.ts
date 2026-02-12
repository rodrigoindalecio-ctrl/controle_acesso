import { useEffect, useRef, useState, useCallback } from 'react';

export interface Guest {
  id: string;
  fullName: string;
  category?: string;
  tableNumber?: string;
  checkedInAt?: string | null;
  isPaying?: boolean | null;
  isManual?: boolean;
  isChild?: boolean;
  childAge?: number;
}

export type GuestCreatePayload = {
  fullName: string;
  category?: string;
  tableNumber?: string;
};

export function useEventGuests(eventId: string) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUpdatedAtRef = useRef<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch guests list
  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/guests`);
      if (!res.ok) throw new Error('Erro ao buscar convidados');
      const data = await res.json();
      setGuests(data.guests || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Fetch sync metadata
  const fetchSync = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/sync`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.updatedAt && data.updatedAt !== lastUpdatedAtRef.current) {
        lastUpdatedAtRef.current = data.updatedAt;
        fetchGuests(); // silent refetch
      }
    } catch {}
  }, [eventId, fetchGuests]);

  // Initial fetch
  useEffect(() => {
    fetchGuests().then(() => {
      // Get initial updatedAt
      fetch(`/api/events/${eventId}/sync`).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          lastUpdatedAtRef.current = data.updatedAt || null;
        }
      });
    });
    // eslint-disable-next-line
  }, [eventId]);

  // Polling
  useEffect(() => {
    function shouldPoll() {
      return !document.hidden && navigator.onLine;
    }
    function poll() {
      if (shouldPoll()) fetchSync();
    }
    pollingRef.current = setInterval(poll, 12000); // 12s
    document.addEventListener('visibilitychange', poll);
    window.addEventListener('online', poll);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', poll);
      window.removeEventListener('online', poll);
    };
  }, [fetchSync]);

  // Actions
  const checkInGuest = useCallback(async (id: string, isPaying: boolean = true) => {
    setGuests((prev) => prev.map(g => g.id === id ? { ...g, checkedInAt: new Date().toISOString(), isPaying } : g));
    await fetch(`/api/guests/${id}/attendance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ present: true, isPaying }),
    });
    fetchSync();
  }, [fetchSync]);

  const undoCheckIn = useCallback(async (id: string) => {
    setGuests((prev) => prev.map(g => g.id === id ? { ...g, checkedInAt: null } : g));
    await fetch(`/api/guests/${id}/attendance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ present: false }),
    });
    fetchSync();
  }, [fetchSync]);

  const createGuest = useCallback(async (payload: GuestCreatePayload) => {
    setLoading(true);
    await fetch(`/api/events/${eventId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await fetchGuests();
    fetchSync();
  }, [eventId, fetchGuests, fetchSync]);

  const deleteGuest = useCallback(async (id: string) => {
    setGuests((prev) => prev.filter(g => g.id !== id));
    await fetch(`/api/guests/${id}`, { method: 'DELETE' });
    fetchSync();
  }, [fetchSync]);

  return {
    guests,
    loading,
    error,
    checkInGuest,
    undoCheckIn,
    createGuest,
    deleteGuest,
    refetch: fetchGuests,
  };
}
