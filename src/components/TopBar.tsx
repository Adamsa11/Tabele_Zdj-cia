import React from 'react';
import { SupabaseConfig, TableMeta } from '../types';
import { Database, HardDrive, Plus, Settings, RefreshCw, Activity } from 'lucide-react';

interface TopBarProps {
  config: SupabaseConfig;
  selectedTable: TableMeta | null;
  totalRecordsCount: number;
  onOpenSettings: () => void;
  onOpenStorage: () => void;
  onOpenDiagnostics: () => void;
  onOpenAddRow: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  config,
  selectedTable,
  totalRecordsCount,
  onOpenSettings,
  onOpenStorage,
  onOpenDiagnostics,
  onOpenAddRow,
  onRefreshData,
  isRefreshing
}) => {
  return (
    <header className="h-14 border-b border-gray-200 bg-white px-5 sm:px-6 flex items-center justify-between gap-6 shrink-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Zone 1: Brand & Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="./" className="flex items-center gap-2.5 group">
          <img
            src="./assets/aistudio/logo-sawtrak_2_d8eb06ac.png"
            alt="Saw-Trak"
            className="h-7 w-auto object-contain"
            onError={(e) => {
              // fallback if asset path is relative in root
              (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/logo-sawtrak_2_d8eb06ac.png';
            }}
          />
          <span className="hidden sm:inline-block text-[11px] font-semibold tracking-wider uppercase text-gray-400 font-mono border-l border-gray-200 pl-2.5">
            Data Studio
          </span>
        </a>

        {/* Clean unboxed environment marker */}
        <span className="text-[11px] text-gray-500 font-mono hidden lg:inline bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
          {config.isDemo ? 'tryb: demo' : 'tryb: live'}
        </span>
      </div>

      {/* Zone 2: Navigation / Breadcrumbs */}
      <nav className="hidden md:flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-500">Tabela:</span>
          <span className="font-semibold text-[#161616] font-mono">
            {selectedTable ? selectedTable.name : 'Brak wyboru'}
          </span>
          <span aria-hidden="true" className="text-gray-300">·</span>
          <span className="font-mono text-gray-500">
            {totalRecordsCount} {totalRecordsCount === 1 ? 'rekord' : 'rekordów'}
          </span>
        </div>

        <span aria-hidden="true" className="text-gray-300">/</span>

        <button
          onClick={onOpenStorage}
          className="hover:text-[#F36F21] text-gray-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 font-medium"
        >
          <HardDrive className="w-3.5 h-3.5 text-gray-400" />
          <span>Storage</span>
        </button>

        <span aria-hidden="true" className="text-gray-300">/</span>

        <button
          onClick={onOpenSettings}
          className="hover:text-[#F36F21] text-gray-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 font-medium"
        >
          <Settings className="w-3.5 h-3.5 text-gray-400" />
          <span>Połączenie</span>
        </button>

        <span aria-hidden="true" className="text-gray-300">/</span>

        <button
          onClick={onOpenDiagnostics}
          className="hover:text-[#F36F21] text-orange-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 font-medium"
        >
          <Activity className="w-3.5 h-3.5 text-[#F36F21]" />
          <span>Diagnostyka</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action & Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="p-1.5 text-gray-500 hover:text-[#161616] hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          title="Odśwież dane"
          aria-label="Odśwież dane"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={onOpenDiagnostics}
          className="px-2.5 py-1.5 text-xs text-[#F36F21] hover:text-[#df5d12] bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 font-medium"
          title="Centrum diagnostyki i tester bazy"
        >
          <Activity className="w-3.5 h-3.5 text-[#F36F21]" />
          <span className="hidden sm:inline">Diagnostyka</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="px-3 py-1.5 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 font-medium"
        >
          <span className={`w-2 h-2 rounded-full ${config.isDemo ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span>{config.isDemo ? 'Tryb Demo' : 'Supabase Live'}</span>
        </button>

        <button
          onClick={onOpenAddRow}
          disabled={!selectedTable}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#F36F21] hover:bg-[#df5d12] disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm active:translate-y-px"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj rekord</span>
        </button>
      </div>
    </header>
  );
};
