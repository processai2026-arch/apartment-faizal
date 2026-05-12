import { useState, useEffect } from 'react';
import { Plus, Edit2, ToggleLeft, X, Building2, Users, Car, Eye, EyeOff, Edit3, Save, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import UICustomizer from '@/components/features/UICustomizer';
import type { Office } from '@/types';
import type { ColumnConfig } from '@/types/uiSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const emptyOffice: Partial<Office> = { 
  block: 'A', 
  floorNumber: '1', 
  companyName: '', 
  status: 'Vacant', 
  contactPerson: '', 
  contactPhone: '', 
  contactEmail: '',
  allocatedVehicleCount: 2
};

export default function ManageApartment() {
  const { offices, addOffice, updateOffice, toggleOfficeStatus } = useAppStore();
  const { settings, getVisibleColumns, updateColumnOrder, resetPageSettings } = useUISettingsStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Office | null>(null);
  const [form, setForm] = useState<Partial<Office>>(emptyOffice);
  const [filter, setFilter] = useState({ status: '', floor: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const pageSettings = settings.manageApartment;

  // Initialize local columns when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      setLocalColumns([...pageSettings.columns].sort((a, b) => a.order - b.order));
      setHasChanges(false);
    }
  }, [isEditMode, pageSettings.columns]);

  const visibleColumns = isEditMode 
    ? localColumns 
    : getVisibleColumns('manageApartment');

  // Column visibility helper
  const isColumnVisible = (columnId: string) => {
    if (isEditMode) {
      return localColumns.find(c => c.id === columnId)?.visible ?? false;
    }
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
    updateColumnOrder('manageApartment', localColumns);
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
    resetPageSettings('manageApartment');
    setLocalColumns([...settings.manageApartment.columns].sort((a, b) => a.order - b.order));
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

  // Get unique floors for filter
  const uniqueFloors = [...new Set(offices.map(o => o.floorNumber))].sort();

  const filtered = offices.filter(o => {
    if (filter.status && o.status !== filter.status) return false;
    if (filter.floor && o.floorNumber !== filter.floor) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(query) ||
        o.companyName?.toLowerCase().includes(query) ||
        o.contactPerson?.toLowerCase().includes(query) ||
        o.block?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const openAdd = () => { setEditing(null); setForm(emptyOffice); setShowModal(true); };
  const openEdit = (office: Office) => { setEditing(office); setForm(office); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.companyName) { toast.error('Company name is required'); return; }
    if (editing) {
      updateOffice({ ...editing, ...form } as Office);
      toast.success('Office updated successfully');
    } else {
      addOffice({ ...form, id: `OFF${Date.now()}` } as Office);
      toast.success('Office added successfully');
    }
    setShowModal(false);
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

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{offices.length}</p>
              <p className="text-xs text-slate-500">Total Offices</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{offices.filter(o => o.status === 'Active').length}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{offices.filter(o => o.status === 'Vacant').length}</p>
              <p className="text-xs text-slate-500">Vacant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search offices..."
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
          <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Vacant">Vacant</option>
          </select>
          <select value={filter.floor} onChange={e => setFilter(f => ({ ...f, floor: e.target.value }))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Floors</option>
            {uniqueFloors.map(floor => (
              <option key={floor} value={floor}>Floor {floor}</option>
            ))}
          </select>
          <span className="text-sm text-slate-500">{filtered.length} offices</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Office
        </button>
      </div>

      {/* Data Table */}
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={displayColumns.length || 7} className="px-4 py-8 text-center text-slate-400">
                    No offices found
                  </td>
                </tr>
              ) : (
                filtered.map((office, idx) => (
                  <motion.tr 
                    key={office.id} 
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
                        case 'unitNo':
                          return <td key={col.id} className={cn(cellClass, "font-semibold text-slate-900")}>{office.id}</td>;
                        case 'block':
                          return <td key={col.id} className={cellClass}>{office.block}</td>;
                        case 'floor':
                          return <td key={col.id} className={cellClass}>Floor {office.floorNumber}</td>;
                        case 'type':
                          return (
                            <td key={col.id} className={cellClass}>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-500" />
                                <span className="font-medium text-slate-900">{office.companyName}</span>
                              </div>
                            </td>
                          );
                        case 'resident':
                          return <td key={col.id} className={cellClass}>{office.contactPerson || <span className="text-slate-400 italic">—</span>}</td>;
                        case 'status':
                          return <td key={col.id} className={cellClass}><StatusBadge status={office.status} /></td>;
                        case 'action':
                          return (
                            <td key={col.id} className={cellClass}>
                              <div className="flex items-center gap-2">
                                <button onClick={() => openEdit(office)} className="p-1.5 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => { toggleOfficeStatus(office.id); toast.success(`Status updated`); }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Toggle Status">
                                  <ToggleLeft className="w-4 h-4" />
                                </button>
                              </div>
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
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold font-[Outfit]">{editing ? 'Edit Office' : 'Add Office'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Block</label>
                  <select value={form.block ?? 'A'} onChange={e => setForm(f => ({ ...f, block: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {['A', 'B', 'C', 'D'].map(b => <option key={b} value={b}>Block {b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Floor Number</label>
                  <select value={form.floorNumber ?? '1'} onChange={e => setForm(f => ({ ...f, floorNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {['G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(f => <option key={f} value={f}>Floor {f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                  <select value={form.status ?? 'Vacant'} onChange={e => setForm(f => ({ ...f, status: e.target.value as Office['status'] }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Vacant">Vacant</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Allocated Parking Slots</label>
                  <input type="number" value={form.allocatedVehicleCount ?? 2}
                    onChange={e => setForm(f => ({ ...f, allocatedVehicleCount: Number(e.target.value) }))}
                    min={0} max={20}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Company Name *</label>
                  <input type="text" value={form.companyName ?? ''}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    placeholder="e.g., TechCorp Solutions"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Contact Person</label>
                  <input type="text" value={form.contactPerson ?? ''}
                    onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                    placeholder="e.g., John Doe"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Contact Phone</label>
                  <input type="text" value={form.contactPhone ?? ''}
                    onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                    placeholder="e.g., +91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Contact Email</label>
                  <input type="email" value={form.contactEmail ?? ''}
                    onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                    placeholder="e.g., contact@company.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">{editing ? 'Update' : 'Add'}</button>
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
        page="manageApartment"
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        pageTitle="Manage Offices"
      />
    </div>
  );
}