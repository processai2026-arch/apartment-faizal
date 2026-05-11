import { Car, LogOut } from 'lucide-react';
import StatusBadge from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';

function timeSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function CheckOutVehicle() {
  const { vehicles, checkOutVehicle } = useAppStore();
  const inside = vehicles.filter(v => v.status === 'Inside');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Car className="w-4 h-4 text-amber-600" />
          <span className="text-amber-700 font-semibold text-sm">{inside.length} vehicles currently inside</span>
        </div>
      </div>

      {inside.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-7 h-7 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold font-[Outfit] text-slate-700 mb-2">Parking clear!</h3>
          <p className="text-slate-400 text-sm">No vehicles currently inside the premises.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {inside.map(v => (
              <div key={v.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0"><Car className="w-5 h-5 text-indigo-500" /></div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm tracking-wide">{v.vehicleNo}</p>
                    <p className="text-xs text-slate-500">{v.type} • {v.ownerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900">{v.apartmentNo}</p>
                    <p className="text-xs text-slate-400">Apt No.</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-amber-600">{timeSince(v.entryTime)}</p>
                    <p className="text-xs text-slate-400">Duration</p>
                  </div>
                  <StatusBadge status={v.status} />
                  <button onClick={() => { checkOutVehicle(v.id); toast.success(`${v.vehicleNo} checked out`); }}
                    className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                    <LogOut className="w-4 h-4" /> Exit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
