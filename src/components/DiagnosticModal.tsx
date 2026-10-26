import React, { useState } from 'react';
import { SupabaseConfig } from '../types';
import {
  decodeSupabaseKey,
  probeTableDirectly,
  createStorageBucket,
  testConnection
} from '../lib/supabaseClient';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Database,
  Key,
  HardDrive,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onOpenTable: (tableName: string) => void;
  onOpenSettings: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  onClose,
  config,
  onOpenTable,
  onOpenSettings,
  onToast
}) => {
  const [probeTableName, setProbeTableName] = useState('');
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<any>(null);

  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);

  const [creatingBucket, setCreatingBucket] = useState(false);
  const [copiedSql, setCopiedSql] = useState<string | null>(null);

  if (!isOpen) return null;

  const keyInfo = decodeSupabaseKey(config.key);
  const urlRefMatch = config.url.match(/https?:\/\/([a-zA-Z0-9_-]+)\.supabase\.co/i);
  const detectedUrlRef = urlRefMatch ? urlRefMatch[1] : null;

  const refMismatch = keyInfo.validJwt && keyInfo.ref && detectedUrlRef && keyInfo.ref !== detectedUrlRef;

  const handleRunPing = async () => {
    setTestingPing(true);
    const res = await testConnection(config.url, config.key);
    setPingResult(res);
    setTestingPing(false);
  };

  const handleProbeTable = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!probeTableName.trim()) return;

    setProbing(true);
    setProbeResult(null);
    const res = await probeTableDirectly(probeTableName.trim());
    setProbeResult(res);
    setProbing(false);
  };

  const handleCreateImagesBucket = async () => {
    setCreatingBucket(true);
    try {
      await createStorageBucket('images', true);
      onToast('success', 'Utworzono bucket "images"', 'Magazyn na zdjęcia jest gotowy.');
    } catch (err: any) {
      onToast('error', 'Błąd tworzenia bucketa', err.message);
    } finally {
      setCreatingBucket(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(id);
    setTimeout(() => setCopiedSql(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Centrum Diagnostyki Supabase</h3>
              <p className="text-xs text-slate-400">Analiza połączenia, uprawnień RLS oraz magazynu Storage</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Section 1: Credentials & JWT Role */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-slate-400 text-[11px] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Weryfikacja Danych Dostępowych</span>
              </span>
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                Zmień dane w Ustawieniach
              </button>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Project URL:</span>
                <span className="text-slate-200 truncate max-w-xs">{config.url || '(nie ustawiono)'}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Rola klucza API:</span>
                <span className="font-semibold">
                  {keyInfo.validJwt ? (
                    keyInfo.role === 'service_role' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 inline" /> service_role (Pełny dostęp / Omija RLS)
                      </span>
                    ) : keyInfo.keyType === 'publishable' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 inline" /> Klucz Publishable (sb_publishable_*)
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 inline" /> anon / public (Wymaga polityk RLS!)
                      </span>
                    )
                  ) : (
                    <span className="text-rose-400">Nieprawidłowy format klucza JWT</span>
                  )}
                </span>
              </div>

              {refMismatch && (
                <div className="p-2.5 rounded bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Niezgodność projektu i klucza!</strong>
                    <span>
                      Twój klucz API należy do projektu <code>{keyInfo.ref}</code>, podczas gdy adres URL wskazuje na{' '}
                      <code>{detectedUrlRef}</code>. Upewnij się, że kopiujesz klucz i URL z tego samego projektu w panelu Supabase.
                    </span>
                  </div>
                </div>
              )}

              {keyInfo.role === 'anon' && (
                <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
                  <p className="leading-relaxed">
                    <strong>Wskazówka RLS:</strong> Klucz <code>anon</code> w Supabase domyślnie <strong>nie ma prawa odczytu wierszy</strong> z tabeli, dopóki w Supabase SQL Editor nie utworzysz polityki <code>SELECT</code>. Aby uzyskać dostęp do wszystkich tabel bez konfigurowania reguł, użyj klucza <code>service_role</code>.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Interactive Table Prober */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="font-semibold uppercase tracking-wider text-slate-400 text-[11px] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Przetestuj dowolną tabelę z Twojej bazy</span>
            </span>

            <form onSubmit={handleProbeTable} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Wpisz nazwę tabeli (np. produkty, users, orders)"
                value={probeTableName}
                onChange={e => setProbeTableName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={probing || !probeTableName.trim()}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                {probing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Odpytaj bazę</span>
              </button>
            </form>

            {probeResult && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono space-y-2 ${
                  probeResult.ok
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {probeResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="font-semibold">
                      {probeResult.ok
                        ? `Tabela "${probeTableName}" istnieje w bazie! (${probeResult.count} wierszy)`
                        : `Błąd zapytania do "${probeTableName}"`}
                    </span>
                  </div>

                  {probeResult.ok && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenTable(probeTableName.trim());
                        onClose();
                      }}
                      className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-sans rounded transition-colors flex items-center gap-1"
                    >
                      <span>Otwórz tę tabelę w aplikacji</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {!probeResult.ok && (
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <p className="text-rose-300 font-sans">{probeResult.error}</p>
                    {probeResult.rlsProbable && (
                      <div className="mt-2 p-2 bg-slate-900 rounded border border-rose-800/60 font-sans text-slate-300 space-y-1">
                        <strong className="text-amber-400 block">Przyczyna: Blokada Row Level Security (RLS)</strong>
                        <p className="text-[11px] text-slate-400">
                          Tabela istnieje, ale Supabase nie pozwala roli anon na jej odczytanie. Wykonaj w Supabase SQL Editor:
                        </p>
                        <div className="p-1.5 bg-black/60 rounded font-mono text-emerald-400 text-[10px] flex items-center justify-between">
                          <span>CREATE POLICY "Dostęp publiczny" ON public."{probeTableName}" FOR ALL USING (true);</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`CREATE POLICY "Dostęp publiczny" ON public."${probeTableName}" FOR ALL USING (true);`, 'probe-rls')}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            {copiedSql === 'probe-rls' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {probeResult.ok && probeResult.columns?.length > 0 && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    <span>Wykryte kolumny: </span>
                    <span className="text-slate-200">{probeResult.columns.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Storage Buckets Diagnostics */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="font-semibold uppercase tracking-wider text-slate-400 text-[11px] flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. Magazyn Supabase Storage na zdjęcia</span>
            </span>

            <div className="space-y-2">
              <p className="text-slate-400 leading-relaxed">
                Jeśli widzisz komunikat <strong>"Brak zdefiniowanych bucketów"</strong>, Twój projekt Supabase nie posiada jeszcze utworzonego magazynu lub rola <code>anon</code> nie ma uprawnień do listowania.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreateImagesBucket}
                  disabled={creatingBucket}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {creatingBucket && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Utwórz publiczny bucket "images"</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sql = `-- Zezwolenie na publiczny dostęp do Storage w Supabase:\nINSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT (id) DO NOTHING;\nCREATE POLICY "Publiczne zdjecia odczyt" ON storage.objects FOR SELECT USING (bucket_id = 'images');\nCREATE POLICY "Publiczne zdjecia upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');`;
                    copyToClipboard(sql, 'storage-sql');
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  {copiedSql === 'storage-sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Kopiuj SQL konfiguracji Storage</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <span className="text-[11px] text-slate-400">
            Wskazówka: Zawsze zalecamy klucz <strong>service_role</strong> do administrowania tabelami.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
