import { z } from 'zod';

// Schema para linha de CSV
export const guestImportSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  category: z.string().max(50).optional().default('Convidado'),
  phone: z.string().max(20).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  table_number: z.string().max(10).optional().or(z.literal(''))
});

export type GuestImportData = z.infer<typeof guestImportSchema>;

export interface ImportValidationResult {
  valid: GuestImportData[];
  invalid: Array<{
    row: number;
    data: Record<string, any>;
    errors: string[];
  }>;
  duplicates: Array<{
    row: number;
    name: string;
    count: number;
  }>;
}

/**
 * Valida uma linha de convidado importado
 */
export function validateGuestRow(
  row: Record<string, any>,
  rowNumber: number
): { valid: GuestImportData | null; errors: string[] } {
  const errors: string[] = [];

  // Verificar campo obrigatório
  if (!row.full_name || typeof row.full_name !== 'string' || !row.full_name.trim()) {
    errors.push('Nome é obrigatório');
  }

  if (errors.length > 0) {
    return { valid: null, errors };
  }

  try {
    const validated = guestImportSchema.parse({
      full_name: row.full_name.trim(),
      category: row.category?.trim() || 'Convidado',
      phone: row.phone?.toString().trim() || '',
      notes: row.notes?.toString().trim() || '',
      table_number: row.table_number?.toString().trim() || ''
    });

    return { valid: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach(issue => {
        errors.push(`${issue.path.join('.')}: ${issue.message}`);
      });
    }
    return { valid: null, errors };
  }
}

/**
 * Normaliza nome: remove espaços duplicados e trim
 */
export function normalizeFullName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Padroniza telefone: remove caracteres especiais
 */
export function standardizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').substring(0, 20);
}

/**
 * Detecta duplicatas por nome
 */
export function detectDuplicates(guests: GuestImportData[]): Map<string, number> {
  const nameCount = new Map<string, number>();

  guests.forEach(guest => {
    const name = guest.full_name.toLowerCase();
    nameCount.set(name, (nameCount.get(name) || 0) + 1);
  });

  return nameCount;
}

/**
 * Valida um arquivo CSV completo
 */
export function validateImportData(
  csvData: Record<string, any>[],
  existingNames: Set<string> = new Set()
): ImportValidationResult {
  const valid: GuestImportData[] = [];
  const invalid: ImportValidationResult['invalid'] = [];
  const nameCount = new Map<string, number>();
  const duplicates: ImportValidationResult['duplicates'] = [];

  csvData.forEach((row, index) => {
    const rowNumber = index + 2; // +2 porque header é linha 1, dados começam em 2

    // Ignorar linhas vazias
    if (!row.full_name || !row.full_name.trim()) {
      return;
    }

    // Validar estrutura
    const { valid: validatedGuest, errors } = validateGuestRow(row, rowNumber);

    if (errors.length > 0 || !validatedGuest) {
      invalid.push({
        row: rowNumber,
        data: row,
        errors
      });
      return;
    }

    // Normalizar dados
    validatedGuest.full_name = normalizeFullName(validatedGuest.full_name);
    if (validatedGuest.phone) {
      validatedGuest.phone = standardizePhone(validatedGuest.phone);
    }

    // Detectar duplicata
    const nameLower = validatedGuest.full_name.toLowerCase();
    if (existingNames.has(nameLower)) {
      duplicates.push({
        row: rowNumber,
        name: validatedGuest.full_name,
        count: 1
      });
      return;
    }

    // Detectar duplicata dentro do import
    const count = (nameCount.get(nameLower) || 0) + 1;
    nameCount.set(nameLower, count);

    if (count > 1) {
      duplicates.push({
        row: rowNumber,
        name: validatedGuest.full_name,
        count
      });
    }

    valid.push(validatedGuest);
  });

  return {
    valid,
    invalid,
    duplicates
  };
}

/**
 * Gera CSV de erros
 */
export function generateErrorCSV(
  invalid: ImportValidationResult['invalid'],
  duplicates: ImportValidationResult['duplicates']
): string {
  let csv = 'row,full_name,error_reason\n';

  invalid.forEach(item => {
    const escapedName = `"${item.data.full_name?.toString().replace(/"/g, '""') || 'N/A'}"`;
    const errors = item.errors.join('; ');
    csv += `${item.row},${escapedName},"${errors}"\n`;
  });

  duplicates.forEach(item => {
    csv += `${item.row},"${item.name}","Duplicado (${item.count}x neste arquivo)"\n`;
  });

  return csv;
}

/**
 * Gera exemplo de CSV
 */
export function generateExampleCSV(): string {
  return `full_name,category,phone,notes,table_number
João Silva,Acompanhante,11987654321,Convidado do noivo,A1
Maria Santos,Convidado,11987654322,Convidada da noiva,A2
Pedro Oliveira,Criança,11987654323,Filho de João,A1
Ana Costa,Acompanhante,11987654324,Cônjuge de Maria,A2
Carla Martins,Convidado,,,B1
`;
}
