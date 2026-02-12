'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './GuestSearchBar.module.css';

export interface Guest {
  id: string;
  fullName: string;
  category: string;
  tableNumber?: string;
  checkedInAt?: string;
  isManual: boolean;
  isChild: boolean;
  childAge?: number;
  isPaying: boolean;
}

interface GuestSearchBarProps {
  guests: Guest[];
  onSelectGuest: (guest: Guest) => void;
  onAddManual: (name: string) => void;
  disabled?: boolean;
}

export default function GuestSearchBar({
  guests,
  onSelectGuest,
  onAddManual,
  disabled = false
}: GuestSearchBarProps) {
  const [search, setSearch] = useState('');
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar convidados conforme digitação
  useEffect(() => {
    if (!search.trim()) {
      setFilteredGuests([]);
      setShowDropdown(false);
      return;
    }

    const query = search.toLowerCase();
    const filtered = guests
      .filter(guest => 
        guest.fullName.toLowerCase().includes(query) ||
        guest.category.toLowerCase().includes(query)
      )
      .slice(0, 10); // Limita a 10 resultados

    setFilteredGuests(filtered);
    setShowDropdown(filtered.length > 0);
    setSelectedIndex(-1);
  }, [search, guests]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegação com arrow keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'Enter' && search.trim()) {
        e.preventDefault();
        handleAddManual();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredGuests.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredGuests.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectGuest(filteredGuests[selectedIndex]);
        } else if (search.trim()) {
          handleAddManual();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
    }
  };

  const handleSelectGuest = (guest: Guest) => {
    onSelectGuest(guest);
    setSearch('');
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleAddManual = () => {
    const trimmedName = search.trim();
    if (trimmedName) {
      onAddManual(trimmedName);
      setSearch('');
      setShowDropdown(false);
      setSelectedIndex(-1);
      inputRef.current?.focus();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <span className={styles.icon}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Digite o nome do convidado..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => search && setShowDropdown(true)}
          disabled={disabled}
          className={styles.input}
          autoComplete="off"
        />
        {search && (
          <button
            className={styles.clearBtn}
            onClick={() => {
              setSearch('');
              setShowDropdown(false);
              inputRef.current?.focus();
            }}
            title="Limpar"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && filteredGuests.length > 0 && (
        <div className={styles.dropdown} ref={dropdownRef}>
          {filteredGuests.map((guest, idx) => (
            <button
              key={guest.id}
              className={`${styles.option} ${
                idx === selectedIndex ? styles.selected : ''
              }`}
              onClick={() => handleSelectGuest(guest)}
              type="button"
            >
              <div className={styles.guestInfo}>
                <div className={styles.name}>{guest.fullName}</div>
                <div className={styles.meta}>
                  {guest.category && (
                    <span className={styles.category}>{guest.category}</span>
                  )}
                  {guest.tableNumber && (
                    <span className={styles.table}>Mesa {guest.tableNumber}</span>
                  )}
                  {guest.isManual === true && (
                    <span className={styles.manual}>Manual</span>
                  )}
                </div>
              </div>
              <div
                className={`${styles.status} ${
                  guest.checkedInAt ? styles.checked : styles.unchecked
                }`}
              >
                {guest.checkedInAt ? '✓ Presente' : 'Ausente'}
              </div>
            </button>
          ))}

          {search.trim() && !filteredGuests.some(g => g.fullName.toLowerCase() === search.toLowerCase()) && (
            <button
              className={styles.addNew}
              onClick={handleAddManual}
              type="button"
            >
              <span className={styles.addIcon}>➕</span>
              Adicionar "{search.trim()}" como novo
            </button>
          )}
        </div>
      )}

      {search && filteredGuests.length === 0 && showDropdown && (
        <div className={styles.dropdown} ref={dropdownRef}>
          <button
            className={styles.addNew}
            onClick={handleAddManual}
            type="button"
          >
            <span className={styles.addIcon}>➕</span>
            Adicionar "{search.trim()}" como novo
          </button>
        </div>
      )}

      <div className={styles.hint}>
        Pressione ↓/↑ para navegar, Enter para confirmar, ou ESC para cancelar
      </div>
    </div>
  );
}
