import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';

/**
 * GET /api/guests/import/template
 * Retorna um arquivo XLSX contendo a aba 'Convidados' e 'Instruções'
 */
export async function GET(_request: NextRequest) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Controle de Acesso';
  workbook.created = new Date();

  // Aba de Convidados
  const wsGuests = workbook.addWorksheet('Convidados', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // Definir colunas
  wsGuests.columns = [
    { header: 'Nome Completo', key: 'fullName', width: 35 },
    { header: 'Categoria', key: 'category', width: 20 },
    { header: 'Mesa', key: 'tableNumber', width: 12 }
  ];

  // Dados de exemplo
  const exampleGuests = [
    { fullName: 'João Silva', category: 'Família Noiva', tableNumber: '1' },
    { fullName: 'Maria Santos', category: 'Família Noivo', tableNumber: '2' },
    { fullName: 'Pedro Oliveira', category: 'Padrinhos', tableNumber: '3' },
    { fullName: 'Ana Costa', category: 'Madrinhas', tableNumber: '4' },
    { fullName: 'Carlos Mendes', category: 'Amigos', tableNumber: '5' },
    { fullName: 'Fernanda Rocha', category: 'VIP', tableNumber: '6' },
    { fullName: 'Lucas Ferreira', category: 'Outros', tableNumber: '7' }
  ];

  exampleGuests.forEach(guest => wsGuests.addRow(guest));

  // Estilizar cabeçalho
  const headerRow = wsGuests.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7B2D3D' }
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
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

  // Estilizar dados
  for (let i = 2; i <= exampleGuests.length + 1; i++) {
    const row = wsGuests.getRow(i);
    row.height = 18;
    const isEvenRow = i % 2 === 0;
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEvenRow ? 'FFF5E8EB' : 'FFFFFFFF' }
      };
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF333333' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
      };
    });
  }

  // Aba de Instruções
  const wsInstructions = workbook.addWorksheet('Instruções');
  wsInstructions.columns = [{ header: '', key: 'text', width: 80 }];
  
  const instructions = [
    '=== INSTRUÇÕES PARA IMPORTAÇÃO DE CONVIDADOS ===',
    '',
    '📝 COMO PREENCHER:',
    '   • Preencha APENAS a aba "Convidados"',
    '   • Não altere o nome das colunas',
    '   • Cada linha = um convidado',
    '',
    '✅ CAMPO OBRIGATÓRIO:',
    '   • Nome Completo',
    '',
    '📌 CAMPOS OPCIONAIS:',
    '   • Categoria (ex: Família Noiva, Padrinhos, Amigos, VIP)',
    '   • Mesa (ex: A01, B02, VIP01)',
    '',
    '⚠️ ATENÇÃO:',
    '   • Evite linhas totalmente vazias',
    '   • Salve o arquivo como .xlsx antes de enviar',
    '   • Apague as linhas de exemplo antes de adicionar seus convidados',
    '',
    '🔄 DUPLICIDADE:',
    '   • Ao confirmar importação, escolha a estratégia:',
    '   • IGNORAR: mantém o existente e não importa duplicado',
    '   • ATUALIZAR: substitui o existente pelo novo',
    '   • MARCAR: importa como novo e adiciona sufixo ao nome'
  ];
  
  instructions.forEach((text, index) => {
    const row = wsInstructions.addRow({ text });
    if (index === 0) {
      row.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF7B2D3D' } };
    } else if (text.startsWith('📝') || text.startsWith('✅') || text.startsWith('📌') || text.startsWith('⚠️') || text.startsWith('🔄')) {
      row.font = { name: 'Calibri', size: 11, bold: true };
    } else {
      row.font = { name: 'Calibri', size: 10 };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_convidados.xlsx"'
    }
  });
}
