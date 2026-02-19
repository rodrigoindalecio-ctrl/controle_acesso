/**
 * P4.3: Hook para buscar histórico de um convidado
 */

import { useEffect, useState } from 'react';
export interface GuestHistoryResponse {
  history: {
    type: 'checkin' | 'undo';
    timestamp: string;
    userId?: string;
    reason?: string;
  }[];
}

interface UseGuestHistoryReturn {
  history: GuestHistoryResponse | null;
  loading: boolean;
  error: string | null;
}

export function useGuestHistory(
  eventId: string,
  guestId: string | null
): UseGuestHistoryReturn {
  const [history, setHistory] = useState<GuestHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId || !guestId) {
      setHistory(null);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/events/${eventId}/guests/${guestId}/history`
        );

        if (!response.ok) {
          if (response.status === 401) {
            setError('Não autenticado');
          } else if (response.status === 403) {
            setError('Acesso negado');
          } else {
            setError('Erro ao buscar histórico');
          }
          setHistory(null);
          return;
        }

        const data = await response.json();
        setHistory(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching guest history:', err);
        setError('Erro ao buscar histórico');
        setHistory(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [eventId, guestId]);

  return {
    history,
    loading,
    error,
  };
}
