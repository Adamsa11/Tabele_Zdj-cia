import React, { useState } from 'react';
import { TableMeta, SupabaseConfig } from '../types';
import { Plus, Search, HardDrive, Settings, Table as TableIcon, Layers, Sparkles, Database } from 'lucide-react';

interface SidebarProps {
  tables: TableMeta[];
  selectedTable: TableMeta | null;
  onSelectTable: (table: TableMeta) => void;
  onOpenCreateTable: () => void;
  onOpenStorage: () => void;
  onOpenSettings: () => void;
  onOpenDiagnostics?: () => void;
  onOpenTriggers?: () => void;
  onQuickOpenTable?: (name: string) => Promise<void>;
  config: SupabaseConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tables,
  selectedTable,
  onSelectTable,
  onOpenCreateTable,
  onOpenStorage,
  onOpenSettings,
  onOpenDiagnostics,
  onOpenTriggers,
  onQuickOpenTable,
  config
}) => {
  const [search, setSearch] = useState('');
  const [opening, setOpening] = useState(false);

  // Filter tables starting with Model or matching v_model
  const modelTables = tables.filter(t => /^(v_model|model)/i.test(t.name));
  const filteredTables = modelTables.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  // Separate v_model and underlying Model_* tables
  const viewModel = filteredTables.find(t => t.name.toLowerCase() === 'v_model');
  const baseTables = filteredTables.filter(t => t.name.toLowerCase() !== 'v_model');

  const handleOpenByName = async (nameToOpen: string) => {
    if (!onQuickOpenTable || !nameToOpen.trim()) return;
    setOpening(true);
    try {
      await onQuickOpenTable(nameToOpen.trim());
      setSearch('');
    } finally {
      setOpening(false);
    }
  };

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col shrink-0 select-none">
      {/* Tables Explorer Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-700">
          <Layers className="w-4 h-4 text-[#F36F21]" />
          <span>Tabele Model ({modelTables.length})</span>
        </div>

        <button
          onClick={onOpenCreateTable}
          className="p-1 text-gray-400 hover:text-[#F36F21] hover:bg-orange-50 rounded-md transition-colors"
          title="Utwórz nową tabelę Model_*"
          aria-label="Utwórz nową tabelę"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj Model_* lub v_model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && search.trim()) {
                handleOpenByName(search);
              }
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F9F9F9] border border-gray-200 rounded-lg text-[#161616] placeholder-gray-400 focus:outline-none focus:border-[#F36F21] focus:bg-white font-mono transition-colors"
          />
        </div>
      </div>

      {/* Tables & Views List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* SECTION 1: PRIMARY VIEW v_model */}
        {viewModel && (
          <div>
            <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#F36F21]">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#F36F21]" />
                Widok Roboczy
              </span>
              <span className="text-[9px] bg-orange-100 text-[#F36F21] px-1.5 py-0.2 rounded font-mono">
                Auto-sync
              </span>
            </div>

            {(() => {
              const isSelected = selectedTable?.name.toLowerCase() === 'v_model';
              return (
                <button
                  key={viewModel.name}
                  onClick={() => onSelectTable(viewModel)}
                  className={`w-full flex flex-col p-2.5 rounded-lg text-xs font-medium transition-all text-left border ${
                    isSelected
                      ? 'bg-orange-50/90 text-[#161616] border-[#F36F21] shadow-xs'
                      : 'bg-white hover:bg-orange-50/40 text-gray-700 border-orange-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-[#F36F21] shrink-0 animate-pulse" />
                      <span className="truncate font-mono font-bold text-sm text-[#F36F21]">
                        {viewModel.name}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100/80 text-[#F36F21] font-mono font-semibold">
                      Główny
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                    Kompleksowa edycja maszyn i osprzętu
                  </p>
                </button>
              );
            })()}
          </div>
        )}

        {/* SECTION 2: BASE TABLES (Model_*) */}
        <div>
          <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <span>Tabele źródłowe ({baseTables.length})</span>
          </div>

          <div className="space-y-0.5">
            {baseTables.map(t => {
              const isSelected = selectedTable?.name === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => onSelectTable(t)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    isSelected
                      ? 'bg-gray-100 text-[#161616] border border-gray-300 font-semibold shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100/70 hover:text-[#161616] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <TableIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#F36F21]' : 'text-gray-400'}`} />
                    <span className="truncate font-mono">{t.name}</span>
                  </div>
                  <span className={`text-[11px] shrink-0 font-mono ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>
                    {t.columns.length} kol.
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredTables.length === 0 && (
          <div className="p-4 text-center text-xs text-gray-500 space-y-2">
            <p>{search ? `Brak tabeli "${search}" na liście Model_*.` : 'Brak tabel w schemacie.'}</p>
            {search && onQuickOpenTable && (
              <button
                type="button"
                onClick={() => handleOpenByName(search)}
                disabled={opening}
                className="w-full px-2.5 py-1.5 text-xs font-medium bg-[#F36F21] hover:bg-[#df5d12] text-white rounded-lg transition-colors shadow-xs"
              >
                {opening ? 'Sprawdzanie...' : `Otwórz "${search}"`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Shortcuts */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/60 space-y-1">
        {onOpenTriggers && (
          <button
            onClick={onOpenTriggers}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:text-[#161616] hover:bg-white rounded-lg transition-colors text-left border border-transparent hover:border-gray-200 shadow-xs"
            title="Skrypt PostgreSQL INSTEAD OF Triggerów"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F36F21]" />
              <span className="font-medium">Triggery v_model</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">SQL</span>
          </button>
        )}

        <button
          onClick={onOpenStorage}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:text-[#161616] hover:bg-white rounded-lg transition-colors text-left border border-transparent hover:border-gray-200 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Supabase Storage</span>
          </div>
          <span className="text-[10px] text-[#F36F21] font-mono font-semibold">Media</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:text-[#161616] hover:bg-white rounded-lg transition-colors text-left border border-transparent hover:border-gray-200 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Konfiguracja</span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              config.isDemo ? 'bg-amber-400' : config.isConnected ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </button>
      </div>
    </aside>
  );
};
