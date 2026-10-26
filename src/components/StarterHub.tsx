import React, { useState } from 'react';
import { SupabaseConfig } from '../types';
import { STARTER_SETUP_SQL } from '../lib/starterSql';
import {
  Database,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Plus,
  HardDrive,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface StarterHubProps {
  config: SupabaseConfig;
  onOpenCreateTable: () => void;
  onOpenStorage: () => void;
  onOpenDiagnostics: () => void;
  onQuickOpenTable: (name: string) => Promise<void>;
  onSwitchToDemo: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const StarterHub: React.FC<StarterHubProps> = ({
  config,
  onOpenCreateTable,
  onOpenStorage,
  onOpenDiagnostics,
  onQuickOpenTable,
  onSwitchToDemo,
  onToast
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [quickTableName, setQuickTableName] = useState('');
  const [opening, setOpening] = useState(false);

  // Extract project ref if available
  const match = config.url.match(/https?:\/\/([a-zA-Z0-9_-]+)\.supabase\.co/i);
  const projectRef = match ? match[1] : 'twoj-projekt';
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(STARTER_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
    onToast('success', 'Skopiowano kod SQL startowy!', 'Wklej go w Supabase Dashboard -> SQL Editor i kliknij Run.');
  };

  const handleOpenTable = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTableName.trim()) return;
    setOpening(true);
    try {
      await onQuickOpenTable(quickTableName.trim());
    } catch (err: any) {
      onToast('error', 'Błąd otwierania tabeli', err.message);
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-900/60 p-6 md:p-10">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Banner powitalny */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Połączono z instancją Supabase</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">
                Twoja baza Supabase jest podłączona i gotowa!
              </h2>
              <p className="text-xs text-slate-400 max-w-xl font-mono">
                {config.url} · klucz: {config.key.slice(0, 16)}...
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenDiagnostics}
                className="px-3 py-2 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Diagnostyka bazy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sekcja: Dlaczego nie ma jeszcze tabel i bucketów */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Projekt jest nowy: w bazie nie ma jeszcze zdefiniowanych tabel ani bucketów Storage</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Supabase to pełny PostgreSQL w chmurze. Aby tabela pojawiła się w aplikacji i można było dodawać/edytować/importować rekordy oraz zdjęcia, wybierz jedną z 3 poniższych metod:
          </p>
        </div>

        {/* Karta 1: Rekomendowane rozwiązanie: 1-Click SQL Seed */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-lg space-y-4 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Rekomendowane
                </span>
                <h3 className="text-sm font-semibold text-slate-100">
                  Szybki start: Automatyczny skrypt SQL (Tabela + Storage + Uprawnienia RLS)
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                Jednorazowy kod SQL, który w 5 sekund utworzy w Twojej bazie tabelę <code className="text-emerald-300">produkty</code> ze zdjęciami, skonfiguruje pełne uprawnienia RLS (odczyt, dodawanie, edycja, usuwanie) oraz utworzy publiczny bucket <code className="text-emerald-300">images</code> na multimedia.
              </p>
            </div>
          </div>

          {/* Akcje SQL */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleCopySql}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'Skopiowano gotowy kod SQL!' : 'Kopiuj gotowy skrypt SQL (Tabele + Storage)'}</span>
            </button>

            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors flex items-center gap-2"
            >
              <span>Otwórz Supabase SQL Editor</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 underline"
            >
              {showSqlPreview ? 'Ukryj kod SQL' : 'Zobacz podgląd kodu SQL'}
            </button>
          </div>

          {/* Podgląd kodu SQL */}
          {showSqlPreview && (
            <div className="mt-3 p-3 bg-black/60 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
              <pre>{STARTER_SETUP_SQL}</pre>
            </div>
          )}
        </div>

        {/* Grid 2 kart dodatkowych */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opcja B: Otwórz istniejącą tabelę po nazwie */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                <Database className="w-4 h-4 text-sky-400" />
                <span>Otwórz dowolną tabelę po nazwie</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Jeśli masz już własną tabelę w Supabase (np. <code>users</code>, <code>zamowienia</code>, <code>klienci</code>), wpisz jej nazwę:
              </p>
            </div>

            <form onSubmit={handleOpenTable} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="np. produkty, users..."
                value={quickTableName}
                onChange={e => setQuickTableName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={opening || !quickTableName.trim()}
                className="px-3 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-40 rounded-lg transition-colors shrink-0"
              >
                {opening ? 'Otwieranie...' : 'Otwórz'}
              </button>
            </form>
          </div>

          {/* Opcja C: Kreator nowej tabeli w aplikacji */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                <Layers className="w-4 h-4 text-violet-400" />
                <span>Kreator nowej tabeli w aplikacji</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Zaprojektuj nową tabelę z własnymi kolumnami (tekst, liczby, zdjęcia, daty) przez interfejs graficzny.
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={onOpenCreateTable}
                className="w-full px-4 py-2 text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Uruchom kreator tabeli</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dolny pasek z funkcjami Storage i Demo */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Obsługa zdjęć i multimediów przez Supabase Storage</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenStorage}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Otwórz Storage Explorer →
            </button>
            <span>·</span>
            <button
              onClick={onSwitchToDemo}
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              Włącz tryb Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
