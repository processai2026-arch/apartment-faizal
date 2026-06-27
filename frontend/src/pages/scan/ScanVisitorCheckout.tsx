import { useState } from 'react';
import { CheckCircle, ShieldCheck, Search, User, Clock, LogOut } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { Visitor } from '@/types';

export default function ScanVisitorCheckout() {
  const { visitors, checkOutVisitor } = useAppStore();
  const [search, setSearch] = useState('');
  const [checkedOut, setCheckedOut] = useState<Visitor | null>(null);

  const active = visitors.filter(v => v.status === 'Inside');
  const filtered = active.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.phone.includes(search) ||
    (v.apartmentNo || v.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
    v.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheckout = async (visitor: Visitor) => {
    try {
      await checkOutVisitor(visitor.id);
    } catch {
      return;
    }
    try {
      const ch = new BroadcastChannel('apartmentos-scan-sync');
      ch.postMessage({ type: 'visitor-checkout', payload: visitor.id });
      ch.close();
    } catch { /* ignore */ }
    setCheckedOut({ ...visitor, exitTime: new Date().toISOString(), status: 'Exited' });
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getDuration = (entryTime: string) => {
    const diffMs = Date.now() - new Date(entryTime).getTime();
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (checkedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden text-center">
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-8">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <LogOut className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white font-[Outfit]">Checked Out</h2>
              <p className="text-slate-400 text-sm mt-1">Your visit has been closed</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Name</span>
                  <span className="font-semibold text-slate-900">{checkedOut.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Apartment</span>
                  <span className="font-semibold text-slate-900">{checkedOut.apartmentNo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Entry</span>
                  <span className="font-semibold text-slate-900">{formatTime(checkedOut.entryTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Exit</span>
                  <span className="font-semibold text-slate-900">{formatTime(checkedOut.exitTime)}</span>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-green-700 text-sm font-medium text-center">✓ Successfully checked out. Thank you for visiting!</p>
              </div>
              <p className="text-center text-xs text-slate-400">Powered by <span className="font-semibold text-indigo-500">ApartmentOS</span></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-[Outfit]">Visitor Check-Out</h1>
          <p className="text-slate-400 text-sm mt-1">Find your name to complete checkout</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, or apartment..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {active.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-medium">No active visitors</p>
                <p className="text-slate-400 text-xs mt-1">All visitors have checked out</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No matching visitors found</p>
              </div>
            ) : (
              filtered.map(v => (
                <div key={v.id} className="border border-slate-100 rounded-xl p-3.5 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{v.name}</p>
                        <p className="text-xs text-slate-500 truncate">Apt {v.apartmentNo} • {v.purpose}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-400">In since {formatTime(v.entryTime)} • {getDuration(v.entryTime)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCheckout(v)}
                      className="flex-shrink-0 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      Out
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="text-center text-xs text-slate-400 pt-1">
            Powered by <span className="font-semibold text-indigo-500">ApartmentOS</span>
          </p>
        </div>
      </div>
    </div>
  );
}
