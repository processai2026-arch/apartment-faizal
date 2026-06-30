import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, RefreshCcw, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/features/SearchInput';
import EmptyState from '@/components/features/EmptyState';
import StatusBadge from '@/components/features/StatusBadge';
import { useAnnouncementStore } from '@/stores/useAnnouncementStore';
import type { Announcement } from '@/types';

const PRIORITY_COLORS: Record<string, string> = {
  Emergency: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  High: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Medium: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  Low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function AnnouncementCard({ announcement, onView }: { announcement: Announcement; onView: () => void }) {
  const priorityClass = PRIORITY_COLORS[announcement.priority] ?? PRIORITY_COLORS.Low;
  return (
    <div onClick={onView} className={cn('cursor-pointer rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md', announcement.isRead ? 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900' : 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-700/40 dark:bg-indigo-900/10')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', priorityClass)}>
            {announcement.priority === 'Emergency' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cn('font-semibold text-slate-900 dark:text-slate-100', !announcement.isRead && 'font-bold')}>{announcement.title}</h3>
              {!announcement.isRead && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{announcement.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', priorityClass)}>{announcement.priority}</span>
              <span>{new Date(announcement.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
        {announcement.isRead ? <BellOff className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" /> : <Bell className="h-4 w-4 shrink-0 text-indigo-500" />}
      </div>
    </div>
  );
}

export default function Announcements() {
  const navigate = useNavigate();
  const { announcements, unreadCount, loadAnnouncements, loadUnreadCount, markRead } = useAnnouncementStore();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      loadAnnouncements({ search: search || undefined, priority: priority || undefined }),
      loadUnreadCount(),
    ]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed')).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [search, priority]); // eslint-disable-line

  const handleView = async (a: Announcement) => {
    if (!a.isRead) { try { await markRead(a.id); } catch { /* noop */ } }
    navigate(`/tenant/announcements/${a.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Announcements</h1>
          {unreadCount > 0 && <p className="text-sm text-indigo-600 font-medium">{unreadCount} unread</p>}
        </div>
        <button onClick={refresh} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
          <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search announcements…" /></div>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <option value="">All Priorities</option>
          {['Emergency', 'High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {announcements.length === 0 ? (
        <EmptyState icon={Bell} title="No announcements" description="You're all caught up!" />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => <AnnouncementCard key={a.id} announcement={a} onView={() => handleView(a)} />)}
        </div>
      )}
    </div>
  );
}
