import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { parseCSV, readFileAsString, isValidCSVFile, isFileSizeValid, filterBlankRows, isXLSXFile, parseXLSX } from '@/lib/import-parser';
import { validateImportData, generateErrorCSV, generateExampleCSV } from '@/lib/import-validation';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/guests/import/validate
 * Valida um arquivo CSV sem salvar
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await verifyAuth(request);
    if (!authResult) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    // Extrair form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;

    // Validações
    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo foi enviado' }, { status: 400 });
    }

    if (!eventId) {
      return NextResponse.json({ message: 'Event ID é obrigatório' }, { status: 400 });
    }

    // Validar que evento existe
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
      select: { id: true }
    });

    if (!event) {
      return NextResponse.json({ message: 'Evento não encontrado' }, { status: 404 });
    }

    // Autorização: ADMIN ou USER vinculado ao evento
    if (authResult.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: Number(authResult.userId),
            eventId: Number(eventId)
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

    if (!isValidCSVFile(file)) {
      return NextResponse.json(
        { message: 'Arquivo deve ser CSV ou XLSX' },
        { status: 400 }
      );
    }

    if (!isFileSizeValid(file, 10)) {
      return NextResponse.json(
        { message: 'Arquivo não pode exceder 10MB' },
        { status: 400 }
      );
    }

    // Parse arquivo (CSV ou XLSX)
    let csvData: Record<string, any>[];

    if (isXLSXFile(file)) {
      csvData = await parseXLSX(file);
    } else {
      const csvContent = await readFileAsString(file);
      csvData = parseCSV(csvContent);
    }

    // Normalizar nomes de campos (PT-BR para formato do sistema)
    const fieldMapping: Record<string, string> = {
      'nome completo': 'full_name',
      'nome': 'full_name',
      'fullname': 'full_name',
      'full name': 'full_name',
      'categoria': 'category',
      'category': 'category',
      'mesa': 'table_number',
      'tablenumber': 'table_number',
      'table': 'table_number',
      'table number': 'table_number',
      'table_number': 'table_number',
      'telefone': 'phone',
      'phone': 'phone',
      'observações': 'notes',
      'observacoes': 'notes',
      'notes': 'notes',
      'obs': 'notes'
    };

    csvData = csvData.map(row => {
      const normalizedRow: Record<string, any> = {};
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim();
        const mappedKey = fieldMapping[lowerKey] || key;
        normalizedRow[mappedKey] = row[key];
      });
      return normalizedRow;
    });

    // Filter blank rows before validation
    csvData = filterBlankRows(csvData);

    if (csvData.length === 0) {
      return NextResponse.json(
        { message: 'Arquivo está vazio ou não contém dados válidos' },
        { status: 400 }
      );
    }

    // Buscar nomes existentes do evento para detecção de duplicatas
    const existingGuests = await prisma.guest.findMany({
      where: { eventId: Number(eventId) },
      select: { fullName: true }
    });

    const existingNames = new Set<string>(
      existingGuests.map(g => (g.fullName || '').toLowerCase())
    );

    // Validar dados
    const validation = validateImportData(csvData, existingNames);

    // Gerar CSV de erros se houver
    let errorCSVContent: string | null = null;
    if (validation.invalid.length > 0 || validation.duplicates.length > 0) {
      errorCSVContent = generateErrorCSV(validation.invalid, validation.duplicates);
    }

    return NextResponse.json({
      summary: {
        total: csvData.length,
        valid: validation.valid.length,
        invalid: validation.invalid.length,
        duplicates: validation.duplicates.length
      },
      data: {
        valid: validation.valid.slice(0, 200).map((guest, idx) => ({
          id: `new-${idx}`,
          ...guest,
          status: 'novo'
        })),
        invalid: validation.invalid.slice(0, 200),
        duplicates: validation.duplicates.slice(0, 200).map((dup, idx) => ({
          id: `dup-${idx}`,
          ...dup,
          status: 'duplicado'
        }))
      },
      errorCSV: errorCSVContent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao validar importação:', error);
    return NextResponse.json(
      { message: 'Erro ao processar arquivo' },
      { status: 500 }
    );
  }
}
