import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Plus, RefreshCcw, Send, XCircle, Trash2, Users, Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/useEventStore';
import StatusBadge from '@/components/features/StatusBadge';
import SearchInput from '@/components/features/SearchInput';
import EmptyState from '@/components/features/EmptyState';
import type { CommunityEvent, EventRegistration } from '@/types';
import { api } from '@/lib/api';

type Tab = 'dashboard' | 'list' | 'create';

const STATUS_OPTIONS = ['All', 'Draft', 'Published', 'Cancelled', 'Completed'];

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Published: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
  Completed: 'bg-blue-100 text-blue-700',
};

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function EventFormDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<CommunityEvent> | null;
  onClose: () => void;
  onSave: (data: Partial<CommunityEvent>) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<CommunityEvent>>(
    initial ?? { status: 'Draft', capacity: 0, registrationRequired: false, visibility: 'All Residents', category: 'General' }
  );
  const [saving, setSaving] = useState(false);

  const set = (field: keyof CommunityEvent, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.eventDate) {
      toast.error('Title and Event Date are required');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-900 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            {initial?.id ? 'Edit Event' : 'Create Event'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title *</label>
            <input
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Event Date *</label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.eventDate ?? ''}
                onChange={(e) => set('eventDate', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Event Time</label>
              <input
                type="time"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.eventTime ?? ''}
                onChange={(e) => set('eventTime', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Location</label>
            <input
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.location ?? ''}
              onChange={(e) => set('location', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Organizer</label>
            <input
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.organizer ?? ''}
              onChange={(e) => set('organizer', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Capacity (0 = Unlimited)</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.capacity ?? 0}
                onChange={(e) => set('capacity', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.status ?? 'Draft'}
                onChange={(e) => set('status', e.target.value as CommunityEvent['status'])}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reg_required"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              checked={form.registrationRequired ?? false}
              onChange={(e) => set('registrationRequired', e.target.checked)}
            />
            <label htmlFor="reg_required" className="text-sm text-slate-700 dark:text-slate-300">Registration Required</label>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Visibility / Share To</label>
            <select
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={(form as { visibility?: string }).visibility ?? 'All Residents'}
              onChange={(e) => set('visibility' as keyof CommunityEvent, e.target.value)}
            >
              <option value="All Residents">All Residents</option>
              <option value="Secretary Only">Secretary Only</option>
              <option value="Associate Members">Associate Members</option>
              <option value="Public">Public</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
            <select
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.category ?? 'General'}
              onChange={(e) => set('category', e.target.value as CommunityEvent['category'])}
            >
              <option value="General">General</option>
              <option value="Sports">Sports (chess tournaments, indoor games)</option>
              <option value="Evening Stall">Evening Stall (stalls set up by residents)</option>
              <option value="Cultural">Cultural</option>
              <option value="Educational">Educational (workshops, classes)</option>
              <option value="Community Sale">Community Sale (buy/sell among residents)</option>
              <option value="Fitness">Fitness (yoga, exercise groups)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving…' : (initial?.id ? 'Save Changes' : 'Create Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventDetailDialog({ event, onClose, onPublish, onCancel, onDelete }: {
  event: CommunityEvent;
  onClose: () => void;
  onPublish: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  useEffect(() => {
    if (!event.id) return;
    setLoadingRegs(true);
    api.events.adminRegistrations(event.id)
      .then(setRegistrations)
      .catch(() => null)
      .finally(() => setLoadingRegs(false));
  }, [event.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl dark:bg-slate-900 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">{event.title}</h2>
              <StatusBadge status={event.status} size="sm" />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{event.eventDate}{event.eventTime && ` at ${event.eventTime}`}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 ml-2 flex-shrink-0">
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {event.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{event.description}</p>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {event.location && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
                {event.location}
              </div>
            )}
            {event.organizer && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Users className="h-4 w-4 flex-shrink-0 text-slate-400" />
                {event.organizer}
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Users className="h-4 w-4 flex-shrink-0 text-slate-400" />
              Capacity: {event.capacity === 0 ? 'Unlimited' : event.capacity}
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Users className="h-4 w-4 flex-shrink-0 text-slate-400" />
              Registrations: {event.registrationCount ?? 0}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {event.status === 'Draft' && (
              <button
                onClick={() => { onPublish(event.id); onClose(); }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                <Send className="h-3.5 w-3.5" /> Publish
              </button>
            )}
            {(event.status === 'Draft' || event.status === 'Published') && (
              <button
                onClick={() => { onCancel(event.id); onClose(); }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel Event
              </button>
            )}
            <button
              onClick={() => { if (confirm('Delete this event?')) { onDelete(event.id); onClose(); } }}
              className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>

          {/* Registrations table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Registrations</h3>
            {loadingRegs ? (
              <div className="text-xs text-slate-500 py-4 text-center">Loading…</div>
            ) : registrations.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No registrations yet.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-slate-500">
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Phone</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{r.name}</td>
                        <td className="px-3 py-2 text-slate-500">{r.phone ?? '—'}</td>
                        <td className="px-3 py-2"><StatusBadge status={r.status} size="sm" /></td>
                        <td className="px-3 py-2 text-slate-400">{r.registeredAt ? new Date(r.registeredAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminEvents() {
  const { adminEvents, dashboard, loading, loadAdminEvents, loadDashboard, createEvent, updateEvent, publishEvent, cancelEvent, deleteEvent } = useEventStore();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formEvent, setFormEvent] = useState<Partial<CommunityEvent> | null>(null);
  const [detailEvent, setDetailEvent] = useState<CommunityEvent | null>(null);

  const refresh = useCallback(() => {
    loadAdminEvents({
      search: search || undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
    }).catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to load events'));
  }, [loadAdminEvents, search, statusFilter]);

  useEffect(() => {
    if (tab === 'dashboard') {
      loadDashboard().catch(() => null);
    }
    if (tab === 'list') {
      refresh();
    }
  }, [tab, search, statusFilter]); // eslint-disable-line

  const handleSave = async (data: Partial<CommunityEvent>) => {
    try {
      if (formEvent?.id) {
        await updateEvent(formEvent.id, data);
        toast.success('Event updated');
      } else {
        await createEvent(data);
        toast.success('Event created');
      }
      setFormEvent(null);
      setTab('list');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handlePublish = async (id: string) => {
    try { await publishEvent(id); toast.success('Event published'); refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleCancel = async (id: string) => {
    try { await cancelEvent(id); toast.success('Event cancelled'); refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteEvent(id); toast.success('Event deleted'); refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Community Events</h1>
          <p className="text-sm text-slate-500">Manage events & notice board</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { if (tab === 'list') refresh(); else loadDashboard().catch(() => null); }}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700"
          >
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={() => { setFormEvent({}); setTab('create'); }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> New Event
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 w-fit">
        {(['dashboard', 'list'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all',
              tab === t ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {t === 'dashboard' ? 'Dashboard' : 'Events List'}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Upcoming Events" value={dashboard?.upcomingCount ?? 0} icon={CalendarDays} color="bg-indigo-500" />
            <KpiCard label="This Month" value={dashboard?.thisMonthCount ?? 0} icon={Calendar} color="bg-sky-500" />
            <KpiCard label="Total Published" value={dashboard?.totalPublished ?? 0} icon={Send} color="bg-emerald-500" />
            <KpiCard label="Today's Registrations" value={dashboard?.todayRegistrations ?? 0} icon={Users} color="bg-amber-500" />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Events</h2>
            {(dashboard?.recentEvents ?? []).length === 0 ? (
              <EmptyState icon={CalendarDays} title="No events yet" description="Create your first community event." />
            ) : (
              <div className="space-y-2">
                {(dashboard?.recentEvents ?? []).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => { setDetailEvent(ev); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                        <CalendarDays className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{ev.title}</p>
                        <p className="text-xs text-slate-400">{ev.eventDate}{ev.location && ` · ${ev.location}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Users className="h-3.5 w-3.5" />
                        {ev.registrationCount ?? 0}
                      </div>
                      <StatusBadge status={ev.status} size="sm" />
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* List tab */}
      {tab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-48">
              <SearchInput value={search} onChange={setSearch} placeholder="Search events…" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>
          ) : adminEvents.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No events found" description="Create your first community event or adjust filters." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Regs</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminEvents.map((ev) => (
                    <tr
                      key={ev.id}
                      className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer"
                      onClick={() => setDetailEvent(ev)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[220px]">{ev.title}</p>
                        {ev.organizer && <p className="text-xs text-slate-400">{ev.organizer}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" />{ev.eventDate}</div>
                        {ev.eventTime && <div className="flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3 w-3" />{ev.eventTime}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[120px] truncate">{ev.location ?? '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={ev.status} size="sm" /></td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Users className="h-3.5 w-3.5" />{ev.registrationCount ?? 0}
                          {ev.capacity > 0 && <span className="text-slate-400">/{ev.capacity}</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {ev.status === 'Draft' && (
                            <button
                              onClick={() => handlePublish(ev.id)}
                              className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400"
                            >
                              Publish
                            </button>
                          )}
                          {(ev.status === 'Draft' || ev.status === 'Published') && (
                            <button
                              onClick={() => handleCancel(ev.id)}
                              className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => { if (confirm('Delete this event?')) handleDelete(ev.id); }}
                            className="rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit form dialog */}
      {(tab === 'create' || formEvent !== null) && (
        <EventFormDialog
          initial={formEvent}
          onClose={() => { setFormEvent(null); if (tab === 'create') setTab('list'); }}
          onSave={handleSave}
        />
      )}

      {/* Detail dialog */}
      {detailEvent && (
        <EventDetailDialog
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onPublish={handlePublish}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
