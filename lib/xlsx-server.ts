'use server';

export async function generateExampleXlsx() {
  // Dinâmicamente importar xlsx só quando precisar
  const XLSX = await import('xlsx');

  const data = [
    ['full_name', 'phone', 'category', 'table_number', 'notes'],
    ['João Silva', '11999999999', 'familia_noiva', 'A01', 'Primo do noivo'],
    ['Maria Santos', '11988888888', 'familia_noivo', 'A02', 'Tia da noiva'],
    ['Pedro Oliveira', '11977777777', 'padrinhos', 'B01', 'Padrinho'],
    ['Ana Costa', '11966666666', 'amigos', 'C01', 'Colega de trabalho'],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  XLSX.utils.book_append_sheet(wb, ws, 'Convidados');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}
