/**
 * P4.2: Hook para buscar relatório de check-in com polling leve
 */

import { useEffect, useState } from 'react';
import { CheckInReport } from '@/lib/report/generateCheckInReport';

interface UseCheckInReportReturn {
  report: CheckInReport | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCheckInReport(eventId: string): UseCheckInReportReturn {
  const [report, setReport] = useState<CheckInReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!eventId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/checkin-report`);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Não autenticado');
        } else if (response.status === 403) {
          setError('Acesso negado');
        } else {
          setError('Erro ao buscar relatório');
        }
        setReport(null);
        return;
      }

      const data = await response.json();
      setReport(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching check-in report:', err);
      setError('Erro ao buscar relatório');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch inicial e polling leve (a cada 30s)
  useEffect(() => {
    fetchReport();

    const interval = setInterval(() => {
      fetchReport();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [eventId]);

  return {
    report,
    loading,
    error,
    refetch: fetchReport,
  };
}
