export type ColumnDataType = 'text' | 'number' | 'boolean' | 'datetime' | 'json' | 'image' | 'uuid';

export interface ColumnMeta {
  name: string;
  dataType: ColumnDataType;
  isPrimary?: boolean;
  isNullable?: boolean;
  defaultValue?: string | null;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface TableMeta {
  name: string;
  schema?: string;
  rowCount?: number;
  columns: ColumnMeta[];
  isCustom?: boolean;
}

export interface SupabaseConfig {
  url: string;
  key: string;
  defaultBucket: string;
  isDemo: boolean;
  isConnected: boolean;
  lastConnectedAt?: string;
}

export type FilterOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'is_null' | 'is_not_null';

export interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value: string;
}

export interface SortCondition {
  column: string;
  ascending: boolean;
}

export interface StorageBucketItem {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
}

export interface StorageFileItem {
  name: string;
  id?: string | null;
  size?: number;
  createdAt?: string | null;
  publicUrl: string;
  mimeType?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}
