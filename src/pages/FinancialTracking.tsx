import { useState } from 'react';
import { CheckCircle, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import { financialTrendData } from '@/data/mockData';
import { toast } from 'sonner';

export default function FinancialTracking() {
  const { apartments, markPaymentPaid } = useAppStore();
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-05');

  const filtered = apartments.filter(a => !filterStatus || a.paymentStatus === filterStatus);

  const totalCollected = apartments.filter(a => a.paymentStatus === 'Paid').reduce((s, a) => s + (a.monthlyCharge || 0), 0);
  const totalPending = apartments.filter(a => a.paymentStatus === 'Pending').reduce((s, a) => s + (a.monthlyCharge || 0), 0);
  const overdueCount = apartments.filter(a => a.paymentStatus === 'Overdue').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-green-100 text-sm font-medium mb-1">Total Collected</p>
          <p className="text-3xl font-bold font-[Outfit]">₹{totalCollected.toLocaleString()}</p>
          <p className="text-green-200 text-xs mt-1">{apartments.filter(a => a.paymentStatus === 'Paid').length} apartments paid</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-amber-100 text-sm font-medium mb-1">Total Pending</p>
          <p className="text-3xl font-bold font-[Outfit]">₹{totalPending.toLocaleString()}</p>
          <p className="text-amber-200 text-xs mt-1">{apartments.filter(a => a.paymentStatus === 'Pending').length} apartments pending</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-red-100 text-sm font-medium mb-1">Overdue Count</p>
          <p className="text-3xl font-bold font-[Outfit]">{overdueCount}</p>
          <p className="text-red-200 text-xs mt-1">apartments overdue</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-base font-semibold font-[Outfit] mb-4">Collection Trend — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={financialTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
            <Legend />
            <Bar dataKey="collected" name="Collected" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <button onClick={() => toast.info('Export coming soon')}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Unit', 'Resident', 'Monthly Charge', 'Payment Status', 'Last Paid', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(apt => (
                <tr key={apt.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{apt.unitNo}</td>
                  <td className="px-4 py-3 text-slate-700">{apt.residentName || <span className="text-slate-400 italic">Vacant</span>}</td>
                  <td className="px-4 py-3 font-medium text-indigo-600">₹{apt.monthlyCharge?.toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={apt.paymentStatus || 'Pending'} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{apt.lastPaid || '—'}</td>
                  <td className="px-4 py-3">
                    {apt.paymentStatus !== 'Paid' && (
                      <button onClick={() => { markPaymentPaid(apt.id); toast.success(`Payment marked for ${apt.unitNo}`); }}
                        className="flex items-center gap-1.5 bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
