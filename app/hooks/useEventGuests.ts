import { useEffect, useRef, useState, useCallback } from 'react';
import { enqueueAction, getOfflineQueue, removeActionFromQueue } from '@/app/lib/offlineQueue';

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
  const [pendingSyncs, setPendingSyncs] = useState<number>(0);

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
    } catch { }
  }, [eventId, fetchGuests]);

  const updatePendingCount = useCallback(() => {
    setPendingSyncs(getOfflineQueue().length);
  }, []);

  // Process offline queue
  const processQueue = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    let hasSuccess = false;
    for (const action of queue) {
      try {
        const res = await fetch(action.endpoint, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: Object.keys(action.payload).length > 0 ? JSON.stringify(action.payload) : undefined,
        });

        if (res.ok) {
          removeActionFromQueue(action.id);
          hasSuccess = true;
        } else if (res.status >= 400 && res.status < 500) {
          // Remover da fila se for um erro do lado do cliente (ex: convidado já deletado) para não travar a fila
          removeActionFromQueue(action.id);
        }
      } catch {
        // Ocorreu erro de rede novamente; para e tenta no próximo ciclo de polling
        break;
      }
    }

    updatePendingCount();
    if (hasSuccess) {
      fetchSync();
    }
  }, [fetchSync, updatePendingCount]);

  // Initial fetch
  useEffect(() => {
    updatePendingCount();
    fetchGuests().then(() => {
      // Get initial updatedAt
      fetch(`/api/events/${eventId}/sync`).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          lastUpdatedAtRef.current = data.updatedAt || null;
        }
      });
      processQueue();
    });
    // eslint-disable-next-line
  }, [eventId]);

  // Polling
  useEffect(() => {
    function shouldPoll() {
      return !document.hidden && navigator.onLine;
    }
    function poll() {
      if (shouldPoll()) {
        processQueue(); // Tenta limpar a fila antes de sincronizar
        fetchSync();
      }
    }
    pollingRef.current = setInterval(poll, 12000); // 12s
    document.addEventListener('visibilitychange', poll);
    window.addEventListener('online', poll);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', poll);
      window.removeEventListener('online', poll);
    };
  }, [fetchSync, processQueue]);

  // General Dispatch fallback
  const dispatchAction = useCallback(async (
    actionType: 'CHECK_IN' | 'UNDO_CHECK_IN' | 'CREATE_GUEST' | 'DELETE_GUEST',
    endpoint: string,
    method: string,
    payload: any
  ) => {
    if (navigator.onLine) {
      try {
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined
        });
        if (res.ok) {
          fetchSync();
          return true;
        }
      } catch (err) {
        // Se cair no catch (Falha de fetch por rede intermitente), desce pro fallback de offline queue.
      }
    }

    // Fallback pra Offline Queue
    enqueueAction(actionType, endpoint, method, payload);
    updatePendingCount();
    return false;
  }, [fetchSync, updatePendingCount]);

  // Actions
  const checkInGuest = useCallback(async (id: string, isPaying: boolean = true) => {
    setGuests((prev) => prev.map(g => g.id === id ? { ...g, checkedInAt: new Date().toISOString(), isPaying } : g));
    await dispatchAction('CHECK_IN', `/api/guests/${id}/attendance`, 'PATCH', { present: true, isPaying });
  }, [dispatchAction]);

  const undoCheckIn = useCallback(async (id: string) => {
    setGuests((prev) => prev.map(g => g.id === id ? { ...g, checkedInAt: null } : g));
    await dispatchAction('UNDO_CHECK_IN', `/api/guests/${id}/attendance`, 'PATCH', { present: false });
  }, [dispatchAction]);

  const createGuest = useCallback(async (payload: GuestCreatePayload) => {
    // Cadastro não é garantido imediato pela otimização, então marcamos 'temp' no ID e forçamos o Fetch do Banco.
    // Assim que a internet voltar, a API devolve com o ID correto (cuid) pro DOM do React amarrar.
    const newGuest = { id: `temp-${Date.now()}`, ...payload, isManual: true };
    setGuests(prev => [...prev, newGuest as Guest]);
    await dispatchAction('CREATE_GUEST', `/api/events/${eventId}/guests`, 'POST', payload);
  }, [eventId, dispatchAction]);

  const deleteGuest = useCallback(async (id: string) => {
    setGuests((prev) => prev.filter(g => g.id !== id));
    await dispatchAction('DELETE_GUEST', `/api/guests/${id}`, 'DELETE', {});
  }, [dispatchAction]);

  return {
    guests,
    loading,
    error,
    pendingSyncs,
    checkInGuest,
    undoCheckIn,
    createGuest,
    deleteGuest,
    refetch: fetchGuests,
  };
}
