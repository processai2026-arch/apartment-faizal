import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, X } from 'lucide-react';
import DataTable from '@/components/features/DataTable';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import type { Apartment } from '@/types';
import { toast } from 'sonner';

const emptyApt: Partial<Apartment> = { unitNo: '', floor: 1, block: 'A', type: '2BHK', status: 'Vacant', residentName: '', contact: '', monthlyCharge: 3500, paymentStatus: 'Pending' };

export default function ManageApartment() {
  const { apartments, addApartment, updateApartment, toggleApartmentStatus } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Apartment | null>(null);
  const [form, setForm] = useState<Partial<Apartment>>(emptyApt);
  const [filter, setFilter] = useState({ status: '', floor: '' });

  const filtered = apartments.filter(a => {
    if (filter.status && a.status !== filter.status) return false;
    if (filter.floor && String(a.floor) !== filter.floor) return false;
    return true;
  });

  const openAdd = () => { setEditing(null); setForm(emptyApt); setShowModal(true); };
  const openEdit = (apt: Apartment) => { setEditing(apt); setForm(apt); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.unitNo) { toast.error('Unit number is required'); return; }
    if (editing) {
      updateApartment({ ...editing, ...form } as Apartment);
      toast.success('Apartment updated successfully');
    } else {
      addApartment({ ...form, id: `APT${Date.now()}` } as Apartment);
      toast.success('Apartment added successfully');
    }
    setShowModal(false);
  };

  const columns = [
    { key: 'unitNo', label: 'Unit No', render: (a: Apartment) => <span className="font-semibold text-slate-900">{a.unitNo}</span> },
    { key: 'block', label: 'Block' },
    { key: 'floor', label: 'Floor' },
    { key: 'type', label: 'Type', render: (a: Apartment) => <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">{a.type}</span> },
    { key: 'status', label: 'Status', render: (a: Apartment) => <StatusBadge status={a.status} /> },
    { key: 'residentName', label: 'Resident', render: (a: Apartment) => a.residentName || <span className="text-slate-400 italic">—</span> },
    { key: 'contact', label: 'Contact', render: (a: Apartment) => a.contact || <span className="text-slate-400 italic">—</span> },
    { key: 'paymentStatus', label: 'Payment', render: (a: Apartment) => a.paymentStatus ? <StatusBadge status={a.paymentStatus} /> : null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Status</option>
            <option value="Occupied">Occupied</option>
            <option value="Vacant">Vacant</option>
          </select>
          <select value={filter.floor} onChange={e => setFilter(f => ({ ...f, floor: e.target.value }))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Floors</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
          </select>
          <span className="text-sm text-slate-500">{filtered.length} apartments</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Apartment
        </button>
      </div>

      <DataTable data={filtered as Record<string, unknown>[]} columns={columns as unknown[]} searchKeys={['unitNo', 'residentName', 'block'] as never[]} searchPlaceholder="Search by unit, resident..."
        actions={(apt: unknown) => {
          const a = apt as Apartment;
          return (
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => { toggleApartmentStatus(a.id); toast.success(`Status updated`); }}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Toggle Status">
                <ToggleLeft className="w-4 h-4" />
              </button>
            </div>
          );
        }} />

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-[Outfit]">{editing ? 'Edit Apartment' : 'Add Apartment'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[['Unit No', 'unitNo', 'text'], ['Block', 'block', 'text'], ['Floor', 'floor', 'number'], ['Resident Name', 'residentName', 'text'], ['Contact', 'contact', 'text'], ['Monthly Charge (₹)', 'monthlyCharge', 'number']].map(([label, key, type]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
                  <input type={type} value={(form as Record<string, unknown>)[key] as string ?? ''}
                    onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Apartment['type'] }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {['1BHK', '2BHK', '3BHK', 'Studio'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Apartment['status'] }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Occupied">Occupied</option>
                  <option value="Vacant">Vacant</option>
                </select>
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
