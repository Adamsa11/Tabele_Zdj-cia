import React from 'react';
import { SupabaseConfig, TableMeta } from '../types';
import { Database, HardDrive, Plus, Settings, Sparkles, RefreshCw, Activity } from 'lucide-react';

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
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between gap-8 shrink-0 z-20">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="/" className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs">
            S
          </div>
          <span>SupaTable Studio</span>
        </a>

        {/* Clean unboxed environment marker */}
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          {config.isDemo ? 'tryb: demo' : 'tryb: produkcja'}
        </span>
      </div>

      {/* Zone 2: Navigation / Breadcrumbs */}
      <nav className="hidden md:flex items-center gap-5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Tabela:</span>
          <span className="font-semibold text-slate-200">
            {selectedTable ? selectedTable.name : 'Brak wyboru'}
          </span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span className="font-mono text-slate-400">
            {totalRecordsCount} {totalRecordsCount === 1 ? 'rekord' : 'rekordów'}
          </span>
        </div>

        <span aria-hidden="true" className="text-slate-400">/</span>

        <button
          onClick={onOpenStorage}
          className="hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span>Storage</span>
        </button>

        <span aria-hidden="true" className="text-slate-400">/</span>

        <button
          onClick={onOpenSettings}
          className="hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>Połączenie</span>
        </button>

        <span aria-hidden="true" className="text-slate-400">/</span>

        <button
          onClick={onOpenDiagnostics}
          className="hover:text-amber-300 text-amber-400/90 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Diagnostyka</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action & Quick Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          title="Odśwież dane"
          aria-label="Odśwież dane"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={onOpenDiagnostics}
          className="px-2.5 py-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          title="Centrum diagnostyki i tester bazy"
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>Diagnostyka</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="px-3 py-1.5 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <span className={`w-2 h-2 rounded-full ${config.isDemo ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span>{config.isDemo ? 'Ustawienia (Demo)' : 'Supabase Live'}</span>
        </button>

        <button
          onClick={onOpenAddRow}
          disabled={!selectedTable}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj rekord</span>
        </button>
      </div>
    </header>
  );
};
