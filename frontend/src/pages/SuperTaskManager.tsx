import { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, CheckCircle2, Clock, AlertTriangle, Calendar,
  Filter, RefreshCcw, Trash2, Pencil, ChevronDown, Tag,
  ListTodo, TrendingUp, Circle, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';

// ── Types ────────────────────────────────────────────────────────────────────

interface SuperTask {
  id: number;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category?: string;
  dueDate?: string;
  dueTime?: string;
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
  tags?: string;
  createdAt: string;
}

interface TaskDashboard {
  summary: {
    today_pending: number;
    today_in_progress: number;
    overdue: number;
    completed_today: number;
    total_pending: number;
  };
  today_tasks: SuperTask[];
  overdue: SuperTask[];
  upcoming: SuperTask[];
}

const STATUSES = ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'] as const;
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
const CATEGORIES = ['Administrative', 'Technical', 'Financial', 'Client', 'Meeting', 'Follow-up', 'Other'] as const;

const STATUS_COLORS: Record<string, string> = {
  'Pending':     'bg-amber-100 text-amber-800 border-amber-200',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'Completed':   'bg-green-100 text-green-800 border-green-200',
  'On Hold':     'bg-slate-100 text-slate-700 border-slate-200',
  'Cancelled':   'bg-red-100 text-red-700 border-red-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  'Low':    'bg-slate-100 text-slate-600',
  'Medium': 'bg-sky-100 text-sky-700',
  'High':   'bg-orange-100 text-orange-700',
  'Urgent': 'bg-red-100 text-red-700',
};

const PRIORITY_ICONS: Record<string, React.ElementType> = {
  'Low': Circle, 'Medium': TrendingUp, 'High': AlertTriangle, 'Urgent': Zap,
};

const empty: Partial<SuperTask> = { status: 'Pending', priority: 'Medium' };

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(task: SuperTask) {
  if (!task.dueDate || ['Completed', 'Cancelled'].includes(task.status)) return false;
  return task.dueDate < new Date().toISOString().split('T')[0];
}

function isToday(task: SuperTask) {
  return task.dueDate === new Date().toISOString().split('T')[0];
}

// ── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onEdit, onComplete, onDelete, onStatusChange }: {
  task: SuperTask;
  onEdit: (t: SuperTask) => void;
  onComplete: (t: SuperTask) => void;
  onDelete: (t: SuperTask) => void;
  onStatusChange: (t: SuperTask, status: string) => void;
}) {
  const PIcon = PRIORITY_ICONS[task.priority] ?? Circle;
  const overdue = isOverdue(task);
  const today = isToday(task);

  return (
    <div className={cn(
      'bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-2 transition-all hover:shadow-md',
      task.status === 'Completed' && 'opacity-60',
      overdue && task.status !== 'Completed' && 'border-red-300 bg-red-50/30',
      today && task.status !== 'Completed' && !overdue && 'border-indigo-300',
    )}>
      <div className="flex items-start gap-2">
        <button onClick={() => onComplete(task)} title="Mark complete"
          className={cn('mt-0.5 flex-shrink-0 rounded-full w-5 h-5 border-2 flex items-center justify-center transition-colors',
            task.status === 'Completed' ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400')}>
          {task.status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium text-slate-900 text-sm leading-tight',
            task.status === 'Completed' && 'line-through text-slate-400')}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(task)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative inline-flex items-center">
          <select
            value={task.status}
            onChange={e => onStatusChange(task, e.target.value)}
            onClick={e => e.stopPropagation()}
            className={cn(
              'rounded-full pl-2 pr-6 py-0.5 text-xs font-medium border cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400',
              STATUS_COLORS[task.status]
            )}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px]">▾</span>
        </div>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_COLORS[task.priority])}>
          <PIcon className="w-3 h-3" />{task.priority}
        </span>
        {task.category && (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-xs">
            <Tag className="w-3 h-3" />{task.category}
          </span>
        )}
      </div>

      {task.dueDate && (
        <div className={cn('flex items-center gap-1 text-xs', overdue ? 'text-red-600 font-medium' : today ? 'text-indigo-600 font-medium' : 'text-slate-500')}>
          <Calendar className="w-3 h-3" />
          {overdue ? '⚠ Overdue — ' : today ? '📌 Today — ' : ''}{fmtDate(task.dueDate)}
          {task.dueTime && ` at ${task.dueTime}`}
        </div>
      )}

      {task.tags && (
        <div className="flex gap-1 flex-wrap">
          {task.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Task Form ────────────────────────────────────────────────────────────────

function TaskForm({ initial, onSave, onCancel }: {
  initial: Partial<SuperTask>;
  onSave: (data: Partial<SuperTask>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<SuperTask>>(initial);
  const [saving, setSaving] = useState(false);
  const f = (k: keyof SuperTask, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Title *</label>
        <input value={form.title ?? ''} onChange={e => f('title', e.target.value)}
          placeholder="What needs to be done?" autoFocus
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
        <textarea value={form.description ?? ''} onChange={e => f('description', e.target.value)}
          rows={2} placeholder="Optional details..."
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Priority</label>
        <select value={form.priority ?? 'Medium'} onChange={e => f('priority', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Due Date</label>
          <input type="date" value={form.dueDate ?? ''} onChange={e => f('dueDate', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Due Time</label>
          <input type="time" value={form.dueTime ?? ''} onChange={e => f('dueTime', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
          <select value={form.category ?? ''} onChange={e => f('category', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">— None —</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Assigned To</label>
          <input value={form.assignedTo ?? ''} onChange={e => f('assignedTo', e.target.value)}
            placeholder="Name or team"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Tags (comma separated)</label>
        <input value={form.tags ?? ''} onChange={e => f('tags', e.target.value)}
          placeholder="urgent, followup, billing..."
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
        <textarea value={form.notes ?? ''} onChange={e => f('notes', e.target.value)}
          rows={2} placeholder="Additional notes..."
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Saving...' : (initial.id ? 'Update Task' : 'Create Task')}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type View = 'dashboard' | 'all' | 'today' | 'overdue';

export default function SuperTaskManager() {
  const [view, setView] = useState<View>('dashboard');
  const [tasks, setTasks] = useState<SuperTask[]>([]);
  const [dashboard, setDashboard] = useState<TaskDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<SuperTask> | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDueFrom, setFilterDueFrom] = useState('');
  const [filterDueTo, setFilterDueTo] = useState('');
  const [search, setSearch] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/super/tasks/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('officegate.accessToken')}` },
      });
      const data = await res.json();
      if (data.success) setDashboard(data.data);
    } catch { /* ignore */ }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ perPage: '100' });
      if (filterStatus) params.set('status', filterStatus);
      if (filterPriority) params.set('priority', filterPriority);
      if (filterCategory) params.set('category', filterCategory);
      if (filterDueFrom) params.set('due_from', filterDueFrom);
      if (filterDueTo) params.set('due_to', filterDueTo);
      if (search) params.set('search', search);
      if (view === 'today') params.set('today', '1');
      if (view === 'overdue') params.set('overdue', '1');

      const res = await fetch(`/api/super/tasks?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('officegate.accessToken')}` },
      });
      const data = await res.json();
      if (data.success) setTasks(mapTasks(data.data));
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [filterStatus, filterPriority, filterCategory, filterDueFrom, filterDueTo, search, view]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { if (view !== 'dashboard') loadTasks(); }, [loadTasks, view]);

  function mapTasks(rows: Record<string, unknown>[]): SuperTask[] {
    return rows.map(r => ({
      id: r.id as number,
      title: r.title as string,
      description: r.description as string | undefined,
      status: r.status as SuperTask['status'],
      priority: r.priority as SuperTask['priority'],
      category: r.category as string | undefined,
      dueDate: (r.due_date as string | undefined),
      dueTime: (r.due_time as string | undefined),
      completedAt: (r.completed_at as string | undefined),
      assignedTo: r.assigned_to as string | undefined,
      notes: r.notes as string | undefined,
      tags: r.tags as string | undefined,
      createdAt: r.created_at as string,
    }));
  }

  function mapTask(r: Record<string, unknown>): SuperTask {
    return mapTasks([r])[0];
  }

  const handleSave = async (data: Partial<SuperTask>) => {
    const payload = {
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      category: data.category || null,
      due_date: data.dueDate || null,
      due_time: data.dueTime || null,
      assigned_to: data.assignedTo || null,
      notes: data.notes || null,
      tags: data.tags || null,
    };
    const token = localStorage.getItem('officegate.accessToken');
    const BASE = import.meta.env.VITE_API_BASE_URL || '';

    if (data.id) {
      const res = await fetch(`/api/super/tasks/${data.id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setTasks(ts => ts.map(t => t.id === data.id ? mapTask(json.data) : t));
      toast.success('Task updated');
    } else {
      const res = await fetch(`/api/super/tasks`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      const newTask = mapTask(json.data);
      setTasks(ts => [newTask, ...ts]);
      toast.success('Task created');
    }
    setShowForm(false);
    setEditing(null);
    loadDashboard();
  };

  const handleComplete = async (task: SuperTask) => {
    if (task.status === 'Completed') return;
    const token = localStorage.getItem('officegate.accessToken');
    const BASE = import.meta.env.VITE_API_BASE_URL || '';
    const res = await fetch(`/api/super/tasks/${task.id}/complete`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success) {
      setTasks(ts => ts.map(t => t.id === task.id ? mapTask(json.data) : t));
      toast.success('✅ Task completed!');
      loadDashboard();
    }
  };

  const handleDelete = async (task: SuperTask) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    const token = localStorage.getItem('officegate.accessToken');
    const BASE = import.meta.env.VITE_API_BASE_URL || '';
    await fetch(`/api/super/tasks/${task.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    setTasks(ts => ts.filter(t => t.id !== task.id));
    toast.success('Task deleted');
    loadDashboard();
  };

  const handleStatusChange = async (task: SuperTask, status: string) => {
    const token = localStorage.getItem('officegate.accessToken');
    const res = await fetch(`/api/super/tasks/${task.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) {
      setTasks(ts => ts.map(t => t.id === task.id ? mapTask(json.data) : t));
      if (status === 'Completed') toast.success('✅ Task completed!');
      loadDashboard();
    }
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
            <ListTodo className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-[Outfit]">Task Manager</h1>
            <p className="text-xs text-slate-500">{today}</p>
          </div>
        </div>
        <button onClick={() => { setEditing(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'today', label: '📌 Today' },
          { id: 'overdue', label: '⚠ Overdue' },
          { id: 'all', label: '📋 All Tasks' },
        ] as { id: View; label: string }[]).map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              view === v.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900')}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Dashboard view */}
      {view === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Today's Pending", value: dashboard.summary.today_pending, color: 'bg-amber-500', onClick: () => setView('today') },
              { label: 'In Progress Today', value: dashboard.summary.today_in_progress, color: 'bg-blue-500', onClick: () => setView('today') },
              { label: 'Overdue', value: dashboard.summary.overdue, color: 'bg-red-500', onClick: () => setView('overdue') },
              { label: 'Completed Today', value: dashboard.summary.completed_today, color: 'bg-green-500', onClick: undefined },
              { label: 'Total Pending', value: dashboard.summary.total_pending, color: 'bg-purple-500', onClick: () => { setView('all'); setFilterStatus('Pending'); } },
            ].map(card => (
              <div key={card.label} onClick={card.onClick}
                className={cn('bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center', card.onClick && 'cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all')}>
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${card.color} mb-2`}>
                  <span className="text-white text-base font-bold">{card.value}</span>
                </div>
                <p className="text-xs text-slate-500 leading-tight">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Today's tasks */}
          {dashboard.today_tasks.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-slate-800 mb-3">📌 Today's Tasks ({dashboard.today_tasks.length})</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {dashboard.today_tasks.map(t => (
                  <TaskCard key={t.id} task={t}
                    onEdit={t => { setEditing(t); setShowForm(true); }}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          )}

          {/* Overdue */}
          {dashboard.overdue.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-red-700 mb-3">⚠ Overdue ({dashboard.overdue.length})</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {dashboard.overdue.map(t => (
                  <TaskCard key={t.id} task={t}
                    onEdit={t => { setEditing(t); setShowForm(true); }}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {dashboard.upcoming.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-slate-700 mb-3">📅 Upcoming</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {dashboard.upcoming.map(t => (
                  <TaskCard key={t.id} task={t}
                    onEdit={t => { setEditing(t); setShowForm(true); }}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          )}

          {!dashboard.today_tasks.length && !dashboard.overdue.length && !dashboard.upcoming.length && (
            <EmptyState icon={ListTodo} title="All clear!" description="No tasks today. Great work or add a new task to get started." action={{ label: 'Add Task', icon: Plus, onClick: () => { setEditing(empty); setShowForm(true); } }} />
          )}
        </div>
      )}

      {/* Task list views (today / overdue / all) */}
      {view !== 'dashboard' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filters</span>
              {(filterStatus || filterPriority || filterCategory || filterDueFrom || filterDueTo || search) && (
                <button onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterCategory(''); setFilterDueFrom(''); setFilterDueTo(''); setSearch(''); }}
                  className="ml-auto text-xs text-red-500 hover:text-red-700">Clear all</button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Status</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Priority</option>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="flex items-center gap-1">
                <input type="date" value={filterDueFrom} onChange={e => setFilterDueFrom(e.target.value)} title="Due from"
                  className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            {filterDueTo !== undefined && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500">to</span>
                <input type="date" value={filterDueTo} onChange={e => setFilterDueTo(e.target.value)} title="Due to"
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={loadTasks} className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700">
                  <RefreshCcw className="w-3 h-3" /> Apply
                </button>
              </div>
            )}
          </div>

          {/* Task grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState icon={ListTodo} title={view === 'today' ? "No tasks today" : view === 'overdue' ? "No overdue tasks 🎉" : "No tasks found"}
              description="Add a new task or adjust your filters."
              action={{ label: 'Add Task', icon: Plus, onClick: () => { setEditing(empty); setShowForm(true); } }} />
          ) : (
            <>
              <p className="text-xs text-slate-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {tasks.map(t => (
                  <TaskCard key={t.id} task={t}
                    onEdit={t => { setEditing(t); setShowForm(true); }}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Task form modal */}
      {showForm && editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold font-[Outfit]">{editing.id ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <TaskForm initial={editing} onSave={handleSave} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
