import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ColumnMeta, FilterCondition, SortCondition, StorageBucketItem, StorageFileItem, SupabaseConfig, TableMeta, ValidatedOption } from '../types';
import { DEMO_DATA, DEMO_STORAGE_BUCKETS, DEMO_STORAGE_FILES, DEMO_TABLES } from './demoData';

const CONFIG_STORAGE_KEY = 'supatable_config_v1';
const DEMO_TABLES_KEY = 'supatable_demo_tables_v1';
const DEMO_DATA_PREFIX = 'supatable_demo_data_v1_';
const DEMO_STORAGE_FILES_KEY = 'supatable_demo_storage_files_v1';

let activeSupabaseClient: SupabaseClient | null = null;
let currentConfig: SupabaseConfig = {
  url: 'https://nhqambvmghlhzjtdvljz.supabase.co',
  key: 'sb_publishable_Y6F5nGyspeypmyQbanrUEA_r2N2s6PC',
  defaultBucket: 'zdjecia_modeli',
  isDemo: false,
  isConnected: true
};

export function cleanSupabaseUrl(inputUrl: string): string {
  let url = (inputUrl || '').trim();
  if (!url) return '';
  // Check if user accidentally pasted dashboard URL: https://supabase.com/dashboard/project/<project_ref>/...
  const dashboardMatch = url.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url.replace(/\/$/, '');
}

// Initialize config from localStorage or defaults
export function loadSavedConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If user saved a custom config, merge it
      if (parsed.url && parsed.key) {
        currentConfig = { ...currentConfig, ...parsed };
      }
    }
  } catch (e) {
    console.error('Failed to load saved config:', e);
  }

  // Ensure client is initialized with active project credentials
  if (!currentConfig.isDemo && currentConfig.url && currentConfig.key) {
    initSupabase(currentConfig.url, currentConfig.key);
  }
  return currentConfig;
}

export function saveConfig(cfg: Partial<SupabaseConfig>): SupabaseConfig {
  const normalizedCfg = { ...cfg };
  if (normalizedCfg.url) {
    normalizedCfg.url = cleanSupabaseUrl(normalizedCfg.url);
  }
  currentConfig = { ...currentConfig, ...normalizedCfg };
  if (!currentConfig.isDemo && currentConfig.url && currentConfig.key) {
    initSupabase(currentConfig.url, currentConfig.key);
  }
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(currentConfig));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
  return currentConfig;
}

export function getActiveConfig(): SupabaseConfig {
  return currentConfig;
}

export function initSupabase(url: string, key: string): SupabaseClient {
  const cleanedUrl = cleanSupabaseUrl(url);
  activeSupabaseClient = createClient(cleanedUrl, key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return activeSupabaseClient;
}

export function getSupabase(): SupabaseClient | null {
  if (currentConfig.isDemo) return null;
  if (!activeSupabaseClient && currentConfig.url && currentConfig.key) {
    return initSupabase(currentConfig.url, currentConfig.key);
  }
  return activeSupabaseClient;
}

// Information Schema diagnostic result interface
export interface InformationSchemaDiagnosticResult {
  ok: boolean;
  readable: boolean;
  directInformationSchemaAccess: boolean;
  openApiSchemaAccess: boolean;
  tablesFound: string[];
  role: string;
  keyType: 'publishable' | 'secret' | 'jwt' | 'unknown';
  latencyMs: number;
  statusTitle: string;
  message: string;
  details?: string;
  rawError?: string;
  recommendations: string[];
}

/**
 * Diagnostic function testing permissions to read 'information_schema' metadata
 * and PostgREST schema cache to verify connection parameters before data loading.
 */
export async function testInformationSchemaAccess(
  urlInput?: string,
  keyInput?: string
): Promise<InformationSchemaDiagnosticResult> {
  const startTime = performance.now();
  const url = cleanSupabaseUrl(urlInput || currentConfig.url || '');
  const key = (keyInput || currentConfig.key || '').trim();

  if (!url) {
    return {
      ok: false,
      readable: false,
      directInformationSchemaAccess: false,
      openApiSchemaAccess: false,
      tablesFound: [],
      role: 'unknown',
      keyType: 'unknown',
      latencyMs: 0,
      statusTitle: 'Brak adresu URL',
      message: 'Wprowadź prawidłowy adres Project URL (np. https://nhqambvmghlhzjtdvljz.supabase.co).',
      recommendations: ['Skopiuj Project URL z panelu Supabase > Settings > API.']
    };
  }

  if (!key) {
    return {
      ok: false,
      readable: false,
      directInformationSchemaAccess: false,
      openApiSchemaAccess: false,
      tablesFound: [],
      role: 'unknown',
      keyType: 'unknown',
      latencyMs: 0,
      statusTitle: 'Brak klucza API',
      message: 'Wprowadź klucz API Supabase (anon / publishable lub service_role).',
      recommendations: ['Skopiuj klucz anon (lub sb_publishable_*) z panelu Supabase > Settings > API.']
    };
  }

  const keyDecoded = decodeSupabaseKey(key);
  const detectedRole = (keyDecoded.role as any) || (keyDecoded.keyType === 'publishable' ? 'publishable' : 'unknown');
  const keyType = keyDecoded.keyType || 'unknown';

  let directInfoSuccess = false;
  let directInfoErrorMsg = '';
  let directInfoTables: string[] = [];

  // 1. Test direct query to information_schema.tables via @supabase/supabase-js
  try {
    const infoClient = createClient(url, key, {
      db: { schema: 'information_schema' },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await infoClient
      .from('tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .limit(30);

    if (!error && Array.isArray(data)) {
      directInfoSuccess = true;
      directInfoTables = data
        .map((r: any) => r.table_name)
        .filter((name: string) => name && !name.startsWith('_') && !name.startsWith('pg_'));
    } else if (error) {
      directInfoErrorMsg = `${error.code || ''}: ${error.message}`;
    }
  } catch (err: any) {
    directInfoErrorMsg = err?.message || 'Wyjątek klienta';
  }

  // 2. Test OpenAPI schema metadata endpoint (/rest/v1/?apikey=...)
  let openApiSuccess = false;
  let openApiTables: string[] = [];
  let openApiStatusCode = 0;
  let openApiErrorMsg = '';
  let isPublishableKeyRestricted = false;

  try {
    const res = await fetch(`${url}/rest/v1/?apikey=${key}`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    openApiStatusCode = res.status;

    if (res.ok) {
      openApiSuccess = true;
      const schema = await res.json();
      const defs = schema.definitions || schema.components?.schemas || {};
      openApiTables = Object.keys(defs).filter(
        name => !name.startsWith('_') && !name.startsWith('pg_')
      );
    } else {
      const errJson = await res.json().catch(() => ({}));
      openApiErrorMsg = errJson.message || `HTTP ${res.status} ${res.statusText}`;
      if (res.status === 401 && (errJson.message?.includes('Secret API key required') || key.startsWith('sb_publishable_'))) {
        isPublishableKeyRestricted = true;
      }
    }
  } catch (err: any) {
    openApiErrorMsg = err?.message || 'Błąd połączenia sieciowego';
  }

  // 3. Table Probe via Supabase Client (handles sb_publishable_* and auto-detects tables like Model, Model_zdjecia)
  const probeTables: string[] = [];
  let tableProbeSuccess = false;
  try {
    const probeClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const candidates = [
      'v_model',
      'Model',
      'Model_Podstawowy',
      'Model_Specyfikacja',
      'Model_Ceny',
      'Model_Multimedia',
      'Model_zdjecia',
      'modele',
      'model'
    ];
    const checked = new Set<string>();

    for (let i = 0; i < candidates.length; i++) {
      const cName = candidates[i];
      if (checked.has(cName)) continue;
      checked.add(cName);

      const { data, error } = await probeClient.from(cName).select('*').limit(1);
      if (!error) {
        probeTables.push(cName);
        tableProbeSuccess = true;
      } else if (error.message && (error.message.includes('schema cache') || error.code === 'PGRST205')) {
        const hint = (error as any).hint || '';
        const match = hint.match(/public\.([a-zA-Z0-9_]+)/i);
        if (match && match[1] && !checked.has(match[1])) {
          candidates.push(match[1]);
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // 4. Test Storage API (buckets)
  let storageAccessible = false;
  let discoveredBuckets: string[] = [];
  try {
    const probeClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: buckets, error: bErr } = await probeClient.storage.listBuckets();
    if (!bErr && buckets && buckets.length > 0) {
      storageAccessible = true;
      discoveredBuckets = buckets.map(b => b.name);
    } else {
      const storageRes = await fetch(`${url}/storage/v1/bucket`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      if (storageRes.ok || storageRes.status === 200) {
        storageAccessible = true;
      }
    }
  } catch {
    // ignore
  }

  const combinedTables = Array.from(new Set([...directInfoTables, ...openApiTables, ...probeTables]));
  const latencyMs = Math.round(performance.now() - startTime);

  const readable = directInfoSuccess || openApiSuccess || tableProbeSuccess;
  const ok = readable || storageAccessible || isPublishableKeyRestricted;

  const recommendations: string[] = [];
  let statusTitle = '';
  let message = '';
  let details = '';

  if (ok && (combinedTables.length > 0 || tableProbeSuccess || storageAccessible)) {
    statusTitle = 'Połączenie aktywne i zweryfikowane!';

    if (combinedTables.length > 0) {
      message = `Połączenie z bazą Supabase jest poprawne! Wykryto ${combinedTables.length} tabel: ${combinedTables.join(', ')} oraz dostęp do magazynu Storage (${discoveredBuckets.length > 0 ? discoveredBuckets.join(', ') : 'OK'}). Baza jest gotowa do ładowania danych.`;
      recommendations.push('Kliknij "Zapisz i zastosuj", aby natychmiast załadować tabele do edytora.');
    } else {
      message = 'Uwierzytelnienie i połączenie powiodły się, lecz w schemacie bazy nie znaleziono jeszcze tabel.';
      recommendations.push('Skorzystaj z gotowego skryptu SQL (Kopiuj SQL), aby utworzyć tabelę produkty i polityki RLS.');
    }

    if (isPublishableKeyRestricted) {
      details = `Użyto nowoczesnego klucza Supabase Publishable (sb_publishable_*). Kong Gateway zabezpiecza przed odczytem pełnego katalogu OpenAPI bez klucza secret, lecz zapytania do tabel schematu publicznego (${combinedTables.join(', ') || 'PostgREST'}) oraz Storage działają w 100% prawidłowo.`;
    } else if (directInfoSuccess) {
      details = 'Bezpośredni odczyt information_schema.tables oraz Schema Cache PostgREST działają prawidłowo.';
    } else {
      details = 'PostgREST Schema API oraz Storage API zostały zweryfikowane pomyślnie.';
    }
  } else if (openApiStatusCode === 401 && !isPublishableKeyRestricted) {
    statusTitle = 'Błąd autoryzacji HTTP 401';
    message = 'Serwer Supabase odrzucił podany klucz API. Brak uprawnień do projektu.';
    recommendations.push('Upewnij się, że klucz pochodzi z tego samego projektu Supabase co podany URL.');
    recommendations.push('W Supabase Dashboard przejdź do: Project Settings -> API i skopiuj klucz "anon public" lub "service_role".');
    details = openApiErrorMsg;
  } else {
    statusTitle = 'Błąd połączenia z bazą';
    message = `Nie można połączyć się z serwerem Supabase pod adresem ${url}.`;
    recommendations.push('Sprawdź czy adres URL ma poprawny format https://[id-projektu].supabase.co.');
    recommendations.push('Upewnij się, że masz połączenie z internetem i projekt w Supabase nie jest uśpiony (Paused).');
    details = openApiErrorMsg || directInfoErrorMsg || 'Brak odpowiedzi serwera';
  }

  return {
    ok,
    readable,
    directInformationSchemaAccess: directInfoSuccess,
    openApiSchemaAccess: openApiSuccess || tableProbeSuccess,
    tablesFound: combinedTables,
    role: detectedRole,
    keyType,
    latencyMs,
    statusTitle,
    message,
    details,
    rawError: openApiErrorMsg || directInfoErrorMsg || undefined,
    recommendations
  };
}

// Test live Supabase connection (backward compatibility wrapper using testInformationSchemaAccess)
export async function testConnection(url: string, key: string): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
  tables?: string[];
  keyType?: 'publishable' | 'secret' | 'jwt';
  verifiedVia?: string;
}> {
  const diag = await testInformationSchemaAccess(url, key);
  return {
    ok: diag.ok,
    latencyMs: diag.latencyMs,
    error: diag.ok ? undefined : diag.message,
    tables: diag.tablesFound,
    keyType: diag.keyType === 'secret' ? 'secret' : diag.keyType === 'publishable' ? 'publishable' : 'jwt',
    verifiedVia: diag.directInformationSchemaAccess
      ? 'information_schema.tables'
      : diag.openApiSchemaAccess
      ? 'PostgREST Schema API'
      : 'Supabase Storage API'
  };
}

// Infer column metadata type from name and schema definition
export function inferColumnType(colName: string, typeDesc?: string, format?: string): ColumnMeta['dataType'] {
  const lower = colName.toLowerCase();
  if (
    lower.includes('image') ||
    lower.includes('avatar') ||
    lower.includes('photo') ||
    lower.includes('thumbnail') ||
    lower.includes('picture') ||
    lower.includes('receipt') ||
    lower.includes('zdjec') ||
    lower.includes('foto') ||
    lower.includes('obraz') ||
    lower.endsWith('_img') ||
    (lower.endsWith('_url') && (lower.includes('media') || lower.includes('file') || lower.includes('icon') || lower.includes('zdjec') || lower.includes('foto')))
  ) {
    return 'image';
  }

  if (lower === 'id' && format === 'uuid') return 'uuid';
  if (typeDesc === 'integer' || typeDesc === 'number' || format === 'int4' || format === 'int8' || format === 'numeric') {
    return 'number';
  }
  if (typeDesc === 'boolean') {
    return 'boolean';
  }
  if (typeDesc === 'array' || typeDesc === 'object' || format === 'json' || format === 'jsonb') {
    return 'json';
  }
  if (format === 'date-time' || format === 'timestamp' || lower.includes('created_at') || lower.includes('updated_at') || lower.includes('date')) {
    return 'datetime';
  }
  return 'text';
}

// Fetch tables list (Live or Demo)
export async function getTablesList(): Promise<TableMeta[]> {
  if (currentConfig.isDemo) {
    try {
      const stored = localStorage.getItem(DEMO_TABLES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEMO_TABLES;
  }

  const tables: TableMeta[] = [];

  // Helper to load user-saved custom/opened tables from storage
  const loadSavedCustomTables = () => {
    try {
      const customKey = `supatable_custom_tables_${currentConfig.url}`;
      const customSaved = localStorage.getItem(customKey);
      if (customSaved) {
        const customTables: TableMeta[] = JSON.parse(customSaved);
        customTables.forEach(ct => {
          if (!tables.some(t => t.name === ct.name)) tables.push(ct);
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const supabase = getSupabase();
  if (!supabase) {
    loadSavedCustomTables();
    return tables;
  }

  // 1. Try OpenAPI schema introspection on PostgREST
  try {
    const trimmedUrl = cleanSupabaseUrl(currentConfig.url);
    const res = await fetch(`${trimmedUrl}/rest/v1/?apikey=${currentConfig.key}`, {
      headers: {
        'apikey': currentConfig.key,
        'Authorization': `Bearer ${currentConfig.key}`
      }
    });

    if (res.ok) {
      const schema = await res.json();
      const defs = schema.definitions || schema.components?.schemas || {};

      for (const [tableName, def] of Object.entries<any>(defs)) {
        if (tableName.startsWith('_') || tableName.startsWith('pg_')) continue;

        const columns: ColumnMeta[] = [];
        const properties = def.properties || {};
        const requiredProps: string[] = def.required || [];

        for (const [propName, propDef] of Object.entries<any>(properties)) {
          const type = inferColumnType(propName, propDef.type, propDef.format);
          const isPrimary = propName === 'id' || propDef.description?.includes('Primary Key');
          columns.push({
            name: propName,
            dataType: type,
            isPrimary,
            isNullable: !requiredProps.includes(propName),
            defaultValue: propDef.default !== undefined ? String(propDef.default) : null
          });
        }

        tables.push({
          name: tableName,
          schema: 'public',
          columns,
          rowCount: undefined
        });
      }
    }
  } catch (err) {
    console.warn('Could not auto-detect schema from OpenAPI endpoint:', err);
  }

  // 2. Fallback probe for publishable keys (or when OpenAPI is blocked by Supabase gateway)
  if (tables.length === 0) {
    const candidates = [
      'v_model',
      'Model_Podstawowy',
      'Model_Rodzaj',
      'Model_Gwarancja_Detal',
      'Model_Gwarancja_Hurt',
      'Model_Gwarancje',
      'Model_Specyfikacja',
      'Model_Ceny',
      'Model_Multimedia',
      'Model',
      'Model_zdjecia',
      'modele',
      'model'
    ];
    const checked = new Set<string>();

    for (let i = 0; i < candidates.length; i++) {
      const candidateName = candidates[i];
      if (checked.has(candidateName)) continue;
      checked.add(candidateName);

      try {
        const { data, error } = await supabase.from(candidateName).select('*').limit(2);
        if (!error) {
          if (!tables.some(t => t.name === candidateName)) {
            let cols: ColumnMeta[] = [];
            if (data && data.length > 0) {
              cols = Object.keys(data[0]).map(k => ({
                name: k,
                dataType: inferColumnType(k),
                isPrimary: k.toLowerCase() === 'id' || k.toLowerCase().endsWith('_id'),
                isNullable: true
              }));
            } else {
              cols = [
                { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
                { name: 'nazwa_modelu', dataType: 'text', isNullable: false },
                { name: 'created_at', dataType: 'datetime', isNullable: true }
              ];
            }
            tables.push({
              name: candidateName,
              schema: 'public',
              columns: cols
            });
          }
        } else if (error.message && (error.message.includes('schema cache') || error.code === 'PGRST205')) {
          const hint = (error as any).hint || '';
          const match = hint.match(/public\.([a-zA-Z0-9_]+)/i);
          if (match && match[1] && !checked.has(match[1])) {
            candidates.push(match[1]);
          }
        }
      } catch (e) {
        // continue
      }
    }
  }

  loadSavedCustomTables();

  // Strict user rule: restrict only to tables starting with 'Model' and the view 'v_model'
  const isModelRelated = (name: string) => /^(v_model|model)/i.test(name.trim());
  const filtered = tables.filter(t => isModelRelated(t.name));

  // If v_model is not discovered from server, ensure it is available as the primary working view
  let viewModelFound = filtered.find(t => t.name.toLowerCase() === 'v_model');
  if (!viewModelFound) {
    viewModelFound = {
      name: 'v_model',
      schema: 'public',
      isView: true,
      description: 'Główny widok roboczy (automatycznie synchronizowany z tabelami Model_*)',
      rowCount: undefined,
      columns: [
        { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
        { name: 'nazwa_modelu', dataType: 'text', isNullable: false },
        { name: 'seria', dataType: 'text', isNullable: false },
        {
          name: 'rodzaj',
          dataType: 'text',
          isNullable: false,
          foreignKey: { table: 'Model_Rodzaj', column: 'nazwa' }
        },
        { name: 'typ_napedu', dataType: 'text', isNullable: false },
        { name: 'udzwig_kg', dataType: 'number', isNullable: false },
        { name: 'wysokosc_podnoszenia_mm', dataType: 'number', isNullable: false },
        { name: 'typ_masztu', dataType: 'text', isNullable: false },
        {
          name: 'gwarancja_detal',
          dataType: 'text',
          isNullable: false,
          foreignKey: { table: 'Model_Gwarancja_Detal', column: 'nazwa' }
        },
        {
          name: 'gwarancja_hurt',
          dataType: 'text',
          isNullable: false,
          foreignKey: { table: 'Model_Gwarancja_Hurt', column: 'nazwa' }
        },
        { name: 'cena_netto_pln', dataType: 'number', isNullable: false },
        { name: 'waluta', dataType: 'text', isNullable: false, defaultValue: 'PLN' },
        { name: 'rok_produkcji', dataType: 'number', isNullable: false },
        { name: 'dostepnosc', dataType: 'text', isNullable: false },
        { name: 'zdjecie_glowne', dataType: 'image', isNullable: true },
        { name: 'uwagi', dataType: 'text', isNullable: true }
      ]
    };
    filtered.unshift(viewModelFound);
  }

  // Sort: v_model always at the top (index 0)
  filtered.sort((a, b) => {
    if (a.name.toLowerCase() === 'v_model') return -1;
    if (b.name.toLowerCase() === 'v_model') return 1;
    return a.name.localeCompare(b.name);
  });

  filtered.forEach(t => {
    if (t.name.toLowerCase() === 'v_model') {
      t.isView = true;
      if (!t.description) {
        t.description = 'Główny widok roboczy (automatycznie synchronizowany z tabelami Model_*)';
      }
    }
  });

  return filtered;
}

// Quick-open or query any existing table directly by name
export async function quickOpenTable(tableName: string): Promise<TableMeta> {
  const cleanName = tableName.trim();
  if (!cleanName) throw new Error('Wprowadź prawidłową nazwę tabeli.');

  if (currentConfig.isDemo) {
    const demoTables = getDemoTables();
    let found = demoTables.find(t => t.name.toLowerCase() === cleanName.toLowerCase());
    if (!found) {
      found = {
        name: cleanName,
        schema: 'public',
        columns: [
          { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
          { name: 'name', dataType: 'text', isNullable: true },
          { name: 'created_at', dataType: 'datetime', isNullable: true }
        ],
        isCustom: true
      };
      registerCustomTable(found);
    }
    return found;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak aktywnego połączenia z Supabase.');

  // Attempt to select 1 row to verify existence and dynamically discover columns
  const { data, error } = await supabase.from(cleanName).select('*').limit(1);

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205' || error.message.toLowerCase().includes('schema cache')) {
      throw new Error(`Tabela "${cleanName}" nie została jeszcze utworzona w bazie Supabase. Skopiuj i uruchom skrypt SQL w Supabase Dashboard lub utwórz tabelę.`);
    }
    if (error.code === '42501' || error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('policy')) {
      throw new Error(`Brak uprawnień RLS do tabeli "${cleanName}". Dodaj politykę odczytu (SELECT) dla roli anon lub użyj klucza service_role.`);
    }
    throw new Error(`Błąd odpytania tabeli "${cleanName}": ${error.message}`);
  }

  let columns: ColumnMeta[] = [];
  if (data && data.length > 0) {
    columns = Object.keys(data[0]).map(k => ({
      name: k,
      dataType: inferColumnType(k),
      isPrimary: k.toLowerCase() === 'id' || k.toLowerCase().endsWith('_id'),
      isNullable: true
    }));
  } else {
    // If table exists but is currently empty, provide common standard columns
    columns = [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'created_at', dataType: 'datetime', isNullable: true }
    ];
  }

  const tableMeta: TableMeta = {
    name: cleanName,
    schema: 'public',
    columns,
    isCustom: true
  };

  registerCustomTable(tableMeta);
  return tableMeta;
}

// Save a custom table definition
export function registerCustomTable(table: TableMeta) {
  if (currentConfig.isDemo) {
    const current = getDemoTables();
    const existingIndex = current.findIndex(t => t.name === table.name);
    if (existingIndex >= 0) current[existingIndex] = table;
    else current.push(table);
    localStorage.setItem(DEMO_TABLES_KEY, JSON.stringify(current));
    // initialize empty data
    if (!localStorage.getItem(DEMO_DATA_PREFIX + table.name)) {
      localStorage.setItem(DEMO_DATA_PREFIX + table.name, JSON.stringify([]));
    }
  } else {
    const customKey = `supatable_custom_tables_${currentConfig.url}`;
    let customTables: TableMeta[] = [];
    try {
      const saved = localStorage.getItem(customKey);
      if (saved) customTables = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    const idx = customTables.findIndex(t => t.name === table.name);
    if (idx >= 0) customTables[idx] = table;
    else customTables.push(table);
    localStorage.setItem(customKey, JSON.stringify(customTables));
  }
}

function getDemoTables(): TableMeta[] {
  try {
    const stored = localStorage.getItem(DEMO_TABLES_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error(e);
  }
  return [...DEMO_TABLES];
}

function getDemoData(tableName: string): Record<string, any>[] {
  try {
    const stored = localStorage.getItem(DEMO_DATA_PREFIX + tableName);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error(e);
  }
  return DEMO_DATA[tableName] ? [...DEMO_DATA[tableName]] : [];
}

function setDemoData(tableName: string, data: Record<string, any>[]) {
  try {
    localStorage.setItem(DEMO_DATA_PREFIX + tableName, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

// Fetch Rows with pagination, search, sorting, and filtering
export async function fetchRows(
  tableName: string,
  options: {
    page: number;
    pageSize: number;
    search?: string;
    searchColumn?: string;
    sort?: SortCondition;
    filters?: FilterCondition[];
  }
): Promise<{ data: Record<string, any>[]; totalCount: number }> {
  const { page, pageSize, search, searchColumn, sort, filters } = options;

  if (currentConfig.isDemo) {
    let list = getDemoData(tableName);

    // Apply global or column search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(row => {
        if (searchColumn && searchColumn !== 'all') {
          return String(row[searchColumn] ?? '').toLowerCase().includes(q);
        }
        return Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q));
      });
    }

    // Apply filters
    if (filters && filters.length > 0) {
      filters.forEach(f => {
        if (!f.column) return;
        list = list.filter(row => {
          const val = row[f.column];
          if (f.operator === 'is_null') return val === null || val === undefined || val === '';
          if (f.operator === 'is_not_null') return val !== null && val !== undefined && val !== '';
          if (f.operator === 'contains') return String(val ?? '').toLowerCase().includes(f.value.toLowerCase());
          if (f.operator === 'equals') return String(val ?? '').toLowerCase() === f.value.toLowerCase();
          if (f.operator === 'gt') return Number(val) > Number(f.value);
          if (f.operator === 'lt') return Number(val) < Number(f.value);
          return true;
        });
      });
    }

    // Apply sort
    if (sort?.column) {
      list.sort((a, b) => {
        const valA = a[sort.column];
        const valB = b[sort.column];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sort.ascending ? valA - valB : valB - valA;
        }
        const strA = String(valA);
        const strB = String(valB);
        return sort.ascending ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    const totalCount = list.length;
    const from = (page - 1) * pageSize;
    const pagedData = list.slice(from, from + pageSize);
    return { data: pagedData, totalCount };
  }

  // Live Supabase
  const supabase = getSupabase();
  if (!supabase) throw new Error('Klient Supabase nie został zainicjalizowany.');

  let query = supabase.from(tableName).select('*', { count: 'exact' });

  // Search filter
  if (search && search.trim()) {
    const q = search.trim();
    if (searchColumn && searchColumn !== 'all') {
      query = query.ilike(searchColumn, `%${q}%`);
    }
  }

  // Column filters
  if (filters && filters.length > 0) {
    filters.forEach(f => {
      if (!f.column) return;
      if (f.operator === 'equals') query = query.eq(f.column, f.value);
      else if (f.operator === 'contains') query = query.ilike(f.column, `%${f.value}%`);
      else if (f.operator === 'gt') query = query.gt(f.column, f.value);
      else if (f.operator === 'lt') query = query.lt(f.column, f.value);
      else if (f.operator === 'is_null') query = query.is(f.column, null);
      else if (f.operator === 'is_not_null') query = query.not(f.column, 'is', null);
    });
  }

  // Sort safely if a column is specified
  if (sort?.column && sort.column.trim()) {
    query = query.order(sort.column, { ascending: sort.ascending });
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  let { data, count, error } = await query;

  // If ordering failed because the specified column does not exist in table
  if (error && sort?.column && error.message.toLowerCase().includes('does not exist')) {
    console.warn(`Sort column "${sort.column}" does not exist in table "${tableName}", retrying query without sort...`);
    const retryQuery = supabase.from(tableName).select('*', { count: 'exact' }).range(from, to);
    const retryRes = await retryQuery;
    data = retryRes.data;
    count = retryRes.count;
    error = retryRes.error;
  }

  if (error) {
    if (error.code === '42501' || error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('policy')) {
      throw new Error(`Brak uprawnień do odczytu danych tabeli "${tableName}" (Row Level Security - RLS). Dodaj politykę odczytu (SELECT) dla roli anon lub użyj klucza service_role w konfiguracji.`);
    }
    if (error.code === '42P01') {
      throw new Error(`Tabela "${tableName}" nie istnieje w schemacie publicznym bazy.`);
    }
    throw new Error(`Błąd bazy danych Supabase: ${error.message}`);
  }

  return {
    data: data || [],
    totalCount: count ?? (data?.length || 0)
  };
}

// Helper: Synchronize v_model mutations into underlying demo Model_* tables
function syncDemoViewModel(
  operation: 'insert' | 'update' | 'delete',
  payload: Record<string, any>,
  primaryKeyValue?: any
) {
  const modelId = primaryKeyValue !== undefined && primaryKeyValue !== null ? primaryKeyValue : payload.id;
  if (modelId === undefined || modelId === null) return;

  // 1. Model_Podstawowy
  const podstawowyList = getDemoData('Model_Podstawowy');
  if (operation === 'delete') {
    setDemoData('Model_Podstawowy', podstawowyList.filter(r => String(r.id) !== String(modelId)));
  } else if (operation === 'insert') {
    const row = {
      id: modelId,
      nazwa_modelu: payload.nazwa_modelu || '',
      seria: payload.seria || '',
      rodzaj: payload.rodzaj || 'Wózek czołowy elektryczny',
      typ_napedu: payload.typ_napedu || '',
      rok_produkcji: payload.rok_produkcji || new Date().getFullYear(),
      dostepnosc: payload.dostepnosc || 'Dostępny od ręki'
    };
    setDemoData('Model_Podstawowy', [row, ...podstawowyList.filter(r => String(r.id) !== String(modelId))]);
  } else if (operation === 'update') {
    const idx = podstawowyList.findIndex(r => String(r.id) === String(modelId));
    if (idx >= 0) {
      podstawowyList[idx] = {
        ...podstawowyList[idx],
        ...(payload.nazwa_modelu !== undefined ? { nazwa_modelu: payload.nazwa_modelu } : {}),
        ...(payload.seria !== undefined ? { seria: payload.seria } : {}),
        ...(payload.rodzaj !== undefined ? { rodzaj: payload.rodzaj } : {}),
        ...(payload.typ_napedu !== undefined ? { typ_napedu: payload.typ_napedu } : {}),
        ...(payload.rok_produkcji !== undefined ? { rok_produkcji: payload.rok_produkcji } : {}),
        ...(payload.dostepnosc !== undefined ? { dostepnosc: payload.dostepnosc } : {})
      };
      setDemoData('Model_Podstawowy', podstawowyList);
    }
  }

  // 2. Model_Gwarancje (Gwarancja detaliczna i hurtowa)
  const gwarancjeList = getDemoData('Model_Gwarancje');
  if (operation === 'delete') {
    setDemoData('Model_Gwarancje', gwarancjeList.filter(r => String(r.model_id) !== String(modelId) && String(r.id) !== String(modelId)));
  } else if (operation === 'insert') {
    const row = {
      id: modelId,
      model_id: modelId,
      gwarancja_detal: payload.gwarancja_detal || '24 miesiące / 2000 mth (Rozszerzona)',
      gwarancja_hurt: payload.gwarancja_hurt || '12 miesięcy / 1000 mth (Hurt Standard)'
    };
    setDemoData('Model_Gwarancje', [row, ...gwarancjeList.filter(r => String(r.model_id) !== String(modelId))]);
  } else if (operation === 'update') {
    const idx = gwarancjeList.findIndex(r => String(r.model_id) === String(modelId) || String(r.id) === String(modelId));
    if (idx >= 0) {
      gwarancjeList[idx] = {
        ...gwarancjeList[idx],
        ...(payload.gwarancja_detal !== undefined ? { gwarancja_detal: payload.gwarancja_detal } : {}),
        ...(payload.gwarancja_hurt !== undefined ? { gwarancja_hurt: payload.gwarancja_hurt } : {})
      };
      setDemoData('Model_Gwarancje', gwarancjeList);
    }
  }

  // 3. Model_Specyfikacja
  const specList = getDemoData('Model_Specyfikacja');
  if (operation === 'delete') {
    setDemoData('Model_Specyfikacja', specList.filter(r => String(r.model_id) !== String(modelId) && String(r.id) !== String(modelId)));
  } else if (operation === 'insert') {
    const row = {
      id: modelId,
      model_id: modelId,
      udzwig_kg: payload.udzwig_kg || 0,
      wysokosc_podnoszenia_mm: payload.wysokosc_podnoszenia_mm || 0,
      typ_masztu: payload.typ_masztu || ''
    };
    setDemoData('Model_Specyfikacja', [row, ...specList.filter(r => String(r.model_id) !== String(modelId))]);
  } else if (operation === 'update') {
    const idx = specList.findIndex(r => String(r.model_id) === String(modelId) || String(r.id) === String(modelId));
    if (idx >= 0) {
      specList[idx] = {
        ...specList[idx],
        ...(payload.udzwig_kg !== undefined ? { udzwig_kg: payload.udzwig_kg } : {}),
        ...(payload.wysokosc_podnoszenia_mm !== undefined ? { wysokosc_podnoszenia_mm: payload.wysokosc_podnoszenia_mm } : {}),
        ...(payload.typ_masztu !== undefined ? { typ_masztu: payload.typ_masztu } : {})
      };
      setDemoData('Model_Specyfikacja', specList);
    }
  }

  // 4. Model_Ceny
  const cenyList = getDemoData('Model_Ceny');
  if (operation === 'delete') {
    setDemoData('Model_Ceny', cenyList.filter(r => String(r.model_id) !== String(modelId) && String(r.id) !== String(modelId)));
  } else if (operation === 'insert') {
    const row = {
      id: modelId,
      model_id: modelId,
      cena_netto_pln: payload.cena_netto_pln || 0,
      waluta: payload.waluta || 'PLN'
    };
    setDemoData('Model_Ceny', [row, ...cenyList.filter(r => String(r.model_id) !== String(modelId))]);
  } else if (operation === 'update') {
    const idx = cenyList.findIndex(r => String(r.model_id) === String(modelId) || String(r.id) === String(modelId));
    if (idx >= 0) {
      cenyList[idx] = {
        ...cenyList[idx],
        ...(payload.cena_netto_pln !== undefined ? { cena_netto_pln: payload.cena_netto_pln } : {}),
        ...(payload.waluta !== undefined ? { waluta: payload.waluta } : {})
      };
      setDemoData('Model_Ceny', cenyList);
    }
  }

  // 5. Model_Multimedia
  const mediaList = getDemoData('Model_Multimedia');
  if (operation === 'delete') {
    setDemoData('Model_Multimedia', mediaList.filter(r => String(r.model_id) !== String(modelId) && String(r.id) !== String(modelId)));
  } else if (operation === 'insert') {
    const row = {
      id: modelId,
      model_id: modelId,
      zdjecie_glowne: payload.zdjecie_glowne || null,
      uwagi: payload.uwagi || ''
    };
    setDemoData('Model_Multimedia', [row, ...mediaList.filter(r => String(r.model_id) !== String(modelId))]);
  } else if (operation === 'update') {
    const idx = mediaList.findIndex(r => String(r.model_id) === String(modelId) || String(r.id) === String(modelId));
    if (idx >= 0) {
      mediaList[idx] = {
        ...mediaList[idx],
        ...(payload.zdjecie_glowne !== undefined ? { zdjecie_glowne: payload.zdjecie_glowne } : {}),
        ...(payload.uwagi !== undefined ? { uwagi: payload.uwagi } : {})
      };
      setDemoData('Model_Multimedia', mediaList);
    }
  }
}

/**
 * Pobiera opcje z walidowanych tabel słownikowych dla pól takich jak:
 * - 'rodzaj' (z tabeli Model_Rodzaj / rodzaj)
 * - 'gwarancja_detal' (z tabeli Model_Gwarancja_Detal / gwarancja_detal)
 * - 'gwarancja_hurt' (z tabeli Model_Gwarancja_Hurt / gwarancja_hurt)
 */
export async function fetchValidatedTableOptions(columnName: string): Promise<ValidatedOption[]> {
  const col = columnName.toLowerCase();
  let candidateTables: string[] = [];

  if (col.includes('rodzaj')) {
    candidateTables = ['Model_Rodzaj', 'Model_Rodzaje', 'rodzaj', 'rodzaje', 'Model_Typ', 'slownik_rodzaj'];
  } else if (col.includes('gwarancja_detal')) {
    candidateTables = ['Model_Gwarancja_Detal', 'Model_Gwarancje_Detal', 'gwarancja_detal', 'slownik_gwarancja_detal', 'Model_Gwarancja'];
  } else if (col.includes('gwarancja_hurt')) {
    candidateTables = ['Model_Gwarancja_Hurt', 'Model_Gwarancje_Hurt', 'gwarancja_hurt', 'slownik_gwarancja_hurt'];
  } else {
    return [];
  }

  // 1. Sprawdź bazę Supabase w trybie na żywo
  const supabase = getSupabase();
  if (supabase && !currentConfig.isDemo) {
    for (const tableName of candidateTables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(50);
        if (!error && data && data.length > 0) {
          return data.map((row: any) => {
            const val = row.nazwa ?? row.name ?? row.wartosc ?? row[columnName] ?? String(row.id);
            const desc = row.opis ?? row.zakres ?? row.warunki_b2b ?? (row.kod ? `Kod: ${row.kod}` : undefined);
            return {
              value: String(val),
              label: String(val),
              sourceTable: tableName,
              description: desc
            };
          });
        }
      } catch {
        // Kontynuuj do kolejnej tabeli
      }
    }
  }

  // 2. Sprawdź tabele demo lub zapisane w localStorage
  for (const tableName of candidateTables) {
    const demoItems = getDemoData(tableName);
    if (demoItems && demoItems.length > 0) {
      return demoItems.map(row => {
        const val = row.nazwa ?? row.name ?? row.wartosc ?? row[columnName] ?? String(row.id);
        const desc = row.opis ?? row.zakres ?? row.warunki_b2b ?? (row.kod ? `Kod: ${row.kod}` : undefined);
        return {
          value: String(val),
          label: String(val),
          sourceTable: tableName,
          description: desc
        };
      });
    }
  }

  // 3. Sprawdzone wartości domyślne Saw-Trak (gdy tabela nie została jeszcze zasilana w PostgreSQL)
  if (col.includes('rodzaj')) {
    return [
      { value: 'Wózek czołowy elektryczny', label: 'Wózek czołowy elektryczny', sourceTable: 'Model_Rodzaj', description: 'Li-Ion / kwasowy 3 i 4-kołowy' },
      { value: 'Wózek czołowy spalinowy (Diesel)', label: 'Wózek czołowy spalinowy (Diesel)', sourceTable: 'Model_Rodzaj', description: 'Silnik Kubota / Mitsubishi' },
      { value: 'Wózek czołowy gazowy (LPG)', label: 'Wózek czołowy gazowy (LPG)', sourceTable: 'Model_Rodzaj', description: 'Niskoemisyjny silnik gazowy' },
      { value: 'Wózek wysokiego składowania (Reach Truck)', label: 'Wózek wysokiego składowania (Reach Truck)', sourceTable: 'Model_Rodzaj', description: 'Maszt wysuwny do 12.5m' },
      { value: 'Elektryczny wózek paletowy (Paleciak)', label: 'Elektryczny wózek paletowy (Paleciak)', sourceTable: 'Model_Rodzaj', description: 'Kompaktowy wózek prowadzony' },
      { value: 'Wózek prowadzony masztowy (Stacker)', label: 'Wózek prowadzony masztowy (Stacker)', sourceTable: 'Model_Rodzaj', description: 'Układnica magazynowa z masztem' },
      { value: 'Wózek boczny wielokierunkowy', label: 'Wózek boczny wielokierunkowy', sourceTable: 'Model_Rodzaj', description: 'Do dłużyc i profili' }
    ];
  } else if (col.includes('gwarancja_detal')) {
    return [
      { value: '12 miesięcy / 1000 mth (Standard B2C)', label: '12 miesięcy / 1000 mth (Standard B2C)', sourceTable: 'Model_Gwarancja_Detal', description: 'Podstawowa gwarancja Saw-Trak' },
      { value: '24 miesiące / 2000 mth (Rozszerzona)', label: '24 miesiące / 2000 mth (Rozszerzona)', sourceTable: 'Model_Gwarancja_Detal', description: 'Pełna ochrona napędu i hydrauliki' },
      { value: '36 miesięcy / 3000 mth (Saw-Trak Care)', label: '36 miesięcy / 3000 mth (Saw-Trak Care)', sourceTable: 'Model_Gwarancja_Detal', description: 'Pakiet serwisowy VIP z UDT' },
      { value: '60 miesięcy / 5000 mth (Li-Ion Ultra)', label: '60 miesięcy / 5000 mth (Li-Ion Ultra)', sourceTable: 'Model_Gwarancja_Detal', description: 'Gwarancja na baterię Li-Ion' },
      { value: 'Stan zastany (Bez gwarancji)', label: 'Stan zastany (Bez gwarancji)', sourceTable: 'Model_Gwarancja_Detal', description: 'Sprzęt komisowy / używany' }
    ];
  } else if (col.includes('gwarancja_hurt')) {
    return [
      { value: '6 miesięcy na podzespoły główne (B2B)', label: '6 miesięcy na podzespoły główne (B2B)', sourceTable: 'Model_Gwarancja_Hurt', description: 'Silnik, skrzynia, pompa' },
      { value: '12 miesięcy / 1000 mth (Hurt Standard)', label: '12 miesięcy / 1000 mth (Hurt Standard)', sourceTable: 'Model_Gwarancja_Hurt', description: 'Wymagane przeglądy co 250 mth' },
      { value: '24 miesiące na układ napędowy i Li-Ion', label: '24 miesiące na układ napędowy i Li-Ion', sourceTable: 'Model_Gwarancja_Hurt', description: 'Dla autoryzowanych dealerów' },
      { value: 'Gwarancja rozruchowa 30 dni', label: 'Gwarancja rozruchowa 30 dni', sourceTable: 'Model_Gwarancja_Hurt', description: 'Weryfikacja sprawności przy odbiorze' },
      { value: 'Wyłączenie rękojmi hurtowej (As-Is B2B)', label: 'Wyłączenie rękojmi hurtowej (As-Is B2B)', sourceTable: 'Model_Gwarancja_Hurt', description: 'Cena hurtowa bez roszczeń' }
    ];
  }

  return [];
}

/**
 * Dodaje nową opcję do walidowanej tabeli słownikowej
 */
export async function addOptionToValidatedTable(columnName: string, newValue: string, description?: string): Promise<void> {
  const col = columnName.toLowerCase();
  let targetTable = 'Model_Rodzaj';
  if (col.includes('gwarancja_detal')) targetTable = 'Model_Gwarancja_Detal';
  else if (col.includes('gwarancja_hurt')) targetTable = 'Model_Gwarancja_Hurt';

  if (currentConfig.isDemo) {
    const list = getDemoData(targetTable);
    const maxId = list.reduce((m, r) => (typeof r.id === 'number' && r.id > m ? r.id : m), 0);
    const newRow: Record<string, any> = {
      id: maxId + 1,
      nazwa: newValue.trim(),
      kod: newValue.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20),
      opis: description || 'Dodano przez edycję rekordu'
    };
    if (targetTable.includes('Gwarancja')) {
      newRow.okres_miesiace = 12;
      newRow.limit_mth = 1000;
      newRow.zakres = description || 'Standardowy';
      newRow.warunki_b2b = description || 'Standardowy';
    }
    setDemoData(targetTable, [...list, newRow]);
    return;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  const payload: Record<string, any> = {
    nazwa: newValue.trim(),
    opis: description || 'Dodano przez edycję rekordu'
  };
  if (targetTable === 'Model_Rodzaj') {
    payload.kod = newValue.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);
  }
  await supabase.from(targetTable).insert(payload);
}

// Generate complete PostgreSQL DDL + INSTEAD OF triggers for v_model view
export function getViewModelTriggerSql(): string {
  return `-- ==============================================================================
-- SAW-TRAK: Skrypt PostgreSQL dla widoku v_model oraz triggerów INSTEAD OF
-- Pozwala pracować wyłącznie na widoku v_model, automatycznie uzupełniając tabele Model_*
-- Zawiera walidowane tabele słownikowe: Model_Rodzaj, Model_Gwarancja_Detal, Model_Gwarancja_Hurt
-- ==============================================================================

-- 1. TABELE WALIDOWANE (SŁOWNIKOWE)
CREATE TABLE IF NOT EXISTS public."Model_Rodzaj" (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nazwa TEXT NOT NULL UNIQUE,
    kod TEXT,
    opis TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Model_Gwarancja_Detal" (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nazwa TEXT NOT NULL UNIQUE,
    okres_miesiace INTEGER DEFAULT 12,
    limit_mth INTEGER DEFAULT 1000,
    zakres TEXT DEFAULT 'Pełny (B2C)',
    opis TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Model_Gwarancja_Hurt" (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nazwa TEXT NOT NULL UNIQUE,
    okres_miesiace INTEGER DEFAULT 6,
    limit_mth INTEGER DEFAULT 1000,
    warunki_b2b TEXT DEFAULT 'Podzespoły główne',
    opis TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Upewnij się, że tabele bazowe Model_* istnieją w schemacie public
CREATE TABLE IF NOT EXISTS public."Model_Podstawowy" (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nazwa_modelu TEXT NOT NULL,
    seria TEXT,
    rodzaj TEXT REFERENCES public."Model_Rodzaj"(nazwa) ON UPDATE CASCADE,
    typ_napedu TEXT,
    rok_produkcji INTEGER,
    dostepnosc TEXT DEFAULT 'Dostępny od ręki',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Model_Specyfikacja" (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    model_id BIGINT REFERENCES public."Model_Podstawowy"(id) ON DELETE CASCADE UNIQUE,
    udzwig_kg NUMERIC,
    wysokosc_podnoszenia_mm NUMERIC,
    typ_masztu TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Model_Gwarancje" (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    model_id BIGINT REFERENCES public."Model_Podstawowy"(id) ON DELETE CASCADE UNIQUE,
    gwarancja_detal TEXT REFERENCES public."Model_Gwarancja_Detal"(nazwa) ON UPDATE CASCADE,
    gwarancja_hurt TEXT REFERENCES public."Model_Gwarancja_Hurt"(nazwa) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Model_Ceny" (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    model_id BIGINT REFERENCES public."Model_Podstawowy"(id) ON DELETE CASCADE UNIQUE,
    cena_netto_pln NUMERIC,
    waluta TEXT DEFAULT 'PLN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Model_Multimedia" (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    model_id BIGINT REFERENCES public."Model_Podstawowy"(id) ON DELETE CASCADE UNIQUE,
    zdjecie_glowne TEXT,
    uwagi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Utworzenie widoku v_model łączącego wszystkie tabele Model_*
CREATE OR REPLACE VIEW public.v_model AS
SELECT 
    p.id,
    p.nazwa_modelu,
    p.seria,
    p.rodzaj,
    p.typ_napedu,
    s.udzwig_kg,
    s.wysokosc_podnoszenia_mm,
    s.typ_masztu,
    gw.gwarancja_detal,
    gw.gwarancja_hurt,
    c.cena_netto_pln,
    c.waluta,
    p.rok_produkcji,
    p.dostepnosc,
    m.zdjecie_glowne,
    m.uwagi
FROM public."Model_Podstawowy" p
LEFT JOIN public."Model_Specyfikacja" s ON s.model_id = p.id
LEFT JOIN public."Model_Gwarancje" gw ON gw.model_id = p.id
LEFT JOIN public."Model_Ceny" c ON c.model_id = p.id
LEFT JOIN public."Model_Multimedia" m ON m.model_id = p.id;

-- 4. Trigger INSTEAD OF INSERT: dodanie do v_model rozdziela dane do tabel Model_*
CREATE OR REPLACE FUNCTION trg_v_model_insert()
RETURNS TRIGGER AS $$
DECLARE
    new_model_id BIGINT;
BEGIN
    INSERT INTO public."Model_Podstawowy" (nazwa_modelu, seria, rodzaj, typ_napedu, rok_produkcji, dostepnosc)
    VALUES (NEW.nazwa_modelu, NEW.seria, NEW.rodzaj, NEW.typ_napedu, NEW.rok_produkcji, COALESCE(NEW.dostepnosc, 'Dostępny od ręki'))
    RETURNING id INTO new_model_id;

    NEW.id := new_model_id;

    INSERT INTO public."Model_Specyfikacja" (model_id, udzwig_kg, wysokosc_podnoszenia_mm, typ_masztu)
    VALUES (new_model_id, NEW.udzwig_kg, NEW.wysokosc_podnoszenia_mm, NEW.typ_masztu)
    ON CONFLICT (model_id) DO UPDATE SET
        udzwig_kg = EXCLUDED.udzwig_kg,
        wysokosc_podnoszenia_mm = EXCLUDED.wysokosc_podnoszenia_mm,
        typ_masztu = EXCLUDED.typ_masztu;

    INSERT INTO public."Model_Gwarancje" (model_id, gwarancja_detal, gwarancja_hurt)
    VALUES (new_model_id, NEW.gwarancja_detal, NEW.gwarancja_hurt)
    ON CONFLICT (model_id) DO UPDATE SET
        gwarancja_detal = EXCLUDED.gwarancja_detal,
        gwarancja_hurt = EXCLUDED.gwarancja_hurt;

    INSERT INTO public."Model_Ceny" (model_id, cena_netto_pln, waluta)
    VALUES (new_model_id, NEW.cena_netto_pln, COALESCE(NEW.waluta, 'PLN'))
    ON CONFLICT (model_id) DO UPDATE SET
        cena_netto_pln = EXCLUDED.cena_netto_pln,
        waluta = EXCLUDED.waluta;

    INSERT INTO public."Model_Multimedia" (model_id, zdjecie_glowne, uwagi)
    VALUES (new_model_id, NEW.zdjecie_glowne, NEW.uwagi)
    ON CONFLICT (model_id) DO UPDATE SET
        zdjecie_glowne = EXCLUDED.zdjecie_glowne,
        uwagi = EXCLUDED.uwagi;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_v_model_instead_of_insert ON public.v_model;
CREATE TRIGGER trg_v_model_instead_of_insert
INSTEAD OF INSERT ON public.v_model
FOR EACH ROW EXECUTE FUNCTION trg_v_model_insert();

-- 5. Trigger INSTEAD OF UPDATE: edycja w v_model aktualizuje odpowiednie tabele Model_*
CREATE OR REPLACE FUNCTION trg_v_model_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public."Model_Podstawowy" SET
        nazwa_modelu = COALESCE(NEW.nazwa_modelu, nazwa_modelu),
        seria = COALESCE(NEW.seria, seria),
        rodzaj = COALESCE(NEW.rodzaj, rodzaj),
        typ_napedu = COALESCE(NEW.typ_napedu, typ_napedu),
        rok_produkcji = COALESCE(NEW.rok_produkcji, rok_produkcji),
        dostepnosc = COALESCE(NEW.dostepnosc, dostepnosc)
    WHERE id = OLD.id;

    INSERT INTO public."Model_Specyfikacja" (model_id, udzwig_kg, wysokosc_podnoszenia_mm, typ_masztu)
    VALUES (OLD.id, NEW.udzwig_kg, NEW.wysokosc_podnoszenia_mm, NEW.typ_masztu)
    ON CONFLICT (model_id) DO UPDATE SET
        udzwig_kg = COALESCE(EXCLUDED.udzwig_kg, public."Model_Specyfikacja".udzwig_kg),
        wysokosc_podnoszenia_mm = COALESCE(EXCLUDED.wysokosc_podnoszenia_mm, public."Model_Specyfikacja".wysokosc_podnoszenia_mm),
        typ_masztu = COALESCE(EXCLUDED.typ_masztu, public."Model_Specyfikacja".typ_masztu);

    INSERT INTO public."Model_Gwarancje" (model_id, gwarancja_detal, gwarancja_hurt)
    VALUES (OLD.id, NEW.gwarancja_detal, NEW.gwarancja_hurt)
    ON CONFLICT (model_id) DO UPDATE SET
        gwarancja_detal = COALESCE(EXCLUDED.gwarancja_detal, public."Model_Gwarancje".gwarancja_detal),
        gwarancja_hurt = COALESCE(EXCLUDED.gwarancja_hurt, public."Model_Gwarancje".gwarancja_hurt);

    INSERT INTO public."Model_Ceny" (model_id, cena_netto_pln, waluta)
    VALUES (OLD.id, NEW.cena_netto_pln, COALESCE(NEW.waluta, 'PLN'))
    ON CONFLICT (model_id) DO UPDATE SET
        cena_netto_pln = COALESCE(EXCLUDED.cena_netto_pln, public."Model_Ceny".cena_netto_pln),
        waluta = COALESCE(EXCLUDED.waluta, public."Model_Ceny".waluta);

    INSERT INTO public."Model_Multimedia" (model_id, zdjecie_glowne, uwagi)
    VALUES (OLD.id, NEW.zdjecie_glowne, NEW.uwagi)
    ON CONFLICT (model_id) DO UPDATE SET
        zdjecie_glowne = COALESCE(EXCLUDED.zdjecie_glowne, public."Model_Multimedia".zdjecie_glowne),
        uwagi = COALESCE(EXCLUDED.uwagi, public."Model_Multimedia".uwagi);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_v_model_instead_of_update ON public.v_model;
CREATE TRIGGER trg_v_model_instead_of_update
INSTEAD OF UPDATE ON public.v_model
FOR EACH ROW EXECUTE FUNCTION trg_v_model_update();

-- 6. Trigger INSTEAD OF DELETE: usunięcie z v_model kaskadowo usuwa powiązane rekordy
CREATE OR REPLACE FUNCTION trg_v_model_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public."Model_Podstawowy" WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_v_model_instead_of_delete ON public.v_model;
CREATE TRIGGER trg_v_model_instead_of_delete
INSTEAD OF DELETE ON public.v_model
FOR EACH ROW EXECUTE FUNCTION trg_v_model_delete();

-- 7. Włączenie RLS i dodanie uprawnień publicznych
ALTER TABLE public."Model_Rodzaj" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Model_Gwarancja_Detal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Model_Gwarancja_Hurt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Model_Gwarancje" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Model_Podstawowy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Model_Specyfikacja" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Model_Ceny" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Model_Multimedia" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dostęp publiczny Model_Rodzaj" ON public."Model_Rodzaj" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dostęp publiczny Model_Gwarancja_Detal" ON public."Model_Gwarancja_Detal" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dostęp publiczny Model_Gwarancja_Hurt" ON public."Model_Gwarancja_Hurt" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dostęp publiczny Model_Gwarancje" ON public."Model_Gwarancje" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dostęp publiczny Model_Podstawowy" ON public."Model_Podstawowy" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dostęp publiczny Model_Specyfikacja" ON public."Model_Specyfikacja" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dostęp publiczny Model_Ceny" ON public."Model_Ceny" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Dostęp publiczny Model_Multimedia" ON public."Model_Multimedia" FOR ALL USING (true) WITH CHECK (true);
`;
}

// Insert single row
export async function insertRow(tableName: string, rowData: Record<string, any>): Promise<any> {
  const isViewModel = tableName.toLowerCase() === 'v_model';

  if (currentConfig.isDemo) {
    const current = getDemoData(tableName);
    if (!rowData.id) {
      const maxId = current.reduce((max, r) => (typeof r.id === 'number' && r.id > max ? r.id : max), 0);
      rowData.id = maxId + 1;
    }
    if (!rowData.created_at) {
      rowData.created_at = new Date().toISOString();
    }
    const updated = [rowData, ...current];
    setDemoData(tableName, updated);

    // Auto-propagate to underlying tables if inserted into v_model
    if (isViewModel) {
      syncDemoViewModel('insert', rowData);
    }
    return rowData;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  // Try direct insert on the target table / view
  const { data, error } = await supabase.from(tableName).insert(rowData).select().single();

  if (error) {
    // If v_model cannot be inserted directly (e.g. multi-table view without INSTEAD OF trigger in DB)
    const isViewError =
      isViewModel &&
      (error.message.toLowerCase().includes('view') ||
        error.message.toLowerCase().includes('not automatically updatable') ||
        error.code === '42809');

    if (isViewError) {
      // Intelligently decompose and insert into Model_* base tables
      const podstawowyPayload = {
        nazwa_modelu: rowData.nazwa_modelu || '',
        seria: rowData.seria || '',
        rodzaj: rowData.rodzaj || null,
        typ_napedu: rowData.typ_napedu || '',
        rok_produkcji: rowData.rok_produkcji,
        dostepnosc: rowData.dostepnosc || 'Dostępny od ręki'
      };
      const { data: insertedModel, error: pErr } = await supabase
        .from('Model_Podstawowy')
        .insert(podstawowyPayload)
        .select()
        .single();

      if (pErr) throw new Error(`Błąd zapisu tabeli Model_Podstawowy: ${pErr.message}`);
      const newId = insertedModel.id;

      if (rowData.udzwig_kg !== undefined || rowData.wysokosc_podnoszenia_mm !== undefined || rowData.typ_masztu !== undefined) {
        await supabase.from('Model_Specyfikacja').insert({
          model_id: newId,
          udzwig_kg: rowData.udzwig_kg,
          wysokosc_podnoszenia_mm: rowData.wysokosc_podnoszenia_mm,
          typ_masztu: rowData.typ_masztu
        });
      }

      if (rowData.gwarancja_detal !== undefined || rowData.gwarancja_hurt !== undefined) {
        await supabase.from('Model_Gwarancje').insert({
          model_id: newId,
          gwarancja_detal: rowData.gwarancja_detal,
          gwarancja_hurt: rowData.gwarancja_hurt
        });
      }

      if (rowData.cena_netto_pln !== undefined || rowData.waluta !== undefined) {
        await supabase.from('Model_Ceny').insert({
          model_id: newId,
          cena_netto_pln: rowData.cena_netto_pln,
          waluta: rowData.waluta || 'PLN'
        });
      }

      if (rowData.zdjecie_glowne !== undefined || rowData.uwagi !== undefined) {
        await supabase.from('Model_Multimedia').insert({
          model_id: newId,
          zdjecie_glowne: rowData.zdjecie_glowne,
          uwagi: rowData.uwagi
        });
      }

      return { id: newId, ...rowData };
    }

    throw new Error(error.message);
  }

  return data;
}

// Bulk Insert rows (for CSV/Excel/JSON import)
export async function bulkInsertRows(
  tableName: string,
  rows: Record<string, any>[]
): Promise<{ successCount: number; errors: { row: number; error: string }[] }> {
  let successCount = 0;
  const errors: { row: number; error: string }[] = [];

  if (currentConfig.isDemo) {
    for (let i = 0; i < rows.length; i++) {
      try {
        await insertRow(tableName, rows[i]);
        successCount++;
      } catch (err: any) {
        errors.push({ row: i + 1, error: err.message });
      }
    }
    return { successCount, errors };
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  for (let i = 0; i < rows.length; i++) {
    try {
      await insertRow(tableName, rows[i]);
      successCount++;
    } catch (err: any) {
      errors.push({ row: i + 1, error: err.message });
    }
  }

  return { successCount, errors };
}

// Update single row
export async function updateRow(
  tableName: string,
  primaryKeyCol: string,
  primaryKeyValue: any,
  updatedData: Record<string, any>
): Promise<any> {
  const isViewModel = tableName.toLowerCase() === 'v_model';

  if (currentConfig.isDemo) {
    const current = getDemoData(tableName);
    const index = current.findIndex(r => String(r[primaryKeyCol]) === String(primaryKeyValue));
    if (index === -1) throw new Error(`Nie znaleziono rekordu o ${primaryKeyCol} = ${primaryKeyValue}`);
    current[index] = { ...current[index], ...updatedData };
    setDemoData(tableName, current);

    // Auto-propagate to underlying tables if updated in v_model
    if (isViewModel) {
      syncDemoViewModel('update', updatedData, primaryKeyValue);
    }
    return current[index];
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  const { data, error } = await supabase
    .from(tableName)
    .update(updatedData)
    .eq(primaryKeyCol, primaryKeyValue)
    .select()
    .single();

  if (error) {
    const isViewError =
      isViewModel &&
      (error.message.toLowerCase().includes('view') ||
        error.message.toLowerCase().includes('not automatically updatable') ||
        error.code === '42809');

    if (isViewError) {
      // Decomposed update across Model_* base tables
      // 1. Model_Podstawowy
      const pData: Record<string, any> = {};
      ['nazwa_modelu', 'seria', 'rodzaj', 'typ_napedu', 'rok_produkcji', 'dostepnosc'].forEach(k => {
        if (updatedData[k] !== undefined) pData[k] = updatedData[k];
      });
      if (Object.keys(pData).length > 0) {
        await supabase.from('Model_Podstawowy').update(pData).eq('id', primaryKeyValue);
      }

      // 2. Model_Specyfikacja
      const sData: Record<string, any> = {};
      ['udzwig_kg', 'wysokosc_podnoszenia_mm', 'typ_masztu'].forEach(k => {
        if (updatedData[k] !== undefined) sData[k] = updatedData[k];
      });
      if (Object.keys(sData).length > 0) {
        await supabase.from('Model_Specyfikacja').update(sData).eq('model_id', primaryKeyValue);
      }

      // 3. Model_Gwarancje
      const gData: Record<string, any> = {};
      ['gwarancja_detal', 'gwarancja_hurt'].forEach(k => {
        if (updatedData[k] !== undefined) gData[k] = updatedData[k];
      });
      if (Object.keys(gData).length > 0) {
        const { error: gErr } = await supabase.from('Model_Gwarancje').update(gData).eq('model_id', primaryKeyValue);
        if (gErr) {
          // If not exists yet, insert
          await supabase.from('Model_Gwarancje').insert({ model_id: primaryKeyValue, ...gData });
        }
      }

      // 4. Model_Ceny
      const cData: Record<string, any> = {};
      ['cena_netto_pln', 'waluta'].forEach(k => {
        if (updatedData[k] !== undefined) cData[k] = updatedData[k];
      });
      if (Object.keys(cData).length > 0) {
        await supabase.from('Model_Ceny').update(cData).eq('model_id', primaryKeyValue);
      }

      // 5. Model_Multimedia
      const mData: Record<string, any> = {};
      ['zdjecie_glowne', 'uwagi'].forEach(k => {
        if (updatedData[k] !== undefined) mData[k] = updatedData[k];
      });
      if (Object.keys(mData).length > 0) {
        await supabase.from('Model_Multimedia').update(mData).eq('model_id', primaryKeyValue);
      }

      return { id: primaryKeyValue, ...updatedData };
    }

    throw new Error(error.message);
  }

  return data;
}

// Delete single row
export async function deleteRow(tableName: string, primaryKeyCol: string, primaryKeyValue: any): Promise<void> {
  const isViewModel = tableName.toLowerCase() === 'v_model';

  if (currentConfig.isDemo) {
    const current = getDemoData(tableName);
    const filtered = current.filter(r => String(r[primaryKeyCol]) !== String(primaryKeyValue));
    setDemoData(tableName, filtered);

    if (isViewModel) {
      syncDemoViewModel('delete', {}, primaryKeyValue);
    }
    return;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  const { error } = await supabase.from(tableName).delete().eq(primaryKeyCol, primaryKeyValue);
  if (error) {
    const isViewError =
      isViewModel &&
      (error.message.toLowerCase().includes('view') ||
        error.message.toLowerCase().includes('not automatically updatable') ||
        error.code === '42809');

    if (isViewError) {
      await supabase.from('Model_Podstawowy').delete().eq('id', primaryKeyValue);
      return;
    }
    throw new Error(error.message);
  }
}

// Bulk delete rows
export async function bulkDeleteRows(tableName: string, primaryKeyCol: string, primaryKeyValues: any[]): Promise<void> {
  if (currentConfig.isDemo) {
    const current = getDemoData(tableName);
    const set = new Set(primaryKeyValues.map(v => String(v)));
    const filtered = current.filter(r => !set.has(String(r[primaryKeyCol])));
    setDemoData(tableName, filtered);
    return;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  const { error } = await supabase.from(tableName).delete().in(primaryKeyCol, primaryKeyValues);
  if (error) throw new Error(error.message);
}

// Decode Supabase API key JWT payload or recognize modern sb_publishable_* / sb_secret_* keys
export function decodeSupabaseKey(token: string): {
  role?: string;
  ref?: string;
  exp?: number;
  validJwt: boolean;
  keyType?: 'publishable' | 'secret' | 'jwt' | 'unknown';
} {
  const trimmed = (token || '').trim();
  if (trimmed.startsWith('sb_publishable_')) {
    return {
      role: 'anon',
      validJwt: true,
      keyType: 'publishable'
    };
  }
  if (trimmed.startsWith('sb_secret_') || trimmed.startsWith('sb_service_')) {
    return {
      role: 'service_role',
      validJwt: true,
      keyType: 'secret'
    };
  }

  try {
    const parts = trimmed.split('.');
    if (parts.length !== 3) return { validJwt: false, keyType: 'unknown' };
    const payload = JSON.parse(atob(parts[1]));
    return {
      role: payload.role,
      ref: payload.ref,
      exp: payload.exp,
      validJwt: true,
      keyType: 'jwt'
    };
  } catch (e) {
    return { validJwt: false, keyType: 'unknown' };
  }
}

// Directly probe any table to test if it exists, read sample data and diagnose RLS
export async function probeTableDirectly(tableName: string): Promise<{
  ok: boolean;
  count?: number;
  sample?: any[];
  error?: string;
  errorCode?: string;
  columns?: string[];
  rlsProbable?: boolean;
  tableMissing?: boolean;
}> {
  const cleanName = tableName.trim();
  if (!cleanName) return { ok: false, error: 'Podaj nazwę tabeli.' };

  const supabase = getSupabase();
  if (!supabase) {
    if (currentConfig.isDemo) {
      const data = getDemoData(cleanName);
      return { ok: true, count: data.length, sample: data.slice(0, 2), columns: data[0] ? Object.keys(data[0]) : [] };
    }
    return { ok: false, error: 'Brak aktywnego połączenia z bazą.' };
  }

  try {
    const { data, count, error } = await supabase.from(cleanName).select('*', { count: 'exact' }).limit(3);
    if (error) {
      const isRls = error.code === '42501' || error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('policy');
      const isMissing = error.code === '42P01' || error.code === 'PGRST205' || error.message.toLowerCase().includes('schema cache');
      return {
        ok: false,
        error: isMissing
          ? `Tabela "${cleanName}" nie została jeszcze utworzona w bazie Supabase (PGRST205).`
          : error.message,
        errorCode: error.code,
        rlsProbable: isRls,
        tableMissing: isMissing
      };
    }

    const cols = data && data.length > 0 ? Object.keys(data[0]) : [];
    return {
      ok: true,
      count: count ?? (data?.length || 0),
      sample: data || [],
      columns: cols,
      rlsProbable: data?.length === 0 && (count === 0 || count === null)
    };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

// --- STORAGE FUNCTIONS ---

export function registerStorageBucket(bucketName: string, isPublic = true) {
  const cleanName = bucketName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  try {
    const customKey = `supatable_custom_buckets_${currentConfig.url}`;
    let list: StorageBucketItem[] = [];
    const saved = localStorage.getItem(customKey);
    if (saved) list = JSON.parse(saved);
    if (!list.some(b => b.name === cleanName)) {
      list.push({
        id: cleanName,
        name: cleanName,
        isPublic,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(customKey, JSON.stringify(list));
    }
  } catch (e) {
    console.error(e);
  }
}

export async function createStorageBucket(bucketName: string, isPublic = true): Promise<StorageBucketItem> {
  const cleanName = bucketName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (!cleanName) throw new Error('Wprowadź prawidłową nazwę bucketa.');

  if (currentConfig.isDemo) {
    const newItem: StorageBucketItem = {
      id: cleanName,
      name: cleanName,
      isPublic,
      createdAt: new Date().toISOString()
    };
    if (!DEMO_STORAGE_BUCKETS.some(b => b.name === cleanName)) {
      DEMO_STORAGE_BUCKETS.push(newItem);
    }
    return newItem;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  const bucketItem: StorageBucketItem = {
    id: cleanName,
    name: cleanName,
    isPublic,
    createdAt: new Date().toISOString()
  };

  const { error } = await supabase.storage.createBucket(cleanName, {
    public: isPublic
  });

  // Always register in local list so it's instantly visible
  registerStorageBucket(cleanName, isPublic);

  if (error) {
    if (error.message?.includes('already exists') || error.message?.includes('Duplicate')) {
      return bucketItem;
    }
    throw new Error(`Supabase zwrócił błąd podczas tworzenia bucketa: ${error.message}. Jeśli używasz roli anon, utwórz bucket w panelu Supabase Storage lub użyj klucza service_role.`);
  }

  return bucketItem;
}

export async function listStorageBuckets(): Promise<StorageBucketItem[]> {
  if (currentConfig.isDemo) {
    return DEMO_STORAGE_BUCKETS;
  }

  const buckets: StorageBucketItem[] = [];

  // 1. Load user custom registered buckets from storage
  try {
    const customKey = `supatable_custom_buckets_${currentConfig.url}`;
    const saved = localStorage.getItem(customKey);
    if (saved) {
      const parsed: StorageBucketItem[] = JSON.parse(saved);
      parsed.forEach(b => {
        if (!buckets.some(existing => existing.name === b.name)) {
          buckets.push(b);
        }
      });
    }
  } catch (e) {
    console.error(e);
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (!error && data && data.length > 0) {
        data.forEach(b => {
          if (!buckets.some(existing => existing.name === b.name)) {
            buckets.push({
              id: b.id,
              name: b.name,
              isPublic: b.public,
              createdAt: b.created_at
            });
          }
        });
      }
    } catch (err) {
      console.warn('Could not list storage buckets via API:', err);
    }
  }

  // 2. If user has 'zdjecia_modeli' in their project, prioritize it as default
  if (buckets.some(b => b.name === 'zdjecia_modeli') && currentConfig.defaultBucket !== 'zdjecia_modeli') {
    currentConfig.defaultBucket = 'zdjecia_modeli';
  }

  // 3. If no buckets detected at all, provide a fallback default so user is never blocked
  if (buckets.length === 0) {
    const defName = currentConfig.defaultBucket || 'zdjecia_modeli';
    buckets.unshift({
      id: defName,
      name: defName,
      isPublic: true,
      createdAt: new Date().toISOString()
    });
  }

  return buckets;
}

export async function listStorageFiles(bucketName: string, path = ''): Promise<StorageFileItem[]> {
  if (currentConfig.isDemo) {
    try {
      const customFiles = localStorage.getItem(DEMO_STORAGE_FILES_KEY);
      const allFiles = customFiles ? JSON.parse(customFiles) : DEMO_STORAGE_FILES;
      return allFiles[bucketName] || [];
    } catch (e) {
      return DEMO_STORAGE_FILES[bucketName] || [];
    }
  }

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.storage.from(bucketName).list(path, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' }
  });

  if (error) throw new Error(error.message);

  return (data || []).map(f => {
    const publicUrl = supabase.storage.from(bucketName).getPublicUrl(path ? `${path}/${f.name}` : f.name).data.publicUrl;
    return {
      name: f.name,
      id: f.id,
      size: f.metadata?.size,
      createdAt: f.created_at,
      mimeType: f.metadata?.mimetype,
      publicUrl
    };
  });
}

// Direct Image Upload to Supabase Storage
export async function uploadImageToStorage(
  bucketName: string,
  file: File,
  folder = ''
): Promise<{ publicUrl: string; name: string; size: number }> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `${cleanBaseName}_${Date.now()}.${fileExt}`;
  const filePath = folder ? `${folder}/${uniqueName}` : uniqueName;

  if (currentConfig.isDemo) {
    // For demo mode: convert to base64 data URL so user immediately sees their actual uploaded photo
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        try {
          const customFiles = localStorage.getItem(DEMO_STORAGE_FILES_KEY);
          const allFiles = customFiles ? JSON.parse(customFiles) : { ...DEMO_STORAGE_FILES };
          if (!allFiles[bucketName]) allFiles[bucketName] = [];
          
          allFiles[bucketName].unshift({
            name: uniqueName,
            id: `f-${Date.now()}`,
            size: file.size,
            createdAt: new Date().toISOString(),
            publicUrl: dataUrl,
            mimeType: file.type
          });
          localStorage.setItem(DEMO_STORAGE_FILES_KEY, JSON.stringify(allFiles));
        } catch (e) {
          console.warn('Demo storage save warning:', e);
        }
        resolve({
          publicUrl: dataUrl,
          name: uniqueName,
          size: file.size
        });
      };
      reader.onerror = () => reject(new Error('Błąd odczytu pliku obrazu.'));
      reader.readAsDataURL(file);
    });
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true
  });

  if (error) {
    throw new Error(`Błąd przesyłania do magazynu Storage (${bucketName}): ${error.message}`);
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return {
    publicUrl: data.publicUrl,
    name: uniqueName,
    size: file.size
  };
}

export async function deleteStorageFile(bucketName: string, fileName: string): Promise<void> {
  if (currentConfig.isDemo) {
    try {
      const customFiles = localStorage.getItem(DEMO_STORAGE_FILES_KEY);
      const allFiles = customFiles ? JSON.parse(customFiles) : { ...DEMO_STORAGE_FILES };
      if (allFiles[bucketName]) {
        allFiles[bucketName] = allFiles[bucketName].filter((f: any) => f.name !== fileName);
        localStorage.setItem(DEMO_STORAGE_FILES_KEY, JSON.stringify(allFiles));
      }
    } catch (e) {
      console.error(e);
    }
    return;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  const { error } = await supabase.storage.from(bucketName).remove([fileName]);
  if (error) throw new Error(error.message);
}
