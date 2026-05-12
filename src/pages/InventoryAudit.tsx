import { useState, useEffect } from 'react';
import { Plus, X, Package, Eye, EyeOff, Edit3, Save, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import DataTable from '@/components/features/DataTable';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import type { InventoryItem } from '@/types';
import type { ColumnConfig } from '@/types/uiSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MONTHLY_BUDGET = 50000;

const emptyForm = { itemName: '', category: 'General', quantity: 1, unitCost: 0, vendor: '', date: new Date().toISOString().split('T')[0] };

export default function InventoryAudit() {
  const { inventory, addInventoryItem } = useAppStore();
  const { settings, updateColumnOrder, resetPageSettings } = useUISettingsStore();
  const [activeTab, setActiveTab] = useState<'procurement' | 'usage'>('procurement');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const pageSettings = settings.inventoryAudit || { cards: [], columns: [], buttons: [], sections: [] };

  // Default columns for procurement
  const defaultProcurementColumns: ColumnConfig[] = [
    { id: 'itemName', label: 'Item', visible: true, order: 0 },
    { id: 'category', label: 'Category', visible: true, order: 1 },
    { id: 'quantity', label: 'Qty', visible: true, order: 2 },
    { id: 'unitCost', label: 'Unit Cost', visible: true, order: 3 },
    { id: 'totalCost', label: 'Total', visible: true, order: 4 },
    { id: 'date', label: 'Date', visible: true, order: 5 },
  ];

  // Default columns for usage
  const defaultUsageColumns: ColumnConfig[] = [
    { id: 'itemName', label: 'Item', visible: true, order: 0 },
    { id: 'usedQuantity', label: 'Used Qty', visible: true, order: 1 },
    { id: 'location', label: 'Location', visible: true, order: 2 },
    { id: 'usedBy', label: 'Used By', visible: true, order: 3 },
    { id: 'coverage', label: 'Coverage', visible: true, order: 4 },
  ];

  const defaultColumns = activeTab === 'procurement' ? defaultProcurementColumns : defaultUsageColumns;

  // Initialize local columns when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      const cols = pageSettings.columns.length > 0 
        ? [...pageSettings.columns].sort((a, b) => a.order - b.order)
        : defaultColumns;
      setLocalColumns(cols);
      setHasChanges(false);
    }
  }, [isEditMode, pageSettings.columns, activeTab]);

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
    updateColumnOrder('inventoryAudit', localColumns);
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
    resetPageSettings('inventoryAudit');
    setLocalColumns(defaultColumns);
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

  const totalSpent = inventory.reduce((sum, i) => sum + i.totalCost, 0);
  const budgetPct = Math.min((totalSpent / MONTHLY_BUDGET) * 100, 100);

  const handleAdd = () => {
    if (!form.itemName || !form.vendor) { toast.error('Please fill all required fields'); return; }
    const item: InventoryItem = { ...form, id: `I${Date.now()}`, totalCost: form.quantity * form.unitCost, category: form.category as InventoryItem['category'], usedQuantity: 0, location: '', usedBy: '' };
    addInventoryItem(item);
    toast.success('Item added to inventory');
    setShowModal(false);
    setForm(emptyForm);
  };

  // Build visible columns for DataTable
  const visibleColumnIds = isEditMode 
    ? localColumns.filter(c => c.visible).map(c => c.id)
    : (pageSettings.columns.length > 0 
        ? pageSettings.columns.filter(c => c.visible).sort((a, b) => a.order - b.order).map(c => c.id)
        : defaultColumns.map(c => c.id));

  const allProcurementCols = [
    { key: 'itemName', label: 'Item', render: (i: InventoryItem) => <div><p className="font-medium text-slate-900">{i.itemName}</p><p className="text-xs text-slate-400">{i.vendor}</p></div> },
    { key: 'category', label: 'Category', render: (i: InventoryItem) => <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{i.category}</span> },
    { key: 'quantity', label: 'Qty' },
    { key: 'unitCost', label: 'Unit Cost', render: (i: InventoryItem) => `₹${i.unitCost.toLocaleString()}` },
    { key: 'totalCost', label: 'Total', render: (i: InventoryItem) => <span className="font-semibold text-indigo-600">₹{i.totalCost.toLocaleString()}</span> },
    { key: 'date', label: 'Date' },
  ];

  const allUsageCols = [
    { key: 'itemName', label: 'Item', render: (i: InventoryItem) => <p className="font-medium text-slate-900">{i.itemName}</p> },
    { key: 'usedQuantity', label: 'Used Qty', render: (i: InventoryItem) => <span className="font-medium text-amber-600">{i.usedQuantity ?? 0}</span> },
    { key: 'location', label: 'Location', render: (i: InventoryItem) => i.location || <span className="text-slate-400">—</span> },
    { key: 'usedBy', label: 'Used By', render: (i: InventoryItem) => i.usedBy || <span className="text-slate-400">—</span> },
    { key: 'coverage', label: 'Coverage', render: (i: InventoryItem) => {
      const pct = i.usedQuantity ? Math.round((i.usedQuantity / i.quantity) * 100) : 0;
      return <div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-slate-200 rounded-full"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} /></div><span className="text-xs text-slate-500">{pct}%</span></div>;
    }},
  ];

  const procurementCols = allProcurementCols.filter(col => visibleColumnIds.includes(col.key));
  const usageCols = allUsageCols.filter(col => visibleColumnIds.includes(col.key));

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

      {/* Budget */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold font-[Outfit]">Monthly Budget Tracker</h3>
            <p className="text-xs text-slate-500 mt-0.5">Budget: ₹{MONTHLY_BUDGET.toLocaleString()} / month</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-[Outfit] text-indigo-600">₹{totalSpent.toLocaleString()}</p>
            <p className="text-xs text-slate-500">spent this month</p>
          </div>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${budgetPct > 80 ? 'bg-red-500' : budgetPct > 60 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${budgetPct}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-1.5">{budgetPct.toFixed(0)}% of budget used • ₹{(MONTHLY_BUDGET - totalSpent).toLocaleString()} remaining</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1">
          {[['procurement', 'Procurement Log'], ['usage', 'Usage Audit']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key as 'procurement' | 'usage')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              {label}
            </button>
          ))}
        </div>
        {activeTab === 'procurement' && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        )}
      </div>

      <motion.div
        className={cn(
          "transition-all",
          isEditMode && "ring-2 ring-indigo-400 ring-offset-2 rounded-2xl"
        )}
      >
        {activeTab === 'procurement' ? (
          <DataTable data={inventory as unknown as Record<string, unknown>[]} columns={procurementCols as never[]} searchKeys={['itemName', 'vendor', 'category'] as never[]} searchPlaceholder="Search items..." />
        ) : (
          <DataTable data={inventory as unknown as Record<string, unknown>[]} columns={usageCols as never[]} searchKeys={['itemName', 'location', 'usedBy'] as never[]} searchPlaceholder="Search usage..." />
        )}
      </motion.div>

      {/* Floating Edit Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {!isEditMode && (
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
          )}
        </AnimatePresence>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-[Outfit]">Add Procurement Item</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Item Name</label>
                <input value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Quantity</label>
                  <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Unit Cost (₹)</label>
                  <input type="number" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {['Electrical', 'Plumbing', 'General', 'Cleaning', 'Safety'].map(c => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Vendor</label>
                <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div className="bg-slate-50 rounded-xl p-3 flex justify-between"><span className="text-sm text-slate-600">Total Cost</span><span className="font-bold text-indigo-600">₹{(form.quantity * form.unitCost).toLocaleString()}</span></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Add Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}