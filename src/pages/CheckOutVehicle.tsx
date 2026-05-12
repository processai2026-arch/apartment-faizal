import { useState } from 'react';
import { Home, LogOut } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '');
}

export default function CheckOutVehicle() {
  const { vehicles, checkOutVehicle } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter vehicles that are currently inside
  const insideVehicles = vehicles.filter(v => v.status === 'Inside');

  // Filter based on search
  const filtered = insideVehicles.filter(v => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.vehicleNo?.toLowerCase().includes(query) ||
      v.companyName?.toLowerCase().includes(query) ||
      v.vehicleType?.toLowerCase().includes(query) ||
      v.vehicleModel?.toLowerCase().includes(query) ||
      v.ownerName?.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  const handleCheckout = (id: string, vehicleNo: string) => {
    checkOutVehicle(id);
    toast.success(`${vehicleNo} checked out successfully`);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Check Out Visitors</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Home className="w-4 h-4" />
          <span>Home</span>
          <span>›</span>
          <span className="text-indigo-600">Visitors</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-700">Displaying Visitor's Entry</h2>
        </div>

        {/* Table Controls */}
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-600">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  <div className="flex items-center gap-1">
                    #
                    <span className="text-slate-400 text-xs">↕</span>
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  <div className="flex items-center gap-1">
                    Visitor's Company
                    <span className="text-slate-400 text-xs">↕</span>
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  <div className="flex items-center gap-1">
                    Vehicle Type
                    <span className="text-slate-400 text-xs">↕</span>
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  <div className="flex items-center gap-1">
                    Vehicle Number
                    <span className="text-slate-400 text-xs">↕</span>
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  <div className="flex items-center gap-1">
                    Vehicle Model
                    <span className="text-slate-400 text-xs">↕</span>
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  <div className="flex items-center gap-1">
                    Visitor Type
                    <span className="text-slate-400 text-xs">↕</span>
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  <div className="flex items-center gap-1">
                    Entry Time
                    <span className="text-slate-400 text-xs">↕</span>
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  <div className="flex items-center gap-1">
                    Action
                    <span className="text-slate-400 text-xs">↕</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No data available in table
                  </td>
                </tr>
              ) : (
                paginatedData.map((vehicle, idx) => (
                  <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-600">{startIndex + idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-indigo-600 hover:underline cursor-pointer">
                        {vehicle.companyName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{vehicle.vehicleType || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-600">{vehicle.vehicleNo || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-600">{vehicle.vehicleModel || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-600">{vehicle.parkingUserType || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(vehicle.entryTime)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleCheckout(vehicle.id, vehicle.vehicleNo)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing {filtered.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} entries
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                  className={`px-3 py-1.5 border rounded text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}