const XLSX = require('xlsx');
const path = require('path');

// Dados dos convidados
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

// Configurar estilos
const headerFill = { fgColor: { rgb: 'FFD4A574' } }; // Cor primária
const headerFont = { bold: true, color: { rgb: 'FFFFFFFF' }, size: 12 };
const headerAlignment = { horizontal: 'center', vertical: 'center' };

// Aplicar estilos ao header
for (let i = 0; i < 5; i++) {
  const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
  ws[cellRef].fill = headerFill;
  ws[cellRef].font = headerFont;
  ws[cellRef].alignment = headerAlignment;
}

// Dados com cores alternadas
const evenFill = { fgColor: { rgb: 'FFF5E6D3' } };
const oddFill = { fgColor: { rgb: 'FFFAF7F2' } };

for (let i = 1; i < data.length; i++) {
  for (let j = 0; j < 5; j++) {
    const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
    ws[cellRef].fill = i % 2 === 0 ? evenFill : oddFill;
    ws[cellRef].alignment = { horizontal: 'left', vertical: 'center' };
    ws[cellRef].border = {
      top: { style: 'thin', color: { rgb: 'FFD4A574' } },
      bottom: { style: 'thin', color: { rgb: 'FFD4A574' } },
      left: { style: 'thin', color: { rgb: 'FFD4A574' } },
      right: { style: 'thin', color: { rgb: 'FFD4A574' } }
    };
  }
}

// Configurar largura das colunas
ws['!cols'] = [
  { wch: 20 }, // full_name
  { wch: 15 }, // phone
  { wch: 16 }, // category
  { wch: 14 }, // table_number
  { wch: 25 }  // notes
];

// Configurar altura do header
ws['!rows'] = [{ hpx: 25 }];

// Adicionar worksheet ao workbook
XLSX.utils.book_append_sheet(wb, ws, 'Convidados');

// Salvar arquivo
const filePath = path.join(__dirname, 'exemplo_convidados.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`✅ Arquivo criado: ${filePath}`);
