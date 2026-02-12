/**
 * P4.1: Exportação CSV de Relatório de Check-in
 * Sem dependências externas, compatível com Excel
 */

import { CheckInReport } from './generateCheckInReport';

interface GuestForExport {
  id: string;
  fullName: string;
  category?: string;
  tableNumber?: string | null;
  checkedInAt?: string | null;
  undoAt?: string;
}

/**
 * Determina o status do convidado para o relatório
 */
function getGuestStatus(guest: GuestForExport): string {
  if (guest.undoAt && guest.undoAt.trim() !== '') {
    return 'Desfeito';
  }
  if (guest.checkedInAt && guest.checkedInAt.trim() !== '') {
    return 'Entrou';
  }
  return 'Não entrou';
}

/**
 * Formata timestamp ISO para formato HH:MM:SS PT-BR
 */
function formatCheckInTime(isoString: string | null | undefined): string {
  if (!isoString || isoString.trim() === '') {
    return '';
  }
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (e) {
    return '';
  }
}

/**
 * Escapa aspas duplas em valores CSV
 */
function escapeCSV(value: string | null | undefined): string {
  if (!value) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(';') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Gera CSV a partir do relatório e inicia download
 * 
 * Colunas: Nome | Categoria | Mesa | Status | Horário de entrada | Horário de desfazer
 */
export function exportCheckInCSV(report: CheckInReport): void {
  const lines: string[] = [];

  // Cabeçalho (UTF-8 BOM para Excel reconhecer encoding)
  lines.push(
    '\uFEFFNome;Categoria;Mesa;Status;Horário de entrada;Horário de desfazer'
  );

  // Dados
  report.raw.forEach((guest) => {
    const status = getGuestStatus(guest);
    const checkInTime = formatCheckInTime(guest.checkedInAt ?? undefined);
    const undoTime = formatCheckInTime(guest.undoAt ?? undefined);

    const row = [
      escapeCSV(guest.fullName),
      escapeCSV(guest.category || ''),
      escapeCSV(guest.tableNumber || ''),
      escapeCSV(status),
      escapeCSV(checkInTime),
      escapeCSV(undoTime),
    ].join(';');

    lines.push(row);
  });

  // Linha em branco
  lines.push('');

  // Resumo
  lines.push('');
  lines.push('Resumo;;;;;');
  lines.push(`Total;${report.summary.total};;;;`);
  lines.push(`Entraram;${report.summary.checkedIn};;;;`);
  lines.push(`Não entraram;${report.summary.notCheckedIn};;;;`);
  lines.push(`Desfeitos;${report.summary.undone};;;;`);

  // Timeline
  lines.push('');
  lines.push('Timeline;;;;;');
  lines.push('Hora;Quantidade;;;;');
  report.timeline.forEach(({ hour, count }) => {
    lines.push(`${hour};${count};;;;`);
  });

  // Gerar blob e download
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `checkin-report-${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  URL.revokeObjectURL(url);
}
