import { useState, useEffect } from 'react';
import { Download, Eye, EyeOff, Search, ChevronLeft, ChevronRight, Edit3, X, Save, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import UICustomizer from '@/components/features/UICustomizer';
import type { Visitor } from '@/types';
import type { ColumnConfig } from '@/types/uiSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export default function VisitorManagement() {
  const { visitors } = useAppStore();
  const { settings, getVisibleColumns, getVisibleButtons, updateColumnOrder, resetPageSettings } = useUISettingsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  const pageSize = 10;
  const pageSettings = settings.visitorManagement;

  // Initialize local columns when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      setLocalColumns([...pageSettings.columns].sort((a, b) => a.order - b.order));
      setHasChanges(false);
    }
  }, [isEditMode, pageSettings.columns]);

  const visibleColumns = isEditMode 
    ? localColumns 
    : getVisibleColumns('visitorManagement');
  const visibleButtons = getVisibleButtons('visitorManagement');

  // Column visibility helper
  const isColumnVisible = (columnId: string) => {
    if (isEditMode) {
      return localColumns.find(c => c.id === columnId)?.visible ?? false;
    }
    return visibleColumns.some(c => c.id === columnId);
  };
  
  // Button visibility helper
  const isButtonVisible = (buttonId: string) => visibleButtons.some(b => b.id === buttonId);

  // Handle column visibility toggle in edit mode
  const handleColumnVisibilityToggle = (columnId: string) => {
    setLocalColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
    setHasChanges(true);
  };

  // Handle reorder
  const handleReorder = (newOrder: ColumnConfig[]) => {
    const updatedColumns = newOrder.map((col, index) => ({
      ...col,
      order: index,
    }));
    setLocalColumns(updatedColumns);
    setHasChanges(true);
  };

  // Save changes
  const handleSave = () => {
    updateColumnOrder('visitorManagement', localColumns);
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
    resetPageSettings('visitorManagement');
    setLocalColumns([...settings.visitorManagement.columns].sort((a, b) => a.order - b.order));
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

  // Filter visitors based on search
  const filtered = visitors.filter(v => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(query) ||
      v.phone.toLowerCase().includes(query) ||
      v.companyName?.toLowerCase().includes(query) ||
      v.whomToMeet?.toLowerCase().includes(query) ||
      v.block?.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  const exportCSV = () => {
    const headers = ['#', 'Visitor Name', 'Contact', 'Gender', 'Building', 'Company', 'Whom To Visit', 'Entry Time', 'Status'];
    const rows = filtered.map((v, idx) => [
      idx + 1,
      v.name,
      v.phone,
      v.gender || 'N/A',
      v.block || 'N/A',
      v.companyName || 'N/A',
      v.whomToMeet || 'N/A',
      formatDateTime(v.entryTime),
      v.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visitors.csv';
    a.click();
    toast.success('CSV exported successfully');
  };

  const handleView = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
  };

  const closeModal = () => {
    setSelectedVisitor(null);
  };

  // Get display columns (sorted)
  const displayColumns = isEditMode 
    ? localColumns 
    : [...pageSettings.columns].sort((a, b) => a.order - b.order).filter(c => c.visible);

  return (
    <div className="space-y-6">
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
            <p className="text-sm text-slate-500">Click eye to show/hide columns</p>
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
              onReorder={handleReorder}
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

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AnimatePresence>
          {isButtonVisible('search') && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search visitors..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{filtered.length} records</span>
          <AnimatePresence>
            {isButtonVisible('export') && (
              <motion.button 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={exportCSV} 
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Export CSV
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden",
          isEditMode && "ring-2 ring-indigo-400 ring-offset-2"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {displayColumns.map((col) => (
                  <th 
                    key={col.id} 
                    className={cn(
                      "text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3",
                      isEditMode && !col.visible && "opacity-40"
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={displayColumns.length || 9} className="px-4 py-8 text-center text-slate-400">
                    No visitors found
                  </td>
                </tr>
              ) : (
                paginatedData.map((visitor, idx) => (
                  <motion.tr 
                    key={visitor.id} 
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
                        case 'name':
                          return (
                            <td key={col.id} className={cellClass}>
                              <span className="font-medium text-slate-900">{visitor.name}</span>
                            </td>
                          );
                        case 'contact':
                          return <td key={col.id} className={cn(cellClass, "text-slate-600")}>{visitor.phone}</td>;
                        case 'gender':
                          return (
                            <td key={col.id} className={cellClass}>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                visitor.gender === 'Male' ? 'bg-blue-100 text-blue-700' :
                                visitor.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {visitor.gender || 'N/A'}
                              </span>
                            </td>
                          );
                        case 'building':
                          return <td key={col.id} className={cn(cellClass, "text-slate-600")}>{visitor.block || 'N/A'}</td>;
                        case 'apartment':
                          return <td key={col.id} className={cn(cellClass, "text-slate-600")}>{visitor.companyName || visitor.apartmentNo || 'N/A'}</td>;
                        case 'whomToVisit':
                          return <td key={col.id} className={cn(cellClass, "text-slate-600")}>{visitor.whomToMeet || 'N/A'}</td>;
                        case 'entryTime':
                          return <td key={col.id} className={cn(cellClass, "text-slate-500 text-xs")}>{formatDateTime(visitor.entryTime)}</td>;
                        case 'action':
                          return (
                            <td key={col.id} className={cellClass}>
                              <button
                                onClick={() => handleView(visitor)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* View Modal */}
      <AnimatePresence>
        {selectedVisitor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">Visitor Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Name</p>
                    <p className="font-medium text-slate-900">{selectedVisitor.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Contact</p>
                    <p className="font-medium text-slate-900">{selectedVisitor.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Gender</p>
                    <p className="font-medium text-slate-900">{selectedVisitor.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Building</p>
                    <p className="font-medium text-slate-900">{selectedVisitor.block || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Floor</p>
                    <p className="font-medium text-slate-900">{selectedVisitor.floorNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Company</p>
                    <p className="font-medium text-slate-900">{selectedVisitor.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Whom To Meet</p>
                    <p className="font-medium text-slate-900">{selectedVisitor.whomToMeet || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Reason</p>
                    <p className="font-medium text-slate-900">{selectedVisitor.reason || selectedVisitor.purpose || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Entry Time</p>
                    <p className="font-medium text-slate-900">{formatDateTime(selectedVisitor.entryTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Exit Time</p>
                    <p className="font-medium text-slate-900">{selectedVisitor.exitTime ? formatDateTime(selectedVisitor.exitTime) : 'Still Inside'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      selectedVisitor.status === 'Inside' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedVisitor.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Vehicle</p>
                    <p className="font-medium text-slate-900">
                      {selectedVisitor.vehicleNo ? `${selectedVisitor.vehicleType} - ${selectedVisitor.vehicleNo}` : 'No Vehicle'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                title="Edit Columns"
                aria-label="Edit Columns"
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <Edit3 className="w-5 h-5" />
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Customizer Modal */}
      <UICustomizer
        page="visitorManagement"
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        pageTitle="Visitor Management"
      />
    </div>
  );
}