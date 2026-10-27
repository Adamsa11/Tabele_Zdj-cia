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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F9F9F9] p-6 md:p-10">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Banner powitalny */}
        <div className="p-6 rounded-2xl bg-white border border-orange-200/90 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#F36F21] text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Połączono z instancją Supabase</span>
              </div>
              <h2 className="text-xl font-bold text-[#161616] font-heading tracking-tight">
                Twoja baza danych jest podłączona i gotowa!
              </h2>
              <p className="text-xs text-gray-500 max-w-xl font-mono">
                {config.url} · klucz: {config.key.slice(0, 16)}...
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenDiagnostics}
                className="px-3.5 py-2 text-xs font-semibold text-[#F36F21] bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Diagnostyka bazy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sekcja: Informacja o stanie bazy */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-[#161616] font-semibold">
            <Sparkles className="w-4 h-4 text-[#F36F21]" />
            <span>Projekt jest nowy: w bazie nie ma jeszcze zdefiniowanych tabel ani bucketów Storage</span>
          </div>
          <p className="text-gray-500 leading-relaxed text-[11px]">
            Supabase to pełny PostgreSQL w chmurze. Aby tabela pojawiła się w aplikacji i można było dodawać/edytować/importować rekordy oraz zdjęcia, wybierz jedną z 3 poniższych metod:
          </p>
        </div>

        {/* Karta 1: Rekomendowane rozwiązanie: 1-Click SQL Seed */}
        <div className="p-6 rounded-2xl bg-white border-2 border-orange-300 shadow-sm space-y-4 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-[#F36F21] border border-orange-200">
                  Rekomendowane
                </span>
                <h3 className="text-sm font-bold text-[#161616]">
                  Szybki start: Automatyczny skrypt SQL (Tabela + Storage + Uprawnienia RLS)
                </h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                Jednorazowy kod SQL, który w 5 sekund utworzy w Twojej bazie tabelę <code className="text-[#F36F21] font-semibold bg-orange-50 px-1 py-0.5 rounded">produkty</code> ze zdjęciami, skonfiguruje pełne uprawnienia RLS (odczyt, dodawanie, edycja, usuwanie) oraz utworzy publiczny bucket <code className="text-[#F36F21] font-semibold bg-orange-50 px-1 py-0.5 rounded">images</code> na multimedia.
              </p>
            </div>
          </div>

          {/* Akcje SQL */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleCopySql}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#F36F21] hover:bg-[#df5d12] rounded-xl transition-all shadow-sm flex items-center gap-2 active:translate-y-px"
            >
              {copiedSql ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'Skopiowano gotowy kod SQL!' : 'Kopiuj gotowy skrypt SQL (Tabele + Storage)'}</span>
            </button>

            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors flex items-center gap-2 shadow-2xs"
            >
              <span>Otwórz Supabase SQL Editor</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
            </a>

            <button
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="px-3 py-2 text-xs text-gray-500 hover:text-gray-900 underline"
            >
              {showSqlPreview ? 'Ukryj kod SQL' : 'Zobacz podgląd kodu SQL'}
            </button>
          </div>

          {/* Podgląd kodu SQL */}
          {showSqlPreview && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-[11px] text-gray-800 overflow-x-auto max-h-60 leading-relaxed shadow-inner">
              <pre>{STARTER_SETUP_SQL}</pre>
            </div>
          )}
        </div>

        {/* Grid 2 kart dodatkowych */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opcja B: Otwórz istniejącą tabelę po nazwie */}
          <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-3 flex flex-col justify-between shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[#161616] font-semibold text-xs">
                <Database className="w-4 h-4 text-[#F36F21]" />
                <span>Otwórz dowolną tabelę po nazwie</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Jeśli masz już własną tabelę w Supabase (np. <code>wozki</code>, <code>czesci</code>, <code>klienci</code>), wpisz jej nazwę:
              </p>
            </div>

            <form onSubmit={handleOpenTable} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="np. produkty, wozki..."
                value={quickTableName}
                onChange={e => setQuickTableName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono bg-[#F9F9F9] border border-gray-200 rounded-lg text-[#161616] placeholder-gray-400 focus:outline-none focus:border-[#F36F21] focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={opening || !quickTableName.trim()}
                className="px-3 py-2 text-xs font-semibold text-white bg-[#161616] hover:bg-gray-800 disabled:opacity-40 rounded-lg transition-colors shrink-0 shadow-2xs"
              >
                {opening ? 'Otwieranie...' : 'Otwórz'}
              </button>
            </form>
          </div>

          {/* Opcja C: Kreator nowej tabeli w aplikacji */}
          <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-3 flex flex-col justify-between shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[#161616] font-semibold text-xs">
                <Layers className="w-4 h-4 text-[#F36F21]" />
                <span>Kreator nowej tabeli w aplikacji</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Zaprojektuj nową tabelę z własnymi kolumnami (tekst, liczby, zdjęcia, daty) przez interfejs graficzny.
              </p>
            </div>

            <div className="pt-1">
              <button
                onClick={onOpenCreateTable}
                className="w-full px-4 py-2 text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#F36F21]" />
                <span>Uruchom kreator tabeli</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dolny pasek z funkcjami Storage i Demo */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 shadow-2xs">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#F36F21]" />
            <span>Obsługa zdjęć i multimediów przez Supabase Storage</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenStorage}
              className="text-[#F36F21] hover:text-[#df5d12] font-semibold transition-colors"
            >
              Otwórz Storage Explorer →
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={onSwitchToDemo}
              className="text-gray-600 hover:text-[#161616] font-medium transition-colors"
            >
              Włącz tryb demonstracyjny (Saw-Trak)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
