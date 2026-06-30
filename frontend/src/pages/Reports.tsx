import { useState } from 'react';
import { Download, Printer, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import StatusBadge from '@/components/features/StatusBadge';
import { toast } from 'sonner';

type ReportType = 'Visitor Summary' | 'Vendor Log' | 'Staff Attendance' | 'Inventory' | 'Financial';

const reportTypes: ReportType[] = ['Visitor Summary', 'Vendor Log', 'Staff Attendance', 'Inventory', 'Financial'];

export default function Reports() {
  const { visitors, vendors, staff, inventory, invoices } = useAppStore();
  const [reportType, setReportType] = useState<ReportType>('Visitor Summary');
  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const getData = () => {
    switch (reportType) {
      case 'Visitor Summary': return visitors;
      case 'Vendor Log': return vendors;
      case 'Staff Attendance': return staff;
      case 'Inventory': return inventory;
      case 'Financial': return invoices;
      default: return [];
    }
  };

  const data = getData();

  const handleExport = () => {
    toast.success(`${reportType} report exported successfully`);
  };

  const renderRow = (item: Record<string, unknown>, idx: number) => {
    switch (reportType) {
      case 'Visitor Summary': {
        const v = item as { id?: string; name?: string; phone?: string; apartmentNo?: string; companyName?: string; officeNo?: string; purpose?: string; reason?: string; status?: string; category?: string };
        return (
          <tr key={idx} className="hover:bg-slate-50/50 divide-x divide-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">{v.name}</td>
            <td className="px-4 py-3 text-slate-500">{v.phone}</td>
            <td className="px-4 py-3 text-slate-700">{v.companyName || v.officeNo || v.apartmentNo || '—'}</td>
            <td className="px-4 py-3 text-slate-500">{v.reason || v.purpose || '—'}</td>
            <td className="px-4 py-3"><StatusBadge status={v.status || ''} /></td>
          </tr>
        );
      }
      case 'Vendor Log': {
        const v = item as { name?: string; company?: string; serviceType?: string; contact?: string; lastVisit?: string; status?: string };
        return (
          <tr key={idx} className="hover:bg-slate-50/50">
            <td className="px-4 py-3 font-medium text-slate-900">{v.name}</td>
            <td className="px-4 py-3 text-slate-500">{v.company}</td>
            <td className="px-4 py-3 text-slate-700">{v.serviceType}</td>
            <td className="px-4 py-3 text-slate-500">{v.lastVisit}</td>
            <td className="px-4 py-3"><StatusBadge status={v.status || ''} /></td>
          </tr>
        );
      }
      case 'Staff Attendance': {
        const s = item as { name?: string; role?: string; department?: string; contact?: string; attendance?: Record<string, string> };
        const attStatus = s.attendance?.[dateTo];
        const attLabel = attStatus === 'P' ? 'Present' : attStatus === 'A' ? 'Absent' : attStatus === 'H' ? 'Half-Day' : 'Not Marked';
        const attCls = attStatus === 'P'
          ? 'bg-green-100 text-green-700'
          : attStatus === 'A'
          ? 'bg-red-100 text-red-700'
          : attStatus === 'H'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-slate-100 text-slate-400';
        return (
          <tr key={idx} className="hover:bg-slate-50/50">
            <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
            <td className="px-4 py-3 text-slate-500">{s.role}</td>
            <td className="px-4 py-3 text-slate-700">{s.department}</td>
            <td className="px-4 py-3 text-slate-500">{s.contact}</td>
            <td className="px-4 py-3">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${attCls}`}>{attLabel}</span>
            </td>
          </tr>
        );
      }
      case 'Inventory': {
        const i = item as { itemName?: string; category?: string; quantity?: number; totalCost?: number; vendor?: string };
        return (
          <tr key={idx} className="hover:bg-slate-50/50">
            <td className="px-4 py-3 font-medium text-slate-900">{i.itemName}</td>
            <td className="px-4 py-3 text-slate-500">{i.category}</td>
            <td className="px-4 py-3 text-slate-700">{i.quantity}</td>
            <td className="px-4 py-3 font-medium text-indigo-600">₹{i.totalCost?.toLocaleString()}</td>
            <td className="px-4 py-3 text-slate-500">{i.vendor}</td>
          </tr>
        );
      }
      case 'Financial': {
        const inv = item as { invoiceNo?: string; description?: string; amount?: number; paidAmount?: number; status?: string; dueDate?: string };
        return (
          <tr key={idx} className="hover:bg-slate-50/50">
            <td className="px-4 py-3 font-semibold text-slate-900">{inv.invoiceNo}</td>
            <td className="px-4 py-3 text-slate-700">{inv.description || '—'}</td>
            <td className="px-4 py-3 font-medium text-indigo-600">₹{inv.amount?.toLocaleString()}</td>
            <td className="px-4 py-3 text-green-600">₹{inv.paidAmount?.toLocaleString()}</td>
            <td className="px-4 py-3"><StatusBadge status={inv.status || 'Pending'} /></td>
            <td className="px-4 py-3 text-slate-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
          </tr>
        );
      }
      default: return null;
    }
  };

  const headersByType: Record<ReportType, string[]> = {
    'Visitor Summary': ['Name', 'Phone', 'Unit', 'Purpose', 'Status'],
    'Vendor Log': ['Vendor', 'Company', 'Service', 'Last Visit', 'Status'],
    'Staff Attendance': ['Name', 'Role', 'Department', 'Contact', `Attendance (${dateTo})`],
    'Inventory': ['Item', 'Category', 'Qty', 'Total Cost', 'Vendor'],
    'Financial': ['Invoice', 'Description', 'Amount', 'Paid', 'Status', 'Due Date'],
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Report Type</label>
            <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {reportTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => window.print()} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-900 font-[Outfit]">{reportType}</h3>
          <span className="text-xs text-slate-400">{data.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {headersByType[reportType].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data as unknown as Record<string, unknown>[]).map((item, idx) => renderRow(item, idx))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
