import { useState, useEffect } from 'react';
import { Plus, X, MessageSquareText, RefreshCcw, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';

interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  flatInterest?: string;
  message: string;
  status: 'New' | 'Contacted' | 'Resolved';
  createdAt: string;
}

const STORAGE_KEY = 'og.apartment.enquiries';

function loadEnquiries(): Enquiry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

function saveEnquiries(data: Enquiry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const empty = { name: '', phone: '', email: '', flatInterest: '', message: '' };

export default function ApartmentEnquiry() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'All' | 'New' | 'Contacted' | 'Resolved'>('All');

  useEffect(() => { setEnquiries(loadEnquiries()); }, []);

  const filtered = filter === 'All' ? enquiries : enquiries.filter(e => e.status === filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error('Name, phone and message are required');
      return;
    }
    setSaving(true);
    const newEnquiry: Enquiry = {
      id: `ENQ-${Date.now()}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      flatInterest: form.flatInterest.trim() || undefined,
      message: form.message.trim(),
      status: 'New',
      createdAt: new Date().toISOString(),
    };
    const updated = [newEnquiry, ...enquiries];
    setEnquiries(updated);
    saveEnquiries(updated);
    toast.success('Enquiry recorded');
    setForm(empty);
    setShowForm(false);
    setSaving(false);
  };

  const updateStatus = (id: string, status: Enquiry['status']) => {
    const updated = enquiries.map(e => e.id === id ? { ...e, status } : e);
    setEnquiries(updated);
    saveEnquiries(updated);
    toast.success(`Marked as ${status}`);
  };

  const deleteEnquiry = (id: string) => {
    if (!confirm('Delete this enquiry?')) return;
    const updated = enquiries.filter(e => e.id !== id);
    setEnquiries(updated);
    saveEnquiries(updated);
    toast.success('Deleted');
  };

  const newCount = enquiries.filter(e => e.status === 'New').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <MessageSquareText className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-[Outfit]">Apartment Enquiries</h1>
            <p className="text-sm text-slate-500">Manage flat availability and incoming enquiries</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Enquiry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['New', 'Contacted', 'Resolved'] as const).map(s => (
          <div key={s} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center cursor-pointer hover:border-indigo-300" onClick={() => setFilter(filter === s ? 'All' : s)}>
            <p className="text-2xl font-bold text-slate-900">{enquiries.filter(e => e.status === s).length}</p>
            <p className="text-xs text-slate-500 mt-1">{s}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['All', 'New', 'Contacted', 'Resolved'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900')}>
            {f} {f === 'New' && newCount > 0 && <span className="ml-1 bg-white/30 rounded px-1">{newCount}</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="No enquiries" description="No enquiries in this category yet." action={{ label: 'Add Enquiry', icon: Plus, onClick: () => setShowForm(true) }} />
      ) : (
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900">{e.name}</p>
                    <StatusBadge status={e.status} />
                    <span className="text-xs text-slate-400">{e.id}</span>
                  </div>
                  <p className="text-sm text-slate-600">{e.phone}{e.email ? ` • ${e.email}` : ''}</p>
                  {e.flatInterest && <p className="text-xs text-indigo-600 mt-1">Interested in: {e.flatInterest}</p>}
                  <p className="text-sm text-slate-700 mt-2 bg-slate-50 rounded-lg px-3 py-2">{e.message}</p>
                  <p className="text-xs text-slate-400 mt-2">{new Date(e.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {e.status === 'New' && (
                    <button onClick={() => updateStatus(e.id, 'Contacted')} className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg">
                      <Clock className="h-3 w-3" /> Contact
                    </button>
                  )}
                  {e.status === 'Contacted' && (
                    <button onClick={() => updateStatus(e.id, 'Resolved')} className="flex items-center gap-1 text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg">
                      <CheckCircle2 className="h-3 w-3" /> Resolve
                    </button>
                  )}
                  <button onClick={() => deleteEnquiry(e.id)} className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Enquiry Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold font-[Outfit]">New Apartment Enquiry</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enquirer name" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Phone *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91XXXXXXXXXX" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="optional" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Flat / Unit Interest</label>
                  <input value={form.flatInterest} onChange={e => setForm(f => ({ ...f, flatInterest: e.target.value }))} placeholder="e.g. 2BHK, Block A" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Message / Notes *</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="Enquiry details..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
