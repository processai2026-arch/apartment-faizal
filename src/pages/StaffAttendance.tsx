import { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { Staff } from '@/types';
import { toast } from 'sonner';
import StatusBadge from '@/components/features/StatusBadge';

type AttStatus = 'P' | 'A' | 'H';
const statusLabels = { P: 'Present', A: 'Absent', H: 'Half-Day' };
const statusColors = {
  P: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
  A: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
  H: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
};

export default function StaffAttendance() {
  const { staff, updateStaffAttendance } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttStatus>>(() => {
    const init: Record<string, AttStatus> = {};
    staff.forEach(s => {
      const a = s.attendance?.[selectedDate];
      init[s.id] = (a as AttStatus) || 'P';
    });
    return init;
  });

  const handleChange = (staffId: string, status: AttStatus) => {
    setAttendance(prev => ({ ...prev, [staffId]: status }));
  };

  const handleSubmit = () => {
    Object.entries(attendance).forEach(([staffId, status]) => {
      updateStaffAttendance(staffId, selectedDate, status);
    });
    toast.success(`Attendance submitted for ${selectedDate}`);
  };

  const presentCount = Object.values(attendance).filter(s => s === 'P').length;
  const absentCount = Object.values(attendance).filter(s => s === 'A').length;
  const halfCount = Object.values(attendance).filter(s => s === 'H').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={() => toast.info('Monthly report download coming soon')}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[['Present', presentCount, 'text-green-600 bg-green-50'], ['Absent', absentCount, 'text-red-600 bg-red-50'], ['Half-Day', halfCount, 'text-amber-600 bg-amber-50']].map(([label, count, cls]) => (
          <div key={String(label)} className={`rounded-2xl p-4 ${String(cls).split(' ').slice(1).join(' ')} border border-current/10 text-center`}>
            <p className={`text-3xl font-bold font-[Outfit] ${String(cls).split(' ')[0]}`}>{count}</p>
            <p className={`text-sm font-medium ${String(cls).split(' ')[0]}`}>{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-base font-semibold font-[Outfit]">Mark Attendance — {selectedDate}</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {staff.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">{s.name[0]}</div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.role} • {s.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(['P', 'A', 'H'] as AttStatus[]).map(status => (
                  <button key={status} onClick={() => handleChange(s.id, status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${attendance[s.id] === status ? statusColors[status] + ' ring-2 ring-offset-1 ring-current' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleSubmit} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Check className="w-4 h-4" /> Submit Attendance
          </button>
        </div>
      </div>
    </div>
  );
}
