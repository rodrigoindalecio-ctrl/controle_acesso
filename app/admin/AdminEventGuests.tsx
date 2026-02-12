import React from 'react';
import { useEventGuests } from '@/app/hooks/useEventGuests';
import GuestCheckInList from '@/app/components/event/GuestCheckInList';

export default function AdminEventGuests({ eventId, eventName, eventDescription, eventDate, eventLocation, eventStatus }: { eventId: string, eventName: string, eventDescription?: string, eventDate?: string, eventLocation?: string, eventStatus?: string }) {
  const {
    guests,
    loading,
    checkInGuest,
    undoCheckIn,
    deleteGuest,
    error
  } = useEventGuests(eventId);

  // guests otimista local
  const [localGuests, setLocalGuests] = React.useState(guests);
  React.useEffect(() => {
    // Sempre sincroniza localGuests com guests do backend (polling/refetch)
    setLocalGuests(guests);
  }, [guests]);

  // Funções otimistas
  const handleCheckInGuest = async (id: string) => {
    setLocalGuests(prev => prev.map(g =>
      g.id === id ? { ...g, checkedInAt: new Date().toISOString() } : g
    ));
    await checkInGuest(id);
  };
  const handleUndoCheckIn = async (id: string) => {
    setLocalGuests(prev => prev.map(g =>
      g.id === id ? { ...g, checkedInAt: null } : g
    ));
    await undoCheckIn(id);
  };

  // Compute stats for UI (total, checkedIn, pending, paying, nonPaying)
  const stats = (() => {
    let total = 0, checkedIn = 0, paying = 0, nonPaying = 0;
    localGuests.forEach(g => {
      total++;
      if (g.checkedInAt) {
        checkedIn++;
        if (g.isPaying === true) paying++;
        if (g.isPaying === false) nonPaying++;
      }
    });
    return {
      total,
      checkedIn,
      pending: total - checkedIn,
      paying,
      nonPaying
    };
  })();

  // Receberá props extras para descrição, data e local
  // Recebe props extras do pai
  return (
    <GuestCheckInList
      guests={localGuests}
      onCheckIn={handleCheckInGuest}
      onUndoCheckIn={handleUndoCheckIn}
      onDeleteGuest={deleteGuest}
    />
  );
}
