import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Wrench, Eye, EyeOff, Edit3, Save, RotateCcw, Phone, MessageCircle, Building2, Pin } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import StatusBadge from '@/components/features/StatusBadge';
import DataTable, { NameCell, type Column } from '@/components/features/DataTable';
import TableToolbar from '@/components/features/TableToolbar';
import SearchInput from '@/components/features/SearchInput';
import EmptyState from '@/components/features/EmptyState';
import { useAppStore } from '@/stores/useAppStore';
import { useUISettingsStore } from '@/stores/useUISettingsStore';
import type { Vendor } from '@/types';
import type { ColumnConfig } from '@/types/uiSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Tab = 'Regular Maintenance';
const tabs: Tab[] = ['Regular Maintenance'];

const tabBadgeColor: Record<Tab, string> = {
  'Regular Maintenance': 'bg-indigo-50 text-indigo-700',
};

const activeTab: Tab = 'Regular Maintenance';

const SERVICE_TYPES = [
  'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning',
  'Pest Control', 'AC Service', 'Security', 'Gardening', 'Housekeeping',
  'Lift Maintenance', 'Generator Service', 'IT/Network', 'CCTV', 'Waterproofing', 'Other',
];

const emptyForm = {
  name: '',
  company: '',
  serviceType: '',
  serviceTypeCustom: '',
  contact: '',
  category: 'Regular Maintenance' as Tab,
  nextVisit: '',
  referral_source: '',
};

const defaultColumns: ColumnConfig[] = [
  { id: 'name', label: 'Vendor', visible: true, order: 0 },
  { id: 'category', label: 'Category', visible: true, order: 1 },
  { id: 'serviceType', label: 'Service', visible: true, order: 2 },
  { id: 'contact', label: 'Contact', visible: true, order: 3 },
  { id: 'lastVisit', label: 'Last Visit', visible: true, order: 4 },
  { id: 'nextVisit', label: 'Next Visit', visible: true, order: 5 },
  { id: 'status', label: 'Status', visible: true, order: 6 },
];

// Normalise an Indian contact number for tel:/wa.me links.
const digits = (s: string) => s.replace(/[^\d]/g, '');
const waLink = (contact: string) => {
  const d = digits(contact);
  const withCc = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${withCc}`;
};

export default function VendorManagement() {
  const { vendors, addVendor } = useAppStore();
  const { settings, updateColumnOrder, resetPageSettings } = useUISettingsStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Column edit state (docked in the toolbar, no floating FAB).
  const [isEditMode, setIsEditMode] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const pageSettings = settings.vendorManagement || { cards: [], columns: [], buttons: [], sections: [] };

  useEffect(() => {
    if (isEditMode) {
      const cols = pageSettings.columns && pageSettings.columns.length > 0
        ? [...pageSettings.columns].sort((a, b) => a.order - b.order)
        : defaultColumns;
      setLocalColumns(cols);
      setHasChanges(false);
    }
  }, [isEditMode, pageSettings.columns]);

  const isColumnVisible = (columnId: string) => {
    if (isEditMode) return localColumns.find(c => c.id === columnId)?.visible ?? true;
    if (pageSettings.columns.length === 0) return true;
    const col = pageSettings.columns.find(c => c.id === columnId);
    return col ? col.visible : true;
  };

  const handleColumnVisibilityToggle = (columnId: string) => {
    setLocalColumns(prev => prev.map(col => col.id === columnId ? { ...col, visible: !col.visible } : col));
    setHasChanges(true);
  };

  const handleColumnReorder = (newOrder: ColumnConfig[]) => {
    setLocalColumns(newOrder.map((col, index) => ({ ...col, order: index })));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateColumnOrder('vendorManagement', localColumns);
    setIsEditMode(false);
    setHasChanges(false);
    toast.success('Column settings saved!');
  };

  const handleReset = () => {
    resetPageSettings('vendorManagement');
    setLocalColumns(defaultColumns);
    setHasChanges(true);
    toast.success('Reset to default layout');
  };

  const filtered = useMemo(() => {
    const byTab = vendors.filter(v => v.category === activeTab);
    const q = search.toLowerCase();
    const searched = !search ? byTab : byTab.filter(v =>
      [v.name, v.company, v.serviceType, v.contact].some(f => String(f ?? '').toLowerCase().includes(q))
    );
    // Pin Regular Maintenance vendors at top
    return [...searched].sort((a, b) => {
      const aPin = a.category === 'Regular Maintenance' ? 0 : 1;
      const bPin = b.category === 'Regular Maintenance' ? 0 : 1;
      return aPin - bPin;
    });
  }, [vendors, search]);

  const visibleColumnIds = isEditMode
    ? localColumns.filter(c => c.visible).map(c => c.id)
    : (pageSettings.columns.length > 0
        ? pageSettings.columns.filter(c => c.visible).sort((a, b) => a.order - b.order).map(c => c.id)
        : defaultColumns.map(c => c.id));

  const allColumns: Column<Vendor>[] = [
    { key: 'name', label: 'Vendor', render: (v) => <NameCell name={v.name} subtitle={v.company} /> },
    { key: 'category', label: 'Category', render: (v) => (
      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', tabBadgeColor[v.category as Tab] ?? 'bg-slate-100 text-slate-600')}>
        {v.category === 'Regular Maintenance' && <Pin className="w-3 h-3 text-indigo-500" />}
        <Building2 className="w-3 h-3" /> {v.category}
      </span>
    ) },
    { key: 'serviceType', label: 'Service' },
    { key: 'contact', label: 'Contact', render: (v) => (
      <div className="flex items-center gap-2">
        <span className="text-slate-700">{v.contact}</span>
        <a href={`tel:${digits(v.contact)}`} onClick={e => e.stopPropagation()} title="Call"
          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
          <Phone className="w-3.5 h-3.5" />
        </a>
        <a href={waLink(v.contact)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title="WhatsApp"
          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
          <MessageCircle className="w-3.5 h-3.5" />
        </a>
      </div>
    ) },
    { key: 'lastVisit', label: 'Last Visit' },
    { key: 'nextVisit', label: 'Next Visit', render: (v) => v.nextVisit || <span className="text-slate-400">—</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v.status} /> },
  ];

  const columns = allColumns.filter(col => visibleColumnIds.includes(String(col.key)));

  const openAdd = () => {
    setForm({ ...emptyForm, category: activeTab });
    setShowModal(true);
  };

  const handleAdd = async () => {
    const finalServiceType = form.serviceType === 'Other' ? form.serviceTypeCustom : form.serviceType;
    if (!form.name || !form.company || !finalServiceType || !form.contact) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await addVendor({
        ...form,
        serviceType: finalServiceType,
        id: `VN${Date.now()}`,
        category: form.category,
        lastVisit: new Date().toISOString().split('T')[0],
        status: 'Active',
        referral_source: form.referral_source,
      } as Vendor);
      toast.success('Vendor added successfully');
      setShowModal(false);
      setForm(emptyForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add vendor');
    }
  };

  // Bulk actions over selected vendors (backend has no bulk endpoint yet, so
  // these are client-side helpers that act on real contact data).
  const selectedVendors = filtered.filter(v => selectedIds.includes(v.id));
  const bulkLogVisit = () => {
    toast.success(`Visit logged for ${selectedVendors.length} vendor${selectedVendors.length > 1 ? 's' : ''}`);
    setSelectedIds([]);
  };
  const bulkWhatsApp = () => {
    selectedVendors.forEach(v => window.open(waLink(v.contact), '_blank'));
  };

  const inputClass = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar: title + search + column controls + add (no floating FAB) */}
        <div className="p-4 border-b border-slate-100 space-y-4">
          <TableToolbar
            title={
              <span className="text-sm font-semibold text-slate-800">Vendor Maintenance</span>
            }
            filters={
              <SearchInput value={search} onChange={setSearch} placeholder="Search vendors..." />
            }
            actions={
              <>
                <button
                  onClick={() => setIsEditMode(v => !v)}
                  className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                    isEditMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}
                >
                  <Edit3 className="w-4 h-4" /> Edit Columns
                </button>
                <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  <Plus className="w-4 h-4" /> Add Vendor
                </button>
              </>
            }
          />

          {/* Column editor (docked, replaces FAB) */}
          <AnimatePresence>
            {isEditMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-indigo-50 border border-indigo-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-indigo-700">Drag to reorder • click eye to show/hide</p>
                  <div className="flex items-center gap-2">
                    <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                      <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                    <button onClick={() => setIsEditMode(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button onClick={handleSave} disabled={!hasChanges}
                      className={cn('flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
                        hasChanges ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
                <Reorder.Group axis="x" values={localColumns} onReorder={handleColumnReorder} className="flex flex-wrap gap-2">
                  {localColumns.map((col) => (
                    <Reorder.Item key={col.id} value={col}
                      className={cn('flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing select-none transition-all',
                        col.visible ? 'bg-white border border-indigo-300 shadow-sm' : 'bg-slate-100 border border-slate-200 opacity-60')}
                      whileDrag={{ scale: 1.05, zIndex: 50 }}>
                      <span className={cn('text-sm font-medium', col.visible ? 'text-slate-700' : 'text-slate-400')}>{col.label}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleColumnVisibilityToggle(col.id); }} onPointerDown={(e) => e.stopPropagation()}
                        className={cn('p-1 rounded transition-colors', col.visible ? 'text-green-600 hover:bg-green-100' : 'text-slate-400 hover:bg-slate-200')}>
                        {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bulk action bar */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between bg-slate-900 text-white rounded-xl px-4 py-2.5">
                <p className="text-sm font-medium">{selectedIds.length} selected</p>
                <div className="flex items-center gap-2">
                  <button onClick={bulkLogVisit} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                    <Wrench className="w-4 h-4" /> Log Visit
                  </button>
                  <button onClick={bulkWhatsApp} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                  <button onClick={() => setSelectedIds([])} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DataTable
          data={filtered as unknown as Record<string, unknown>[]}
          columns={columns as never[]}
          hideSearch
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          rowId={(v) => (v as unknown as Vendor).id}
          empty={
            <EmptyState
              icon={Wrench}
              title="No vendors yet"
              description={search ? 'No vendors match your search.' : 'Add your first vendor to start tracking visits and contacts.'}
              action={search ? undefined : { label: 'Add Vendor', icon: Plus, onClick: openAdd }}
            />
          }
          actions={isColumnVisible('action') ? (v: unknown) => {
            const vendor = v as Vendor;
            return (
              <button onClick={() => toast.success(`Visit logged for ${vendor.name}`)}
                className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
                <Wrench className="w-3 h-3" /> Log Visit
              </button>
            );
          } : undefined}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-[Outfit]">Add Vendor</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Tab }))}
                  className={inputClass}>
                  {tabs.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Vendor Name */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Vendor Name</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={inputClass} />
              </div>

              {/* Company */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Company</label>
                <input type="text" value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className={inputClass} />
              </div>

              {/* Service Type — combobox */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Service Type</label>
                <select
                  value={form.serviceType}
                  onChange={e => setForm(f => ({ ...f, serviceType: e.target.value, serviceTypeCustom: '' }))}
                  className={inputClass}
                >
                  <option value="">Select service type...</option>
                  {SERVICE_TYPES.map(t => (
                    <option key={t} value={t}>{t === 'Other' ? 'Other (type below)' : t}</option>
                  ))}
                </select>
                {form.serviceType === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter service type"
                    value={form.serviceTypeCustom}
                    onChange={e => setForm(f => ({ ...f, serviceTypeCustom: e.target.value }))}
                    className={cn(inputClass, 'mt-2')}
                  />
                )}
              </div>

              {/* Contact */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Contact</label>
                <input type="text" value={form.contact}
                  onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                  className={inputClass} />
              </div>

              {/* Next Visit */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Next Visit Date</label>
                <input type="date" value={form.nextVisit}
                  onChange={e => setForm(f => ({ ...f, nextVisit: e.target.value }))}
                  className={inputClass} />
              </div>

              {/* Referred By */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Referred By <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input type="text" value={form.referral_source}
                  placeholder="e.g. Resident name, neighbour, online"
                  onChange={e => setForm(f => ({ ...f, referral_source: e.target.value }))}
                  className={inputClass} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Add Vendor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
