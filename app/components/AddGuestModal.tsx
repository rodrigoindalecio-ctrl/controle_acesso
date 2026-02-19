'use client';

import { useEffect, useState } from 'react';
import styles from './AddGuestModal.module.css';

interface Table {
  id: string;
  name: string;
}

interface AddGuestModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onGuestAdded?: (guest: {
    id: string
    fullName: string
    checkedInAt: string | Date | null
    category?: string | null
    tableNumber?: string | number | null
    isManual?: boolean
    isChild?: boolean
    childAge?: number | null
    isPaying?: boolean
  }) => void;
}

export default function AddGuestModal({ eventId, isOpen, onClose, onGuestAdded }: AddGuestModalProps) {
  const [fullName, setFullName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [category, setCategory] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTablesAndCategories();
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

  const loadTablesAndCategories = async () => {
    setLoadingTables(true);
    setError(null);

    try {
      // Load event guests to extract tables and categories
      const guestsRes = await fetch(`/api/events/${eventId}/guests`);
      if (guestsRes.ok) {
        const data = await guestsRes.json();
        const guests = data.guests || [];

        // Extract unique tables
        const tableSet = new Set<string>();
        guests.forEach((g: any) => {
          if (g.tableNumber) tableSet.add(g.tableNumber);
        });

        const tableNameCollator = new Intl.Collator('pt-BR', {
          numeric: true,
          sensitivity: 'base',
        });

        const tableList = Array.from(tableSet)
          .sort((a, b) => tableNameCollator.compare(String(a), String(b)))
          .map(name => ({ id: name, name }));

        setTables(tableList);

        // Set first table as default if available
        if (tableList.length > 0) {
          setTableNumber(tableList[0].name);
        }

        // Extract unique categories
        const categorySet = new Set<string>();
        guests.forEach((g: any) => {
          if (g.category) categorySet.add(g.category);
        });
        setCategories(Array.from(categorySet).sort());
      } else {
        setError('Erro ao carregar dados do evento');
      }
    } catch (err) {
      console.error('Error loading tables and categories:', err);
      setError('Erro ao carregar mesas e categorias');
    } finally {
      setLoadingTables(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Nome do convidado é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const trimmedCategory = typeof category === 'string' ? category.trim() : '';

      const res = await fetch(`/api/events/${eventId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          tableNumber: tableNumber && tableNumber !== '' ? tableNumber : null,
          category: trimmedCategory || 'outros',
        }),
      });

      interface ApiResponse {
        success?: boolean;
        guest?: {
          id: string;
          fullName: string;
          checkedInAt: string;
          checkedInBy: string;
          category: string | null;
          tableNumber: number | null;
          isManual: boolean;
        };
        message?: string;
        error?: string;
      }

      let data: ApiResponse = {};
      const contentType = res.headers.get('content-type');

      // Tentar fazer parse de JSON só se o content-type é JSON
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await res.json() as ApiResponse;
        } catch (jsonErr) {
          console.error('JSON parse error:', jsonErr);
          data = {};
        }
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Erro ao adicionar convidado');
      }

      const newGuest = data.guest || {
        id: `guest-${Date.now()}`,
        fullName: fullName.trim(),
        checkedInAt: null,
        category: trimmedCategory || 'outros',
        tableNumber: tableNumber && tableNumber !== '' ? tableNumber : null,
        isManual: true,
      };

      setSuccess(true);
      setFullName('');
      setTableNumber('');
      setCategory('');

      onGuestAdded?.(newGuest);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao adicionar convidado';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h3>Adicionar Convidado</h3>
          <button className={styles.close} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>✅ Convidado adicionado com sucesso!</div>}

          <div className={styles.formGroup}>
            <label htmlFor="fullName">Nome do Convidado *</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Digite o nome completo"
              disabled={loading}
              className={styles.input}
              aria-label="Nome do convidado"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tableNumber">Mesa</label>
            <select
              id="tableNumber"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              disabled={loading || loadingTables}
              className={styles.select}
              aria-label="Selecionar mesa"
            >
              {tables.length === 0 && (
                <option value="">Carregando mesas...</option>
              )}
              {tables.map((table) => (
                <option key={table.id} value={table.name}>
                  {table.name}
                </option>
              ))}
              {tables.length > 0 && (
                <option value="">Sem mesa atribuída</option>
              )}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Categoria</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading || loadingTables}
              className={styles.select}
              aria-label="Selecionar categoria"
            >
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || loadingTables}
            >
              {loading ? '...' : 'Adicionar Convidado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
