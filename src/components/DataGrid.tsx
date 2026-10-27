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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F9F9F9]">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Left: Table Title & Metrics */}
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-[#161616] font-mono tracking-tight">
            {table.name}
          </h1>
          <span className="text-xs text-gray-500 font-mono">
            {totalCount} {totalCount === 1 ? 'rekord' : 'rekordów'}
          </span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-500 font-mono">{table.columns.length} kolumn</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search bar */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtruj rekordy..."
              value={search}
              onChange={e => onSearchChange(e.target.value, searchColumn)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F9F9F9] border border-gray-200 rounded-lg text-[#161616] placeholder-gray-400 focus:outline-none focus:border-[#F36F21] focus:bg-white font-mono transition-colors"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
              filters.length > 0 || showFilterPanel
                ? 'bg-orange-50 text-[#F36F21] border-orange-300 font-medium'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtry {filters.length > 0 && `(${filters.length})`}</span>
          </button>

          {/* Import Button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors font-medium shadow-xs"
            title="Importuj z pliku CSV, XLSX lub JSON"
          >
            <Upload className="w-3.5 h-3.5 text-gray-500" />
            <span>Importuj</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden text-xs text-gray-700 shadow-xs">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 hover:bg-gray-50 transition-colors border-r border-gray-200 flex items-center gap-1 font-medium"
              title="Eksportuj do pliku CSV"
            >
              <Download className="w-3 h-3 text-gray-500" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1.5 hover:bg-gray-50 transition-colors font-medium"
              title="Eksportuj do formatu JSON"
            >
              <span>JSON</span>
            </button>
          </div>

          {/* Add Row Button */}
          <button
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#F36F21] hover:bg-[#df5d12] rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowy rekord</span>
          </button>
        </div>
      </div>

      {/* Prominent Error Banner if query failed */}
      {error && (
        <div className="px-5 py-3.5 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#CC0000] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-950">Błąd odczytu danych z Supabase:</p>
              <p className="text-rose-700 font-mono text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyRlsSql}
              className="px-2.5 py-1 text-xs bg-[#CC0000] hover:bg-red-700 text-white font-medium rounded transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>{copiedRlsSql ? 'Skopiowano SQL RLS!' : 'Kopiuj SQL (Odblokuj RLS)'}</span>
            </button>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-2.5 py-1 text-xs bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 transition-colors font-medium"
              >
                Konfiguracja klucza
              </button>
            )}
            <button
              onClick={onRefresh}
              className="p-1 text-gray-500 hover:text-gray-900"
              title="Spróbuj ponownie"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Advanced Filter Drawer / Bar */}
      {showFilterPanel && (
        <div className="p-3 border-b border-gray-200 bg-white flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-semibold uppercase text-[10px]">Dodaj warunek:</span>
            <select
              value={newFilterCol}
              onChange={e => setNewFilterCol(e.target.value)}
              className="px-2 py-1 text-xs bg-[#F9F9F9] border border-gray-300 rounded text-gray-800 focus:outline-none focus:border-[#F36F21]"
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
              className="px-2 py-1 text-xs bg-[#F9F9F9] border border-gray-300 rounded text-gray-800 focus:outline-none focus:border-[#F36F21]"
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
                className="px-2 py-1 text-xs bg-[#F9F9F9] border border-gray-300 rounded text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F36F21]"
              />
            )}

            <button
              onClick={handleAddFilter}
              className="px-2.5 py-1 bg-[#F36F21] hover:bg-[#df5d12] text-white rounded text-xs transition-colors font-medium"
            >
              Dodaj
            </button>
          </div>

          {/* Active Filter Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((f, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 border border-orange-200 rounded text-[11px] text-orange-900 font-mono"
              >
                <span>{f.column}</span>
                <span className="text-[#F36F21] font-semibold">{f.operator}</span>
                {f.value && <span>"{f.value}"</span>}
                <button
                  onClick={() => handleRemoveFilter(idx)}
                  className="hover:text-[#CC0000] transition-colors ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.length > 0 && (
              <button
                onClick={() => onFiltersChange([])}
                className="text-[11px] text-[#CC0000] hover:underline font-medium"
              >
                Wyczyść wszystkie
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Selected Rows Action Bar */}
      {selectedIds.size > 0 && (
        <div className="px-4 py-2.5 bg-orange-50 border-b border-orange-200 flex items-center justify-between text-xs text-orange-950">
          <div className="flex items-center gap-3">
            <span className="font-semibold font-mono text-[#F36F21]">Wybrano {selectedIds.size} wierszy</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-gray-500 hover:text-gray-900 underline text-[11px]"
            >
              Odznacz wszystko
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 flex items-center gap-1 font-medium shadow-xs"
            >
              <Download className="w-3 h-3 text-gray-500" />
              <span>Eksportuj zaznaczone</span>
            </button>
            <button
              onClick={handleBulkDeleteSelected}
              className="px-2.5 py-1 bg-[#CC0000] hover:bg-red-700 text-white font-medium rounded flex items-center gap-1 shadow-sm"
            >
              <Trash2 className="w-3 h-3" />
              <span>Usuń zaznaczone ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table Area */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600 border-b border-gray-200 shadow-xs">
            <tr>
              {/* Checkbox Col */}
              <th className="w-10 px-3 py-2.5 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-gray-400 hover:text-[#161616]"
                  title="Zaznacz / odznacz wszystkie"
                >
                  {allCurrentPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#F36F21]" />
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
                    className={`px-3 py-2.5 font-semibold text-gray-700 uppercase tracking-wider text-[11px] whitespace-nowrap select-none hover:text-[#161616] transition-colors cursor-pointer ${
                      isNum ? 'text-right' : 'text-left'
                    }`}
                    onClick={() => onSortChange(col.name)}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${isNum ? 'flex-row-reverse' : ''}`}>
                      <span className="font-mono">{col.name}</span>
                      <span className="text-[10px] text-gray-400 font-normal lowercase">
                        {col.dataType}
                      </span>
                      {isSorted ? (
                        sort.ascending ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#F36F21]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#F36F21]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                      )}
                    </div>
                  </th>
                );
              })}

              {/* Actions Header */}
              <th className="px-3 py-2.5 text-right w-24 uppercase tracking-wider text-[11px] text-gray-500 font-semibold">
                Akcje
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 font-sans">
            {loading ? (
              /* Loading Skeletons */
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse bg-gray-50/50">
                  <td className="px-3 py-3 text-center">
                    <div className="w-4 h-4 bg-gray-200 rounded mx-auto" />
                  </td>
                  {table.columns.map(col => (
                    <td key={col.name} className="px-3 py-3">
                      <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <div className="h-3.5 bg-gray-200 rounded w-12 ml-auto" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              /* Empty State */
              <tr>
                <td colSpan={table.columns.length + 2} className="py-16 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto" />
                    <h3 className="text-sm font-semibold text-[#161616]">
                      Brak rekordów w tabeli "{table.name}"
                    </h3>
                    <p className="text-xs text-gray-500">
                      {search || filters.length > 0
                        ? 'Żaden rekord nie odpowiada kryteriom wyszukiwania lub aktywnym filtrom.'
                        : 'Ta tabela nie zawiera jeszcze wierszy lub dostęp do nich jest ograniczony przez reguły RLS.'}
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={onAddRow}
                        className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#F36F21] hover:bg-[#df5d12] rounded-lg transition-colors shadow-sm"
                      >
                        + Dodaj rekord
                      </button>
                      <button
                        onClick={onOpenImport}
                        className="px-3.5 py-1.5 text-xs text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 font-medium"
                      >
                        Importuj z pliku
                      </button>
                    </div>

                    {/* RLS Guidance Box */}
                    <div className="mt-4 p-3.5 bg-orange-50/60 border border-orange-200 rounded-lg text-left text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-orange-900 text-xs">Nie widzisz swoich danych w Supabase?</span>
                        <button
                          type="button"
                          onClick={copyRlsSql}
                          className="px-2 py-1 text-[11px] bg-white hover:bg-orange-100 text-[#F36F21] rounded border border-orange-300 font-medium transition-colors"
                        >
                          {copiedRlsSql ? 'Skopiowano SQL!' : 'Kopiuj SQL (Zezwól na odczyt RLS)'}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Supabase domyślnie włącza zabezpieczenie <strong>Row Level Security (RLS)</strong>. Jeśli korzystasz z klucza <code>anon</code> i nie utworzyłeś polityki <code>SELECT</code>, baza zwraca 0 wierszy.
                      </p>
                      <div className="text-[11px] text-gray-800 font-mono bg-white p-2 rounded border border-orange-200">
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
                    className={`h-10 hover:bg-orange-50/40 transition-colors ${
                      isSelected ? 'bg-orange-50/70' : rowIdx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelectRow(rowId)}
                        className="text-gray-400 hover:text-[#161616]"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#F36F21]" />
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
                            col.name.toLowerCase().includes('zdjecie') ||
                            val.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i)));

                      return (
                        <td
                          key={col.name}
                          className={`px-3 py-1.5 whitespace-nowrap max-w-xs truncate ${
                            col.dataType === 'number' ? 'text-right font-mono tabular-nums font-medium text-gray-900' : 'text-gray-800'
                          }`}
                        >
                          {val === null || val === undefined ? (
                            <span className="text-gray-400 italic font-mono text-[11px]">null</span>
                          ) : isImageCol ? (
                            /* Thumbnail with Lightbox trigger */
                            <div className="flex items-center gap-2">
                              <div
                                onClick={() => onShowLightbox(String(val), `${col.name} - ${rowId}`)}
                                className="relative w-7 h-7 rounded bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer group shrink-0 shadow-2xs"
                                title="Kliknij, aby powiększyć zdjęcie"
                              >
                                <img
                                  src={String(val)}
                                  alt="Miniatura"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><rect fill="%23f1f5f9" width="30" height="30"/><text fill="%2394a3b8" font-family="sans-serif" font-size="8" dy="2.5" x="50%" y="50%" text-anchor="middle">IMG</text></svg>';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-3 h-3 text-white" />
                                </div>
                              </div>
                              <span
                                className="text-[11px] font-mono text-gray-700 truncate cursor-pointer hover:text-[#F36F21]"
                                onClick={() => onShowLightbox(String(val), `${col.name} - ${rowId}`)}
                              >
                                {String(val).split('/').pop()}
                              </span>
                            </div>
                          ) : col.dataType === 'boolean' ? (
                            <span
                              className={`font-mono text-[11px] font-medium ${
                                val ? 'text-emerald-600' : 'text-gray-400'
                              }`}
                            >
                              {val ? 'true' : 'false'}
                            </span>
                          ) : col.dataType === 'datetime' ? (
                            <span className="font-mono text-[11px] text-gray-600 tabular-nums">
                              {String(val).replace('T', ' ').replace('Z', '')}
                            </span>
                          ) : col.dataType === 'json' ? (
                            <span className="font-mono text-[11px] text-gray-600">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          ) : (
                            <span className="text-gray-800">{String(val)}</span>
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
                          className="p-1 text-gray-400 hover:text-[#F36F21] hover:bg-orange-50 rounded transition-colors"
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
                          className="p-1 text-gray-400 hover:text-[#CC0000] hover:bg-red-50 rounded transition-colors"
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
      <div className="p-3 border-t border-gray-200 bg-white flex items-center justify-between gap-4 text-xs text-gray-500 shrink-0 select-none shadow-[0_-1px_2px_rgba(0,0,0,0.02)]">
        {/* Left: Range and Count */}
        <div className="flex items-center gap-3">
          <span>
            Pokazano <span className="text-[#161616] font-mono font-medium tabular-nums">{totalCount > 0 ? rangeStart : 0}</span>-
            <span className="text-[#161616] font-mono font-medium tabular-nums">{rangeEnd}</span> z{' '}
            <span className="text-[#161616] font-mono font-medium tabular-nums">{totalCount}</span> rekordów
          </span>

          <span className="text-gray-300">·</span>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5">
            <span>Wierszy na stronę:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-xs bg-[#F9F9F9] border border-gray-200 rounded text-gray-800 focus:outline-none focus:border-[#F36F21]"
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
          <span className="font-mono text-gray-500">
            Strona <span className="text-[#161616] font-semibold">{page}</span> z{' '}
            <span className="text-[#161616] font-semibold">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-2.5 py-1 bg-white hover:bg-gray-50 disabled:opacity-30 text-gray-700 rounded border border-gray-200 transition-colors font-medium shadow-2xs"
            >
              Poprzednia
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-2.5 py-1 bg-white hover:bg-gray-50 disabled:opacity-30 text-gray-700 rounded border border-gray-200 transition-colors font-medium shadow-2xs"
            >
              Następna
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
