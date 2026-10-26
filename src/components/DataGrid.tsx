import React, { useState } from 'react';
import { ColumnMeta, FilterCondition, SortCondition, TableMeta } from '../types';
import { exportToCSV, exportToJSON } from '../lib/fileParser';
import {
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  X
} from 'lucide-react';

interface DataGridProps {
  table: TableMeta;
  rows: Record<string, any>[];
  totalCount: number;
  loading: boolean;
  error?: string | null;
  page: number;
  pageSize: number;
  sort: SortCondition;
  search: string;
  searchColumn: string;
  filters: FilterCondition[];
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  onSortChange: (column: string) => void;
  onSearchChange: (query: string, column?: string) => void;
  onFiltersChange: (filters: FilterCondition[]) => void;
  onAddRow: () => void;
  onEditRow: (row: Record<string, any>) => void;
  onDeleteRow: (row: Record<string, any>) => void;
  onBulkDelete: (rows: Record<string, any>[]) => void;
  onOpenImport: () => void;
  onShowLightbox: (url: string, title?: string) => void;
  onRefresh: () => void;
  onOpenSettings?: () => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  table,
  rows,
  totalCount,
  loading,
  error,
  page,
  pageSize,
  sort,
  search,
  searchColumn,
  filters,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSearchChange,
  onFiltersChange,
  onAddRow,
  onEditRow,
  onDeleteRow,
  onBulkDelete,
  onOpenImport,
  onShowLightbox,
  onRefresh,
  onOpenSettings
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [newFilterCol, setNewFilterCol] = useState(table.columns[0]?.name || '');
  const [newFilterOp, setNewFilterOp] = useState<FilterCondition['operator']>('contains');
  const [newFilterVal, setNewFilterVal] = useState('');
  const [copiedRlsSql, setCopiedRlsSql] = useState(false);

  const primaryKeyCol = table.columns.find(c => c.isPrimary)?.name || 'id';

  const rlsSql = `ALTER TABLE public."${table.name}" ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Dostęp publiczny" ON public."${table.name}" FOR ALL USING (true);`;

  const copyRlsSql = () => {
    navigator.clipboard.writeText(rlsSql);
    setCopiedRlsSql(true);
    setTimeout(() => setCopiedRlsSql(false), 2500);
  };

  // Determine which rows are selected
  const allCurrentPageSelected = rows.length > 0 && rows.every(r => selectedIds.has(r[primaryKeyCol]));

  const toggleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      rows.forEach(r => next.add(r[primaryKeyCol]));
      setSelectedIds(next);
    }
  };

  const toggleSelectRow = (id: any) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDeleteSelected = () => {
    const selectedRows = rows.filter(r => selectedIds.has(r[primaryKeyCol]));
    if (selectedRows.length === 0) return;
    if (confirm(`Czy na pewno trwale usunąć ${selectedRows.length} zaznaczonych rekordów?`)) {
      onBulkDelete(selectedRows);
      setSelectedIds(new Set());
    }
  };

  const handleExportCSV = () => {
    const headers = table.columns.map(c => c.name);
    const dataToExport = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r[primaryKeyCol]))
      : rows;
    exportToCSV(table.name, headers, dataToExport);
  };

  const handleExportJSON = () => {
    const dataToExport = selectedIds.size > 0
      ? rows.filter(r => selectedIds.has(r[primaryKeyCol]))
      : rows;
    exportToJSON(table.name, dataToExport);
  };

  const handleAddFilter = () => {
    if (!newFilterCol) return;
    onFiltersChange([
      ...filters,
      { column: newFilterCol, operator: newFilterOp, value: newFilterVal }
    ]);
    setNewFilterVal('');
  };

  const handleRemoveFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900/60">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        {/* Left: Table Title & Metrics */}
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-100 font-mono tracking-tight">
            {table.name}
          </h1>
          <span className="text-xs text-slate-400 font-mono">
            {totalCount} {totalCount === 1 ? 'rekord' : 'rekordów'}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-400 font-mono">{table.columns.length} kolumn</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search bar */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtruj rekordy..."
              value={search}
              onChange={e => onSearchChange(e.target.value, searchColumn)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
              filters.length > 0 || showFilterPanel
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtry {filters.length > 0 && `(${filters.length})`}</span>
          </button>

          {/* Import Button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title="Importuj z pliku CSV, XLSX lub JSON"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Importuj</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 overflow-hidden text-xs text-slate-300">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 hover:bg-slate-800 transition-colors border-r border-slate-800 flex items-center gap-1"
              title="Eksportuj do pliku CSV"
            >
              <Download className="w-3 h-3 text-slate-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1.5 hover:bg-slate-800 transition-colors"
              title="Eksportuj do formatu JSON"
            >
              <span>JSON</span>
            </button>
          </div>

          {/* Add Row Button */}
          <button
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowy rekord</span>
          </button>
        </div>
      </div>

      {/* Prominent Error Banner if query failed */}
      {error && (
        <div className="px-5 py-3.5 bg-rose-950/80 border-b border-rose-500/40 text-rose-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-100">Błąd odczytu danych z Supabase:</p>
              <p className="text-rose-300 font-mono text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyRlsSql}
              className="px-2.5 py-1 text-xs bg-rose-900/80 hover:bg-rose-800 text-white rounded border border-rose-700/60 transition-colors flex items-center gap-1"
            >
              <span>{copiedRlsSql ? 'Skopiowano SQL RLS!' : 'Kopiuj SQL (Odblokuj RLS)'}</span>
            </button>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition-colors"
              >
                Konfiguracja klucza
              </button>
            )}
            <button
              onClick={onRefresh}
              className="p-1 text-rose-300 hover:text-white"
              title="Spróbuj ponownie"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Advanced Filter Drawer / Bar */}
      {showFilterPanel && (
        <div className="p-3 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Dodaj warunek:</span>
            <select
              value={newFilterCol}
              onChange={e => setNewFilterCol(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200"
            >
              {table.columns.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={newFilterOp}
              onChange={e => setNewFilterOp(e.target.value as any)}
              className="px-2 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200"
            >
              <option value="contains">zawiera</option>
              <option value="equals">równa się</option>
              <option value="gt">większe niż (&gt;)</option>
              <option value="lt">mniejsze niż (&lt;)</option>
              <option value="is_null">jest puste (NULL)</option>
              <option value="is_not_null">nie jest puste</option>
            </select>

            {!['is_null', 'is_not_null'].includes(newFilterOp) && (
              <input
                type="text"
                placeholder="Wartość filtra..."
                value={newFilterVal}
                onChange={e => setNewFilterVal(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-400"
              />
            )}

            <button
              onClick={handleAddFilter}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs transition-colors font-medium"
            >
              Dodaj
            </button>
          </div>

          {/* Active Filter Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((f, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300 font-mono"
              >
                <span>{f.column}</span>
                <span className="text-emerald-400">{f.operator}</span>
                {f.value && <span>"{f.value}"</span>}
                <button
                  onClick={() => handleRemoveFilter(idx)}
                  className="hover:text-rose-400 transition-colors ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.length > 0 && (
              <button
                onClick={() => onFiltersChange([])}
                className="text-[11px] text-rose-400 hover:underline"
              >
                Wyczyść wszystkie
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Selected Rows Action Bar */}
      {selectedIds.size > 0 && (
        <div className="px-4 py-2.5 bg-emerald-950/90 border-b border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-3">
            <span className="font-semibold font-mono">Wybrano {selectedIds.size} wierszy</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Odznacz wszystko
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700/60 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Eksportuj zaznaczone</span>
            </button>
            <button
              onClick={handleBulkDeleteSelected}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded flex items-center gap-1 shadow-sm"
            >
              <Trash2 className="w-3 h-3" />
              <span>Usuń zaznaczone ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400 border-b border-slate-800 shadow-sm">
            <tr>
              {/* Checkbox Col */}
              <th className="w-10 px-3 py-2.5 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-white"
                  title="Zaznacz / odznacz wszystkie"
                >
                  {allCurrentPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>

              {/* Dynamic Columns */}
              {table.columns.map(col => {
                const isSorted = sort.column === col.name;
                const isNum = col.dataType === 'number';

                return (
                  <th
                    key={col.name}
                    className={`px-3 py-2.5 font-semibold text-slate-300 uppercase tracking-wider text-[11px] whitespace-nowrap select-none hover:text-white transition-colors cursor-pointer ${
                      isNum ? 'text-right' : 'text-left'
                    }`}
                    onClick={() => onSortChange(col.name)}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${isNum ? 'flex-row-reverse' : ''}`}>
                      <span className="font-mono">{col.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal lowercase">
                        {col.dataType}
                      </span>
                      {isSorted ? (
                        sort.ascending ? (
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                      )}
                    </div>
                  </th>
                );
              })}

              {/* Actions Header */}
              <th className="px-3 py-2.5 text-right w-24 uppercase tracking-wider text-[11px] text-slate-400">
                Akcje
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {loading ? (
              /* Loading Skeletons */
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse bg-slate-900/40">
                  <td className="px-3 py-3 text-center">
                    <div className="w-4 h-4 bg-slate-800 rounded mx-auto" />
                  </td>
                  {table.columns.map(col => (
                    <td key={col.name} className="px-3 py-3">
                      <div className="h-3.5 bg-slate-800/80 rounded w-3/4" />
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <div className="h-3.5 bg-slate-800 rounded w-12 ml-auto" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              /* Empty State */
              <tr>
                <td colSpan={table.columns.length + 2} className="py-16 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      Brak rekordów w tabeli "{table.name}"
                    </h3>
                    <p className="text-xs text-slate-400">
                      {search || filters.length > 0
                        ? 'Żaden rekord nie odpowiada kryteriom wyszukiwania lub aktywnym filtrom.'
                        : 'Ta tabela nie zawiera jeszcze wierszy lub dostęp do nich jest ograniczony przez reguły RLS.'}
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={onAddRow}
                        className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
                      >
                        + Dodaj rekord
                      </button>
                      <button
                        onClick={onOpenImport}
                        className="px-3.5 py-1.5 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                      >
                        Importuj z pliku
                      </button>
                    </div>

                    {/* RLS Guidance Box */}
                    <div className="mt-4 p-3.5 bg-slate-950/90 border border-slate-800 rounded-lg text-left text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-400 text-xs">Nie widzisz swoich danych w Supabase?</span>
                        <button
                          type="button"
                          onClick={copyRlsSql}
                          className="px-2 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 transition-colors"
                        >
                          {copiedRlsSql ? 'Skopiowano SQL!' : 'Kopiuj SQL (Zezwól na odczyt RLS)'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Supabase domyślnie włącza zabezpieczenie <strong>Row Level Security (RLS)</strong>. Jeśli korzystasz z klucza <code>anon</code> i nie utworzyłeś polityki <code>SELECT</code>, baza zwraca 0 wierszy.
                      </p>
                      <div className="text-[11px] text-slate-300 font-mono bg-slate-900/90 p-2 rounded border border-slate-800/80">
                        {rlsSql}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              /* Render Data Rows */
              rows.map((row, rowIdx) => {
                const rowId = row[primaryKeyCol];
                const isSelected = selectedIds.has(rowId);

                return (
                  <tr
                    key={rowId || rowIdx}
                    className={`h-10 hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelectRow(rowId)}
                        className="text-slate-400 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Columns */}
                    {table.columns.map(col => {
                      const val = row[col.name];
                      const isImageCol =
                        col.dataType === 'image' ||
                        (typeof val === 'string' &&
                          (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image')) &&
                          (col.name.toLowerCase().includes('image') ||
                            col.name.toLowerCase().includes('avatar') ||
                            col.name.toLowerCase().includes('photo') ||
                            col.name.toLowerCase().includes('receipt') ||
                            val.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i)));

                      return (
                        <td
                          key={col.name}
                          className={`px-3 py-1.5 whitespace-nowrap max-w-xs truncate ${
                            col.dataType === 'number' ? 'text-right font-mono tabular-nums' : ''
                          }`}
                        >
                          {val === null || val === undefined ? (
                            <span className="text-slate-400 italic font-mono text-[11px]">null</span>
                          ) : isImageCol ? (
                            /* Thumbnail with Lightbox trigger */
                            <div className="flex items-center gap-2">
                              <div
                                onClick={() => onShowLightbox(String(val), `${col.name} - ${rowId}`)}
                                className="relative w-7 h-7 rounded bg-slate-950 border border-slate-800 overflow-hidden cursor-pointer group shrink-0"
                                title="Kliknij, aby powiększyć zdjęcie"
                              >
                                <img
                                  src={String(val)}
                                  alt="Miniatura"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><rect fill="%231e293b" width="30" height="30"/><text fill="%2364748b" font-family="sans-serif" font-size="8" dy="2.5" x="50%" y="50%" text-anchor="middle">IMG</text></svg>';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-3 h-3 text-white" />
                                </div>
                              </div>
                              <span
                                className="text-[11px] font-mono text-slate-300 truncate cursor-pointer hover:text-emerald-400"
                                onClick={() => onShowLightbox(String(val), `${col.name} - ${rowId}`)}
                              >
                                {String(val).split('/').pop()}
                              </span>
                            </div>
                          ) : col.dataType === 'boolean' ? (
                            <span
                              className={`font-mono text-[11px] ${
                                val ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {val ? 'true' : 'false'}
                            </span>
                          ) : col.dataType === 'datetime' ? (
                            <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                              {String(val).replace('T', ' ').replace('Z', '')}
                            </span>
                          ) : col.dataType === 'json' ? (
                            <span className="font-mono text-[11px] text-slate-400">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          ) : (
                            <span className="text-slate-200">{String(val)}</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Actions Row */}
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditRow(row)}
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                          title="Edytuj rekord"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Czy na pewno usunąć rekord ${primaryKeyCol} = ${rowId}?`)) {
                              onDeleteRow(row);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Usuń rekord"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-4 text-xs text-slate-400 shrink-0 select-none">
        {/* Left: Range and Count */}
        <div className="flex items-center gap-3">
          <span>
            Pokazano <span className="text-slate-200 font-mono tabular-nums">{totalCount > 0 ? rangeStart : 0}</span>-
            <span className="text-slate-200 font-mono tabular-nums">{rangeEnd}</span> z{' '}
            <span className="text-slate-200 font-mono tabular-nums">{totalCount}</span> rekordów
          </span>

          <span className="text-slate-400">·</span>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5">
            <span>Wierszy na stronę:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Right: Prev / Next Buttons */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400">
            Strona <span className="text-slate-200 font-semibold">{page}</span> z{' '}
            <span className="text-slate-200 font-semibold">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-200 rounded border border-slate-800 transition-colors"
            >
              Poprzednia
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-200 rounded border border-slate-800 transition-colors"
            >
              Następna
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
