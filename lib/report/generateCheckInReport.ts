/**
 * P4.1: Relatório Operacional de Check-in
 * Função pura de agregação — sem dependências externas
 */

interface GuestForReport {
  id: string | number;
  fullName: string;
  category?: string | null;
  tableNumber?: string | number | null;
  checkedInAt?: string | Date | null;
  checkedInBy?: string | number | null;
  undoAt?: string | Date | null;
  undoBy?: string | number | null;
}

export interface CheckInReportSummary {
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  undone: number;
}

export interface CheckInReportTimeline {
  hour: string; // formato "HH:00"
  count: number;
}

export interface CheckInReport {
  summary: CheckInReportSummary;
  timeline: CheckInReportTimeline[];
  raw: GuestForReport[];
}

/**
 * Gera relatório operacional de check-in
 * 
 * Regras:
 * - checkedIn: possui checkedInAt e NÃO possui undoAt
 * - undone: possui undoAt (foi desfeito)
 * - notCheckedIn: nunca teve checkedInAt
 * - timeline: agrupa somente check-ins válidos por hora cheia
 */
export function generateCheckInReport(guests: GuestForReport[]): CheckInReport {
  const summary: CheckInReportSummary = {
    total: guests.length,
    checkedIn: 0,
    notCheckedIn: 0,
    undone: 0,
  };

  const timelineMap = new Map<string, number>();

  guests.forEach((guest) => {
    const hasCheckedIn = !!guest.checkedInAt;
    const hasUndo = !!guest.undoAt;

    if (hasUndo) {
      // Check-in foi desfeito
      summary.undone++;
    } else if (hasCheckedIn) {
      // Check-in válido
      summary.checkedIn++;

      // Agregar por hora
      try {
        const date = new Date(guest.checkedInAt!);
        if (!isNaN(date.getTime())) {
          const hour = String(date.getHours()).padStart(2, '0') + ':00';
          timelineMap.set(hour, (timelineMap.get(hour) ?? 0) + 1);
        }
      } catch (e) {
        // Ignorar timestamps inválidos
      }
    } else {
      // Nunca entrou
      summary.notCheckedIn++;
    }
  });

  // Converter timeline map para array ordenado
  const timeline: CheckInReportTimeline[] = Array.from(timelineMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  return {
    summary,
    timeline,
    raw: guests,
  };
}
