'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import ImportGuestsModal from './ImportGuestsModal';
import AddGuestModal from './AddGuestModal';
import styles from './GuestManagement.module.css';
import GuestCheckInList from './event/GuestCheckInList';
import TablesModal from './TablesModal';
import ConfirmDialog from './ConfirmDialog';
import CheckInConfirmModal from './CheckInConfirmModal';
import CheckInSuccessOverlay from './CheckInSuccessOverlay';
import AttendanceDashboard from './AttendanceDashboard';
import buttonStyles from '@/lib/buttons.module.css';
import { statusTranslation, translateStatus } from '@/lib/statusUtils';

interface Guest {
  id: string;
  fullName: string;
  category: string;
  tableNumber?: string;
  isPaying: boolean;
  isChild: boolean;
  childAge?: number;
  checkedInAt?: string;
  isManual: boolean;
}

interface EditingGuest {
  id: string;
  fullName: string;
  category: string;
  tableNumber?: string;
  isPaying: boolean;
  isChild: boolean;
  childAge?: number;
}

interface Props {
  eventId: string;
  eventName?: string;
  eventDate?: string;
  eventDescription?: string;
  eventStatus?: string;
}

export default function GuestManagement({ eventId, eventName, eventDate, eventDescription, eventStatus }: Props) {
    const { user } = useAuth();
    // Função padrão para check-in/desfazer check-in igual à página de colaboradores
    // Check-in admin: usa o mesmo fluxo do sistema (POST /api/events/[eventId]/check-in)
    // Check-in admin: sempre usa a rota oficial do sistema
    // Modal state for check-in confirmation
    const [checkInModalOpen, setCheckInModalOpen] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [successGuest, setSuccessGuest] = useState<Guest | null>(null);

    const [showAddGuestChoiceModal, setShowAddGuestChoiceModal] = useState(false);

    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [detailsExpanded, setDetailsExpanded] = useState(true);

    useEffect(() => {
      const mq = window.matchMedia('(max-width: 520px)');
      const apply = () => {
        const small = mq.matches;
        setIsSmallScreen(small);
        setDetailsExpanded(!small);
      };

      apply();
      const onChange = () => apply();
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
      }
      mq.addListener(onChange);
      return () => mq.removeListener(onChange);
    }, []);

    useEffect(() => {
      if (!showAddGuestChoiceModal) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowAddGuestChoiceModal(false);
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [showAddGuestChoiceModal]);

    // Open modal instead of direct check-in
    const handleCheckInClick = (guest: Guest) => {
      setSelectedGuest(guest);
      setCheckInModalOpen(true);
    };

    // Confirm check-in with modal
    const handleConfirmCheckIn = async (isNonPaying: boolean) => {
      if (!selectedGuest) return;
      setCheckInLoading(true);
      try {
        // Check-in: POST /api/events/{eventId}/check-in
        const response = await fetch(`/api/events/${eventId}/check-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ guestId: selectedGuest.id, isPaying: !isNonPaying }),
        });
        if (!response.ok) {
          let errorMsg = 'Erro ao confirmar presença';
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch {}
          throw new Error(errorMsg);
        }
        setGuests(guests => guests.map(g =>
          g.id === selectedGuest.id ? { ...g, checkedInAt: new Date().toISOString(), isPaying: !isNonPaying } : g
        ));
        // Exibir overlay de sucesso verde
        setSuccessGuest({ ...selectedGuest, checkedInAt: new Date().toISOString() });
        setCheckInModalOpen(false);
        setSelectedGuest(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar presença');
      } finally {
        setCheckInLoading(false);
      }
    };

    // Undo check-in (no modal)
    const handleUndoCheckIn = async (guestId: string) => {
      try {
        const response = await fetch(`/api/guests/${guestId}/attendance`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ present: false }),
        });
        if (!response.ok) {
          let errorMsg = 'Erro ao desfazer presença';
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch {}
          throw new Error(errorMsg);
        }
        setGuests(guests => guests.map(g =>
          g.id === guestId ? { ...g, checkedInAt: undefined } : g
        ));
        setSuccessMessage('Presença desfeita!');
        setTimeout(() => setSuccessMessage(''), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar presença');
      }
    };
  const [showFilter, setShowFilter] = useState<string | null>(null);
  // Fecha popup ao clicar fora
  useEffect(() => {
    if (!showFilter) return;
    const handleClick = (e: MouseEvent) => {
      const popups = document.querySelectorAll('.' + styles.filterPopup);
      let clickedInside = false;
      popups.forEach(popup => {
        if (popup.contains(e.target as Node)) clickedInside = true;
      });
      // Se não clicou no popup nem no título, fecha
      if (!clickedInside) setShowFilter(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFilter]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGuest, setEditingGuest] = useState<EditingGuest | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [isDeletingGuest, setIsDeletingGuest] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isSavingGuest, setIsSavingGuest] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [showTablesModal, setShowTablesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    name: '',
    category: '',
    table: '',
    type: '',
    status: 'pendente'
  });

  const [hasEventAccess, setHasEventAccess] = useState<boolean | null>(null);
  const canManageEvent = user?.role === 'ADMIN' || hasEventAccess === true;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  // Carregar convidados
  const fetchGuests = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await fetch(`/api/events/${eventId}/guests`);

      if (response.status === 403) {
        setHasEventAccess(false);
        throw new Error('Acesso negado ao evento');
      }

      if (response.ok) {
        setHasEventAccess(true);
      }

      if (!response.ok) {
        throw new Error('Erro ao carregar convidados');
      }

      const data = await response.json();
      const loadedGuests = data.guests || [];
      setGuests(loadedGuests);
      setFilteredGuests(loadedGuests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar convidados');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests(true);

    // Polling: atualiza automaticamente a cada 7 segundos
    const interval = setInterval(() => {
      fetchGuests(false);
    }, 7000);

    return () => clearInterval(interval);
  }, [eventId]);

  // Aplicar filtros
  useEffect(() => {
    const filtered = guests.filter(guest => {
      const matchName = guest.fullName.toLowerCase().includes(filters.name.toLowerCase());
      const matchCategory = !filters.category || guest.category === filters.category;
      const matchTable = !filters.table || (guest.tableNumber && guest.tableNumber.toLowerCase().includes(filters.table.toLowerCase()));
      const matchType = !filters.type || (filters.type === 'crianca' ? guest.isChild : !guest.isChild);
      const matchStatus = !filters.status || (filters.status === 'presente' ? guest.checkedInAt : !guest.checkedInAt);
      
      return matchName && matchCategory && matchTable && matchType && matchStatus;
    });
    setFilteredGuests(filtered);
  }, [guests, filters]);

  const handleEditClick = (guest: Guest) => {
    setEditingId(guest.id);
    setEditingGuest({
      id: guest.id,
      fullName: guest.fullName,
      category: guest.category,
      tableNumber: guest.tableNumber || '',
      isPaying: guest.isPaying,
      isChild: guest.isChild,
      childAge: guest.childAge
    });
  };

  const handleSaveEdit = async () => {
    if (!editingGuest) return;

    setIsSavingGuest(true);
    try {
      const response = await fetch(`/api/guests/${editingGuest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGuest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar');
      }

      const data = await response.json();
      
      // Atualizar lista
      setGuests(guests.map(g => g.id === editingGuest.id ? data.guest : g));
      setEditingId(null);
      setEditingGuest(null);
      setSuccessMessage('Convidado atualizado com sucesso');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSavingGuest(false);
    }
  };

  const handleDeleteClick = (guest: Guest) => {
    setDeleteConfirm({ id: guest.id, name: guest.fullName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeletingGuest(true);
    try {
      const response = await fetch(`/api/guests/${deleteConfirm.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar');
      }

      // Remover da lista
      setGuests(guests.filter(g => g.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      setSuccessMessage('Convidado removido com sucesso');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar');
      setDeleteConfirm(null);
    } finally {
      setIsDeletingGuest(false);
    }
  };

  const handleDeleteAllClick = () => {
    setDeleteAllConfirm(true);
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      // Usar a nova API que deleta todos os convidados de uma vez
      const response = await fetch(`/api/events/${eventId}/guests`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar convidados');
      }

      const data = await response.json();

      setGuests([]);
      setFilteredGuests([]);
      setDeleteAllConfirm(false);
      setSuccessMessage(`${data.deletedCount} convidado(s) removido(s) com sucesso`);
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar convidados');
      setDeleteAllConfirm(false);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const [showStatsModal, setShowStatsModal] = useState(false);

  if (loading) {
    return <div className={styles.loading}>Carregando convidados...</div>;
  }

  // Função para confirmar presença (check-in)

  // Função para confirmar presença
  const handleConfirmPresence = async (guest: Guest) => {
    try {
      const response = await fetch(`/api/guests/${guest.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao confirmar presença');
      }
      const data = await response.json();
      setGuests(guests.map(g => g.id === guest.id ? { ...g, checkedInAt: data.checkedInAt || new Date().toISOString() } : g));
      setSuccessMessage('Presença confirmada!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar presença');
    }
  };

  // Função para desfazer presença
  const handleUndoPresence = async (guest: Guest) => {
    try {
      const response = await fetch(`/api/guests/${guest.id}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ present: false }),
      });
      if (!response.ok) {
        throw new Error('Erro ao desfazer presença');
      }
      setGuests(guests.map(g => g.id === guest.id ? { ...g, checkedInAt: undefined } : g));
      setSuccessMessage('Presença desfeita!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desfazer presença');
    }
  };

  return (
    <section className={styles.section}>
      {/* Card de detalhes do evento */}
      <div className={styles.eventDetailsCard}>
        {isSmallScreen ? (
          <button
            type="button"
            className={styles.eventDetailsToggle}
            aria-expanded={detailsExpanded}
            onClick={() => setDetailsExpanded(v => !v)}
          >
            <span className={styles.eventDetailsTitle}>{eventName || 'Evento'}</span>
            <span className={styles.eventDetailsCaret}>{detailsExpanded ? '▲' : '▼'}</span>
          </button>
        ) : (
          <>
            <h1 className={styles.eventDetailsTitle}>{eventName || 'Evento'}</h1>
            <p className={styles.eventDetailsSubtitle}>Check-in de Convidados</p>
          </>
        )}

        {isSmallScreen && !detailsExpanded && (
          <div className={styles.eventDetailsHint}>Toque para ver detalhes</div>
        )}

        {(!isSmallScreen || detailsExpanded) && (
          <>
            {isSmallScreen && <div className={styles.eventDetailsSubtitleMobile}>Check-in de Convidados</div>}
            <div className={styles.eventDetailsMeta}>
              <div className={styles.eventDetailsMetaItem}>
                <div className={styles.eventDetailsLabel}>DATA E HORA</div>
                <div className={styles.eventDetailsValue}>
                  {eventDate
                    ? new Date(eventDate).toLocaleString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </div>
              </div>

              <div className={styles.eventDetailsMetaItem}>
                <div className={styles.eventDetailsLabel}>STATUS</div>
                <div className={styles.eventDetailsValue}>
                  {eventStatus ? (statusTranslation[eventStatus.toUpperCase()] || eventStatus) : '-'}
                </div>
              </div>

              <div className={styles.eventDetailsMetaItem}>
                <div className={styles.eventDetailsLabel}>DESCRIÇÃO</div>
                <div className={styles.eventDetailsValue}>{eventDescription || '-'}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bloco de botões de filtro, estatísticas, exportação e mesas */}
      <div className={styles.filterBar} style={{maxWidth:'1100px',margin:'0 auto 16px auto'}}>
        <div className={styles.filterBarGroup}>
          {/* Dropdown de Categoria */}
          <div ref={categoryDropdownRef} style={{position:'relative', display:'inline-block', flexShrink:0}}>
            <button 
              className={buttonStyles.btn + ' ' + (filters.category ? buttonStyles['btn--primary'] : buttonStyles['btn--secondary']) + ' ' + styles.filterBarButton} 
              onClick={() => setShowCategoryDropdown(prev => !prev)}
              style={{display:'flex', alignItems:'center', gap:'0.3rem', padding:'0.5rem 0.75rem', fontSize:'0.85rem', whiteSpace:'nowrap'}}
            >
              {filters.category ? `${filters.category}` : 'Categoria'}
              <span style={{fontSize:'0.6rem'}}>{showCategoryDropdown ? '▲' : '▼'}</span>
            </button>
            {showCategoryDropdown && (
              <div style={{
                position:'absolute',
                top:'100%',
                left:0,
                marginTop:'4px',
                background:'#fff',
                border:'1px solid #7b2d3d',
                borderRadius:'8px',
                boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
                zIndex:100,
                minWidth:'180px',
                maxHeight:'280px',
                overflowY:'auto'
              }}>
                <button
                  onClick={() => { setFilters(f => ({ ...f, category: '' })); setShowCategoryDropdown(false); }}
                  style={{
                    display:'block',
                    width:'100%',
                    padding:'0.6rem 1rem',
                    textAlign:'left',
                    background: !filters.category ? '#7b2d3d' : 'transparent',
                    color: !filters.category ? '#fff' : '#333',
                    border:'none',
                    cursor:'pointer',
                    fontSize:'0.95rem',
                    borderBottom:'1px solid #eee'
                  }}
                >
                  Todas as Categorias
                </button>
                {[...new Set(guests.map(g => g.category).filter(Boolean))].sort().map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setFilters(f => ({ ...f, category: cat })); setShowCategoryDropdown(false); }}
                    style={{
                      display:'block',
                      width:'100%',
                      padding:'0.6rem 1rem',
                      textAlign:'left',
                      background: filters.category === cat ? '#7b2d3d' : 'transparent',
                      color: filters.category === cat ? '#fff' : '#333',
                      border:'none',
                      cursor:'pointer',
                      fontSize:'0.95rem',
                      borderBottom:'1px solid #eee'
                    }}
                  >
                    {cat} ({guests.filter(g => g.category === cat).length})
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className={buttonStyles.btn + ' ' + (filters.status === 'pendente' ? buttonStyles['btn--primary'] : buttonStyles['btn--secondary']) + ' ' + styles.filterBarButton} style={{padding:'0.5rem 0.75rem', fontSize:'0.85rem', whiteSpace:'nowrap', flexShrink:0}} onClick={() => setFilters(f => ({ ...f, status: 'pendente' }))}>Pendentes ({guests.filter(g=>!g.checkedInAt).length})</button>
          <button className={buttonStyles.btn + ' ' + (filters.status === 'presente' ? buttonStyles['btn--primary'] : buttonStyles['btn--secondary']) + ' ' + styles.filterBarButton} style={{padding:'0.5rem 0.75rem', fontSize:'0.85rem', whiteSpace:'nowrap', flexShrink:0}} onClick={() => setFilters(f => ({ ...f, status: 'presente' }))}>✓ Presentes ({guests.filter(g=>g.checkedInAt).length})</button>
          <button className={buttonStyles.btn + ' ' + (filters.status === '' ? buttonStyles['btn--primary'] : buttonStyles['btn--secondary']) + ' ' + styles.filterBarButton} style={{padding:'0.5rem 0.75rem', fontSize:'0.85rem', whiteSpace:'nowrap', flexShrink:0}} onClick={() => setFilters(f => ({ ...f, status: '' }))}>Todos ({guests.length})</button>

          <button className={buttonStyles.btn + ' ' + buttonStyles['btn--primary'] + ' ' + styles.filterBarButton} style={{padding:'0.5rem 0.75rem', fontSize:'0.85rem', whiteSpace:'nowrap', flexShrink:0}} onClick={() => setShowStatsModal(true)}>Estatísticas</button>
          <button className={buttonStyles.btn + ' ' + buttonStyles['btn--primary'] + ' ' + styles.filterBarButton} style={{padding:'0.5rem 0.75rem', fontSize:'0.85rem', whiteSpace:'nowrap', flexShrink:0}} onClick={() => setShowTablesModal(true)}>Mesas</button>
        </div>

        <div className={styles.filterBarGroupEnd}>
          <button className={buttonStyles.btn + ' ' + buttonStyles['btn--primary'] + ' ' + styles.filterBarButton} style={{padding:'0.5rem 0.75rem', fontSize:'0.85rem', whiteSpace:'nowrap', flexShrink:0}}
            onClick={() => setShowExportModal(true)}
            disabled={guests.length === 0}
            title="Exportar"
          >Exportar</button>
          {canManageEvent && (
            <button 
              className={buttonStyles.btn + ' ' + buttonStyles['btn--danger'] + ' ' + styles.filterBarButton} 
              style={{padding:'0.5rem 0.75rem', fontSize:'0.85rem', whiteSpace:'nowrap', flexShrink:0}}
              onClick={handleDeleteAllClick}
              disabled={guests.length === 0}
              title="Excluir todos os convidados"
            >🗑️ Excluir Todos</button>
          )}
        </div>
      </div>

      {/* Campo de busca por nome */}
      <div className={styles.searchBox} style={{ marginBottom: '1.2rem', marginTop: '-0.5rem', maxWidth:'1100px',marginLeft:'auto',marginRight:'auto', width:'100%' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nome..."
            value={filters.name}
            onChange={e => setFilters({ ...filters, name: e.target.value })}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            type="button"
            className={buttonStyles.btn + ' ' + buttonStyles['btn--primary']}
            style={{ padding: '0.55rem 0.85rem', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}
            aria-label="Adicionar convidado"
            title="Adicionar convidado"
            onClick={() => setShowAddGuestChoiceModal(true)}
          >
            +
          </button>
        </div>
      </div>

      {showAddGuestChoiceModal && (
        <div
          className={styles.statsModalOverlay}
          onClick={() => setShowAddGuestChoiceModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.statsModal}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '2rem' }}
          >
            <button className={styles.closeBtn} onClick={() => setShowAddGuestChoiceModal(false)}>Fechar</button>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#222', marginBottom: '0.75rem', textAlign: 'center' }}>
              Adicionar convidado
            </h2>
            <p style={{ color: '#666', marginBottom: '1.25rem', textAlign: 'center' }}>
              Como você deseja adicionar?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {canManageEvent && (
                <button
                  type="button"
                  className={buttonStyles.btn + ' ' + buttonStyles['btn--primary']}
                  style={{ minWidth: '140px' }}
                  onClick={() => {
                    setShowAddGuestChoiceModal(false);
                    setShowImportModal(true);
                  }}
                >
                  XLSX
                </button>
              )}

              <button
                type="button"
                className={
                  buttonStyles.btn +
                  ' ' +
                  (canManageEvent ? buttonStyles['btn--secondary'] : buttonStyles['btn--primary'])
                }
                style={{ minWidth: '140px' }}
                onClick={() => {
                  setShowAddGuestChoiceModal(false);
                  setShowManualAddModal(true);
                }}
              >
                Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
      {successMessage && <div className={styles.success}>{successMessage}</div>}

      {/* Estatísticas Modal */}
      {showStatsModal && (
        <div className={styles.statsModalOverlay} onClick={() => setShowStatsModal(false)}>
          <div className={styles.statsModal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowStatsModal(false)}>Fechar</button>
            <AttendanceDashboard eventId={eventId} />
          </div>
        </div>
      )}

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className={styles.statsModalOverlay} onClick={() => setShowExportModal(false)}>
          <div className={styles.statsModal} onClick={e => e.stopPropagation()} style={{maxWidth:'400px', padding:'2rem'}}>
            <button className={styles.closeBtn} onClick={() => setShowExportModal(false)}>Fechar</button>
            <h2 style={{fontSize:'1.4rem', fontWeight:'bold', color:'#222', marginBottom:'1.5rem', textAlign:'center'}}>Exportar Lista</h2>
            <p style={{color:'#666', marginBottom:'1.5rem', textAlign:'center'}}>Escolha o formato de exportação:</p>
            <div style={{display:'flex', gap:'1rem', justifyContent:'center'}}>
              <button 
                className={buttonStyles.btn + ' ' + buttonStyles['btn--primary']}
                style={{minWidth:'120px', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', padding:'1rem 1.5rem'}}
                onClick={() => {
                  const guestReports = guests.map(guest => ({
                    ...guest,
                    checkedInAt: guest.checkedInAt ?? null,
                  }));
                  import('@/app/utils/exportToPdf').then(mod => mod.generateEventReport(guestReports, {
                    eventName: eventName || eventId,
                    total: guests.length,
                    checkedIn: guests.filter(g=>g.checkedInAt).length,
                    pending: guests.filter(g=>!g.checkedInAt).length,
                    paying: guests.filter(g=>g.isPaying).length,
                    nonPaying: guests.filter(g=>!g.isPaying).length
                  }));
                  setShowExportModal(false);
                }}
              >
                <span style={{fontSize:'1.5rem'}}>📄</span>
                <span>PDF</span>
              </button>
              <button 
                className={buttonStyles.btn + ' ' + buttonStyles['btn--primary']}
                style={{minWidth:'120px', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', padding:'1rem 1.5rem'}}
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/guests/export?eventId=${eventId}`, {
                      method: 'GET',
                      credentials: 'include'
                    });
                    if (!response.ok) {
                      throw new Error('Erro ao exportar');
                    }
                    const contentDisposition = response.headers.get('content-disposition');
                    let filename = 'convidados.xlsx';
                    if (contentDisposition) {
                      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                      if (filenameMatch) {
                        filename = filenameMatch[1];
                      }
                    }
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error('Erro ao exportar XLSX:', err);
                  }
                  setShowExportModal(false);
                }}
              >
                <span style={{fontSize:'1.5rem'}}>📊</span>
                <span>XLSX</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listagem visual dos convidados dentro do container original */}
      <div className={styles.tableWrapper} style={{maxWidth:'1100px',margin:'0 auto'}}>
        <GuestCheckInList
          guests={filteredGuests}
          onCheckIn={id => {
            const guest = guests.find(g => g.id === id);
            if (guest) handleCheckInClick(guest);
          }}
          onUndoCheckIn={handleUndoCheckIn}
          onDeleteGuest={canManageEvent ? (id => {
            const guest = guests.find(g => g.id === id);
            if (guest) {
              handleDeleteClick(guest);
            } else {
              setDeleteConfirm({ id, name: 'este convidado' });
            }
          }) : undefined}
        />
      </div>

      <CheckInConfirmModal
        guestName={selectedGuest?.fullName || ''}
        isOpen={checkInModalOpen}
        onConfirm={handleConfirmCheckIn}
        onCancel={() => { setCheckInModalOpen(false); setSelectedGuest(null); }}
        isLoading={checkInLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Deletar Convidado"
        message={`Tem certeza que deseja deletar "${deleteConfirm?.name}"? Esta ação é irreversível.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={isDeletingGuest}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ConfirmDialog
        isOpen={deleteAllConfirm}
        title="Deletar Todos os Convidados"
        message={`Tem certeza que deseja deletar TODOS os ${guests.length} convidados? Esta ação é irreversível e não pode ser desfeita.`}
        confirmText="Deletar Tudo"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={isDeletingAll}
        onConfirm={handleConfirmDeleteAll}
        onCancel={() => setDeleteAllConfirm(false)}
      />

      <AddGuestModal
        eventId={eventId}
        isOpen={showManualAddModal}
        onClose={() => setShowManualAddModal(false)}
        onGuestAdded={() => fetchGuests(false)}
      />

      <ImportGuestsModal
        eventId={eventId}
        isAdminOnly={false}
        isOpen={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={() => fetchGuests(false)}
      />
      <TablesModal eventId={eventId} isOpen={showTablesModal} onClose={() => setShowTablesModal(false)} />

      {/* Overlay de sucesso verde após check-in */}
      <CheckInSuccessOverlay guest={successGuest ? { ...successGuest, checkedInAt: successGuest.checkedInAt ?? null } : null} onClose={() => setSuccessGuest(null)} />
    </section>
  );
}
