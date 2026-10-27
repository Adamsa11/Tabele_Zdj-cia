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
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col shrink-0 select-none">
      {/* Tables Explorer Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
          <Layers className="w-4 h-4 text-[#F36F21]" />
          <span>Tabele bazy ({tables.length})</span>
        </div>

        <button
          onClick={onOpenCreateTable}
          className="p-1 text-gray-400 hover:text-[#F36F21] hover:bg-orange-50 rounded-md transition-colors"
          title="Utwórz nową tabelę"
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
            placeholder="Szukaj lub wpisz nazwę..."
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
                  ? 'bg-orange-50 text-[#F36F21] border border-orange-200/90 font-semibold shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-[#161616] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <TableIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#F36F21]' : 'text-gray-400'}`} />
                <span className="truncate font-mono">{t.name}</span>
              </div>
              <span className={`text-[11px] shrink-0 font-mono ${isSelected ? 'text-orange-600' : 'text-gray-400'}`}>
                {t.columns.length} kol.
              </span>
            </button>
          );
        })}

        {filteredTables.length === 0 && (
          <div className="p-4 text-center text-xs text-gray-500 space-y-2">
            <p>{search ? `Brak tabeli "${search}" na liście.` : 'Brak tabel w schemacie.'}</p>
            {search && onQuickOpenTable && (
              <button
                type="button"
                onClick={() => handleOpenByName(search)}
                disabled={opening}
                className="w-full px-2.5 py-1.5 text-xs font-medium bg-[#F36F21] hover:bg-[#df5d12] text-white rounded-lg transition-colors shadow-xs"
              >
                {opening ? 'Sprawdzanie...' : `Otwórz tabelę "${search}"`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Shortcuts */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/60 space-y-1">
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
            <span className="font-medium">Konfiguracja bazy</span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            {config.isDemo ? 'Demo' : 'Live'}
          </span>
        </button>

        {onOpenDiagnostics && (
          <button
            onClick={onOpenDiagnostics}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-orange-700 hover:text-orange-800 bg-orange-50/70 hover:bg-orange-100 rounded-lg transition-colors text-left border border-orange-200 shadow-xs font-medium"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#F36F21]" />
              <span>Diagnostyka & RLS</span>
            </div>
            <span className="text-[10px] text-[#F36F21] font-mono font-bold">Pomoc</span>
          </button>
        )}
      </div>
    </aside>
  );
};
