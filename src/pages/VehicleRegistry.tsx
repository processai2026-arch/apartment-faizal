import { useState } from 'react';
import { Car, Plus } from 'lucide-react';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import type { Vehicle } from '@/types';
import { toast } from 'sonner';

export default function VehicleRegistry() {
  const { vehicles, addVehicle } = useAppStore();
  const [form, setForm] = useState({ vehicleNo: '', type: '4-Wheeler', ownerName: '', apartmentNo: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleNo || !form.ownerName || !form.apartmentNo) { toast.error('Please fill all fields'); return; }
    const v: Vehicle = { id: `VH${Date.now()}`, ...form, type: form.type as Vehicle['type'], entryTime: new Date().toISOString(), status: 'Inside' };
    addVehicle(v);
    setForm({ vehicleNo: '', type: '4-Wheeler', ownerName: '', apartmentNo: '' });
    toast.success(`Vehicle ${form.vehicleNo} logged successfully`);
  };

  const active = vehicles.filter(v => v.status === 'Inside');
  const recent = vehicles.filter(v => v.status === 'Exited').slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-semibold font-[Outfit] mb-5 flex items-center gap-2"><Car className="w-5 h-5 text-indigo-500" /> Log Vehicle Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[['Vehicle Number', 'vehicleNo', 'text', 'KA-XX-XX-XXXX'], ['Owner / Visitor Name', 'ownerName', 'text', 'Full name'], ['Apartment No.', 'apartmentNo', 'text', 'e.g. A-101']].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
                <input type={type} placeholder={placeholder} value={(form as Record<string, string>)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Vehicle Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {['2-Wheeler', '4-Wheeler', 'Commercial', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Log Entry
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold font-[Outfit]">Active Vehicles Inside ({active.length})</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {active.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm">No vehicles currently inside</p>
              ) : active.map(v => (
                <div key={v.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center"><Car className="w-4 h-4 text-indigo-500" /></div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{v.vehicleNo}</p>
                      <p className="text-xs text-slate-500">{v.type} • {v.ownerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-slate-500 hidden sm:block">{v.apartmentNo}</p>
                    <StatusBadge status={v.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold font-[Outfit]">Recently Exited</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {recent.map(v => (
                <div key={v.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{v.vehicleNo}</p>
                    <p className="text-xs text-slate-400">{v.ownerName} • {v.apartmentNo}</p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
