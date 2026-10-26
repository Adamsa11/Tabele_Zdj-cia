import React, { useState } from 'react';
import { SupabaseConfig } from '../types';
import {
  saveConfig,
  testInformationSchemaAccess,
  InformationSchemaDiagnosticResult
} from '../lib/supabaseClient';
import { STARTER_SETUP_SQL } from '../lib/starterSql';
import {
  Database,
  Key,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Zap,
  Shield,
  Table2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Info
} from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onConfigUpdated: (newConfig: SupabaseConfig) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
  onToast
}) => {
  const [url, setUrl] = useState(config.url || '');
  const [key, setKey] = useState(config.key || '');
  const [defaultBucket, setDefaultBucket] = useState(config.defaultBucket || 'zdjecia_modeli');
  const [isDemo, setIsDemo] = useState(config.isDemo);
  const [testing, setTesting] = useState(false);
  const [diagnostic, setDiagnostic] = useState<InformationSchemaDiagnosticResult | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url.trim() || !key.trim()) {
      onToast('error', 'Brakujące dane', 'Wprowadź zarówno Project URL jak i klucz API (anon lub service_role).');
      return;
    }

    setTesting(true);
    setDiagnostic(null);

    try {
      const res = await testInformationSchemaAccess(url.trim(), key.trim());
      setDiagnostic(res);

      if (res.ok && res.readable) {
        onToast(
          'success',
          'Parametry połączenia poprawne!',
          `Odczytano metadane schematu (${res.tablesFound.length} tabel). Ping: ${res.latencyMs} ms.`
        );
      } else if (res.ok) {
        onToast(
          'info',
          'Połączenie nawiązane',
          'Uwierzytelniono z projektem, lecz brak tabel lub ograniczony dostęp do schematu.'
        );
      } else {
        onToast('error', res.statusTitle || 'Test nie powiódł się', res.message);
      }
    } catch (err: any) {
      onToast('error', 'Błąd testu diagnostycznego', err.message || 'Wystąpił nieoczekiwany błąd.');
    } finally {
      setTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(STARTER_SETUP_SQL);
    setCopiedSql(true);
    onToast('success', 'Skopiowano skrypt SQL!', 'Wklej go w Supabase Dashboard > SQL Editor i kliknij Run.');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSave = () => {
    if (!isDemo && (!url.trim() || !key.trim())) {
      onToast('error', 'Brakujące dane', 'Aby korzystać z aktywnego projektu Supabase, podaj Project URL oraz klucz API, lub przełącz na tryb demo.');
      return;
    }

    const updated = saveConfig({
      url: url.trim(),
      key: key.trim(),
      defaultBucket: defaultBucket.trim() || 'zdjecia_modeli',
      isDemo,
      isConnected: !isDemo && (diagnostic?.ok ?? true)
    });

    onConfigUpdated(updated);
    onToast('success', 'Zapisano ustawienia połączenia', isDemo ? 'Włączono tryb demonstracyjny.' : 'Podłączono do Supabase.');
    onClose();
  };

  const switchToDemo = () => {
    setIsDemo(true);
    const updated = saveConfig({
      isDemo: true,
      isConnected: false
    });
    onConfigUpdated(updated);
    onToast('info', 'Tryb demonstracyjny', 'Aktywowano lokalną bazę demonstracyjną z gotowymi tabelami i mediami.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Ustawienia połączenia z Supabase</h3>
              <p className="text-xs text-slate-400">Podłącz swój projekt lub korzystaj z bazy demonstracyjnej</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-130px)]">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4 h-4 ${isDemo ? 'text-amber-400' : 'text-slate-400'}`} />
              <div>
                <p className="text-xs font-semibold text-slate-200">Tryb pracy</p>
                <p className="text-[11px] text-slate-400">
                  {isDemo ? 'Tryb demonstracyjny (lokalne przykładowe tabele i zdjęcia)' : 'Połączony z Twoją chmurą Supabase'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-md border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsDemo(false)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  !isDemo ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chmura Supabase
              </button>
              <button
                type="button"
                onClick={() => setIsDemo(true)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  isDemo ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tryb Demo
              </button>
            </div>
          </div>

          {!isDemo ? (
            /* Live Supabase Inputs */
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Project URL</span>
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>API Key (anon / public lub service_role)</span>
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... lub sb_publishable_..."
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Klucz anon/publishable umożliwia operacje zgodnie z politykami RLS. Klucz service_role omija RLS.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Domyślny Bucket Storage dla zdjęć</span>
                </label>
                <input
                  type="text"
                  placeholder="np. images, products, avatars"
                  value={defaultBucket}
                  onChange={e => setDefaultBucket(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Test Connection Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !url.trim() || !key.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-100 bg-emerald-700/80 hover:bg-emerald-600 disabled:opacity-50 border border-emerald-500/40 rounded-lg transition-colors shadow-sm"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Testowanie uprawnień information_schema i połączenia...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-emerald-300" />
                      <span>Przetestuj połączenie i metadane information_schema</span>
                    </>
                  )}
                </button>
              </div>

              {/* Diagnostic Result Card */}
              {diagnostic && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                    diagnostic.readable && diagnostic.tablesFound.length > 0
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : diagnostic.ok
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  }`}
                >
                  {/* Status Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      {diagnostic.readable && diagnostic.tablesFound.length > 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : diagnostic.ok ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <span>{diagnostic.statusTitle}</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300">
                      {diagnostic.latencyMs} ms
                    </span>
                  </div>

                  {/* Badges Overview */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Information Schema Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                        diagnostic.directInformationSchemaAccess
                          ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
                          : diagnostic.openApiSchemaAccess
                          ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-rose-900/40 border-rose-500/50 text-rose-300'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>
                        information_schema:{' '}
                        {diagnostic.directInformationSchemaAccess
                          ? 'Odczyt bezpośredni OK'
                          : diagnostic.openApiSchemaAccess
                          ? 'PostgREST Schema Cache OK'
                          : 'Brak uprawnień'}
                      </span>
                    </div>

                    {/* Tables Count Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-sky-950/50 border border-sky-500/40 text-sky-300">
                      <Table2 className="w-3.5 h-3.5" />
                      <span>Tabele w schemacie: {diagnostic.tablesFound.length}</span>
                    </div>

                    {/* Role Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-purple-950/50 border border-purple-500/40 text-purple-300">
                      <Key className="w-3.5 h-3.5" />
                      <span>Rola: {diagnostic.role}</span>
                    </div>
                  </div>

                  {/* Main Message */}
                  <p className="text-xs leading-relaxed text-slate-200">
                    {diagnostic.message}
                  </p>

                  {/* Discovered Tables List */}
                  {diagnostic.tablesFound.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <p className="text-[11px] text-slate-400 font-medium mb-1.5">
                        Wykryte dostępne tabele:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {diagnostic.tablesFound.map(tbl => (
                          <span
                            key={tbl}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 font-mono text-[11px] text-slate-200"
                          >
                            <Table2 className="w-3 h-3 text-emerald-400" />
                            {tbl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty Database Guidance + Quick Copy SQL */}
                  {diagnostic.ok && diagnostic.tablesFound.length === 0 && (
                    <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 space-y-2">
                      <p className="text-[11px] text-amber-200 leading-relaxed">
                        Połączenie jest poprawne, ale w schemacie bazy nie ma jeszcze tabel. Możesz jednym kliknięciem skopiować gotowy skrypt SQL, który utworzy tabelę <code>produkty</code>, doda uprawnienia RLS oraz bucket na zdjęcia.
                      </p>
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition-colors"
                      >
                        {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSql ? 'Skopiowano do schowka!' : 'Kopiuj gotowy SQL startowy (produkty + RLS + storage)'}</span>
                      </button>
                    </div>
                  )}

                  {/* Recommendations */}
                  {diagnostic.recommendations.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {diagnostic.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                          <span className="text-emerald-400 shrink-0 font-bold">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Collapsible Technical Details */}
                  {diagnostic.details && (
                    <div className="pt-1 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span>Szczegóły techniczne diagnostyki</span>
                      </button>
                      {showTechnicalDetails && (
                        <div className="mt-1.5 p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 whitespace-pre-wrap break-all">
                          {diagnostic.details}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Demo Mode explanation */
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong>Tryb demonstracyjny</strong> pozwala na pełne przetestowanie wszystkich funkcji aplikacji bez konieczności podawania własnych danych uwierzytelniających Supabase:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Dynamiczne tabele: <code>products</code>, <code>customers</code>, <code>orders</code>, <code>media_assets</code></li>
                <li>Pełny CRUD: dodawanie, usuwanie pojedyncze oraz masowe, edycja</li>
                <li>Import masowy z plików CSV, Excel (.xlsx) oraz JSON z mapowaniem kolumn</li>
                <li>Upload zdjęć i podgląd miniaturek oraz lightbox</li>
              </ul>
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
            Anuluj
          </button>
          <div className="flex items-center gap-2">
            {!isDemo && (
              <button
                type="button"
                onClick={switchToDemo}
                className="px-3 py-2 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/30 rounded-lg transition-colors"
              >
                Uruchom Demo
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
            >
              Zapisz i zastosuj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
