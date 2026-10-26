import * as XLSX from 'xlsx';

export interface ParsedFileResult {
  fileName: string;
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export function parseCSV(text: string): { headers: string[]; rows: Record<string, any>[] } {
  // Simple & robust CSV/TSV parser supporting quotes and delimiters
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Detect delimiter: comma, semicolon, or tab
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semicolonCount > commaCount && semicolonCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';

  function parseRow(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  const rawHeaders = parseRow(lines[0]);
  const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').trim());

  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseRow(lines[i]);
    if (rawValues.length === 0 || (rawValues.length === 1 && !rawValues[0])) continue;

    const rowObj: Record<string, any> = {};
    headers.forEach((header, index) => {
      let val: any = rawValues[index] !== undefined ? rawValues[index].replace(/^["']|["']$/g, '').trim() : '';
      
      // Auto-cast types if recognizable
      if (val === 'true' || val === 'TRUE') val = true;
      else if (val === 'false' || val === 'FALSE') val = false;
      else if (val !== '' && !isNaN(Number(val)) && !/^\+?[0-9]{10,15}$/.test(val)) {
        // avoid converting phone numbers with leading plus or long digit sequences
        val = Number(val);
      }
      rowObj[header] = val;
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export async function parseExcel(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
  if (rawRows.length === 0) {
    return { headers: [], rows: [] };
  }

  // Collect unique headers across rows
  const headerSet = new Set<string>();
  rawRows.forEach(row => {
    Object.keys(row).forEach(key => headerSet.add(key));
  });

  const headers = Array.from(headerSet);
  return { headers, rows: rawRows };
}

export function parseJSON(text: string): { headers: string[]; rows: Record<string, any>[] } {
  try {
    const parsed = JSON.parse(text);
    let items: any[] = [];

    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.data)) items = parsed.data;
      else if (Array.isArray(parsed.rows)) items = parsed.rows;
      else if (Array.isArray(parsed.items)) items = parsed.items;
      else items = [parsed];
    }

    if (items.length === 0) {
      return { headers: [], rows: [] };
    }

    const headerSet = new Set<string>();
    items.forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(k => headerSet.add(k));
      }
    });

    const headers = Array.from(headerSet);
    return { headers, rows: items };
  } catch (err: any) {
    throw new Error('Nieprawidłowy format JSON: ' + (err.message || 'Błąd parsowania'));
  }
}

export async function parseImportFile(file: File): Promise<ParsedFileResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    const { headers, rows } = await parseExcel(file);
    return { fileName: file.name, headers, rows, totalRows: rows.length };
  } else if (extension === 'json') {
    const text = await file.text();
    const { headers, rows } = parseJSON(text);
    return { fileName: file.name, headers, rows, totalRows: rows.length };
  } else {
    // Default to CSV
    const text = await file.text();
    const { headers, rows } = parseCSV(text);
    return { fileName: file.name, headers, rows, totalRows: rows.length };
  }
}

export function exportToCSV(filename: string, headers: string[], rows: Record<string, any>[]) {
  const csvRows: string[] = [];
  
  // Header row
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

  // Data rows
  rows.forEach(row => {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(filename: string, rows: Record<string, any>[]) {
  const jsonStr = JSON.stringify(rows, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
