import React, { useState, useRef } from 'react';
import { TableMeta } from '../types';
import { parseImportFile, ParsedFileResult } from '../lib/fileParser';
import { bulkInsertRows } from '../lib/supabaseClient';
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight, Loader2, X, RefreshCw } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableMeta;
  onImportComplete: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  table,
  onImportComplete,
  onToast
}) => {
  const [fileData, setFileData] = useState<ParsedFileResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // fileHeader -> tableColName or '__skip__'
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [importResult, setImportResult] = useState<{ successCount: number; errors: { row: number; error: string }[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setImportResult(null);
    try {
      const parsed = await parseImportFile(file);
      if (parsed.rows.length === 0) {
        onToast('error', 'Pusty plik', 'Wybrany plik nie zawiera żadnych wierszy danych.');
        setParsing(false);
        return;
      }

      setFileData(parsed);

      // Auto-map headers
      const initialMapping: Record<string, string> = {};
      parsed.headers.forEach(header => {
        const cleanH = header.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        // Exact or fuzzy match against table columns
        const matchedCol = table.columns.find(col => {
          const cleanCol = col.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
          if (cleanH === cleanCol) return true;
          if (cleanH.includes(cleanCol) || cleanCol.includes(cleanH)) return true;
          // Polish synonyms
          if (cleanCol === 'title' && (cleanH.includes('nazwa') || cleanH.includes('tytul'))) return true;
          if (cleanCol === 'price' && cleanH.includes('cena')) return true;
          if (cleanCol === 'image_url' && (cleanH.includes('zdjecie') || cleanH.includes('foto') || cleanH.includes('obraz'))) return true;
          if (cleanCol === 'stock' && (cleanH.includes('ilosc') || cleanH.includes('magazyn') || cleanH.includes('stan'))) return true;
          return false;
        });

        if (matchedCol) {
          initialMapping[header] = matchedCol.name;
        } else {
          initialMapping[header] = '__skip__';
        }
      });

      setColumnMapping(initialMapping);
      onToast('info', 'Plik wczytany', `Wykryto ${parsed.rows.length} wierszy oraz ${parsed.headers.length} nagłówków.`);
    } catch (err: any) {
      onToast('error', 'Błąd parsowania pliku', err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleMappingChange = (fileHeader: string, targetCol: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [fileHeader]: targetCol
    }));
  };

  const executeImport = async () => {
    if (!fileData || fileData.rows.length === 0) return;

    setImporting(true);
    setProgress(10);

    try {
      // Transform rows based on mapping
      const mappedRows: Record<string, any>[] = [];

      for (const rawRow of fileData.rows) {
        const cleanRow: Record<string, any> = {};
        for (const [fileHeader, targetCol] of Object.entries(columnMapping)) {
          if (targetCol !== '__skip__' && rawRow[fileHeader] !== undefined) {
            let val = rawRow[fileHeader];

            const colMeta = table.columns.find(c => c.name === targetCol);
            if (colMeta) {
              if (colMeta.dataType === 'number') {
                val = val === '' || val === null ? null : Number(val);
              } else if (colMeta.dataType === 'boolean') {
                val = val === true || val === 'true' || val === 1 || val === '1';
              }
            }

            cleanRow[targetCol] = val;
          }
        }
        mappedRows.push(cleanRow);
      }

      setProgress(40);
      const res = await bulkInsertRows(table.name, mappedRows);
      setProgress(100);
      setImportResult(res);

      if (res.successCount > 0) {
        onToast(
          'success',
          'Import zakończony sukcesem',
          `Zaimportowano ${res.successCount} rekordów do tabeli ${table.name}.`
        );
        onImportComplete();
      }
      if (res.errors.length > 0) {
        onToast('error', 'Niektóre wiersze zwróciły błąd', `Nie udało się zapisać ${res.errors.length} wierszy.`);
      }
    } catch (err: any) {
      onToast('error', 'Błąd masowego importu', err.message);
    } finally {
      setImporting(false);
    }
  };

  const resetAll = () => {
    setFileData(null);
    setColumnMapping({});
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Import danych z pliku (CSV, Excel, JSON)</h3>
              <p className="text-xs text-slate-400">
                Tabela docelowa: <span className="font-semibold text-slate-200">{table.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!fileData ? (
            /* Upload Step */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700/80 hover:border-emerald-500/80 rounded-xl p-10 cursor-pointer bg-slate-950/40 hover:bg-slate-950/70 transition-all text-center group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls,.json"
                className="hidden"
              />
              <div className="p-3 bg-slate-800/80 rounded-full text-slate-300 group-hover:text-emerald-400 group-hover:scale-110 transition-all mb-3 border border-slate-700/60">
                {parsing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </div>
              <h4 className="text-sm font-semibold text-slate-200">
                {parsing ? 'Analizowanie struktury pliku...' : 'Wybierz lub upuść plik z danymi'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Obsługiwane formaty: arkusze <strong>Excel (.xlsx, .xls)</strong>, pliki <strong>CSV</strong> (dowolny separator) oraz <strong>JSON</strong>.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>Auto-detekcja kolumn</span>
                <span>·</span>
                <span>Podgląd przed zapisem</span>
                <span>·</span>
                <span>Bezpieczne wstawianie</span>
              </div>
            </div>
          ) : (
            /* Mapping & Preview Step */
            <div className="space-y-5">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-200">{fileData.fileName}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-emerald-400">{fileData.totalRows} rekordów</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-slate-400">{fileData.headers.length} kolumn w pliku</span>
                </div>
                <button
                  onClick={resetAll}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Zmień plik</span>
                </button>
              </div>

              {/* Column Mapping Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Dopasowanie kolumn (Mapowanie)
                </h4>
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Nagłówek w pliku</th>
                        <th className="px-2 py-2.5 w-8"></th>
                        <th className="px-4 py-2.5 font-medium">Kolumna w tabeli "{table.name}"</th>
                        <th className="px-4 py-2.5 font-medium">Wartość przykładowa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {fileData.headers.map(header => {
                        const target = columnMapping[header] || '__skip__';
                        const sampleValue = fileData.rows[0]?.[header];

                        return (
                          <tr key={header} className="hover:bg-slate-800/30">
                            <td className="px-4 py-2 text-slate-200 font-medium">{header}</td>
                            <td className="px-2 py-2 text-slate-400 text-center">
                              <ArrowRight className="w-3.5 h-3.5 inline" />
                            </td>
                            <td className="px-4 py-2 font-sans">
                              <select
                                value={target}
                                onChange={e => handleMappingChange(header, e.target.value)}
                                className={`px-2 py-1 text-xs rounded border bg-slate-900 focus:outline-none ${
                                  target === '__skip__'
                                    ? 'text-slate-400 border-slate-800'
                                    : 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30'
                                }`}
                              >
                                <option value="__skip__">-- Pomiń tę kolumnę --</option>
                                {table.columns.map(col => (
                                  <option key={col.name} value={col.name}>
                                    {col.name} ({col.dataType}){col.isPrimary ? ' [PK]' : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2 text-slate-400 text-[11px] truncate max-w-xs">
                              {sampleValue !== undefined && sampleValue !== null ? String(sampleValue) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Preview */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Podgląd pierwszych wierszy
                </h4>
                <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950/40">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        {fileData.headers.map(h => (
                          <th key={h} className="px-3 py-2 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                      {fileData.rows.slice(0, 3).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-800/20">
                          {fileData.headers.map(h => (
                            <td key={h} className="px-3 py-1.5 whitespace-nowrap text-slate-300">
                              {r[h] !== undefined ? String(r[h]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Progress and Results */}
              {importing && (
                <div className="space-y-1.5 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Trwa importowanie rekordów do Supabase...</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {importResult && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Zaimportowano pomyślnie {importResult.successCount} rekordów.</span>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="mt-2 text-xs text-rose-400 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Błędy w {importResult.errors.length} wierszach:</span>
                      </div>
                      <div className="max-h-28 overflow-y-auto font-mono text-[11px] p-2 bg-rose-950/30 border border-rose-900/50 rounded">
                        {importResult.errors.map((e, idx) => (
                          <div key={idx}>
                            Wiersz #{e.row}: {e.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {importResult ? 'Zamknij' : 'Anuluj'}
          </button>

          {fileData && !importResult && (
            <button
              onClick={executeImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
            >
              {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Rozpocznij import ({fileData.totalRows} wierszy)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
