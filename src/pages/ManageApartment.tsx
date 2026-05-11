import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, X, Building2, Users, Car } from 'lucide-react';
import DataTable from '@/components/features/DataTable';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import type { Office } from '@/types';
import { toast } from 'sonner';

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
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Office | null>(null);
  const [form, setForm] = useState<Partial<Office>>(emptyOffice);
  const [filter, setFilter] = useState({ status: '', floor: '' });

  // Get unique floors for filter
  const uniqueFloors = [...new Set(offices.map(o => o.floorNumber))].sort();

  const filtered = offices.filter(o => {
    if (filter.status && o.status !== filter.status) return false;
    if (filter.floor && o.floorNumber !== filter.floor) return false;
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

  const columns = [
    { key: 'id', label: 'Office ID', render: (o: Office) => <span className="font-semibold text-slate-900">{o.id}</span> },
    { key: 'block', label: 'Block' },
    { key: 'floorNumber', label: 'Floor', render: (o: Office) => <span>Floor {o.floorNumber}</span> },
    { key: 'companyName', label: 'Company', render: (o: Office) => (
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-indigo-500" />
        <span className="font-medium text-slate-900">{o.companyName}</span>
      </div>
    )},
    { key: 'status', label: 'Status', render: (o: Office) => <StatusBadge status={o.status} /> },
    { key: 'contactPerson', label: 'Contact Person', render: (o: Office) => o.contactPerson || <span className="text-slate-400 italic">—</span> },
    { key: 'allocatedVehicleCount', label: 'Parking', render: (o: Office) => (
      <div className="flex items-center gap-1">
        <Car className="w-4 h-4 text-slate-400" />
        <span>{o.allocatedVehicleCount} slots</span>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
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
      <DataTable 
        data={filtered as unknown as Record<string, unknown>[]} 
        columns={columns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]} 
        searchKeys={['id', 'companyName', 'contactPerson', 'block'] as never[]} 
        searchPlaceholder="Search by ID, company, contact..."
        actions={(office: unknown) => {
          const o = office as Office;
          return (
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(o)} className="p-1.5 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => { toggleOfficeStatus(o.id); toast.success(`Status updated`); }}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Toggle Status">
                <ToggleLeft className="w-4 h-4" />
              </button>
            </div>
          );
        }} 
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in">
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
          </div>
        </div>
      )}
    </div>
  );
}