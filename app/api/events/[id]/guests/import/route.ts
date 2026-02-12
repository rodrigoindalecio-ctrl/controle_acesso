import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import * as XLSX from 'xlsx';

/**
 * POST /api/events/[id]/guests/import
 * Importar convidados via CSV
 * Apenas ADMIN pode fazer isso
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticação
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Validar que o evento existe
    const event = await prisma.event.findUnique({
      where: { id: params.id }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Autorização: ADMIN ou USER vinculado ao evento
    if (payload.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: payload.userId,
            eventId: params.id
          }
        }
      });

      if (!userEvent) {
        return NextResponse.json(
          { error: 'Acesso negado ao evento' },
          { status: 403 }
        );
      }
    }

    // Obter arquivo do form
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    const isXlsx = file.name.endsWith('.xlsx') || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv';

    if (!isXlsx && !isCsv) {
      return NextResponse.json(
        { error: 'Arquivo deve ser XLSX ou CSV' },
        { status: 400 }
      );
    }

    // Ler arquivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let lines: string[] = [];

    if (isXlsx) {
      // Parse XLSX
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
      
      // Converter para linhas de CSV-like format
      lines = data.map(row => (row as any[]).join(','));
    } else {
      // Parse CSV com codificação UTF-8
      const decoder = new TextDecoder('utf-8');
      const csvText = decoder.decode(arrayBuffer);
      lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    }

    if (lines.length < 1) {
      return NextResponse.json(
        { error: 'Arquivo CSV vazio' },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validar headers obrigatórios
    const requiredHeaders = ['full_name', 'phone', 'category', 'table_number', 'notes'];
    const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));

    if (!hasRequiredHeaders) {
      return NextResponse.json(
        { 
          error: `Headers obrigatórios não encontrados. Esperado: ${requiredHeaders.join(', ')}`,
          received: headers
        },
        { status: 400 }
      );
    }

    // Mapear índices das colunas
    const indexMap = {
      fullName: headers.indexOf('full_name'),
      phone: headers.indexOf('phone'),
      category: headers.indexOf('category'),
      tableNumber: headers.indexOf('table_number'),
      notes: headers.indexOf('notes')
    };

    // Normalizar categoria
    const validCategories = ['familia_noiva', 'familia_noivo', 'padrinhos', 'amigos', 'vip', 'outros'];
    const normalizeCategory = (category: string): string => {
      const normalized = category?.trim().toLowerCase();
      return validCategories.includes(normalized) ? normalized : 'outros';
    };

    // Validação de linha
    const validateRow = (rowIndex: number, values: string[], indexMap: any) => {
      const rowErrors: string[] = [];

      const fullName = values[indexMap.fullName];
      const phone = values[indexMap.phone] || '';
      const category = values[indexMap.category] || '';
      const tableNumber = values[indexMap.tableNumber] || '';
      const notes = values[indexMap.notes] || '';

      if (!fullName || fullName.trim().length === 0) {
        rowErrors.push(`Linha ${rowIndex + 1}: full_name é obrigatório`);
      } else if (fullName.length > 200) {
        rowErrors.push(`Linha ${rowIndex + 1}: full_name muito longo (máx 200 caracteres)`);
      }

      // phone é opcional, mas se presente deve ser apenas dígitos (8-15)
      if (phone && !/^\+?\d{8,15}$/.test(phone.replace(/\s+/g, ''))) {
        rowErrors.push(`Linha ${rowIndex + 1}: phone inválido (somente dígitos, 8-15 caracteres)`);
      }

      // category deve ser um dos válidos quando presente
      if (category && !validCategories.includes(category.trim().toLowerCase())) {
        rowErrors.push(`Linha ${rowIndex + 1}: category inválida`);
      }

      // tableNumber opcional, validar tamanho e caracteres
      if (tableNumber && !/^[A-Za-z0-9_\-]{1,10}$/.test(tableNumber)) {
        rowErrors.push(`Linha ${rowIndex + 1}: table_number inválido (aceitos: letras, números, - _ , até 10 chars)`);
      }

      if (notes && notes.length > 1000) {
        rowErrors.push(`Linha ${rowIndex + 1}: notes muito longo (máx 1000 caracteres)`);
      }

      return rowErrors;
    };

    // Processar linhas
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Buscar convidados existentes no banco
    const existingGuests = await prisma.guest.findMany({
      where: { eventId: params.id },
      select: { fullName: true }
    });
    const existingNames = new Set(existingGuests.map((g: any) => g.fullName.toLowerCase()));

    // Processar cada linha (começando da linha 1, pulando header)
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());

        // Validar conteúdo da linha
        const rowValidationErrors = validateRow(i, values, indexMap);
        if (rowValidationErrors.length > 0) {
          skipped++;
          errors.push(...rowValidationErrors);
          continue;
        }

        // Validar duplicata
        const fullName = values[indexMap.fullName];
        if (existingNames.has(fullName.toLowerCase())) {
          skipped++;
          errors.push(`Linha ${i + 1}: ${fullName} já existe neste evento`);
          continue;
        }

        // Extrair dados
        const phone = values[indexMap.phone] || null;
        const category = normalizeCategory(values[indexMap.category]);
        const tableNumber = values[indexMap.tableNumber] || null;
        const notes = values[indexMap.notes] || null;

        // Criar convidado no banco de dados
        await prisma.guest.create({
          data: {
            fullName,
            phone,
            category,
            tableNumber,
            notes,
            eventId: params.id,
            isManual: false,
            isChild: false,
            isPaying: true
          }
        });

        imported++;
        existingNames.add(fullName.toLowerCase());
      } catch (error) {
        skipped++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Linha ${i + 1}: ${errorMsg}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Validação CSV falhou',
        imported,
        skipped,
        total: imported + skipped,
        errors: errors.slice(0, 50)
      }, { status: 400 });
    }

    return NextResponse.json({
      imported,
      skipped,
      total: imported + skipped,
      errors: errors.slice(0, 10),
      status: 'success',
      message: `${imported} convidado(s) importado(s) com sucesso!`
    });
  } catch (error) {
    console.error('Erro ao importar convidados:', error);
    return NextResponse.json(
      { error: 'Erro ao processar arquivo' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

