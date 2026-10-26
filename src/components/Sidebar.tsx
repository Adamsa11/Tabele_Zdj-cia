import React, { useState } from 'react';
import { TableMeta, SupabaseConfig } from '../types';
import { Database, Plus, Search, HardDrive, Settings, Table as TableIcon, Layers, Activity } from 'lucide-react';

interface SidebarProps {
  tables: TableMeta[];
  selectedTable: TableMeta | null;
  onSelectTable: (table: TableMeta) => void;
  onOpenCreateTable: () => void;
  onOpenStorage: () => void;
  onOpenSettings: () => void;
  onOpenDiagnostics?: () => void;
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
  onQuickOpenTable,
  config
}) => {
  const [search, setSearch] = useState('');
  const [opening, setOpening] = useState(false);

  const filteredTables = tables.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

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
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 select-none">
      {/* Tables Explorer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Tabele bazy ({tables.length})</span>
        </div>

        <button
          onClick={onOpenCreateTable}
          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
          title="Utwórz nową tabelę"
          aria-label="Utwórz nową tabelę"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj lub wpisz nazwę..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && search.trim()) {
                handleOpenByName(search);
              }
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filteredTables.map(t => {
          const isSelected = selectedTable?.name === t.name;
          return (
            <button
              key={t.name}
              onClick={() => onSelectTable(t)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                isSelected
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <TableIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate font-mono">{t.name}</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                {t.columns.length} kol.
              </span>
            </button>
          );
        })}

        {filteredTables.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-400 space-y-2">
            <p>{search ? `Brak tabeli "${search}" na liście.` : 'Brak tabel w schemacie.'}</p>
            {search && onQuickOpenTable && (
              <button
                type="button"
                onClick={() => handleOpenByName(search)}
                disabled={opening}
                className="w-full px-2.5 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
              >
                {opening ? 'Sprawdzanie...' : `Otwórz tabelę "${search}"`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Shortcuts */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-1">
        <button
          onClick={onOpenStorage}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <span>Supabase Storage</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Media</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Konfiguracja bazy</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {config.isDemo ? 'Demo' : 'Live'}
          </span>
        </button>

        {onOpenDiagnostics && (
          <button
            onClick={onOpenDiagnostics}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 rounded-lg transition-colors text-left border border-amber-500/20"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Diagnostyka bazy & RLS</span>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">Pomoc</span>
          </button>
        )}
      </div>
    </aside>
  );
};
