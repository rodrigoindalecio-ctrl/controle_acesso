import React from 'react';
import { Guest } from '@/app/hooks/useEventGuests';
import styles from '../CheckInList.module.css';

interface GuestCheckInListProps {
  guests: Guest[];
  onCheckIn: (id: string) => void | Promise<void>;
  onUndoCheckIn: (id: string) => void | Promise<void>;
  onDeleteGuest?: (id: string) => void | Promise<void>;
}

const GuestCheckInList: React.FC<GuestCheckInListProps> = ({ guests, onCheckIn, onUndoCheckIn, onDeleteGuest }) => {
  return (
    <div className={styles.guestList}>
      {guests.length > 0 ? (
        guests.map((guest: Guest) => (
          <div key={guest.id} className={styles.guestRow}>
            <div className={styles.guestInfo}>
              <span className={styles.guestName}>{guest.fullName}</span>

              <div className={styles.guestMetaCompact}>
                {guest.category && <span className={styles.guestCategory}>{guest.category}</span>}
                {guest.tableNumber && <span className={styles.guestTable}>Mesa {guest.tableNumber}</span>}
                <span className={styles.statusBadge + ' ' + (guest.checkedInAt ? styles.statusBadge_checkedIn : styles.statusBadge_pending)}>
                  {guest.checkedInAt ? '✓ Presente' : 'Pendente'}
                </span>
                {guest.isManual === true && <span className={styles.badge}>Manual</span>}
              </div>

              <div className={styles.guestMeta}>
                {guest.category && <span className={styles.guestCategory}>{guest.category}</span>}
                {guest.tableNumber && <span className={styles.guestTable}>Mesa {guest.tableNumber}</span>}
                {guest.isManual === true && <span className={styles.badge}>Manual</span>}
              </div>
            </div>
            <div className={styles.guestMeta}>
              {guest.checkedInAt && guest.isPaying === false && (
                <span className={styles.nonPayingBadge}>Não Pagante</span>
              )}
              <span className={styles.statusBadge + ' ' + (guest.checkedInAt ? styles.statusBadge_checkedIn : styles.statusBadge_pending)}>
                {guest.checkedInAt ? '✓ Presente' : 'Pendente'}
              </span>
              <div className={styles.actionGroup}>
                {guest.checkedInAt ? (
                  <button className={styles.undoButton} onClick={() => onUndoCheckIn(guest.id)} title="Desfazer check-in">Desfazer check-in</button>
                ) : (
                  <button className={styles.checkInButton} onClick={() => onCheckIn(guest.id)} title="Confirmar presença">Confirmar presença</button>
                )}
                {onDeleteGuest && (
                  <button
                    className={styles.deleteButton}
                    onClick={() => onDeleteGuest(guest.id)}
                    title="Remover convidado"
                    aria-label="Remover convidado"
                    type="button"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyStateIcon}>😶</span>
          <p className={styles.emptyStateText}>Nenhum convidado encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default GuestCheckInList;
