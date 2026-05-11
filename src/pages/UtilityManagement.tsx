import { useState } from 'react';
import { Plus, X, CheckCircle } from 'lucide-react';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import type { UtilityTask } from '@/types';
import { toast } from 'sonner';

const taskTypes: UtilityTask['type'][] = ['Sump Cleaning', 'Drainage', 'Electrical', 'Lift', 'Pest Control', 'Fire Safety'];

export default function UtilityManagement() {
  const { utilityTasks, addUtilityTask, markUtilityDone } = useAppStore();
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ description: '', type: 'Sump Cleaning' as UtilityTask['type'], scheduledDate: '', assignedStaff: '', notes: '' });

  const filtered = utilityTasks.filter(t => !filter || t.type === filter);

  const statusColor: Record<string, string> = {
    Done: 'bg-green-50 border-green-200',
    Upcoming: 'bg-blue-50 border-blue-200',
    Overdue: 'bg-red-50 border-red-200',
  };

  const handleAdd = () => {
    if (!form.description || !form.scheduledDate || !form.assignedStaff) { toast.error('Please fill all required fields'); return; }
    addUtilityTask({ ...form, id: `U${Date.now()}`, status: 'Upcoming' });
    toast.success('Utility task added');
    setShowModal(false);
    setForm({ description: '', type: 'Sump Cleaning', scheduledDate: '', assignedStaff: '', notes: '' });
  };

  const upcoming = filtered.filter(t => t.status === 'Upcoming').length;
  const overdue = filtered.filter(t => t.status === 'Overdue').length;
  const done = filtered.filter(t => t.status === 'Done').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[['Upcoming', upcoming, 'bg-blue-50 text-blue-600'], ['Overdue', overdue, 'bg-red-50 text-red-600'], ['Completed', done, 'bg-green-50 text-green-600']].map(([l, v, c]) => (
          <div key={String(l)} className={`rounded-2xl p-4 ${String(c).split(' ').slice(1).join(' ')} border border-current/10 text-center`}>
            <p className={`text-3xl font-bold font-[Outfit] ${String(c).split(' ')[0]}`}>{v}</p>
            <p className={`text-sm font-medium ${String(c).split(' ')[0]}`}>{l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Types</option>
            {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(task => (
          <div key={task.id} className={`bg-white rounded-2xl border p-5 card-hover shadow-sm ${statusColor[task.status] || ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={task.status} />
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">{task.type}</span>
                </div>
                <h4 className="font-semibold text-slate-900 font-[Outfit]">{task.description}</h4>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                  <span>📅 Scheduled: <span className="text-slate-700 font-medium">{task.scheduledDate}</span></span>
                  {task.lastCompleted && <span>✅ Last Done: <span className="text-slate-700 font-medium">{task.lastCompleted}</span></span>}
                  <span>👷 Assigned: <span className="text-slate-700 font-medium">{task.assignedStaff}</span></span>
                </div>
                {task.notes && <p className="text-xs text-slate-400 mt-2 italic">{task.notes}</p>}
              </div>
              {task.status !== 'Done' && (
                <button onClick={() => { markUtilityDone(task.id); toast.success('Task marked as done'); }}
                  className="flex items-center gap-1.5 bg-green-50 text-green-600 border border-green-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex-shrink-0">
                  <CheckCircle className="w-4 h-4" /> Mark Done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-[Outfit]">Add Utility Task</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as UtilityTask['type'] }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Scheduled Date</label>
                  <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Assigned To</label>
                  <input value={form.assignedStaff} onChange={e => setForm(f => ({ ...f, assignedStaff: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
              <div><label className="text-xs font-medium text-slate-600 mb-1 block">Notes (Optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleAdd} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
