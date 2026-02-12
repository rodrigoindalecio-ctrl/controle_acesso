import React, { useState, useMemo } from 'react';
import styles from './GuestCheckInList.module.css';
import TestCell from './TestCell';

// Tipos de props e dados (ajuste conforme seu projeto)
interface Guest {
  id: string;
  fullName: string;
  isManual?: boolean;
  category: string;
  tableNumber?: string;
  isChild?: boolean;
  checkedInAt?: string | null;
}

interface GuestCheckInListProps {
  guests: Guest[];
  loading?: boolean;
  correctionLoading?: boolean;
  correctionError?: string;
  user?: { email?: string };
  canCorrect?: boolean;
  onCheckIn: (id: string, checkedIn: boolean) => void;
  handleCorrectionSubmit?: (guest: Guest) => void;
}

const GuestCheckInList: React.FC<GuestCheckInListProps> = ({
  guests = [],
  loading = false,
  correctionLoading = false,
  correctionError = '',
  user,
  canCorrect = false,
  onCheckIn,
  handleCorrectionSubmit,
}) => {
  // Estados de filtro
  const [filters, setFilters] = useState({
    name: '',
    category: '',
    table: '',
    type: '',
    status: '',
  });
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [correctedGuests] = useState<Set<string>>(new Set()); // Ajuste para seu fluxo

  // Filtragem dos convidados
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      // Filtros básicos (ajuste conforme necessário)
      if (filters.name && !guest.fullName.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.category && guest.category !== filters.category) return false;
      if (filters.table && guest.tableNumber !== filters.table) return false;
      if (filters.type) {
        if (filters.type === 'adulto' && guest.isChild) return false;
        if (filters.type === 'crianca' && !guest.isChild) return false;
      }
      if (filters.status) {
        if (filters.status === 'presente' && !guest.checkedInAt) return false;
        if (filters.status === 'ausente' && guest.checkedInAt) return false;
      }
      return true;
    });
  }, [guests, filters]);

  // Cálculo de presença
  const percentage = guests.length > 0 ? Math.round((guests.filter(g => g.checkedInAt).length / guests.length) * 100) : 0;

  return (
    <div className={styles.container}>
      {/* TESTE VISUAL */}
      <div style={{background: 'yellow', padding: '1rem', fontWeight: 'bold'}}>TESTE VISUAL</div>
      {/* Tabela com Filtros */}
      <TestCell />
      <div className={styles.tableWrapper}>
        {filteredGuests.length === 0 && guests.length === 0 ? (
          <div className={styles.empty}>
            <p>Nenhum convidado encontrado</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho Grid */}
            <div className={styles.gridHeader}>
              <div className={styles.cell}>
                <input
                  type="text"
                  placeholder="Filtrar por nome..."
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.cell}>
                <input
                  type="text"
                  placeholder="Filtrar..."
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.cell}>
                <input
                  type="text"
                  placeholder="Filtrar..."
                  value={filters.table}
                  onChange={(e) => setFilters({ ...filters, table: e.target.value })}
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.cell}>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className={styles.filterInput}
                >
                  <option value="">Todos</option>
                  <option value="adulto">Adulto</option>
                  <option value="crianca">Criança</option>
                </select>
              </div>
              <div className={styles.cell}>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className={styles.filterInput}
                >
                  <option value="">Todos</option>
                  <option value="presente">Presente</option>
                  <option value="ausente">Ausente</option>
                </select>
              </div>
              <div className={styles.cell}>Ação</div>
            </div>
            {/* Linhas Grid */}
            <div className={styles.gridBody}>
              {filteredGuests.map(guest => (
                <div
                  key={guest.id}
                  className={`${styles.gridRow} ${guest.checkedInAt ? styles.rowPresent : styles.rowAbsent}`}
                >
                  <div className={styles.cell} style={{flexDirection:'column',minWidth:0}}>
                    <span style={{wordBreak:'break-word',overflowWrap:'anywhere',whiteSpace:'normal',display:'block',lineHeight:'1.2',maxHeight:'2.6em',overflow:'hidden'}}>
                      {guest.fullName}
                    </span>
                    {guest.isManual === true && <span className={styles.badge}>Manual</span>}
                  </div>
                  <div className={styles.cell} style={{minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{guest.category}</div>
                  <div className={styles.cell} style={{minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{guest.tableNumber || '—'}</div>
                  <div className={styles.cell} style={{minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{guest.isChild ? '👶 Criança' : '👤 Adulto'}</div>
                  <div className={styles.cell} style={{minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {correctedGuests.has(guest.id) ? (
                      <span className={styles.statusBadge} data-status="corrected">Corrigido</span>
                    ) : (
                      <span
                        className={styles.statusBadge}
                        data-status={guest.checkedInAt ? 'present' : 'absent'}
                      >
                        {guest.checkedInAt ? '✓ Presente' : 'Ausente'}
                      </span>
                    )}
                  </div>
                  <div className={styles.cell} style={{minWidth:0}}>
                    <div className={styles.buttonGroup}>
                      <button
                        className={`${styles.button} ${guest.checkedInAt ? styles.buttonUndo : styles.buttonCheck}`}
                        onClick={() => onCheckIn(guest.id, !guest.checkedInAt)}
                        disabled={loading}
                        title={guest.checkedInAt ? 'Desfazer presença' : 'Confirmar presença'}
                        type="button"
                      >
                        {guest.checkedInAt ? '🔄' : '✅'}
                      </button>
                      {canCorrect && (
                        <button
                          className={`${styles.button} ${styles.buttonCorrect}`}
                          onClick={() => setSelectedGuest(guest)}
                          disabled={loading || correctionLoading}
                          title="Corrigir dados do convidado"
                          type="button"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className={styles.counter}>
        <div className={styles.counterLabel}>Presença</div>
        <div className={styles.percentage}>{percentage}%</div>
      </div>
      {/* Modal de Correção */}
      {selectedGuest && canCorrect && (
        <div>Modal de correção aqui</div>
      )}
    </div>
  );
};

export default GuestCheckInList;
