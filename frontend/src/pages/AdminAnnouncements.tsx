import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Send, RefreshCcw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/features/SearchInput';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import WhatsAppShareButton from '@/components/features/WhatsAppShareButton';
import { announcementPayload } from '@/lib/whatsapp';
import { useAnnouncementStore } from '@/stores/useAnnouncementStore';
import type { Announcement } from '@/types';

const PRIORITY_COLORS: Record<string, string> = {
  Emergency: 'bg-rose-100 text-rose-700',
  High: 'bg-amber-100 text-amber-700',
  Medium: 'bg-sky-100 text-sky-700',
  Low: 'bg-slate-100 text-slate-600',
};

export default function AdminAnnouncements() {
  const { adminAnnouncements, loadAdminAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, publishAnnouncement } = useAnnouncementStore();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<(Partial<Announcement> & { publishNow?: boolean }) | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    setLoading(true);
    loadAdminAnnouncements({ search: search || undefined })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [search]); // eslint-disable-line

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      if (form.id) { await updateAnnouncement(form.id, form); toast.success('Updated'); }
      else { await createAnnouncement(form); toast.success('Created'); }
      setForm(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try { await deleteAnnouncement(id); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const handlePublish = async (id: string) => {
    try { await publishAnnouncement(id); toast.success('Published and notifications sent'); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Announcements</h1>
          <p className="text-sm text-slate-500">Publish announcements to residents</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setForm({ priority: 'Medium', audience: 'All', status: 'Draft' })} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search announcements…" />

      {adminAnnouncements.length === 0 ? (
        <EmptyState icon={Bell} title="No announcements yet" description="Create your first announcement." />
      ) : (
        <div className="space-y-3">
          {adminAnnouncements.map((a) => (
            <div key={a.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{a.title}</h3>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', PRIORITY_COLORS[a.priority])}>{a.priority}</span>
                    <StatusBadge status={a.status} size="sm" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{a.description}</p>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Audience: {a.audience}
                    {a.publishAt && <span className="ml-2"><Clock className="inline h-3 w-3" /> {new Date(a.publishAt).toLocaleString('en-IN')}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {(a.status === 'Draft' || a.status === 'Scheduled') && (
                    <button onClick={() => handlePublish(a.id)} className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                      <Send className="h-3.5 w-3.5" /> Publish
                    </button>
                  )}
                  {a.status === 'Published' && (
                    <WhatsAppShareButton
                      size="sm"
                      variant="outline"
                      payload={announcementPayload({
                        title: a.title,
                        body: a.description,
                        date: a.publishAt
                          ? new Date(a.publishAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                      })}
                    />
                  )}
                  <button onClick={() => setForm(a)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700">
                    <Bell className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">{form.id ? 'Edit Announcement' : 'New Announcement'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Title *</label>
                <input required value={form.title ?? ''} onChange={(e) => setForm((f) => f && { ...f, title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
                <textarea required rows={4} value={form.description ?? ''} onChange={(e) => setForm((f) => f && { ...f, description: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
                  <select value={form.priority ?? 'Medium'} onChange={(e) => setForm((f) => f && { ...f, priority: e.target.value as Announcement['priority'] })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {['Low', 'Medium', 'High', 'Emergency'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Audience</label>
                  <select value={form.audience ?? 'All'} onChange={(e) => setForm((f) => f && { ...f, audience: e.target.value as Announcement['audience'] })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {['All', 'Tenants', 'Security', 'Admin'].map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Schedule Publish At (leave blank to save as draft)</label>
                <input type="datetime-local" value={form.publishAt ?? ''} onChange={(e) => setForm((f) => f && { ...f, publishAt: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Expires At</label>
                <input type="datetime-local" value={form.expiresAt ?? ''} onChange={(e) => setForm((f) => f && { ...f, expiresAt: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex items-center gap-2">
                <input id="publishNow" type="checkbox" checked={form.publishNow ?? false} onChange={(e) => setForm((f) => f && { ...f, publishNow: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                <label htmlFor="publishNow" className="text-sm font-medium text-slate-700 dark:text-slate-300">Publish immediately and notify residents</label>
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
