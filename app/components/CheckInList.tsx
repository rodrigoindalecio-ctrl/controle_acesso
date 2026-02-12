'use client';


import React, { useState, useMemo } from 'react';
import CheckInConfirmModal from './CheckInConfirmModal';
import TablesModal from './TablesModal';
import EventAttendanceCard from './EventAttendanceCard';
import CategoryAttendance from './CategoryAttendance';
import { generateEventReport } from '@/app/utils/exportToPdf';
import { Guest } from '@/app/hooks/useEventGuests';
import styles from './CheckInList.module.css';
import buttonStyles from '@/lib/buttons.module.css';
import { statusTranslation, translateStatus } from '@/lib/statusUtils';

interface CheckInListProps {
  eventId: string;
  eventName: string;
  eventDescription?: string;
  eventDate?: string;
  eventLocation?: string;
  eventStatus?: string;
  guests: Guest[];
  loading: boolean;
  stats: {
    total: number;
    checkedIn: number;
    pending: number;
    paying: number;
    nonPaying: number;
  };
  checkInGuest: (id: string) => Promise<void>;
  undoCheckIn: (id: string) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  error?: string | null;
}

function CheckInList({
  eventId,
  eventName,
  guests = [],
  loading,
  stats = { total: 0, checkedIn: 0, pending: 0, paying: 0, nonPaying: 0 },
  checkInGuest,
  undoCheckIn,
  deleteGuest,
  error,
  eventDescription,
  eventDate,
  eventLocation,
  eventStatus
}: CheckInListProps) {
  const [showTablesModal, setShowTablesModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked-in' | 'pending'>('pending');
  const [showStatsModal, setShowStatsModal] = useState(false);
  // guests otimista
  const [localGuests, setLocalGuests] = useState<Guest[]>(guests);

  // Sincroniza localGuests com guests do backend (polling/refetch)
  React.useEffect(() => {
    // Só atualiza localGuests se guests realmente mudarem (deep compare por id/checkedInAt)
    const isDifferent =
      guests.length !== localGuests.length ||
      guests.some((g, i) =>
        g.id !== localGuests[i]?.id || g.checkedInAt !== localGuests[i]?.checkedInAt
      );
    if (isDifferent) {
      setLocalGuests(guests);
    }
  }, [guests]);



  // Filtros e busca aplicados inline no render

  const openConfirm = (guest: Guest) => {
    setSelectedGuest(guest);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedGuest(null);
  };

  const handleConfirm = async (isNonPaying: boolean) => {
    if (!selectedGuest) return;
    setModalLoading(true);
    try {
      // Atualização otimista: marca checkedInAt localmente
      setLocalGuests(prev => prev.map(g =>
        g.id === selectedGuest.id ? { ...g, checkedInAt: new Date().toISOString() } : g
      ));
      await checkInGuest(selectedGuest.id);
      closeModal();
    } finally {
      setModalLoading(false);
    }
  };

  const handleUndo = async (guest: any) => {
    // Atualização otimista: remove checkedInAt localmente
    setLocalGuests(prev => prev.map(g =>
      g.id === guest.id ? { ...g, checkedInAt: null } : g
    ));
    await undoCheckIn(guest.id);
  };


  // stats é recebido via props

  const attendancePercentage = stats.total > 0 
    ? Math.round((stats.checkedIn / stats.total) * 100)
    : 0;

  // Nunca exibe loading global para a lista principal


  return (
    <div className={styles.container}>
      <div className={styles.header} style={{background:'#fff', borderRadius:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', padding:'32px', margin:'24px auto', maxWidth:'900px'}}>
        <h1 className={styles.title} style={{fontSize:'2.2rem', fontWeight:'bold', marginBottom:'8px'}}>{eventName}</h1>
        <p className={styles.subtitle} style={{fontSize:'1.1rem', color:'#7b2d3d', marginBottom:'24px'}}>Check-in de Convidados</p>
        <div style={{display:'flex', gap:'32px', marginTop:'16px'}}>
          <div>
            <span style={{fontWeight:'bold', color:'#7b2d3d', fontSize:'1rem'}}>DATA E HORA</span><br/>
            <span style={{color:'#222', fontSize:'1.05rem'}}>{eventDate ? new Date(eventDate).toLocaleString('pt-BR', {weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '-'}</span>
          </div>
          <div>
            <span style={{fontWeight:'bold', color:'#7b2d3d', fontSize:'1rem'}}>STATUS</span><br/>
            <span style={{color:'#222', fontSize:'1.05rem'}}>{eventStatus ? (statusTranslation[eventStatus.toUpperCase()] || eventStatus) : '-'}</span>
          </div>
          <div>
            <span style={{fontWeight:'bold', color:'#7b2d3d', fontSize:'1rem'}}>DESCRIÇÃO</span><br/>
            <span style={{color:'#222', fontSize:'1.05rem'}}>{eventDescription || '-'}</span>
          </div>
        </div>
      </div>

      {/* Controles: busca, filtros, estatísticas, exportação */}
      <div className={styles.searchContainer}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar por nome, categoria ou mesa..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className={styles.filterBar}>
        <div className={styles.filterToggle}>
          <button
            className={filterStatus === 'pending' ? `${styles.active} ${styles.filterBtn}` : styles.filterBtn}
            onClick={() => setFilterStatus('pending')}
          >
            Pendente ({stats.pending || 0})
          </button>
          <button
            className={filterStatus === 'checked-in' ? `${styles.active} ${styles.filterBtn}` : styles.filterBtn}
            onClick={() => setFilterStatus('checked-in')}
          >
            ✓ Presentes ({stats.checkedIn || 0})
          </button>
          <button
            className={filterStatus === 'all' ? `${styles.active} ${styles.filterBtn}` : styles.filterBtn}
            onClick={() => setFilterStatus('all')}
          >
            Todos ({stats.total || 0})
          </button>
          <button
            className={styles.statsBtn}
            onClick={() => setShowStatsModal(true)}
          >
            Estatísticas
          </button>
        <span style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <button
            className={styles.exportButton}
            onClick={() => setShowTablesModal(true)}
          >
            Mesas
          </button>
        </span>
        </div>
        <button
          className={styles.exportButton}
          onClick={() => generateEventReport(guests.map((g: Guest) => ({ ...g, checkedInAt: g.checkedInAt ?? null })), { ...stats, eventName })}
          title="Exportar lista de convidados para PDF"
          disabled={guests.length === 0}
          style={guests.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          Exportar para PDF
        </button>
      </div>
      {/* Modal de Mesas */}
      {showTablesModal && (
        <TablesModal eventId={eventId} isOpen={showTablesModal} onClose={() => setShowTablesModal(false)} />
      )}

      {/* Lista de convidados com filtro ativo e atualização otimista */}
      {(() => {
        let filteredGuests = localGuests;
        if (filterStatus === 'pending') {
          filteredGuests = localGuests.filter(g => !g.checkedInAt);
        } else if (filterStatus === 'checked-in') {
          filteredGuests = localGuests.filter(g => g.checkedInAt);
        }
        // Filtro de busca por nome, categoria ou mesa
        if (searchTerm.trim() !== '') {
          const term = searchTerm.trim().toLowerCase();
          filteredGuests = filteredGuests.filter(g => {
            const nameMatch = g.fullName?.toLowerCase().includes(term);
            const categoryMatch = g.category?.toLowerCase().includes(term);
            const tableMatch = g.tableNumber ? String(g.tableNumber).toLowerCase().includes(term) : false;
            return nameMatch || categoryMatch || tableMatch;
          });
        }
        return filteredGuests.length > 0 ? (
          <div className={styles.guestList}>
            {filteredGuests.map((guest: Guest) => (
              <div key={guest.id} className={styles.guestRow}>
                <div className={styles.guestInfo}>
                  <span className={styles.guestName}>{guest.fullName}</span>
                  <div className={styles.guestMeta}>
                    {guest.category && <span className={styles.guestCategory}>{guest.category}</span>}
                    {guest.tableNumber && <span className={styles.guestTable}>Mesa {guest.tableNumber}</span>}
                    {guest.isManual === true && <span className={styles.badge}>Manual</span>}
                  </div>
                </div>
                <div className={styles.guestMeta}>
                  <span className={styles.statusBadge + ' ' + (guest.checkedInAt ? styles.statusBadge_checkedIn : styles.statusBadge_pending)}>
                    {guest.checkedInAt ? '✓ Presente' : 'Pendente'}
                  </span>
                  <div className={styles.actionGroup}>
                    {guest.checkedInAt ? (
                      <button className={styles.undoButton} onClick={() => handleUndo(guest)} title="Desfazer check-in">Desfazer check-in</button>
                    ) : (
                      <button className={styles.checkInButton} onClick={() => openConfirm(guest)} title="Confirmar presença">Confirmar presença</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateIcon}>😶</span>
            <p className={styles.emptyStateText}>Nenhum convidado encontrado.</p>
          </div>
        );
      })()}

      {/* Modal Estatísticas */}
      {showStatsModal && (
        <div className={styles.statsModalOverlay} onClick={() => setShowStatsModal(false)}>
          <div className={styles.statsModal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowStatsModal(false)}>Fechar</button>
            {/* Card único de estatísticas para admin e colaborador */}
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: 24 }}>
                <span style={{ fontSize: 22, fontWeight: 700, marginRight: 12, color: '#6b47dc' }}>📊 Check-in de Convidados</span>
                {/* Cards de totais */}
                <div style={{ display: 'flex', gap: 18 }}>
                  <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '12px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#888' }}>TOTAL</div>
                    <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.total}</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '12px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#888' }}>PRESENTES</div>
                    <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.checkedIn}</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '12px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#888' }}>AUSENTES</div>
                    <div style={{ fontWeight: 700, fontSize: 22 }}>{stats.total - stats.checkedIn}</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '12px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#888' }}>PRESENÇA</div>
                    <div style={{ fontWeight: 700, fontSize: 22, color: '#7b2d3d' }}>{stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Card de presença com gráfico e legenda */}
                <div style={{ flex: 1, minWidth: 260, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: 24 }}>
                  <h3 style={{ marginBottom: 12 }}>Presença</h3>
                  <EventAttendanceCard checkedIn={stats.checkedIn} total={stats.total} pending={stats.pending} />
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#388e3c', fontSize: 14 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 5, background: '#388e3c', display: 'inline-block' }}></span>
                      Presente ({stats.checkedIn})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d32f2f', fontSize: 14 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 5, background: '#d32f2f', display: 'inline-block' }}></span>
                      Ausente ({stats.total - stats.checkedIn})
                    </div>
                  </div>
                </div>
                {/* Card Resumo por Categoria */}
                <div style={{ flex: 1, minWidth: 260, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: 24 }}>
                  <h3 style={{ marginBottom: 12 }}>Resumo por Categoria</h3>
                  <CategoryAttendance guests={guests.map((g: Guest) => ({ ...g, checkedInAt: g.checkedInAt ?? null }))} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <CheckInConfirmModal
        guestName={selectedGuest?.fullName || ''}
        isOpen={modalOpen}
        onConfirm={handleConfirm}
        onCancel={closeModal}
        isLoading={modalLoading}
      />
    </div>
  );
};

export default CheckInList;
