import React, { useEffect, useState, useCallback } from 'react';
import {
  ColumnMeta,
  FilterCondition,
  SortCondition,
  SupabaseConfig,
  TableMeta,
  ToastMessage
} from './types';
import {
  bulkDeleteRows,
  deleteRow,
  fetchRows,
  getTablesList,
  inferColumnType,
  insertRow,
  loadSavedConfig,
  quickOpenTable,
  saveConfig,
  updateRow
} from './lib/supabaseClient';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { DataGrid } from './components/DataGrid';
import { StarterHub } from './components/StarterHub';
import { RowEditModal } from './components/RowEditModal';
import { ImportModal } from './components/ImportModal';
import { CreateTableModal } from './components/CreateTableModal';
import { StorageExplorerModal } from './components/StorageExplorerModal';
import { ConnectionModal } from './components/ConnectionModal';
import { DiagnosticModal } from './components/DiagnosticModal';
import { ImageLightbox } from './components/ImageLightbox';
import { ToastContainer } from './components/Toast';

export default function App() {
  // Configuration State
  const [config, setConfig] = useState<SupabaseConfig>(loadSavedConfig);

  // Tables State
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableMeta | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);

  // Rows and Grid State
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortCondition>({ column: 'id', ascending: true });
  const [search, setSearch] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  // Modals & Panels
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [storagePickerCallback, setStoragePickerCallback] = useState<((url: string) => void) | null>(null);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string | undefined>(undefined);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Load Tables
  const loadTables = useCallback(async (preserveTableName?: string) => {
    setLoadingTables(true);
    try {
      const list = await getTablesList();
      setTables(list);

      if (list.length > 0) {
        if (preserveTableName) {
          const matched = list.find(t => t.name === preserveTableName);
          if (matched) {
            setSelectedTable(matched);
            return;
          }
        }
        if (!selectedTable || !list.some(t => t.name === selectedTable.name)) {
          setSelectedTable(list[0]);
        }
      } else {
        setSelectedTable(null);
      }
    } catch (err: any) {
      showToast('error', 'Błąd ładowania tabel', err.message);
    } finally {
      setLoadingTables(false);
    }
  }, [selectedTable, showToast]);

  // Initial load
  useEffect(() => {
    loadTables();
  }, [config.isDemo, config.url]);

  // Load Rows for Active Table
  const loadRows = useCallback(async () => {
    if (!selectedTable) {
      setRows([]);
      setTotalCount(0);
      setRowsError(null);
      return;
    }

    setLoadingRows(true);
    setRowsError(null);
    try {
      const { data, totalCount: count } = await fetchRows(selectedTable.name, {
        page,
        pageSize,
        search,
        searchColumn,
        sort,
        filters
      });
      setRows(data);
      setTotalCount(count);

      // Auto-discover and populate columns if table had 0 or missing columns
      if (data && data.length > 0) {
        const existingColNames = new Set(selectedTable.columns.map(c => c.name));
        const missingKeys = Object.keys(data[0]).filter(k => !existingColNames.has(k));
        if (missingKeys.length > 0 || selectedTable.columns.length === 0) {
          const discoveredCols: ColumnMeta[] = Object.keys(data[0]).map(k => {
            const existing = selectedTable.columns.find(c => c.name === k);
            if (existing) return existing;
            return {
              name: k,
              dataType: inferColumnType(k),
              isPrimary: k.toLowerCase() === 'id' || k.toLowerCase().endsWith('_id'),
              isNullable: true
            };
          });
          setSelectedTable(prev => prev ? { ...prev, columns: discoveredCols } : null);
        }
      }
    } catch (err: any) {
      setRowsError(err.message);
      showToast('error', `Błąd pobierania danych tabeli "${selectedTable.name}"`, err.message);
    } finally {
      setLoadingRows(false);
    }
  }, [selectedTable, page, pageSize, search, searchColumn, sort, filters, showToast]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const handleQuickOpenTable = async (tableName: string) => {
    try {
      const tableMeta = await quickOpenTable(tableName);
      await loadTables(tableMeta.name);
      setSelectedTable(tableMeta);
      showToast('success', 'Wczytano tabelę', `Otwarto tabelę "${tableMeta.name}".`);
    } catch (err: any) {
      showToast('error', 'Błąd otwierania tabeli', err.message);
    }
  };

  // Table Selection
  const handleSelectTable = (table: TableMeta) => {
    setSelectedTable(table);
    setPage(1);
    setSearch('');
    setFilters([]);
    const defaultSortCol = table.columns.find(c => c.isPrimary)?.name || table.columns[0]?.name || '';
    setSort({ column: defaultSortCol, ascending: true });
  };

  // Sort Toggle
  const handleSortChange = (column: string) => {
    if (sort.column === column) {
      setSort(prev => ({ column, ascending: !prev.ascending }));
    } else {
      setSort({ column, ascending: true });
    }
    setPage(1);
  };

  // Search
  const handleSearchChange = (query: string, col?: string) => {
    setSearch(query);
    if (col) setSearchColumn(col);
    setPage(1);
  };

  // Row Add / Edit
  const handleOpenAddRow = () => {
    setEditingRow(null);
    setIsRowModalOpen(true);
  };

  const handleOpenEditRow = (row: Record<string, any>) => {
    setEditingRow(row);
    setIsRowModalOpen(true);
  };

  const handleSaveRow = async (rowData: Record<string, any>) => {
    if (!selectedTable) return;
    const primaryKeyCol = selectedTable.columns.find(c => c.isPrimary)?.name || 'id';

    if (editingRow) {
      // Update
      const pkVal = editingRow[primaryKeyCol];
      await updateRow(selectedTable.name, primaryKeyCol, pkVal, rowData);
      showToast('success', 'Zaktualizowano rekord', `Rekord ${primaryKeyCol} = ${pkVal} został pomyślnie zmodyfikowany.`);
    } else {
      // Insert
      await insertRow(selectedTable.name, rowData);
      showToast('success', 'Dodano nowy rekord', `Pomyślnie dodano rekord do tabeli "${selectedTable.name}".`);
    }
    await loadRows();
    await loadTables(selectedTable.name);
  };

  // Row Delete
  const handleDeleteRow = async (row: Record<string, any>) => {
    if (!selectedTable) return;
    const primaryKeyCol = selectedTable.columns.find(c => c.isPrimary)?.name || 'id';
    const pkVal = row[primaryKeyCol];

    try {
      await deleteRow(selectedTable.name, primaryKeyCol, pkVal);
      showToast('success', 'Usunięto rekord', `Rekord ${primaryKeyCol} = ${pkVal} został trwale usunięty.`);
      await loadRows();
      await loadTables(selectedTable.name);
    } catch (err: any) {
      showToast('error', 'Błąd podczas usuwania rekordu', err.message);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async (selectedRows: Record<string, any>[]) => {
    if (!selectedTable || selectedRows.length === 0) return;
    const primaryKeyCol = selectedTable.columns.find(c => c.isPrimary)?.name || 'id';
    const pkValues = selectedRows.map(r => r[primaryKeyCol]);

    try {
      await bulkDeleteRows(selectedTable.name, primaryKeyCol, pkValues);
      showToast('success', 'Usunięto zaznaczone rekordy', `Pomyślnie usunięto ${pkValues.length} wierszy.`);
      await loadRows();
      await loadTables(selectedTable.name);
    } catch (err: any) {
      showToast('error', 'Błąd usuwania masowego', err.message);
    }
  };

  // Lightbox
  const handleShowLightbox = (url: string, title?: string) => {
    setLightboxUrl(url);
    setLightboxTitle(title);
  };

  // Open storage picker from row edit form
  const handleOpenStoragePicker = (callback: (url: string) => void) => {
    setStoragePickerCallback(() => callback);
    setIsStorageOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F9F9F9] text-[#161616] antialiased font-sans">
      {/* Pasek górny (TopBar) */}
      <TopBar
        config={config}
        selectedTable={selectedTable}
        totalRecordsCount={totalCount}
        onOpenSettings={() => setIsConnectionOpen(true)}
        onOpenStorage={() => {
          setStoragePickerCallback(null);
          setIsStorageOpen(true);
        }}
        onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
        onOpenAddRow={handleOpenAddRow}
        onRefreshData={loadRows}
        isRefreshing={loadingRows}
      />

      {/* Główny kontener aplikacji (Sidebar + DataGrid) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lewy panel boczny z tabelami */}
        <Sidebar
          tables={tables}
          selectedTable={selectedTable}
          onSelectTable={handleSelectTable}
          onOpenCreateTable={() => setIsCreateTableOpen(true)}
          onOpenStorage={() => {
            setStoragePickerCallback(null);
            setIsStorageOpen(true);
          }}
          onOpenSettings={() => setIsConnectionOpen(true)}
          onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
          onQuickOpenTable={handleQuickOpenTable}
          config={config}
        />

        {/* Centralna przestrzeń robocza */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {selectedTable ? (
            <DataGrid
              table={selectedTable}
              rows={rows}
              totalCount={totalCount}
              loading={loadingRows}
              error={rowsError}
              page={page}
              pageSize={pageSize}
              sort={sort}
              search={search}
              searchColumn={searchColumn}
              filters={filters}
              onPageChange={setPage}
              onPageSizeChange={size => {
                setPageSize(size);
                setPage(1);
              }}
              onSortChange={handleSortChange}
              onSearchChange={handleSearchChange}
              onFiltersChange={setFilters}
              onAddRow={handleOpenAddRow}
              onEditRow={handleOpenEditRow}
              onDeleteRow={handleDeleteRow}
              onBulkDelete={handleBulkDelete}
              onOpenImport={() => setIsImportModalOpen(true)}
              onShowLightbox={handleShowLightbox}
              onRefresh={loadRows}
              onOpenSettings={() => setIsConnectionOpen(true)}
            />
          ) : (
            <StarterHub
              config={config}
              onOpenCreateTable={() => setIsCreateTableOpen(true)}
              onOpenStorage={() => {
                setStoragePickerCallback(null);
                setIsStorageOpen(true);
              }}
              onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
              onQuickOpenTable={async (name) => {
                await handleQuickOpenTable(name);
              }}
              onSwitchToDemo={() => {
                const updated = saveConfig({ isDemo: true, isConnected: false });
                setConfig(updated);
                loadTables();
                showToast('info', 'Tryb demonstracyjny', 'Aktywowano gotową bazę demonstracyjną z tabelami i mediami.');
              }}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Modal Dodawania / Edycji Rekordu */}
      {selectedTable && (
        <RowEditModal
          isOpen={isRowModalOpen}
          onClose={() => setIsRowModalOpen(false)}
          table={selectedTable}
          initialData={editingRow}
          onSave={handleSaveRow}
          defaultBucket={config.defaultBucket}
          onShowLightbox={handleShowLightbox}
          onOpenStoragePicker={handleOpenStoragePicker}
        />
      )}

      {/* Modal Importu z plików (CSV / XLSX / JSON) */}
      {selectedTable && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          table={selectedTable}
          onImportComplete={async () => {
            await loadRows();
            await loadTables(selectedTable.name);
          }}
          onToast={showToast}
        />
      )}

      {/* Modal Tworzenia Nowej Tabeli */}
      <CreateTableModal
        isOpen={isCreateTableOpen}
        onClose={() => setIsCreateTableOpen(false)}
        onTableCreated={async (newTableName) => {
          await loadTables(newTableName);
        }}
        onToast={showToast}
      />

      {/* Modal Supabase Storage Explorer */}
      <StorageExplorerModal
        isOpen={isStorageOpen}
        onClose={() => {
          setIsStorageOpen(false);
          setStoragePickerCallback(null);
        }}
        onSelectImage={storagePickerCallback || undefined}
        onShowLightbox={handleShowLightbox}
        onToast={showToast}
      />

      {/* Modal Konfiguracji Połączenia */}
      <ConnectionModal
        isOpen={isConnectionOpen}
        onClose={() => setIsConnectionOpen(false)}
        config={config}
        onConfigUpdated={(newCfg) => {
          setConfig(newCfg);
          loadTables();
        }}
        onToast={showToast}
      />

      {/* Modal Centrum Diagnostyki */}
      <DiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        config={config}
        onOpenTable={async (tableName) => {
          await handleQuickOpenTable(tableName);
        }}
        onOpenSettings={() => {
          setIsDiagnosticOpen(false);
          setIsConnectionOpen(true);
        }}
        onToast={showToast}
      />

      {/* Lightbox do powiększania zdjęć */}
      <ImageLightbox
        url={lightboxUrl}
        title={lightboxTitle}
        onClose={() => setLightboxUrl(null)}
      />

      {/* System powiadomień Toast */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
