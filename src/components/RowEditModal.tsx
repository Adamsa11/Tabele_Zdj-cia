import React, { useState, useEffect, useRef } from 'react';
import { ColumnMeta, TableMeta } from '../types';
import { uploadImageToStorage } from '../lib/supabaseClient';
import { X, Upload, Image as ImageIcon, Loader2, Calendar, FileCode, Check, Eye } from 'lucide-react';

interface RowEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableMeta;
  initialData?: Record<string, any> | null;
  onSave: (data: Record<string, any>) => Promise<void>;
  defaultBucket: string;
  onShowLightbox: (url: string, title?: string) => void;
  onOpenStoragePicker?: (onSelect: (url: string) => void) => void;
}

export const RowEditModal: React.FC<RowEditModalProps> = ({
  isOpen,
  onClose,
  table,
  initialData,
  onSave,
  defaultBucket,
  onShowLightbox,
  onOpenStoragePicker
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingCol, setUploadingCol] = useState<string | null>(null);
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      // Set defaults for new row
      const defaults: Record<string, any> = {};
      table.columns.forEach(col => {
        if (col.isPrimary && col.dataType === 'number') {
          // let database auto-generate
        } else if (col.defaultValue !== undefined && col.defaultValue !== null) {
          if (col.dataType === 'boolean') defaults[col.name] = col.defaultValue === 'true';
          else if (col.dataType === 'number') defaults[col.name] = Number(col.defaultValue);
          else defaults[col.name] = col.defaultValue;
        } else if (col.dataType === 'boolean') {
          defaults[col.name] = false;
        } else if (col.dataType === 'datetime' && (col.name === 'created_at' || col.name === 'updated_at')) {
          defaults[col.name] = new Date().toISOString();
        } else {
          defaults[col.name] = '';
        }
      });
      setFormData(defaults);
    }
    setJsonErrors({});
  }, [initialData, table, isOpen]);

  const handleChange = (columnName: string, value: any) => {
    setFormData(prev => ({ ...prev, [columnName]: value }));
  };

  const handleJsonChange = (columnName: string, text: string) => {
    setFormData(prev => ({ ...prev, [columnName]: text }));
    try {
      if (text.trim()) {
        JSON.parse(text);
      }
      setJsonErrors(prev => {
        const copy = { ...prev };
        delete copy[columnName];
        return copy;
      });
    } catch (e: any) {
      setJsonErrors(prev => ({ ...prev, [columnName]: 'Nieprawidłowa składnia JSON' }));
    }
  };

  const handleImageFileUpload = async (columnName: string, file: File) => {
    setUploadingCol(columnName);
    try {
      const res = await uploadImageToStorage(defaultBucket || 'products-images', file);
      handleChange(columnName, res.publicUrl);
    } catch (err: any) {
      alert(`Błąd podczas przesyłania zdjęcia: ${err.message}`);
    } finally {
      setUploadingCol(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(jsonErrors).length > 0) {
      alert('Proszę poprawić błędy w polach JSON przed zapisem.');
      return;
    }

    setSaving(true);
    try {
      // Process JSON fields to real objects
      const processed: Record<string, any> = { ...formData };
      table.columns.forEach(col => {
        if (col.dataType === 'json' && typeof processed[col.name] === 'string' && processed[col.name].trim()) {
          try {
            processed[col.name] = JSON.parse(processed[col.name]);
          } catch (e) {
            // keep as is
          }
        } else if (col.dataType === 'number') {
          if (processed[col.name] === '' || processed[col.name] === null) {
            if (col.isNullable) processed[col.name] = null;
          } else {
            processed[col.name] = Number(processed[col.name]);
          }
        }
      });

      await onSave(processed);
      onClose();
    } catch (err: any) {
      alert(`Błąd zapisu rekordu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              {isEditMode ? `Edycja rekordu w "${table.name}"` : `Nowy rekord w "${table.name}"`}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditMode ? 'Wprowadź modyfikacje pól i zatwierdź zmiany' : 'Wypełnij wartości dla poszczególnych kolumn tabeli'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {table.columns.map(col => {
            const isPrimaryKey = !!col.isPrimary;
            const isImageCol = col.dataType === 'image' || col.name.toLowerCase().includes('image') || col.name.toLowerCase().includes('avatar') || col.name.toLowerCase().includes('photo');
            const currentValue = formData[col.name] ?? '';

            return (
              <div key={col.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <span>{col.name}</span>
                    <span className="text-[11px] font-mono text-slate-400 font-normal">({col.dataType})</span>
                    {isPrimaryKey && (
                      <span className="text-[10px] text-amber-400 font-mono">PRIMARY KEY</span>
                    )}
                  </label>
                  {!col.isNullable && !isPrimaryKey && (
                    <span className="text-[10px] text-rose-400">wymagane</span>
                  )}
                </div>

                {/* Primary Key Disabled on Edit */}
                {isPrimaryKey && isEditMode ? (
                  <input
                    type="text"
                    disabled
                    value={currentValue}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-400 cursor-not-allowed"
                  />
                ) : isImageCol ? (
                  /* Image Field with Upload & Preview */
                  <div className="space-y-2 p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="https://... lub prześlij plik poniżej"
                        value={currentValue}
                        onChange={e => handleChange(col.name, e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                      />

                      <input
                        type="file"
                        accept="image/*"
                        ref={el => { fileInputRefs.current[col.name] = el; }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFileUpload(col.name, file);
                        }}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[col.name]?.click()}
                        disabled={uploadingCol === col.name}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors shrink-0"
                      >
                        {uploadingCol === col.name ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingCol === col.name ? 'Wysyłanie...' : 'Prześlij zdjęcie'}</span>
                      </button>

                      {onOpenStoragePicker && (
                        <button
                          type="button"
                          onClick={() => onOpenStoragePicker(url => handleChange(col.name, url))}
                          className="px-2.5 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60 shrink-0"
                          title="Wybierz z biblioteki Storage"
                        >
                          Storage
                        </button>
                      )}
                    </div>

                    {/* Image Preview if URL exists */}
                    {currentValue && (
                      <div className="flex items-center gap-3 pt-1">
                        <div
                          className="relative w-16 h-12 bg-slate-900 rounded border border-slate-800 overflow-hidden cursor-pointer group shrink-0"
                          onClick={() => onShowLightbox(currentValue, col.name)}
                        >
                          <img
                            src={currentValue}
                            alt="Podgląd"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate flex-1 font-mono">
                          {currentValue}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange(col.name, '')}
                          className="text-[11px] text-rose-400 hover:underline shrink-0"
                        >
                          Wyczyść
                        </button>
                      </div>
                    )}
                  </div>
                ) : col.dataType === 'boolean' ? (
                  /* Boolean Toggle */
                  <div className="flex items-center gap-3 py-1">
                    <button
                      type="button"
                      onClick={() => handleChange(col.name, !formData[col.name])}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData[col.name] ? 'bg-emerald-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData[col.name] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-slate-300 font-mono">
                      {formData[col.name] ? 'true (Prawda)' : 'false (Fałsz)'}
                    </span>
                  </div>
                ) : col.dataType === 'datetime' ? (
                  /* Datetime Field */
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={currentValue}
                      onChange={e => handleChange(col.name, e.target.value)}
                      placeholder="YYYY-MM-DDTHH:mm:ssZ"
                      className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleChange(col.name, new Date().toISOString())}
                      className="px-2.5 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60 shrink-0"
                    >
                      Teraz (ISO)
                    </button>
                  </div>
                ) : col.dataType === 'json' ? (
                  /* JSON Editor */
                  <div className="space-y-1">
                    <textarea
                      rows={3}
                      value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue}
                      onChange={e => handleJsonChange(col.name, e.target.value)}
                      placeholder='{"key": "value"}'
                      className={`w-full px-3 py-2 text-xs bg-slate-950 border rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none font-mono ${
                        jsonErrors[col.name] ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                      }`}
                    />
                    {jsonErrors[col.name] && (
                      <p className="text-[11px] text-rose-400">{jsonErrors[col.name]}</p>
                    )}
                  </div>
                ) : col.dataType === 'number' ? (
                  /* Number Input */
                  <input
                    type="number"
                    step="any"
                    value={currentValue}
                    onChange={e => handleChange(col.name, e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                ) : (
                  /* Standard Text */
                  <input
                    type="text"
                    value={currentValue}
                    onChange={e => handleChange(col.name, e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>
            );
          })}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={saving || uploadingCol !== null}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditMode ? 'Zapisz zmiany' : 'Dodaj rekord'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
