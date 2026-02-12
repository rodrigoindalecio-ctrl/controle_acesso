import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

/**
 * GET /api/guests/export?eventId=...
 * Exporta convidados do evento para XLSX
 * 
 * Requer autenticação e eventId válido
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair parâmetro
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { message: 'eventId é obrigatório' },
        { status: 400 }
      );
    }

    // Validar que evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true }
    });

    if (!event) {
      return NextResponse.json(
        { message: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Autorização: ADMIN ou USER vinculado ao evento
    if (authResult.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: authResult.userId,
            eventId
          }
        }
      });

      if (!userEvent) {
        return NextResponse.json(
          { message: 'Acesso negado ao evento' },
          { status: 403 }
        );
      }
    }

    // Buscar convidados do evento
    const guests = await prisma.guest.findMany({
      where: { eventId },
      select: {
        fullName: true,
        category: true,
        tableNumber: true,
        checkedInAt: true,
        isPaying: true
      },
      orderBy: { fullName: 'asc' }
    });

    // Função para formatar horário do check-in
    const formatCheckInTime = (checkedInAt: Date | null): string => {
      if (!checkedInAt) return '';
      return new Date(checkedInAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    // Criar workbook com exceljs
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Controle de Acesso';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Convidados', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    // Definir colunas com larguras
    worksheet.columns = [
      { header: 'Qtd', key: 'qtd', width: 6 },
      { header: 'Nome Completo', key: 'fullName', width: 35 },
      { header: 'Categoria', key: 'category', width: 18 },
      { header: 'Mesa', key: 'tableNumber', width: 10 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Horário do Checkin', key: 'checkInTime', width: 20 },
      { header: 'Observações', key: 'observations', width: 16 }
    ];

    // Adicionar dados
    guests.forEach((guest, index) => {
      const status = guest.checkedInAt ? 'check-in' : 'não check-in';
      const checkInTime = formatCheckInTime(guest.checkedInAt);
      const paymentStatus = guest.checkedInAt 
        ? (guest.isPaying ? 'Pagante' : 'Não pagante')
        : '';
      
      worksheet.addRow({
        qtd: index + 1,
        fullName: guest.fullName,
        category: guest.category || '',
        tableNumber: guest.tableNumber || '',
        status: status,
        checkInTime: checkInTime,
        observations: paymentStatus
      });
    });

    // Estilizar cabeçalho
    const headerRow = worksheet.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7B2D3D' } // Bordô
      };
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' } // Branco
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF5E1F2D' } },
        left: { style: 'thin', color: { argb: 'FF5E1F2D' } },
        bottom: { style: 'thin', color: { argb: 'FF5E1F2D' } },
        right: { style: 'thin', color: { argb: 'FF5E1F2D' } }
      };
    });

    // Estilizar linhas de dados
    for (let i = 2; i <= guests.length + 1; i++) {
      const row = worksheet.getRow(i);
      row.height = 18;
      
      const isEvenRow = i % 2 === 0;
      
      row.eachCell((cell, colNumber) => {
        // Cor de fundo alternada
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEvenRow ? 'FFF5E8EB' : 'FFFFFFFF' }
        };
        
        cell.font = {
          name: 'Calibri',
          size: 10,
          color: { argb: 'FF333333' }
        };
        
        // Centralizar colunas Qtd, Mesa, Status, Horário e Observações
        if (colNumber === 1 || colNumber === 4 || colNumber === 5 || colNumber === 6 || colNumber === 7) {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center'
          };
        } else {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left'
          };
        }
        
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
          left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
          bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
          right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
        };
      });
    }

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Gerar nome do arquivo com data/hora
    const eventName = event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `convidados_${eventName}_${timestamp}.xlsx`;

    // Retornar arquivo como download
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Erro ao exportar convidados:', error);
    return NextResponse.json(
      { message: 'Erro ao exportar convidados' },
      { status: 500 }
    );
  }
}
