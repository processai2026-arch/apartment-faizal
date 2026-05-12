import { useState, useEffect } from 'react';
import { Home, LogOut, Eye, EyeOff, Edit3, Save, RotateCcw, X } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import UICustomizer from '@/components/features/UICustomizer';
import type { ColumnConfig } from '@/types/uiSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '');
}

export default function CheckOutVehicle() {
  const { vehicles, checkOutVehicle } = useAppStore();
  const { settings, getVisibleColumns, updateColumnOrder, resetPageSettings } = useUISettingsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const pageSettings = settings.checkOutVehicle || { cards: [], columns: [], buttons: [], sections: [] };

  // Default columns if none configured
  const defaultColumns: ColumnConfig[] = [
    { id: 'vehicleNo', label: 'Vehicle No', visible: true, order: 0 },
    { id: 'driverName', label: 'Driver', visible: true, order: 1 },
    { id: 'driverPhone', label: 'Phone', visible: true, order: 2 },
    { id: 'purpose', label: 'Purpose', visible: true, order: 3 },
    { id: 'entryTime', label: 'Entry Time', visible: true, order: 4 },
    { id: 'status', label: 'Status', visible: true, order: 5 },
    { id: 'action', label: 'Action', visible: true, order: 6 },
  ];

  // Initialize local columns when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      const cols = pageSettings.columns && pageSettings.columns.length > 0 
        ? [...pageSettings.columns].sort((a, b) => a.order - b.order)
        : defaultColumns;
      setLocalColumns(cols);
      setHasChanges(false);
    }
  }, [isEditMode, pageSettings.columns]);

  const visibleColumns = isEditMode 
    ? localColumns 
    : (pageSettings.columns && pageSettings.columns.length > 0 
        ? getVisibleColumns('checkOutVehicle')
        : defaultColumns);

  // Column visibility helper
  const isColumnVisible = (columnId: string) => {
    if (isEditMode) {
      return localColumns.find(c => c.id === columnId)?.visible ?? true;
    }
    if (!pageSettings.columns || pageSettings.columns.length === 0) return true;
    return visibleColumns.some(c => c.id === columnId);
  };

  // Handle column visibility toggle
  const handleColumnVisibilityToggle = (columnId: string) => {
    setLocalColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
    setHasChanges(true);
  };

  // Handle column reorder
  const handleColumnReorder = (newOrder: ColumnConfig[]) => {
    const updatedColumns = newOrder.map((col, index) => ({
      ...col,
      order: index,
    }));
    setLocalColumns(updatedColumns);
    setHasChanges(true);
  };

  // Save changes
  const handleSave = () => {
    updateColumnOrder('checkOutVehicle', localColumns);
    setIsEditMode(false);
    setHasChanges(false);
    toast.success('Column settings saved!');
  };

  // Cancel edit mode
  const handleCancel = () => {
    setIsEditMode(false);
    setHasChanges(false);
  };

  // Reset to default
  const handleReset = () => {
    resetPageSettings('checkOutVehicle');
    setLocalColumns([...settings.checkOutVehicle.columns].sort((a, b) => a.order - b.order));
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

  // Filter vehicles that are currently inside
  const insideVehicles = vehicles.filter(v => v.status === 'Inside');

  // Filter based on search
  const filtered = insideVehicles.filter(v => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.vehicleNo?.toLowerCase().includes(query) ||
      v.companyName?.toLowerCase().includes(query) ||
      v.vehicleType?.toLowerCase().includes(query) ||
      v.vehicleModel?.toLowerCase().includes(query) ||
      v.ownerName?.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  const handleCheckout = (id: string, vehicleNo: string) => {
    checkOutVehicle(id);
    toast.success(`${vehicleNo} checked out successfully`);
  };

  // Get display columns (sorted)
  const displayColumns = isEditMode 
    ? localColumns 
    : (pageSettings.columns && pageSettings.columns.length > 0 
        ? [...pageSettings.columns].sort((a, b) => a.order - b.order).filter(c => c.visible)
        : defaultColumns);

  return (
    <div className="space-y-4">
      {/* Edit Mode Toolbar */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 px-6 py-3 flex items-center gap-4"
          >
            <div className="flex items-center gap-2 text-indigo-600">
              <Edit3 className="w-5 h-5" />
              <span className="font-semibold">Edit Columns</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <p className="text-sm text-slate-500">Drag to reorder • Click eye to show/hide</p>
            <div className="w-px h-6 bg-slate-200" />
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
                hasChanges
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Column Editor Panel (shown in edit mode) */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4"
          >
            <p className="text-sm font-medium text-indigo-700 mb-3">Drag to reorder columns, click eye to show/hide:</p>
            <Reorder.Group
              axis="x"
              values={localColumns}
              onReorder={handleColumnReorder}
              className="flex flex-wrap gap-2"
            >
              {localColumns.map((col) => (
                <Reorder.Item
                  key={col.id}
                  value={col}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing select-none transition-all',
                    col.visible 
                      ? 'bg-white border border-indigo-300 shadow-sm' 
                      : 'bg-slate-100 border border-slate-200 opacity-60'
                  )}
                  whileDrag={{ scale: 1.05, zIndex: 50 }}
                >
                  <span className={cn(
                    'text-sm font-medium',
                    col.visible ? 'text-slate-700' : 'text-slate-400'
                  )}>
                    {col.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColumnVisibilityToggle(col.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                      'p-1 rounded transition-colors',
                      col.visible 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-slate-400 hover:bg-slate-200'
                    )}
                  >
                    {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Check Out Vehicles</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Home className="w-4 h-4" />
          <span>Home</span>
          <span>›</span>
          <span className="text-indigo-600">Vehicles</span>
        </div>
      </div>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-white rounded-lg border border-slate-200 shadow-sm",
          isEditMode && "ring-2 ring-indigo-400 ring-offset-2"
        )}
      >
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-700">Displaying Vehicle Entry</h2>
        </div>

        {/* Table Controls */}
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-600">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {displayColumns.map((col) => (
                  <th 
                    key={col.id} 
                    className={cn(
                      "text-left px-4 py-3 font-semibold text-slate-700",
                      isEditMode && !col.visible && "opacity-40"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <span className="text-slate-400 text-xs">↕</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={displayColumns.length || 8} className="px-4 py-8 text-center text-slate-400">
                    No vehicles currently inside
                  </td>
                </tr>
              ) : (
                paginatedData.map((vehicle, idx) => (
                  <motion.tr 
                    key={vehicle.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {displayColumns.map((col) => {
                      if (!col.visible && !isEditMode) return null;
                      
                      const cellClass = cn(
                        "px-4 py-3",
                        isEditMode && !col.visible && "opacity-40"
                      );
                      
                      switch (col.id) {
                        case 'index':
                          return <td key={col.id} className={cn(cellClass, "text-slate-600")}>{startIndex + idx + 1}</td>;
                        case 'company':
                          return (
                            <td key={col.id} className={cellClass}>
                              <span className="text-indigo-600 hover:underline cursor-pointer">
                                {vehicle.companyName || 'N/A'}
                              </span>
                            </td>
                          );
                        case 'vehicleType':
                          return <td key={col.id} className={cn(cellClass, "text-slate-600")}>{vehicle.vehicleType || 'N/A'}</td>;
                        case 'vehicleNo':
                          return <td key={col.id} className={cn(cellClass, "text-slate-600")}>{vehicle.vehicleNo || 'N/A'}</td>;
                        case 'vehicleModel':
                          return <td key={col.id} className={cn(cellClass, "text-slate-600")}>{vehicle.vehicleModel || 'N/A'}</td>;
                        case 'visitorType':
                          return <td key={col.id} className={cn(cellClass, "text-slate-600")}>{vehicle.parkingUserType || 'N/A'}</td>;
                        case 'entryTime':
                          return <td key={col.id} className={cn(cellClass, "text-slate-600")}>{formatDateTime(vehicle.entryTime)}</td>;
                        case 'action':
                          return (
                            <td key={col.id} className={cellClass}>
                              <button
                                onClick={() => handleCheckout(vehicle.id, vehicle.vehicleNo)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 transition-colors"
                              >
                                <LogOut className="w-4 h-4" />
                                Check Out
                              </button>
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing {filtered.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} entries
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 border rounded text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      {/* Floating Customize Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <AnimatePresence>
          {!isEditMode && (
            <>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <Edit3 className="w-5 h-5" />
                <span className="font-medium text-sm">Edit Columns</span>
              </motion.button>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCustomizerOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <Eye className="w-4 h-4" />
                <span className="font-medium text-sm">Advanced</span>
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Customizer Modal */}
      <UICustomizer
        page="checkOutVehicle"
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        pageTitle="Check Out Vehicles"
      />
    </div>
  );
}