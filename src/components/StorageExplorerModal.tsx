import React, { useEffect, useState, useRef } from 'react';
import { StorageBucketItem, StorageFileItem } from '../types';
import { listStorageBuckets, listStorageFiles, uploadImageToStorage, deleteStorageFile, createStorageBucket, registerStorageBucket } from '../lib/supabaseClient';
import { HardDrive, Upload, Trash2, Copy, Check, Eye, RefreshCw, X, Folder, Image as ImageIcon, Loader2, Plus } from 'lucide-react';

interface StorageExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (url: string) => void;
  onShowLightbox: (url: string, title?: string) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const StorageExplorerModal: React.FC<StorageExplorerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  onShowLightbox,
  onToast
}) => {
  const [buckets, setBuckets] = useState<StorageBucketItem[]>([]);
  const [activeBucket, setActiveBucket] = useState<string>('');
  const [files, setFiles] = useState<StorageFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newBucketName, setNewBucketName] = useState('');
  const [showNewBucket, setShowNewBucket] = useState(false);
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [copiedStorageSql, setCopiedStorageSql] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadBuckets();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeBucket) {
      loadFiles(activeBucket);
    }
  }, [activeBucket]);

  const loadBuckets = async (preferBucket?: string) => {
    try {
      const list = await listStorageBuckets();
      setBuckets(list);
      if (preferBucket) {
        setActiveBucket(preferBucket);
      } else if (list.length > 0 && (!activeBucket || !list.some(b => b.name === activeBucket))) {
        setActiveBucket(list[0].name);
      }
    } catch (err: any) {
      onToast('error', 'Błąd ładowania bucketów Storage', err.message);
    }
  };

  const handleCreateBucket = async () => {
    const name = newBucketName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!name) return;
    setCreatingBucket(true);
    try {
      const bucket = await createStorageBucket(name, true);
      onToast('success', 'Utworzono bucket', `Bucket "${bucket.name}" jest gotowy do użytku.`);
      setNewBucketName('');
      setShowNewBucket(false);
      await loadBuckets(bucket.name);
    } catch (err: any) {
      // If error (e.g. anon permissions), register locally so user can still access it!
      registerStorageBucket(name, true);
      await loadBuckets(name);
      onToast('info', 'Zarejestrowano bucket lokalnie', `Jeśli bucket "${name}" istnieje już w panelu Supabase, możesz z niego korzystać. (${err.message})`);
      setNewBucketName('');
      setShowNewBucket(false);
    } finally {
      setCreatingBucket(false);
    }
  };

  const handleQuickCreateDefault = async (name: string) => {
    try {
      await createStorageBucket(name, true);
      onToast('success', 'Utworzono bucket', `Publiczny bucket "${name}" został zainicjalizowany.`);
      await loadBuckets(name);
    } catch (err: any) {
      registerStorageBucket(name, true);
      await loadBuckets(name);
      onToast('info', 'Dodano bucket do aplikacji', `Możesz teraz przesyłać zdjęcia do "${name}".`);
    }
  };

  const copyStorageSql = () => {
    const sql = `-- Utworzenie publicznego bucketa w Supabase SQL Editor:\nINSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT (id) DO NOTHING;\n\n-- Zezwolenie na odczyt i upload zdjęć dla każdego:\nCREATE POLICY "Publiczne zdjecia odczyt" ON storage.objects FOR SELECT USING (bucket_id = 'images');\nCREATE POLICY "Publiczne zdjecia upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');`;
    navigator.clipboard.writeText(sql);
    setCopiedStorageSql(true);
    setTimeout(() => setCopiedStorageSql(false), 2500);
    onToast('info', 'Skopiowano kod SQL dla Storage', 'Wklej w Supabase SQL Editor.');
  };

  const loadFiles = async (bucketName: string) => {
    setLoading(true);
    try {
      const list = await listStorageFiles(bucketName);
      setFiles(list);
    } catch (err: any) {
      onToast('error', 'Błąd pobierania plików', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0 || !activeBucket) return;

    setUploading(true);
    let uploadedCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        await uploadImageToStorage(activeBucket, file);
        uploadedCount++;
      } catch (err: any) {
        onToast('error', `Błąd uploadu: ${file.name}`, err.message);
      }
    }

    if (uploadedCount > 0) {
      onToast('success', 'Przesłano zdjęcia', `Pomyślnie dodano ${uploadedCount} plików do bucketa ${activeBucket}`);
      await loadFiles(activeBucket);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Czy na pewno usunąć plik "${fileName}" z magazynu ${activeBucket}?`)) return;

    try {
      await deleteStorageFile(activeBucket, fileName);
      setFiles(prev => prev.filter(f => f.name !== fileName));
      onToast('success', 'Usunięto plik', `Plik ${fileName} został usunięty.`);
    } catch (err: any) {
      onToast('error', 'Błąd usuwania pliku', err.message);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    onToast('info', 'Skopiowano URL', 'Bezpośredni link do pliku zapisany w schowku.');
  };

  if (!isOpen) return null;

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Supabase Storage Explorer</h2>
              <p className="text-xs text-slate-400">Przeglądaj, przesyłaj i pobieraj zdjęcia oraz multimedia</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => activeBucket && loadFiles(activeBucket)}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Odśwież"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar + Main File Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Buckets list */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/30 p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Buckety Storage ({buckets.length})
              </span>
              <button
                type="button"
                onClick={() => setShowNewBucket(!showNewBucket)}
                className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                title="Dodaj lub utwórz nowy bucket"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inline New Bucket Form */}
            {showNewBucket && (
              <div className="p-2 mb-2 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                <input
                  type="text"
                  placeholder="nazwa-bucketa (np. images)"
                  value={newBucketName}
                  onChange={e => setNewBucketName(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setShowNewBucket(false)}
                    className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
                  >
                    Anuluj
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateBucket}
                    disabled={creatingBucket || !newBucketName.trim()}
                    className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded transition-colors"
                  >
                    {creatingBucket ? 'Tworzenie...' : 'Dodaj bucket'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-1">
              {buckets.map(b => {
                const isActive = b.name === activeBucket;
                return (
                  <button
                    key={b.id || b.name}
                    onClick={() => setActiveBucket(b.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="w-4 h-4 shrink-0 text-slate-500" />
                      <span className="truncate font-mono">{b.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {b.isPublic ? 'public' : 'private'}
                    </span>
                  </button>
                );
              })}

              {buckets.length === 0 && (
                <div className="p-3 text-xs text-slate-400 text-center space-y-2 bg-slate-900/50 rounded-lg border border-slate-800/80 m-1">
                  <p className="text-[11px] text-slate-300 font-medium">Brak bucketów w Supabase</p>
                  <p className="text-[10px] text-slate-400">Twoja baza nie posiada jeszcze utworzonego magazynu plików.</p>
                  <button
                    type="button"
                    onClick={() => handleQuickCreateDefault('images')}
                    className="w-full px-2.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-sm"
                  >
                    + Aktywuj bucket "images"
                  </button>
                  <button
                    type="button"
                    onClick={copyStorageSql}
                    className="w-full px-2 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700"
                  >
                    Kopiuj SQL (Utwórz w Supabase)
                  </button>
                </div>
              )}
            </div>

            {/* Storage RLS Help button */}
            <div className="pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={copyStorageSql}
                className="w-full text-center text-[10px] text-slate-400 hover:text-emerald-400 transition-colors py-1 flex items-center justify-center gap-1"
              >
                {copiedStorageSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedStorageSql ? 'Skopiowano SQL Storage!' : 'Kopiuj SQL uprawnień Storage'}</span>
              </button>
            </div>

            {/* Quick Upload Button */}
            <div className="pt-3 border-t border-slate-800">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,video/*,application/pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !activeBucket}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{uploading ? 'Wysyłanie...' : 'Prześlij zdjęcia'}</span>
              </button>
            </div>
          </div>

          {/* Right: Files Grid */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/60">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/20">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Magazyn:</span>
                <span className="font-semibold text-slate-200">{activeBucket || 'Brak'}</span>
                <span>·</span>
                <span className="font-mono">{filteredFiles.length} plików</span>
              </div>

              <div className="w-64">
                <input
                  type="text"
                  placeholder="Filtruj po nazwie pliku..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                  <p className="text-xs">Ładowanie plików z bucketa {activeBucket}...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-slate-800 rounded-xl p-8">
                  <ImageIcon className="w-12 h-12 text-slate-400 mb-3" />
                  <h4 className="text-sm font-medium text-slate-300">Ten bucket jest pusty</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Prześlij zdjęcia lub pliki multimedialne za pomocą przycisku w lewym panelu lub przeciągając je tutaj.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredFiles.map(file => {
                    const isCopied = copiedUrl === file.publicUrl;
                    return (
                      <div
                        key={file.name}
                        className="group relative flex flex-col bg-slate-950 border border-slate-800/80 rounded-lg overflow-hidden hover:border-slate-700 transition-all shadow-sm"
                      >
                        {/* Thumbnail */}
                        <div
                          className="relative aspect-video w-full bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer"
                          onClick={() => onShowLightbox(file.publicUrl, file.name)}
                        >
                          <img
                            src={file.publicUrl}
                            alt={file.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%231e293b" width="200" height="150"/><text fill="%2394a3b8" font-family="sans-serif" font-size="12" dy="4" font-weight="bold" x="50%" y="50%" text-anchor="middle">Plik / Obraz</text></svg>';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onShowLightbox(file.publicUrl, file.name);
                              }}
                              className="p-1.5 bg-slate-900/80 text-white rounded hover:bg-slate-800"
                              title="Powiększ"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* File Details */}
                        <div className="p-2.5 flex flex-col gap-1.5">
                          <p className="text-xs font-medium text-slate-200 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <span>{file.size ? `${Math.round(file.size / 1024)} KB` : 'Plik'}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCopy(file.publicUrl)}
                                className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                                title="Kopiuj link"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              {onSelectImage && (
                                <button
                                  onClick={() => {
                                    onSelectImage(file.publicUrl);
                                    onClose();
                                  }}
                                  className="px-1.5 py-0.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                                >
                                  Wybierz
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(file.name)}
                                className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Usuń plik"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
