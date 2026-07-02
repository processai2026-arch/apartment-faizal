import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Trash2, RefreshCcw, Phone, Pin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/features/SearchInput';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import WhatsAppShareButton from '@/components/features/WhatsAppShareButton';
import { emergencyContactPayload } from '@/lib/whatsapp';
import { useEmergencyStore } from '@/stores/useEmergencyStore';
import type { EmergencyContact } from '@/types';

const CATEGORIES = ['Police', 'Fire', 'Hospital', 'Ambulance', 'Electrician', 'Plumber', 'Apartment Office', 'Security', 'Other'];

export default function AdminEmergencyContacts() {
  const { contacts, loadAdminContacts, createContact, updateContact, deleteContact } = useEmergencyStore();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<EmergencyContact> | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    setLoading(true);
    loadAdminContacts({ search: search || undefined })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [search]); // eslint-disable-line

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      if (form.id) { await updateContact(form.id, form); toast.success('Contact updated'); }
      else { await createContact(form); toast.success('Contact added'); }
      setForm(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    try { await deleteContact(id); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Emergency Contacts</h1>
          <p className="text-sm text-slate-500">Manage emergency numbers for residents</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setForm({ category: 'Other', status: 'Active', priority: 0, available24h: false, isPinned: false })} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add Contact
          </button>
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search contacts…" />

      {contacts.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No contacts yet" description="Add your first emergency contact." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {contacts.map((c) => (
            <div key={c.id} className={cn('rounded-2xl border p-4 shadow-sm dark:bg-slate-900', c.isPinned ? 'border-rose-200 bg-rose-50/50 dark:border-rose-800/40' : 'border-slate-100 bg-white dark:border-slate-800')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    {c.isPinned && <Pin className="h-3.5 w-3.5 text-rose-500" />}
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</h3>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{c.category}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"><Phone className="h-3 w-3" /> {c.phone}</a>
                    {c.available24h && <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><Clock className="h-2.5 w-2.5" /> 24h</span>}
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <WhatsAppShareButton
                    size="sm"
                    variant="outline"
                    payload={emergencyContactPayload({
                      name: c.name,
                      role: c.category,
                      phone: c.phone,
                    })}
                  />
                  <button onClick={() => setForm(c)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700"><ShieldAlert className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(c.id)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">{form.id ? 'Edit Contact' : 'Add Emergency Contact'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
                <input required value={form.name ?? ''} onChange={(e) => setForm((f) => f && { ...f, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category *</label>
                <select required value={form.category ?? 'Other'} onChange={(e) => setForm((f) => f && { ...f, category: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone *</label>
                  <input required type="tel" value={form.phone ?? ''} onChange={(e) => setForm((f) => f && { ...f, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Alternate Phone</label>
                  <input type="tel" value={form.alternatePhone ?? ''} onChange={(e) => setForm((f) => f && { ...f, alternatePhone: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Priority (higher = shows first)</label>
                <input type="number" value={form.priority ?? 0} onChange={(e) => setForm((f) => f && { ...f, priority: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.available24h ?? false} onChange={(e) => setForm((f) => f && { ...f, available24h: e.target.checked })} className="h-4 w-4 rounded" />
                  Available 24h
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.isPinned ?? false} onChange={(e) => setForm((f) => f && { ...f, isPinned: e.target.checked })} className="h-4 w-4 rounded" />
                  Pin to top
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
