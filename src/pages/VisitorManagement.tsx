import { useState } from 'react';
import { Download, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { Visitor } from '@/types';
import { toast } from 'sonner';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export default function VisitorManagement() {
  const { visitors } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const pageSize = 10;

  // Filter visitors based on search
  const filtered = visitors.filter(v => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(query) ||
      v.phone.toLowerCase().includes(query) ||
      v.companyName?.toLowerCase().includes(query) ||
      v.whomToMeet?.toLowerCase().includes(query) ||
      v.block?.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  const exportCSV = () => {
    const headers = ['#', 'Visitor Name', 'Contact', 'Gender', 'Building', 'Company', 'Whom To Visit', 'Entry Time', 'Status'];
    const rows = filtered.map((v, idx) => [
      idx + 1,
      v.name,
      v.phone,
      v.gender || 'N/A',
      v.block || 'N/A',
      v.companyName || 'N/A',
      v.whomToMeet || 'N/A',
      formatDateTime(v.entryTime),
      v.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visitors.csv';
    a.click();
    toast.success('CSV exported successfully');
  };

  const handleView = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
  };

  const closeModal = () => {
    setSelectedVisitor(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search visitors..."
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{filtered.length} records</span>
          <button 
            onClick={exportCSV} 
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">#</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">Visitor's Name</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">Visitor's Contact</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">Gender</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">Building</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">Apartment</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">Whom To Visit</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">Entry Time</th>
                <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No visitors found
                  </td>
                </tr>
              ) : (
                paginatedData.map((visitor, idx) => (
                  <tr key={visitor.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-600">{startIndex + idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">{visitor.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{visitor.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        visitor.gender === 'Male' ? 'bg-blue-100 text-blue-700' :
                        visitor.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {visitor.gender || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{visitor.block || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {visitor.companyName || visitor.apartmentNo || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{visitor.whomToMeet || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDateTime(visitor.entryTime)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleView(visitor)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Visitor Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Name</p>
                  <p className="font-medium text-slate-900">{selectedVisitor.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Contact</p>
                  <p className="font-medium text-slate-900">{selectedVisitor.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Gender</p>
                  <p className="font-medium text-slate-900">{selectedVisitor.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Building</p>
                  <p className="font-medium text-slate-900">{selectedVisitor.block || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Floor</p>
                  <p className="font-medium text-slate-900">{selectedVisitor.floorNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Company</p>
                  <p className="font-medium text-slate-900">{selectedVisitor.companyName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Whom To Meet</p>
                  <p className="font-medium text-slate-900">{selectedVisitor.whomToMeet || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Reason</p>
                  <p className="font-medium text-slate-900">{selectedVisitor.reason || selectedVisitor.purpose || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Entry Time</p>
                  <p className="font-medium text-slate-900">{formatDateTime(selectedVisitor.entryTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Exit Time</p>
                  <p className="font-medium text-slate-900">{selectedVisitor.exitTime ? formatDateTime(selectedVisitor.exitTime) : 'Still Inside'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    selectedVisitor.status === 'Inside' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedVisitor.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Vehicle</p>
                  <p className="font-medium text-slate-900">
                    {selectedVisitor.vehicleNo ? `${selectedVisitor.vehicleType} - ${selectedVisitor.vehicleNo}` : 'No Vehicle'}
                  </p>
                </div>
              </div>
              {selectedVisitor.address && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Address</p>
                  <p className="font-medium text-slate-900">
                    {selectedVisitor.address}
                    {selectedVisitor.city && `, ${selectedVisitor.city}`}
                    {selectedVisitor.pincode && ` - ${selectedVisitor.pincode}`}
                  </p>
                </div>
              )}
              {selectedVisitor.remarks && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Remarks</p>
                  <p className="font-medium text-slate-900">{selectedVisitor.remarks}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}