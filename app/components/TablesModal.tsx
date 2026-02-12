'use client';

import { useEffect, useState } from 'react';
import styles from './TablesModal.module.css';

interface Guest {
  id: string;
  fullName: string;
  checkedInAt: string | null;
  tableNumber?: string | null;
}

interface Table {
  id: string;
  name: string;
  count?: number;
  presentCount?: number;
}

interface TablesModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TablesModal({ eventId, isOpen, onClose }: TablesModalProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableGuests, setTableGuests] = useState<Guest[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTables();
    } else {
      setTables([]);
      setSelectedTable(null);
      setTableGuests([]);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const loadTables = async () => {
    setLoadingTables(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/tables`);
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables || []);
        // preselect first
        if ((data.tables || []).length > 0) {
          setSelectedTable(data.tables[0]);
          loadGuestsForTable(data.tables[0].id);
        }
        setLoadingTables(false);
        return;
      }

      // fallback to grouping guests by table when endpoint not available
      throw new Error('No tables endpoint');
    } catch (err) {
      // Fallback: build tables from guests endpoint
      try {
        const res2 = await fetch(`/api/events/${eventId}/guests`);
        if (res2.ok) {
          const data2 = await res2.json();
          const guests: Guest[] = data2.guests || [];
          const map = new Map<string, Guest[]>();
          for (const g of guests) {
            const t = g.tableNumber || 'Sem Mesa';
            if (!map.has(t)) map.set(t, []);
            map.get(t)!.push(g);
          }

          const tableNameCollator = new Intl.Collator('pt-BR', {
            numeric: true,
            sensitivity: 'base',
          });

          const builtTables: Table[] = Array.from(map.entries())
            .sort(([aName], [bName]) => {
              const aIsNoTable = aName.toLowerCase() === 'sem mesa';
              const bIsNoTable = bName.toLowerCase() === 'sem mesa';
              if (aIsNoTable && !bIsNoTable) return 1;
              if (!aIsNoTable && bIsNoTable) return -1;
              return tableNameCollator.compare(String(aName), String(bName));
            })
            .map(([name, list]) => ({
              id: name,
              name,
              count: list.length,
              presentCount: list.filter(x => x.checkedInAt).length,
            }));

          setTables(builtTables);
          if (builtTables.length > 0) {
            setSelectedTable(builtTables[0]);
            setTableGuests(map.get(builtTables[0].name) || []);
          }
        } else {
          setError('Não foi possível carregar mesas');
        }
      } catch (err2) {
        console.error('Fallback error', err2);
        setError('Erro ao carregar mesas');
      }

      setLoadingTables(false);
    }
  };

  const loadGuestsForTable = async (tableIdOrName: string) => {
    setLoadingGuests(true);
    setTableGuests([]);
    setError(null);

    // Try table guests endpoint first
    try {
      const res = await fetch(`/api/tables/${tableIdOrName}/guests`);
      if (res.ok) {
        const data = await res.json();
        setTableGuests(data.guests || []);
        setLoadingGuests(false);
        return;
      }

      throw new Error('No table guests endpoint');
    } catch (err) {
      // Fallback to guests by event and filter by tableNumber
      try {
        const res2 = await fetch(`/api/events/${eventId}/guests`);
        if (res2.ok) {
          const data2 = await res2.json();
          const guests: Guest[] = data2.guests || [];
          // If our tables were built by name, tableIdOrName might be the name
          const filtered = guests.filter(g => (g.tableNumber || 'Sem Mesa') === tableIdOrName);
          setTableGuests(filtered);
        } else {
          setError('Não foi possível carregar convidados da mesa');
        }
      } catch (err2) {
        console.error('Fallback error', err2);
        setError('Erro ao carregar convidados da mesa');
      }

      setLoadingGuests(false);
    }
  };

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    // No fallback, id == name. Se existir endpoint de mesas no futuro, id pode ser diferente.
    loadGuestsForTable(table.id || table.name);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h3>Mesas</h3>
          <button className={styles.close} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className={styles.body}>
          <aside className={styles.tablesList}>
            {loadingTables ? (
              <div className={styles.loading}>Carregando mesas...</div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : tables.length === 0 ? (
              <div className={styles.empty}>Nenhuma mesa encontrada</div>
            ) : (
              tables.map((table) => (
                <button
                  key={table.id}
                  className={`${styles.tableButton} ${selectedTable?.id === table.id ? styles.active : ''}`}
                  onClick={() => handleSelectTable(table)}
                >
                  <div className={styles.tableName}>{table.name}</div>
                  <div className={styles.tableMeta}>{table.count ?? 0} convidados</div>
                </button>
              ))
            )}
          </aside>

          <section className={styles.guestsPanel}>
            <div className={styles.guestsHeader}>
              <h4>{selectedTable ? selectedTable.name : 'Selecione uma mesa'}</h4>
              <div className={styles.count}>{tableGuests.length} convidados</div>
            </div>

              <div className={styles.guestsList}>
                {loadingGuests ? (
                  <div className={styles.loading}>Carregando convidados...</div>
                ) : tableGuests.length === 0 ? (
                  <div className={styles.empty}>Nenhum convidado nessa mesa</div>
                ) : (
                  tableGuests.map((g) => (
                    <div key={g.id} className={styles.guestRow}>
                      <div>
                        <div className={styles.guestName}>{g.fullName}</div>
                        <div className={styles.guestMeta}>{g.checkedInAt ? '✅ Entrou' : '⊘ Não entrou'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
          </section>
        </div>

        <div className={styles.actions}>
          <button className={styles.closeBtn} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
