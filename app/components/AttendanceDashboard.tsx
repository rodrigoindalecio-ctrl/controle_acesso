'use client';

import { useEffect, useState } from 'react';

import styles from './AttendanceDashboard.module.css';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface Guest {
  id: string;
  fullName: string;
  category: string;
  tableNumber?: string;
  checkedInAt?: string;
  isChild: boolean;
  isPaying?: boolean;
}

export default function AttendanceDashboard({ eventId }: { eventId: string }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGuests();
  }, [eventId]);

  const loadGuests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/guests`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar convidados');
      }

      const data = await response.json();
      setGuests(data.guests || []);
      setError('');
    } catch (err) {
      console.error('Erro ao carregar convidados:', err);
      setError('Erro ao carregar dados de presença');
    } finally {
      setLoading(false);
    }
  };

  const checkedIn = guests.filter(g => g.checkedInAt).length;
  const absent = guests.filter(g => !g.checkedInAt).length;
  const percentage = guests.length > 0 ? Math.round((checkedIn / guests.length) * 100) : 0;

  // Pagantes e não pagantes (apenas entre os presentes)
  const presentGuests = guests.filter(g => g.checkedInAt);
  const paying = presentGuests.filter(g => g.isPaying === true).length;
  const nonPaying = presentGuests.filter(g => g.isPaying === false).length;

  if (loading) {
    return <LoadingSpinner message="Carregando dados de presença..." size="large" />;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📊 Check-in de Convidados</h2>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.counters}>
        <div className={styles.counter}>
          <div className={styles.counterLabel}>TOTAL</div>
          <div className={styles.counterValue}>{guests.length}</div>
        </div>

        <div className={styles.counter}>
          <div className={styles.counterLabel}>PRESENÇA</div>
          <div className={styles.percentage}>{percentage}%</div>
        </div>
        
        <div className={styles.counter}>
          <div className={styles.counterLabel}>PRESENTES</div>
          <div className={`${styles.counterValue} ${styles.present}`}>
            {checkedIn}
          </div>
        </div>
        
        <div className={styles.counter}>
          <div className={styles.counterLabel}>AUSENTES</div>
          <div className={`${styles.counterValue} ${styles.absent}`}>
            {absent}
          </div>
        </div>      

      </div>

      {/* Pagantes e Não Pagantes */}
      <div className={styles.paymentSection}>
        <h4 className={styles.paymentTitle}>Presentes por Pagamento</h4>
        <div className={styles.paymentGrid}>
          <div className={styles.paymentItem}>
            <span className={styles.paymentLabel}>Pagantes</span>
            <span className={styles.paymentValue} style={{ color: 'var(--color-success)' }}>{paying}</span>
          </div>
          <div className={styles.paymentItem}>
            <span className={styles.paymentLabel}>Não Pagantes</span>
            <span className={styles.paymentValue} style={{ color: 'var(--color-primary)' }}>{nonPaying}</span>
          </div>
        </div>
      </div>

      {/* Resumo por Categoria */}
      <div className={styles.chartCard}>
        <h3>Resumo por Categoria</h3>
        <div className={styles.categoryList}>
          {guests.length === 0 ? (
            <p className={styles.empty}>Nenhum convidado registrado</p>
          ) : (
            Object.entries(
              guests.reduce((acc, guest) => {
                const cat = guest.category || 'Sem categoria';
                if (!acc[cat]) {
                  acc[cat] = { total: 0, present: 0 };
                }
                acc[cat].total++;
                if (guest.checkedInAt) {
                  acc[cat].present++;
                }
                return acc;
              }, {} as Record<string, { total: number; present: number }>))
            .map(([category, data]) => (
              <div key={category} className={styles.categoryRow}>
                <div className={styles.categoryName}>{category}</div>
                <div className={styles.categoryStats}>
                  <span className={styles.present}>{data.present}</span>
                  <span className={styles.separator}>/</span>
                  <span>{data.total}</span>
                </div>
                <div className={styles.categoryBar}>
                  <div 
                    className={styles.categoryFill}
                    style={{
                      width: `${(data.present / data.total) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
