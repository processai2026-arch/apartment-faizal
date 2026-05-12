import { useState, useEffect } from 'react';
import { Plus, X, Wrench, Eye, EyeOff, Edit3, Save, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import StatusBadge from '@/components/features/StatusBadge';
import DataTable from '@/components/features/DataTable';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import UICustomizer from '@/components/features/UICustomizer';
import type { Vendor } from '@/types';
import type { ColumnConfig } from '@/types/uiSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Tab = 'Regular Maintenance' | 'Utility Providers' | 'Ad-Hoc Vendors';
const tabs: Tab[] = ['Regular Maintenance', 'Utility Providers', 'Ad-Hoc Vendors'];

const emptyForm = { name: '', company: '', serviceType: '', contact: '', category: 'Regular Maintenance' as Tab, nextVisit: '' };

export default function VendorManagement() {
  const { vendors, addVendor } = useAppStore();
  const { settings, getVisibleColumns, updateColumnOrder, resetPageSettings } = useUISettingsStore();
  const [activeTab, setActiveTab] = useState<Tab>('Regular Maintenance');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const pageSettings = settings.vendorManagement || { cards: [], columns: [], buttons: [], sections: [] };

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

  // Default columns if none configured
  const defaultColumns: ColumnConfig[] = [
    { id: 'name', label: 'Vendor', visible: true, order: 0 },
    { id: 'serviceType', label: 'Service', visible: true, order: 1 },
    { id: 'contact', label: 'Contact', visible: true, order: 2 },
    { id: 'lastVisit', label: 'Last Visit', visible: true, order: 3 },
    { id: 'nextVisit', label: 'Next Visit', visible: true, order: 4 },
    { id: 'status', label: 'Status', visible: true, order: 5 },
    { id: 'action', label: 'Action', visible: true, order: 6 },
  ];

  // Column visibility helper
  const isColumnVisible = (columnId: string) => {
    if (isEditMode) {
      return localColumns.find(c => c.id === columnId)?.visible ?? true;
    }
    if (pageSettings.columns.length === 0) return true;
    const col = pageSettings.columns.find(c => c.id === columnId);
    return col ? col.visible : true;
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
    updateColumnOrder('vendorManagement', localColumns);
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
    resetPageSettings('vendorManagement');
    setLocalColumns(defaultColumns);
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

  const filtered = vendors.filter(v => v.category === activeTab);

  // Build visible columns for DataTable
  const visibleColumnIds = isEditMode 
    ? localColumns.filter(c => c.visible).map(c => c.id)
    : (pageSettings.columns.length > 0 
        ? pageSettings.columns.filter(c => c.visible).sort((a, b) => a.order - b.order).map(c => c.id)
        : defaultColumns.map(c => c.id));

  const allColumns = [
    { key: 'name', label: 'Vendor', render: (v: Vendor) => <div><p className="font-medium text-slate-900">{v.name}</p><p className="text-xs text-slate-400">{v.company}</p></div> },
    { key: 'serviceType', label: 'Service' },
    { key: 'contact', label: 'Contact' },
    { key: 'lastVisit', label: 'Last Visit' },
    { key: 'nextVisit', label: 'Next Visit', render: (v: Vendor) => v.nextVisit || <span className="text-slate-400">—</span> },
    { key: 'status', label: 'Status', render: (v: Vendor) => <StatusBadge status={v.status} /> },
  ];

  const columns = allColumns.filter(col => visibleColumnIds.includes(col.key));

  const handleAdd = () => {
    if (!form.name || !form.company || !form.serviceType || !form.contact) { toast.error('Please fill all required fields'); return; }
    addVendor({ ...form, id: `VN${Date.now()}`, category: activeTab, lastVisit: new Date().toISOString().split('T')[0], status: 'Active' } as Vendor);
    toast.success('Vendor added successfully');
    setShowModal(false);
    setForm(emptyForm);
  };

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

      {/* Column Editor Panel */}
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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              {tab}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      <motion.div
        className={cn(
          "transition-all",
          isEditMode && "ring-2 ring-indigo-400 ring-offset-2 rounded-2xl"
        )}
      >
        <DataTable data={filtered as unknown as Record<string, unknown>[]} columns={columns as never[]}
          searchKeys={['name', 'company', 'serviceType'] as never[]} searchPlaceholder="Search vendors..."
          actions={isColumnVisible('action') ? (v: unknown) => {
            const vendor = v as Vendor;
            return (
              <button onClick={() => { toast.success(`Visit logged for ${vendor.name}`); }}
                className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
                <Wrench className="w-3 h-3" /> Log Visit
              </button>
            );
          } : undefined}
        />
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
            </>
          )}
        </AnimatePresence>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-[Outfit]">Add Vendor</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {[['Vendor Name', 'name'], ['Company', 'company'], ['Service Type', 'serviceType'], ['Contact', 'contact'], ['Next Visit Date', 'nextVisit']].map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
                  <input type={key === 'nextVisit' ? 'date' : 'text'} value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Add Vendor</button>
            </div>
          </div>
        </div>
      )}

      {/* Customizer Modal */}
      <UICustomizer
        page="vendorManagement"
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        pageTitle="Vendor Management"
      />
    </div>
  );
}