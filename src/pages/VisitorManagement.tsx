import { useState } from 'react';
import { Download } from 'lucide-react';
import DataTable from '@/components/features/DataTable';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import type { Visitor } from '@/types';
import { toast } from 'sonner';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function VisitorManagement() {
  const { visitors } = useAppStore();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filtered = visitors.filter(v => {
    if (filterStatus && v.status !== filterStatus) return false;
    if (filterCategory && v.category !== filterCategory) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Phone', 'Apartment', 'Purpose', 'Category', 'Entry', 'Exit', 'Duration', 'Status'];
    const rows = filtered.map(v => [v.id, v.name, v.phone, v.apartmentNo, v.purpose, v.category, formatDateTime(v.entryTime), v.exitTime ? formatDateTime(v.exitTime) : '', v.duration || '', v.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'visitors.csv'; a.click();
    toast.success('CSV exported successfully');
  };

  const columns = [
    { key: 'id', label: 'ID', render: (v: Visitor) => <span className="font-mono text-xs text-slate-400">{v.id}</span> },
    { key: 'name', label: 'Name', render: (v: Visitor) => (
      <div><p className="font-medium text-slate-900">{v.name}</p><p className="text-xs text-slate-400">{v.phone}</p></div>
    )},
    { key: 'apartmentNo', label: 'Apt No.' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'category', label: 'Category', render: (v: Visitor) => (
      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{v.category}</span>
    )},
    { key: 'entryTime', label: 'Entry', render: (v: Visitor) => <span className="text-xs">{formatDateTime(v.entryTime)}</span> },
    { key: 'exitTime', label: 'Exit', render: (v: Visitor) => <span className="text-xs">{v.exitTime ? formatDateTime(v.exitTime) : '—'}</span> },
    { key: 'duration', label: 'Duration', render: (v: Visitor) => <span className="text-amber-600 font-medium text-xs">{v.duration || (v.status === 'Inside' ? 'Active' : '—')}</span> },
    { key: 'status', label: 'Status', render: (v: Visitor) => <StatusBadge status={v.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {[['Status', 'filterStatus', ['', 'Inside', 'Exited'], setFilterStatus, filterStatus],
            ['Category', 'filterCategory', ['', 'Guest', 'Delivery', 'Worker', 'Vendor'], setFilterCategory, filterCategory]].map(([label, , options, setter, value]) => (
            <select key={String(label)} value={value as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {(options as string[]).map(o => <option key={o} value={o}>{o || `All ${label}`}</option>)}
            </select>
          ))}
          <span className="text-sm text-slate-500">{filtered.length} records</span>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <DataTable
        data={filtered as unknown as Record<string, unknown>[]}
        columns={columns as unknown[]}
        pageSize={15}
        searchKeys={['name', 'phone', 'apartmentNo', 'purpose'] as never[]}
        searchPlaceholder="Search visitors..."
      />
    </div>
  );
}
