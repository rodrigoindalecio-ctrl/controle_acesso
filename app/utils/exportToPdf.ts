import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GuestReport {
  id: string;
  fullName: string;
  category?: string;
  tableNumber?: string | null;
  checkedInAt: string | null;
  checkedInBy?: string;
  isPaying?: boolean | null;
}

interface EventStats {
  total: number;
  checkedIn: number;
  pending: number;
  eventName: string;
  eventType?: string;
  paying?: number;
  nonPaying?: number;
}


export function generateEventReport(
  guests: GuestReport[],
  stats: EventStats
) {
  try {
    console.log('Iniciando geração de PDF...', { totalGuests: guests.length, eventName: stats.eventName });

    // Garantir que temos um título de evento legível
    const eventTitle = stats.eventName && stats.eventName.trim().length > 0
      ? stats.eventName.trim()
      : 'Evento';
    if (eventTitle === 'Evento') {
      console.warn('generateEventReport: stats.eventName ausente — usando fallback "Evento". Verifique se o nome do evento está sendo carregado da base de dados.');
    }
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    console.log('jsPDF instância criada com sucesso');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // ===== CABEÇALHO =====
    doc.setFontSize(22);
    doc.setFont('', 'bold');
    doc.text(eventTitle, margin, yPosition);
    yPosition += 10;

    if (stats.eventType) {
      doc.setFontSize(11);
      doc.setFont('', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`${stats.eventType}`, margin, yPosition);
      yPosition += 8;
      doc.setTextColor(0, 0, 0);
    }

    doc.setFontSize(10);
    doc.setFont('', 'normal');
    const reportDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Relatório gerado em: ${reportDate}`, margin, yPosition);
    yPosition += 10;

    // ===== ESTATÍSTICAS GERAIS (layout mais didático) =====
    doc.setFontSize(12);
    doc.setFont('', 'bold');
    doc.text('Estatísticas Gerais', margin, yPosition);
    yPosition += 8;

    const percentPresence = stats.total > 0
      ? ((stats.checkedIn / stats.total) * 100).toFixed(1)
      : '0.0';

    // Caixa destacada com linhas label/value
    const statsBoxX = margin;
    const statsBoxY = yPosition;
    const statsBoxW = pageWidth - margin * 2;
    const statsBoxPadding = 6;
    const lineHeight = 9;

    // Background
    doc.setFillColor(250, 249, 247);
    doc.setDrawColor(230, 225, 220);
    doc.setLineWidth(0.6);
    doc.rect(statsBoxX, statsBoxY, statsBoxW, lineHeight * 4 + statsBoxPadding * 2, 'FD');

    const labels = ['Total de Convidados', 'Presentes', 'Ausentes', 'Percentual de Presença'];
    const values = [String(stats.total), String(stats.checkedIn), String(stats.pending), `${percentPresence}%`];

    for (let i = 0; i < labels.length; i++) {
      const rowY = statsBoxY + statsBoxPadding + i * lineHeight + 6;

      // Label
      doc.setFontSize(10);
      doc.setFont('', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(labels[i], statsBoxX + 8, rowY);

      // Value (alinhado à direita)
      doc.setFontSize(12);
      doc.setFont('', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(values[i], statsBoxX + statsBoxW - 8, rowY, { align: 'right' });

      doc.setTextColor(0, 0, 0);
    }

    yPosition = statsBoxY + lineHeight * 4 + statsBoxPadding * 2 + 8;

    // Add paying/non-paying summary if available
    // Calcular pagantes/não pagantes presentes
    const presentPaying = guests.filter(g => g.checkedInAt && g.isPaying === true).length;
    const presentNonPaying = guests.filter(g => g.checkedInAt && g.isPaying === false).length;
    // Box destacado para pagantes/não pagantes presentes
    doc.setFillColor(245, 232, 235);
    doc.setDrawColor(123, 45, 61);
    doc.setLineWidth(1);
    doc.rect(margin, yPosition, pageWidth - margin * 2, 15, 'FD');

    doc.setFont('', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(123, 45, 61);
    const payingSummary = `${presentPaying} convidados Pagantes e ${presentNonPaying} não pagantes`;
    doc.text(payingSummary, pageWidth / 2, yPosition + 9, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    yPosition += 20;

    yPosition += 2;

    // ===== PRESENÇA POR CATEGORIA =====
    const categoryStats = calculateCategoryStats(guests);
    
    if (Object.keys(categoryStats).length > 0) {
      doc.setFontSize(12);
      doc.setFont('', 'bold');
      doc.text('Presença por Categoria', margin, yPosition);
      yPosition += 7;

      doc.setFontSize(9);
      doc.setFont('', 'normal');

      const categoryRows = Object.entries(categoryStats).map(([category, data]) => [
        category || 'Sem categoria',
        String(data.total),
        String(data.checkedIn),
        String(data.pending),
        `${((data.checkedIn / data.total) * 100).toFixed(1)}%`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Categoria', 'Total', 'Presentes', 'Ausentes', '% Presença']],
        body: categoryRows,
        margin: { left: margin, right: margin },
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          halign: 'center',
        },
        headStyles: {
          fillColor: [123, 45, 61],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 232, 235],
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 8;
    }

    // ===== LISTA DETALHADA DE CONVIDADOS =====
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('', 'bold');
    doc.text('Lista Detalhada de Convidados', margin, yPosition);
    yPosition += 7;

    // Preparar dados da tabela
    const tableRows = guests.map((guest) => {
      const checkInInfo = guest.checkedInAt
        ? new Date(guest.checkedInAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Não entrou';

      const pagante = guest.isPaying === false ? 'Não' : (guest.checkedInAt ? 'Sim' : '—');

      return [
        guest.fullName,
        guest.category || '—',
        guest.tableNumber ? `Mesa ${guest.tableNumber}` : '—',
        checkInInfo,
        pagante,
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Nome', 'Categoria', 'Mesa', 'Status / Data e Hora', 'Pagante']],
      body: tableRows,
      margin: { left: margin, right: margin },
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 4,
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [123, 45, 61],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 232, 235],
      },
      columnStyles: {
        0: { cellWidth: 'auto', minWidth: 45 },
        1: { cellWidth: 'auto', minWidth: 30 },
        2: { cellWidth: 'auto', minWidth: 22 },
        3: { cellWidth: 'auto', minWidth: 40 },
        4: { cellWidth: 'auto', minWidth: 18, halign: 'center' },
      },
      didDrawPage: (data: any) => {
        // Rodapé
        const pageCount = doc.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.getHeight();
        const pageWidth = pageSize.getWidth();

        doc.setFontSize(8);
        doc.setFont('', 'normal');
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      },
    });

    // Salvar PDF
    // Sanitize event title for filename
    const safeTitle = eventTitle
      .replace(/[\/:*?"<>|]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-\&]/g, '');
    const fileName = `relatorio-${safeTitle}-${new Date().getTime()}.pdf`;
    console.log('Salvando arquivo:', fileName);
    doc.save(fileName);
    console.log('PDF salvo com sucesso');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
  }
}

function calculateCategoryStats(guests: GuestReport[]): {
  [key: string]: { total: number; checkedIn: number; pending: number };
} {
  const stats: {
    [key: string]: { total: number; checkedIn: number; pending: number };
  } = {};

  guests.forEach((guest) => {
    const category = guest.category || 'Sem categoria';

    if (!stats[category]) {
      stats[category] = { total: 0, checkedIn: 0, pending: 0 };
    }

    stats[category].total += 1;

    if (guest.checkedInAt) {
      stats[category].checkedIn += 1;
    } else {
      stats[category].pending += 1;
    }
  });

  return stats;
}
