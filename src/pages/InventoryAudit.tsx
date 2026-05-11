import { useState } from 'react';
import { Plus, X, Package } from 'lucide-react';
import DataTable from '@/components/features/DataTable';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import type { InventoryItem } from '@/types';
import { toast } from 'sonner';

const MONTHLY_BUDGET = 50000;

const emptyForm = { itemName: '', category: 'General', quantity: 1, unitCost: 0, vendor: '', date: new Date().toISOString().split('T')[0] };

export default function InventoryAudit() {
  const { inventory, addInventoryItem } = useAppStore();
  const [activeTab, setActiveTab] = useState<'procurement' | 'usage'>('procurement');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const totalSpent = inventory.reduce((sum, i) => sum + i.totalCost, 0);
  const budgetPct = Math.min((totalSpent / MONTHLY_BUDGET) * 100, 100);

  const handleAdd = () => {
    if (!form.itemName || !form.vendor) { toast.error('Please fill all required fields'); return; }
    const item: InventoryItem = { ...form, id: `I${Date.now()}`, totalCost: form.quantity * form.unitCost, category: form.category as InventoryItem['category'] };
    addInventoryItem(item);
    toast.success('Item added to inventory');
    setShowModal(false);
    setForm(emptyForm);
  };

  const procurementCols = [
    { key: 'itemName', label: 'Item', render: (i: InventoryItem) => <div><p className="font-medium text-slate-900">{i.itemName}</p><p className="text-xs text-slate-400">{i.vendor}</p></div> },
    { key: 'category', label: 'Category', render: (i: InventoryItem) => <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{i.category}</span> },
    { key: 'quantity', label: 'Qty' },
    { key: 'unitCost', label: 'Unit Cost', render: (i: InventoryItem) => `₹${i.unitCost.toLocaleString()}` },
    { key: 'totalCost', label: 'Total', render: (i: InventoryItem) => <span className="font-semibold text-indigo-600">₹{i.totalCost.toLocaleString()}</span> },
    { key: 'date', label: 'Date' },
  ];

  const usageCols = [
    { key: 'itemName', label: 'Item', render: (i: InventoryItem) => <p className="font-medium text-slate-900">{i.itemName}</p> },
    { key: 'usedQuantity', label: 'Used Qty', render: (i: InventoryItem) => <span className="font-medium text-amber-600">{i.usedQuantity ?? 0}</span> },
    { key: 'location', label: 'Location', render: (i: InventoryItem) => i.location || <span className="text-slate-400">—</span> },
    { key: 'usedBy', label: 'Used By', render: (i: InventoryItem) => i.usedBy || <span className="text-slate-400">—</span> },
    { key: 'coverage', label: 'Coverage', render: (i: InventoryItem) => {
      const pct = i.usedQuantity ? Math.round((i.usedQuantity / i.quantity) * 100) : 0;
      return <div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-slate-200 rounded-full"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} /></div><span className="text-xs text-slate-500">{pct}%</span></div>;
    }},
  ];

  return (
    <div className="space-y-6">
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

      {activeTab === 'procurement' ? (
        <DataTable data={inventory as unknown as Record<string, unknown>[]} columns={procurementCols as unknown[]} searchKeys={['itemName', 'vendor', 'category'] as never[]} searchPlaceholder="Search items..." />
      ) : (
        <DataTable data={inventory as unknown as Record<string, unknown>[]} columns={usageCols as unknown[]} searchKeys={['itemName', 'location', 'usedBy'] as never[]} searchPlaceholder="Search usage..." />
      )}

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
