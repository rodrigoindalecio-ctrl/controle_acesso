import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/guests/example-xlsx
 * Retorna um arquivo XLSX de exemplo com formatação
 */
export async function GET(req: NextRequest) {
  try {
    // Importar dinamicamente para evitar erro se xlsx não está instalado
    let XLSX: any;
    try {
      XLSX = await import('xlsx');
    } catch (e) {
      return NextResponse.json(
        { error: 'Biblioteca XLSX não disponível. Por favor, use CSV.' },
        { status: 500 }
      );
    }

    // Dados de exemplo
    const data = [
      ['full_name', 'phone', 'category', 'table_number', 'notes'],
      ['João Silva', '11999999999', 'familia_noiva', 'A01', 'Primo do noivo'],
      ['Maria Santos', '11988888888', 'familia_noivo', 'A02', 'Tia da noiva'],
      ['Pedro Oliveira', '11977777777', 'padrinhos', 'B01', 'Padrinho'],
      ['Ana Costa', '11966666666', 'amigos', 'C01', 'Colega de trabalho'],
      ['Carlos Mendes', '11955555555', 'vip', 'VIP01', 'Gerente da empresa'],
      ['Fernanda Rocha', '11944444444', 'outros', 'C02', 'Conhecida'],
      ['Julia Silva', '11933333333', 'familia_noiva', 'A03', 'Filha do primo'],
      ['Rafael Santos', '11922222222', 'familia_noivo', 'A04', 'Sobrinho'],
      ['Patricia Oliveira', '', 'padrinhos', 'B02', 'Madrinha'],
      ['Lucas Costa', '11911111111', 'amigos', 'C03', 'Amigo da faculdade']
    ];

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Configurar estilos (cores, fontes, preenchimento)
    const headerStyle = {
      fill: { fgColor: { rgb: 'FF7B2D3D' } },
      font: { bold: true, color: { rgb: 'FFFFFFFF' }, size: 12 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'FF5E1F2D' } },
        bottom: { style: 'thin', color: { rgb: 'FF5E1F2D' } },
        left: { style: 'thin', color: { rgb: 'FF5E1F2D' } },
        right: { style: 'thin', color: { rgb: 'FF5E1F2D' } }
      }
    };

    // Aplicar estilos ao header
    for (let i = 0; i < 5; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      ws[cellRef].fill = headerStyle.fill;
      ws[cellRef].font = headerStyle.font;
      ws[cellRef].alignment = headerStyle.alignment;
      ws[cellRef].border = headerStyle.border;
    }

    // Cores alternadas para as linhas
    const evenFill = { fgColor: { rgb: 'FFF5E8EB' } };
    const oddFill = { fgColor: { rgb: 'FFFFFFFF' } };
    const dataFont = { size: 11, color: { rgb: 'FF333333' } };
    const dataBorder = {
      top: { style: 'thin', color: { rgb: 'FFDDCBD0' } },
      bottom: { style: 'thin', color: { rgb: 'FFDDCBD0' } },
      left: { style: 'thin', color: { rgb: 'FFDDCBD0' } },
      right: { style: 'thin', color: { rgb: 'FFDDCBD0' } }
    };

    for (let i = 1; i < data.length; i++) {
      for (let j = 0; j < 5; j++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
        ws[cellRef].fill = i % 2 === 0 ? evenFill : oddFill;
        ws[cellRef].font = dataFont;
        ws[cellRef].alignment = { horizontal: 'left', vertical: 'center' };
        ws[cellRef].border = dataBorder;
      }
    }

    // Configurar largura das colunas
    ws['!cols'] = [
      { wch: 22 }, // full_name
      { wch: 16 }, // phone
      { wch: 18 }, // category
      { wch: 16 }, // table_number
      { wch: 28 }  // notes
    ];

    // Configurar altura do header
    ws['!rows'] = [{ hpx: 28 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Convidados');

    // Gerar buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Retornar como arquivo
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="exemplo_convidados.xlsx"'
      }
    });
  } catch (error) {
    console.error('Erro ao gerar XLSX:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar arquivo XLSX' },
      { status: 500 }
    );
  }
}
