import { Users, Building2, UserCheck, Home, Clock, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import { visitorTrendData, occupancyData } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const { visitors, apartments, vehicles } = useAppStore();
  const navigate = useNavigate();

  const todayVisitors = visitors.filter(v => {
    const entry = new Date(v.entryTime);
    const today = new Date();
    return entry.toDateString() === today.toDateString();
  }).length;

  const insideNow = visitors.filter(v => v.status === 'Inside').length;
  const occupied = apartments.filter(a => a.status === 'Occupied').length;
  const vacant = apartments.filter(a => a.status === 'Vacant').length;
  const recentVisitors = visitors.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Visitors Today" value={todayVisitors} icon={Users} trend={{ value: 12, positive: true }} color="indigo" subtitle="All time: 847" />
        <StatCard label="Currently Inside" value={insideNow} icon={UserCheck} color="green" subtitle="Active visitors" />
        <StatCard label="Occupied Flats" value={`${occupied}/${apartments.length}`} icon={Home} trend={{ value: 5, positive: true }} color="blue" />
        <StatCard label="Vacant Flats" value={vacant} icon={Building2} color="red" subtitle="Available for lease" />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('/visitors/entry')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          <Users className="w-4 h-4" /> + Entry Visitor
        </button>
        <button onClick={() => navigate('/vehicles/entry')}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
          <Package className="w-4 h-4" /> + Register Vehicle
        </button>
        <button onClick={() => navigate('/reports')}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
          <Clock className="w-4 h-4" /> View Reports
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 font-[Outfit] mb-4">Visitor Trend — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={visitorTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
              <Bar dataKey="visitors" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 font-[Outfit] mb-4">Occupancy Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {occupancyData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 font-[Outfit]">Recent Visitor Activity</h3>
          <button onClick={() => navigate('/visitors/manage')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Visitor</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Apartment</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Purpose</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Entry Time</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentVisitors.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{v.name}</p>
                      <p className="text-xs text-slate-400">{v.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{v.apartmentNo}</td>
                  <td className="px-4 py-3 text-slate-500">{v.purpose}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatTime(v.entryTime)}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
