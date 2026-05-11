import { useState } from 'react';
import { Plus, X, Wrench } from 'lucide-react';
import StatusBadge from '@/components/features/StatusBadge';
import DataTable from '@/components/features/DataTable';
import { useAppStore } from '@/stores/useAppStore';
import type { Vendor } from '@/types';
import { toast } from 'sonner';

type Tab = 'Regular Maintenance' | 'Utility Providers' | 'Ad-Hoc Vendors';
const tabs: Tab[] = ['Regular Maintenance', 'Utility Providers', 'Ad-Hoc Vendors'];

const emptyForm = { name: '', company: '', serviceType: '', contact: '', category: 'Regular Maintenance' as Tab, nextVisit: '' };

export default function VendorManagement() {
  const { vendors, addVendor } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('Regular Maintenance');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = vendors.filter(v => v.category === activeTab);

  const columns = [
    { key: 'name', label: 'Vendor', render: (v: Vendor) => <div><p className="font-medium text-slate-900">{v.name}</p><p className="text-xs text-slate-400">{v.company}</p></div> },
    { key: 'serviceType', label: 'Service' },
    { key: 'contact', label: 'Contact' },
    { key: 'lastVisit', label: 'Last Visit' },
    { key: 'nextVisit', label: 'Next Visit', render: (v: Vendor) => v.nextVisit || <span className="text-slate-400">—</span> },
    { key: 'status', label: 'Status', render: (v: Vendor) => <StatusBadge status={v.status} /> },
  ];

  const handleAdd = () => {
    if (!form.name || !form.company || !form.serviceType || !form.contact) { toast.error('Please fill all required fields'); return; }
    addVendor({ ...form, id: `VN${Date.now()}`, category: activeTab, lastVisit: new Date().toISOString().split('T')[0], status: 'Active' } as Vendor);
    toast.success('Vendor added successfully');
    setShowModal(false);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6">
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

      <DataTable data={filtered as unknown as Record<string, unknown>[]} columns={columns as unknown[]}
        searchKeys={['name', 'company', 'serviceType'] as never[]} searchPlaceholder="Search vendors..."
        actions={(v: unknown) => {
          const vendor = v as Vendor;
          return (
            <button onClick={() => { toast.success(`Visit logged for ${vendor.name}`); }}
              className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
              <Wrench className="w-3 h-3" /> Log Visit
            </button>
          );
        }}
      />

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
    </div>
  );
}
