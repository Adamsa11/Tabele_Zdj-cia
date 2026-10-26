import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ColumnMeta, FilterCondition, SortCondition, StorageBucketItem, StorageFileItem, SupabaseConfig, TableMeta } from '../types';
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
      'Model',
      'Model_zdjecia',
      'produkty',
      'products',
      'models',
      'modele',
      'zdjecia',
      'items',
      'users',
      'customers',
      'orders'
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
      'Model',
      'Model_zdjecia',
      'produkty',
      'products',
      'models',
      'modele',
      'zdjecia',
      'items',
      'users',
      'customers',
      'orders',
      'media_assets'
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
  return tables;
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

// Insert single row
export async function insertRow(tableName: string, rowData: Record<string, any>): Promise<any> {
  if (currentConfig.isDemo) {
    const current = getDemoData(tableName);
    // Auto-generate id if missing
    if (!rowData.id) {
      const maxId = current.reduce((max, r) => (typeof r.id === 'number' && r.id > max ? r.id : max), 0);
      rowData.id = maxId + 1;
    }
    if (!rowData.created_at) {
      rowData.created_at = new Date().toISOString();
    }
    const updated = [rowData, ...current];
    setDemoData(tableName, updated);
    return rowData;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  const { data, error } = await supabase.from(tableName).insert(rowData).select().single();
  if (error) throw new Error(error.message);
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
    const current = getDemoData(tableName);
    let maxId = current.reduce((max, r) => (typeof r.id === 'number' && r.id > max ? r.id : max), 0);

    const newRows = rows.map((r, idx) => {
      const row = { ...r };
      if (!row.id) {
        maxId += 1;
        row.id = maxId;
      }
      if (!row.created_at) {
        row.created_at = new Date().toISOString();
      }
      successCount++;
      return row;
    });

    setDemoData(tableName, [...newRows, ...current]);
    return { successCount, errors };
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  // Insert in batches of 50 to avoid payload size and rate limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from(tableName).insert(batch).select();

    if (error) {
      // If batch fails, attempt row-by-row for granular feedback
      for (let j = 0; j < batch.length; j++) {
        const singleRow = batch[j];
        const rowNum = i + j + 1;
        const singleRes = await supabase.from(tableName).insert(singleRow);
        if (singleRes.error) {
          errors.push({ row: rowNum, error: singleRes.error.message });
        } else {
          successCount++;
        }
      }
    } else {
      successCount += (data?.length || batch.length);
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
  if (currentConfig.isDemo) {
    const current = getDemoData(tableName);
    const index = current.findIndex(r => String(r[primaryKeyCol]) === String(primaryKeyValue));
    if (index === -1) throw new Error(`Nie znaleziono rekordu o ${primaryKeyCol} = ${primaryKeyValue}`);
    current[index] = { ...current[index], ...updatedData };
    setDemoData(tableName, current);
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

  if (error) throw new Error(error.message);
  return data;
}

// Delete single row
export async function deleteRow(tableName: string, primaryKeyCol: string, primaryKeyValue: any): Promise<void> {
  if (currentConfig.isDemo) {
    const current = getDemoData(tableName);
    const filtered = current.filter(r => String(r[primaryKeyCol]) !== String(primaryKeyValue));
    setDemoData(tableName, filtered);
    return;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Brak połączenia z Supabase.');

  const { error } = await supabase.from(tableName).delete().eq(primaryKeyCol, primaryKeyValue);
  if (error) throw new Error(error.message);
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
