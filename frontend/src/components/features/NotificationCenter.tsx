import { useEffect, useMemo, useState } from 'react';
import { Bell, Eye, Filter, Megaphone, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AppNotification, NotificationSummary } from '@/types';
import type { NotificationCreatePayload } from '@/lib/api';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/useAppStore';
import DataTable, { type Column } from '@/components/features/DataTable';
import SearchInput from '@/components/features/SearchInput';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type NotificationRole = 'admin' | 'security' | 'tenant';

const priorityOptions = ['All', 'Low', 'Medium', 'High', 'Emergency'] as const;
const typeOptions = [
  'Announcement',
  'Emergency Alert',
  'System Notification',
  'Maintenance Reminder',
  'Rental Approved',
  'Rental Rejected',
] as const;

function formatWhen(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const emptySummary: NotificationSummary = {
  totalCount: 0,
  unreadCount: 0,
  todayCount: 0,
  highPriorityCount: 0,
};

export default function NotificationCenter({
  role,
  title,
  description,
  allowCreate = false,
  allowDelete = false,
}: {
  role: NotificationRole;
  title: string;
  description: string;
  allowCreate?: boolean;
  allowDelete?: boolean;
}) {
  const navigate = useNavigate();
  const { markRead, markAllRead, refreshNotifications } = useAppStore();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [priority, setPriority] = useState<(typeof priorityOptions)[number]>('All');
  const [category, setCategory] = useState('All');
  const [date, setDate] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState<NotificationCreatePayload>({
    title: '',
    message: '',
    type: 'Announcement',
    category: 'Announcement',
    priority: 'Medium',
    roles: ['tenant'],
  });

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.notifications.list(role, {
        perPage: 100,
        search,
        read: readFilter === 'all' ? undefined : readFilter,
        priority: priority === 'All' ? undefined : priority,
        category: category === 'All' ? undefined : category,
        date: date || undefined,
        sort,
      });
      setItems(result.items);
      setSummary(result.summary);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [role, search, readFilter, priority, category, date, sort]);

  const categories = useMemo(() => {
    const values = Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b));
    return ['All', ...values];
  }, [items]);

  const stats = [
    { label: 'Unread Notifications', value: summary.unreadCount, tone: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { label: "Today's Notifications", value: summary.todayCount, tone: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { label: 'High Priority Alerts', value: summary.highPriorityCount, tone: 'text-red-600 bg-red-50 border-red-100' },
  ];

  const openDetail = async (item: AppNotification) => {
    setSelected(item);
    if (!item.isRead) {
      try {
        await markRead(item.id);
        setItems((current) => current.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)));
        setSummary((current) => ({ ...current, unreadCount: Math.max(0, current.unreadCount - 1) }));
      } catch {
        // no-op
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.notifications.remove(id);
      setItems((current) => current.filter((row) => row.id !== id));
      await refreshNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete notification');
    }
  };

  const handleCompose = async () => {
    try {
      await api.notifications.create(compose);
      setComposeOpen(false);
      setCompose({
        title: '',
        message: '',
        type: 'Announcement',
        category: 'Announcement',
        priority: 'Medium',
        roles: ['tenant'],
      });
      await Promise.all([load(), refreshNotifications()]);
      toast.success('Notification sent');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create notification');
    }
  };

  const columns: Column<AppNotification>[] = [
    {
      key: 'title',
      label: 'Notification',
      className: 'min-w-[300px]',
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900">{item.title}</p>
            {!item.isRead && <Badge variant="destructive" className="rounded-full px-1.5 text-[10px]">Unread</Badge>}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.message}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (item) => (
        <div className="space-y-1">
          <Badge variant="outline" className="rounded-full">{item.type}</Badge>
          <div className="text-[11px] text-slate-400">{item.category}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (item) => <StatusBadge status={item.priority} />,
    },
    {
      key: 'createdAt',
      label: 'Time',
      render: (item) => <span className="text-xs text-slate-500">{formatWhen(item.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[Outfit] text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => markAllRead().then(() => load()).then(() => refreshNotifications()).catch(() => undefined)}>
            <Eye className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
          {allowCreate && (
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl">
                  <Megaphone className="mr-2 h-4 w-4" />
                  New Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Create Notification</DialogTitle>
                  <DialogDescription>Send announcements, maintenance reminders, or emergency alerts without leaving the notification center.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="notification-title">Title</Label>
                    <Input id="notification-title" value={compose.title} onChange={(e) => setCompose((current) => ({ ...current, title: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notification-message">Message</Label>
                    <Textarea id="notification-message" rows={4} value={compose.message} onChange={(e) => setCompose((current) => ({ ...current, message: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" value={compose.type} onChange={(e) => setCompose((current) => ({ ...current, type: e.target.value as NotificationCreatePayload['type'], category: e.target.value }))}>
                        {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Priority</Label>
                      <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" value={compose.priority} onChange={(e) => setCompose((current) => ({ ...current, priority: e.target.value as NotificationCreatePayload['priority'] }))}>
                        {priorityOptions.filter((option) => option !== 'All').map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Audience</Label>
                      <select
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                        value={(compose.roles?.[0] ?? 'all')}
                        onChange={(e) => setCompose((current) => ({ ...current, roles: e.target.value === 'all' ? undefined : [e.target.value as NotificationRole] }))}
                      >
                        <option value="all">All users</option>
                        <option value="admin">Admins</option>
                        <option value="security">Security</option>
                        <option value="tenant">Tenants</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notification-action">Action URL</Label>
                    <Input id="notification-action" placeholder="/financials" value={compose.actionUrl ?? ''} onChange={(e) => setCompose((current) => ({ ...current, actionUrl: e.target.value || undefined }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
                  <Button onClick={handleCompose} disabled={!compose.title.trim() || !compose.message.trim()}>Send Notification</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.label} className={item.tone}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-[Outfit]">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notification Feed
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onChange={setSearch} className="w-full sm:w-72" placeholder="Search title, message, type..." />
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              Filters
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={readFilter} onValueChange={(value) => setReadFilter(value as typeof readFilter)}>
            <TabsList className="grid w-full grid-cols-3 rounded-xl">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
              {priorityOptions.map((option) => <option key={option} value={option}>{option} Priority</option>)}
            </select>
            <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((option) => <option key={option} value={option}>{option} Category</option>)}
            </select>
            <input className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="priority">Priority first</option>
            </select>
          </div>

          <DataTable
            data={items}
            columns={columns}
            pageSize={12}
            hideSearch
            zebra
            empty={
              <EmptyState
                title={loading ? 'Loading notifications...' : 'No notifications found'}
                description={loading ? 'Please wait while we load your latest updates.' : 'Try adjusting your search or filters.'}
              />
            }
            actions={(item) => (
              <>
                <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => openDetail(item)}>
                  <Eye className="h-4 w-4" />
                </Button>
                {!item.isRead && (
                  <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => markRead(item.id).then(() => load()).then(() => refreshNotifications()).catch(() => undefined)}>
                    Mark read
                  </Button>
                )}
                {allowDelete && (
                  <Button variant="ghost" size="sm" className="rounded-lg text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>{selected ? formatWhen(selected.createdAt) : ''}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selected.priority} />
                <Badge variant="outline">{selected.type}</Badge>
                <Badge variant="secondary">{selected.category}</Badge>
              </div>
              <p className="text-sm leading-6 text-slate-600">{selected.message}</p>
              <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                <div><span className="font-medium text-slate-900">Reference:</span> {selected.referenceType ? `${selected.referenceType} #${selected.referenceId ?? 'N/A'}` : 'Not linked'}</div>
                <div><span className="font-medium text-slate-900">Created by:</span> {selected.createdByName || 'System'}</div>
                <div><span className="font-medium text-slate-900">Read status:</span> {selected.isRead ? 'Read' : 'Unread'}</div>
              </div>
              <DialogFooter>
                {selected.actionUrl && (
                  <Button onClick={() => navigate(selected.actionUrl!)}>
                    Open related page
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

