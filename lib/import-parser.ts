/**
 * Parser para CSV e XLSX
 * Suporta quoted fields, escape de aspas, etc.
 */

import ExcelJS from 'exceljs';

export interface ParseCSVOptions {
  delimiter?: string;
  quoteChar?: string;
  escapeChar?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
}

/**
 * Parse CSV string em array de objetos
 */
export function parseCSV(
  csvContent: string,
  options: ParseCSVOptions = {}
): Record<string, any>[] {
  const {
    delimiter = ',',
    quoteChar = '"',
    escapeChar = '"',
    hasHeader = true,
    skipEmptyLines = true
  } = options;

  const lines = csvContent.split('\n');
  
  if (lines.length === 0) {
    return [];
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine, delimiter, quoteChar, escapeChar);

  if (!hasHeader || headers.length === 0) {
    return [];
  }

  const result: Record<string, any>[] = [];

  // Parse data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (skipEmptyLines && !line.trim()) {
      continue;
    }

    const values = parseCSVLine(line, delimiter, quoteChar, escapeChar);
    const row: Record<string, any> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    result.push(row);
  }

  return result;
}

/**
 * Parse uma linha de CSV
 */
export function parseCSVLine(
  line: string,
  delimiter: string = ',',
  quoteChar: string = '"',
  escapeChar: string = '"'
): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === quoteChar) {
      if (insideQuotes && line[i + 1] === escapeChar) {
        // Escaped quote
        current += quoteChar;
        i += 2;
      } else {
        // Toggle quotes
        insideQuotes = !insideQuotes;
        i++;
      }
    } else if (char === delimiter && !insideQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Lê arquivo como string
 * Funciona tanto no browser (FileReader) quanto no servidor (file.text())
 */
export async function readFileAsString(file: File): Promise<string> {
  // No servidor Next.js, o File object tem o método text() diretamente
  if (typeof file.text === 'function') {
    return await file.text();
  }
  
  // Fallback para browser usando FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Valida extensão de arquivo (CSV ou XLSX)
 */
export function isValidCSVFile(file: File): boolean {
  const validTypes = [
    'text/csv', 
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  const validExtensions = ['.csv', '.xlsx'];

  const isValidType = validTypes.includes(file.type);
  const isValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

  return isValidType || isValidExt;
}

/**
 * Verifica se é arquivo XLSX
 */
export function isXLSXFile(file: File): boolean {
  const xlsxTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const isValidType = xlsxTypes.includes(file.type);
  const isValidExt = file.name.toLowerCase().endsWith('.xlsx');
  return isValidType || isValidExt;
}

/**
 * Parse arquivo XLSX em array de objetos
 */
export async function parseXLSX(file: File): Promise<Record<string, any>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  // Pegar primeira aba (ou aba "Convidados" se existir)
  let worksheet = workbook.getWorksheet('Convidados');
  if (!worksheet) {
    worksheet = workbook.worksheets[0];
  }
  
  if (!worksheet) {
    return [];
  }

  const result: Record<string, any>[] = [];
  const headers: string[] = [];

  // Pegar headers da primeira linha
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const value = cell.value?.toString()?.trim() || `Column${colNumber}`;
    headers[colNumber - 1] = value;
  });

  // Iterar pelas linhas de dados (começando da linha 2)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Pular header

    const rowData: Record<string, any> = {};
    let hasData = false;

    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        let value = '';
        
        if (cell.value !== null && cell.value !== undefined) {
          if (typeof cell.value === 'object' && 'text' in cell.value) {
            value = cell.value.text?.toString() || '';
          } else if (typeof cell.value === 'object' && 'richText' in cell.value) {
            value = (cell.value as any).richText?.map((rt: any) => rt.text).join('') || '';
          } else {
            value = cell.value.toString();
          }
        }
        
        rowData[header] = value.trim();
        if (value.trim()) hasData = true;
      }
    });

    // Adicionar apenas linhas com dados
    if (hasData) {
      result.push(rowData);
    }
  });

  return result;
}

/**
 * Valida tamanho do arquivo (máximo 10MB)
 */
export function isFileSizeValid(file: File, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Filtra linhas em branco: retorna apenas linhas com ao menos um campo preenchido
 * Uma linha é considerada em branco se todos os valores são vazios ou contêm só espaços
 */
export function filterBlankRows(rows: Record<string, any>[]): Record<string, any>[] {
  return rows.filter(row => {
    const values = Object.values(row);
    return values.some(val => {
      const str = String(val || '').trim();
      return str.length > 0;
    });
  });
}
