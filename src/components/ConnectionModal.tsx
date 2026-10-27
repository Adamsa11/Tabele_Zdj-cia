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
  ChevronUp
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
    onToast('info', 'Tryb demonstracyjny', 'Aktywowano lokalną bazę demonstracyjną Saw-Trak.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl text-[#161616]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50 text-[#F36F21] border border-orange-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#161616] font-heading">Ustawienia połączenia z Supabase</h3>
              <p className="text-xs text-gray-500">Podłącz swój projekt lub korzystaj z demonstracyjnej bazy Saw-Trak</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-130px)]">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4 h-4 ${isDemo ? 'text-[#F36F21]' : 'text-gray-400'}`} />
              <div>
                <p className="text-xs font-bold text-[#161616]">Tryb pracy</p>
                <p className="text-[11px] text-gray-500">
                  {isDemo ? 'Tryb demonstracyjny (wózki widłowe Saw-Trak, części, klienci)' : 'Połączony z Twoją chmurą Supabase'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setIsDemo(false)}
                className={`px-3 py-1 rounded-md transition-colors font-medium ${
                  !isDemo ? 'bg-[#161616] text-white' : 'text-gray-600 hover:text-[#161616]'
                }`}
              >
                Chmura Supabase
              </button>
              <button
                type="button"
                onClick={() => setIsDemo(true)}
                className={`px-3 py-1 rounded-md transition-colors font-medium ${
                  isDemo ? 'bg-[#F36F21] text-white' : 'text-gray-600 hover:text-[#161616]'
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
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5 mb-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#F36F21]" />
                  <span>Project URL</span>
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#F9F9F9] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F36F21] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5 mb-1.5">
                  <Key className="w-3.5 h-3.5 text-[#F36F21]" />
                  <span>API Key (anon / public lub service_role)</span>
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... lub sb_publishable_..."
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#F9F9F9] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F36F21] focus:bg-white transition-colors"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Klucz anon/publishable umożliwia operacje zgodnie z politykami RLS. Klucz service_role omija RLS.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5 mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#F36F21]" />
                  <span>Domyślny Bucket Storage dla zdjęć</span>
                </label>
                <input
                  type="text"
                  placeholder="np. images, products, avatars"
                  value={defaultBucket}
                  onChange={e => setDefaultBucket(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#F9F9F9] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F36F21] focus:bg-white transition-colors"
                />
              </div>

              {/* Test Connection Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !url.trim() || !key.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#F36F21] bg-orange-50 hover:bg-orange-100 disabled:opacity-50 border border-orange-200 rounded-lg transition-colors shadow-2xs"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#F36F21]" />
                      <span>Testowanie uprawnień information_schema i połączenia...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-[#F36F21]" />
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
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : diagnostic.ok
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {/* Status Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {diagnostic.readable && diagnostic.tablesFound.length > 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : diagnostic.ok ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-[#CC0000] shrink-0" />
                      )}
                      <span>{diagnostic.statusTitle}</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-gray-300 text-gray-700 shadow-2xs">
                      {diagnostic.latencyMs} ms
                    </span>
                  </div>

                  {/* Badges Overview */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Information Schema Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border bg-white ${
                        diagnostic.directInformationSchemaAccess || diagnostic.openApiSchemaAccess
                          ? 'border-emerald-300 text-emerald-700'
                          : 'border-rose-300 text-[#CC0000]'
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
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-blue-200 text-blue-700">
                      <Table2 className="w-3.5 h-3.5" />
                      <span>Tabele w schemacie: {diagnostic.tablesFound.length}</span>
                    </div>

                    {/* Role Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-purple-200 text-purple-700">
                      <Key className="w-3.5 h-3.5" />
                      <span>Rola: {diagnostic.role}</span>
                    </div>
                  </div>

                  {/* Main Message */}
                  <p className="text-xs leading-relaxed text-gray-800">
                    {diagnostic.message}
                  </p>

                  {/* Discovered Tables List */}
                  {diagnostic.tablesFound.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
                      <p className="text-[11px] text-gray-500 font-semibold mb-1.5">
                        Wykryte dostępne tabele:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {diagnostic.tablesFound.map(tbl => (
                          <span
                            key={tbl}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 border border-gray-200 font-mono text-[11px] text-gray-800"
                          >
                            <Table2 className="w-3 h-3 text-[#F36F21]" />
                            {tbl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty Database Guidance + Quick Copy SQL */}
                  {diagnostic.ok && diagnostic.tablesFound.length === 0 && (
                    <div className="p-3 rounded-lg bg-orange-100/70 border border-orange-200 space-y-2">
                      <p className="text-[11px] text-orange-950 leading-relaxed">
                        Połączenie jest poprawne, ale w schemacie bazy nie ma jeszcze tabel. Możesz jednym kliknięciem skopiować gotowy skrypt SQL, który utworzy tabelę <code>produkty</code>, doda uprawnienia RLS oraz bucket na zdjęcia.
                      </p>
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F36F21] hover:bg-[#df5d12] text-white font-semibold text-xs transition-colors shadow-2xs"
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
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700">
                          <span className="text-[#F36F21] shrink-0 font-bold">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Collapsible Technical Details */}
                  {diagnostic.details && (
                    <div className="pt-1 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                        className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span>Szczegóły techniczne diagnostyki</span>
                      </button>
                      {showTechnicalDetails && (
                        <div className="mt-1.5 p-2 rounded bg-white border border-gray-200 text-[10px] font-mono text-gray-800 whitespace-pre-wrap break-all shadow-inner">
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
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 space-y-2 leading-relaxed">
              <p className="font-semibold text-[#161616]">
                Tryb demonstracyjny Saw-Trak:
              </p>
              <p className="text-gray-600">
                Pozwala na natychmiastowe przetestowanie wszystkich funkcji menedżera danych w branży wózków widłowych i logistyki magazynowej:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Gotowe tabele flotowe: <code>products</code>, <code>customers</code>, <code>orders</code>, <code>media_assets</code></li>
                <li>Pełny CRUD: dodawanie, usuwanie wierszy oraz masowe usuwanie, edycja</li>
                <li>Import z plików CSV, Excel (.xlsx) oraz JSON z mapowaniem kolumn</li>
                <li>Magazyn multimediów ze zdjęciami sprzętu oraz podgląd lightbox</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 shadow-2xs"
          >
            Anuluj
          </button>
          <div className="flex items-center gap-2">
            {!isDemo && (
              <button
                type="button"
                onClick={switchToDemo}
                className="px-3.5 py-2 text-xs font-semibold text-[#F36F21] hover:text-[#df5d12] bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
              >
                Uruchom Demo
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#F36F21] hover:bg-[#df5d12] rounded-lg transition-colors shadow-sm"
            >
              Zapisz i zastosuj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
