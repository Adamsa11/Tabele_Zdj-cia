import React, { useState, useEffect, useRef } from 'react';
import { ColumnMeta, TableMeta, ValidatedOption } from '../types';
import { uploadImageToStorage, fetchValidatedTableOptions, addOptionToValidatedTable } from '../lib/supabaseClient';
import {
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  Calendar,
  FileCode,
  Check,
  Eye,
  Database,
  Plus,
  CheckCircle2,
  Edit3,
  ListFilter,
  ShieldCheck,
  Layers
} from 'lucide-react';

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

  // Validated dictionary table states
  const [validatedOptions, setValidatedOptions] = useState<Record<string, ValidatedOption[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});
  const [addingToCol, setAddingToCol] = useState<string | null>(null);
  const [newValInput, setNewValInput] = useState('');
  const [newDescInput, setNewDescInput] = useState('');
  const [savingNewOption, setSavingNewOption] = useState(false);
  const [manualMode, setManualMode] = useState<Record<string, boolean>>({});

  const isEditMode = !!initialData;

  const isValidatedColumn = (col: ColumnMeta): boolean => {
    const lower = col.name.toLowerCase();
    return (
      lower === 'rodzaj' ||
      lower === 'gwarancja_detal' ||
      lower === 'gwarancja_hurt' ||
      lower.includes('rodzaj') ||
      lower.includes('gwarancja') ||
      !!col.foreignKey?.table
    );
  };

  const getTargetTableName = (col: ColumnMeta): string => {
    if (col.foreignKey?.table) return col.foreignKey.table;
    const lower = col.name.toLowerCase();
    if (lower.includes('rodzaj')) return 'Model_Rodzaj';
    if (lower.includes('gwarancja_detal')) return 'Model_Gwarancja_Detal';
    if (lower.includes('gwarancja_hurt')) return 'Model_Gwarancja_Hurt';
    return 'Tabela słownikowa';
  };

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
    setAddingToCol(null);
    setNewValInput('');
    setNewDescInput('');
  }, [initialData, table, isOpen]);

  // Load validated options whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    table.columns.forEach(async col => {
      if (isValidatedColumn(col)) {
        setLoadingOptions(prev => ({ ...prev, [col.name]: true }));
        try {
          const opts = await fetchValidatedTableOptions(col.name);
          setValidatedOptions(prev => ({ ...prev, [col.name]: opts }));

          // If new row and no value yet, and options exist, optionally preselect first or default
          setFormData(prev => {
            if (!prev[col.name] && opts.length > 0 && !isEditMode) {
              return { ...prev, [col.name]: opts[0].value };
            }
            return prev;
          });
        } catch (e) {
          console.warn(`Could not load options for ${col.name}:`, e);
        } finally {
          setLoadingOptions(prev => ({ ...prev, [col.name]: false }));
        }
      }
    });
  }, [isOpen, table]);

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

  const handleAddNewOptionToTable = async (colName: string) => {
    if (!newValInput.trim()) return;
    setSavingNewOption(true);
    try {
      await addOptionToValidatedTable(colName, newValInput.trim(), newDescInput.trim());
      const updated = await fetchValidatedTableOptions(colName);
      setValidatedOptions(prev => ({ ...prev, [colName]: updated }));
      handleChange(colName, newValInput.trim());
      setAddingToCol(null);
      setNewValInput('');
      setNewDescInput('');
    } catch (err: any) {
      alert(`Błąd dodawania do tabeli słownikowej: ${err.message}`);
    } finally {
      setSavingNewOption(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl text-[#161616]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/70">
          <div>
            <h3 className="text-base font-bold text-[#161616] font-heading">
              {isEditMode ? `Edycja rekordu w "${table.name}"` : `Nowy rekord w "${table.name}"`}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {table.isView
                ? 'Zmiany w widoku v_model zostaną automatycznie rozdzielone i zapisane w powiązanych tabelach Model_*'
                : isEditMode
                ? 'Wprowadź modyfikacje pól i zatwierdź zmiany'
                : 'Wypełnij wartości dla poszczególnych kolumn tabeli'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {table.columns.map(col => {
            const isPrimaryKey = !!col.isPrimary;
            const isImageCol =
              col.dataType === 'image' ||
              col.name.toLowerCase().includes('image') ||
              col.name.toLowerCase().includes('avatar') ||
              col.name.toLowerCase().includes('photo') ||
              col.name.toLowerCase().includes('zdjecie');
            const currentValue = formData[col.name] ?? '';
            const isValidated = isValidatedColumn(col);
            const targetTable = getTargetTableName(col);
            const options = validatedOptions[col.name] || [];
            const isLoadingThisCol = loadingOptions[col.name];
            const isManual = manualMode[col.name];
            const selectedOpt = options.find(o => o.value === currentValue);

            return (
              <div key={col.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-2 flex-wrap">
                    <span>{col.name}</span>
                    <span className="text-[11px] font-mono text-gray-400 font-normal">({col.dataType})</span>
                    {isPrimaryKey && (
                      <span className="text-[10px] text-[#F36F21] font-mono font-bold bg-orange-50 px-1 rounded">
                        PRIMARY KEY
                      </span>
                    )}
                    {isValidated && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-orange-700 font-mono font-medium bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                        <Database className="w-2.5 h-2.5 text-[#F36F21]" />
                        <span>Słownik: {targetTable}</span>
                      </span>
                    )}
                  </label>
                  {!col.isNullable && !isPrimaryKey && (
                    <span className="text-[10px] text-[#CC0000] font-medium">wymagane</span>
                  )}
                </div>

                {/* Primary Key Disabled on Edit */}
                {isPrimaryKey && isEditMode ? (
                  <input
                    type="text"
                    disabled
                    value={currentValue}
                    className="w-full px-3 py-2 text-xs font-mono bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                ) : isImageCol ? (
                  /* Image Field with Upload & Preview */
                  <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="https://... lub prześlij plik poniżej"
                        value={currentValue}
                        onChange={e => handleChange(col.name, e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F36F21] font-mono"
                      />

                      <input
                        type="file"
                        accept="image/*"
                        ref={el => {
                          fileInputRefs.current[col.name] = el;
                        }}
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
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#F36F21] hover:bg-[#df5d12] disabled:opacity-50 rounded-lg transition-colors shrink-0 shadow-2xs"
                      >
                        {uploadingCol === col.name ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingCol === col.name ? 'Wysyłanie...' : 'Prześlij plik'}</span>
                      </button>

                      {onOpenStoragePicker && (
                        <button
                          type="button"
                          onClick={() => onOpenStoragePicker(url => handleChange(col.name, url))}
                          className="px-2.5 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 shrink-0 shadow-2xs"
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
                          className="relative w-16 h-12 bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer group shrink-0 shadow-2xs"
                          onClick={() => onShowLightbox(currentValue, col.name)}
                        >
                          <img
                            src={currentValue}
                            alt="Podgląd"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-600 truncate flex-1 font-mono">
                          {currentValue}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange(col.name, '')}
                          className="text-[11px] text-[#CC0000] hover:underline shrink-0 font-medium"
                        >
                          Wyczyść
                        </button>
                      </div>
                    )}
                  </div>
                ) : isValidated && !isManual ? (
                  /* Validated Dictionary Dropdown Field */
                  <div className="space-y-2 p-3 bg-amber-50/30 border border-amber-200/80 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={currentValue}
                          onChange={e => handleChange(col.name, e.target.value)}
                          className="w-full px-3 py-2 pr-8 text-xs bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#F36F21] focus:ring-1 focus:ring-[#F36F21] font-sans appearance-none shadow-2xs"
                        >
                          <option value="">-- Wybierz z tabeli "{targetTable}" --</option>
                          {/* If currentValue exists and is not present in options, add it so nothing is lost */}
                          {currentValue && !options.some(o => o.value === currentValue) && (
                            <option value={currentValue}>{currentValue} (Bieżąca wartość)</option>
                          )}
                          {options.map((opt, i) => (
                            <option key={`${opt.value}-${i}`} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          {isLoadingThisCol ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F36F21]" />
                          ) : (
                            <ListFilter className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAddingToCol(addingToCol === col.name ? null : col.name);
                          setNewValInput('');
                          setNewDescInput('');
                        }}
                        className={`flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-lg transition-colors border shrink-0 ${
                          addingToCol === col.name
                            ? 'bg-orange-100 text-[#F36F21] border-[#F36F21]'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-2xs'
                        }`}
                        title={`Dodaj nową wartość do słownika ${targetTable}`}
                      >
                        <Plus className="w-3.5 h-3.5 text-[#F36F21]" />
                        <span>Nowa opcja</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setManualMode(prev => ({ ...prev, [col.name]: true }))}
                        className="px-2 py-2 text-xs text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors shrink-0 shadow-2xs"
                        title="Przełącz na wpisywanie ręczne"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Selected option description helper */}
                    {selectedOpt?.description && (
                      <div className="flex items-start gap-1.5 text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-amber-200/60 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#F36F21] shrink-0 mt-0.5" />
                        <span className="leading-tight">
                          <strong className="font-semibold text-gray-800">Parametry ze słownika:</strong>{' '}
                          {selectedOpt.description}
                        </span>
                      </div>
                    )}

                    {/* Inline Form: Add new value to validated table */}
                    {addingToCol === col.name && (
                      <div className="p-3 bg-white border border-[#F36F21]/40 rounded-xl space-y-2 shadow-xs animate-in fade-in duration-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#161616] flex items-center gap-1.5 font-heading">
                            <Plus className="w-3.5 h-3.5 text-[#F36F21]" />
                            <span>Dodaj nową pozycję do tabeli "{targetTable}"</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setAddingToCol(null)}
                            className="text-gray-400 hover:text-gray-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <input
                            type="text"
                            placeholder="Wartość / nazwa (np. nowy typ wózka lub gwarancja)..."
                            value={newValInput}
                            onChange={e => setNewValInput(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-[#F9F9F9] border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#F36F21] focus:bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Opis / warunki / limit mth (opcjonalnie)..."
                            value={newDescInput}
                            onChange={e => setNewDescInput(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-[#F9F9F9] border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#F36F21] focus:bg-white"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setAddingToCol(null)}
                            className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            Anuluj
                          </button>
                          <button
                            type="button"
                            disabled={savingNewOption || !newValInput.trim()}
                            onClick={() => handleAddNewOptionToTable(col.name)}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-[#F36F21] hover:bg-[#df5d12] disabled:opacity-50 rounded-lg shadow-2xs"
                          >
                            {savingNewOption && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>Zapisz do tabeli i wybierz</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isValidated && isManual ? (
                  /* Manual input fallback for validated column with toggle back */
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={currentValue}
                        onChange={e => handleChange(col.name, e.target.value)}
                        placeholder={`Wpisz wartość dla ${col.name}...`}
                        className="flex-1 px-3 py-2 text-xs bg-[#F9F9F9] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F36F21] focus:bg-white font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setManualMode(prev => ({ ...prev, [col.name]: false }))}
                        className="px-3 py-2 text-xs font-medium text-[#F36F21] bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors shrink-0 shadow-2xs"
                      >
                        Wróć do wyboru z tabeli
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      Tryb edycji swobodnej. Zalecane jest wybranie wartości z tabeli walidowanej {targetTable}.
                    </p>
                  </div>
                ) : col.dataType === 'boolean' ? (
                  /* Boolean Toggle */
                  <div className="flex items-center gap-3 py-1">
                    <button
                      type="button"
                      onClick={() => handleChange(col.name, !formData[col.name])}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData[col.name] ? 'bg-[#F36F21]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData[col.name] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-gray-700 font-mono">
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
                      className="flex-1 px-3 py-2 text-xs bg-[#F9F9F9] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F36F21] focus:bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleChange(col.name, new Date().toISOString())}
                      className="px-2.5 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 shrink-0 shadow-2xs"
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
                      className={`w-full px-3 py-2 text-xs bg-[#F9F9F9] border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none font-mono ${
                        jsonErrors[col.name] ? 'border-[#CC0000]' : 'border-gray-300 focus:border-[#F36F21] focus:bg-white'
                      }`}
                    />
                    {jsonErrors[col.name] && (
                      <p className="text-[11px] text-[#CC0000]">{jsonErrors[col.name]}</p>
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
                    className="w-full px-3 py-2 text-xs bg-[#F9F9F9] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F36F21] focus:bg-white font-mono"
                  />
                ) : (
                  /* Standard Text */
                  <input
                    type="text"
                    value={currentValue}
                    onChange={e => handleChange(col.name, e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F9F9F9] border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F36F21] focus:bg-white"
                  />
                )}
              </div>
            );
          })}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors shadow-2xs"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={saving || uploadingCol !== null}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#F36F21] hover:bg-[#df5d12] disabled:opacity-50 rounded-lg transition-colors shadow-sm"
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
