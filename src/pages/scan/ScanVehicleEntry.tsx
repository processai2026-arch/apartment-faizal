import { useState } from 'react';
import { CheckCircle, ShieldCheck, Car, User, Home } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { Vehicle } from '@/types';

type Step = 'form' | 'success';

export default function ScanVehicleEntry() {
  const { addVehicle } = useAppStore();
  const [step, setStep] = useState<Step>('form');
  const [entry, setEntry] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicleNo: '',
    type: '4-Wheeler' as Vehicle['type'],
    ownerName: '',
    apartmentNo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.vehicleNo.trim()) e.vehicleNo = 'Vehicle number is required';
    if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
    if (!form.apartmentNo.trim()) e.apartmentNo = 'Apartment number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    setTimeout(() => {
      const vehicle: Vehicle = {
        id: `VH${Date.now()}`,
        vehicleNo: form.vehicleNo.trim().toUpperCase(),
        type: form.type,
        ownerName: form.ownerName.trim(),
        apartmentNo: form.apartmentNo.trim(),
        entryTime: new Date().toISOString(),
        status: 'Inside',
      };
      addVehicle(vehicle);
      try {
        const ch = new BroadcastChannel('apartmentos-scan-sync');
        ch.postMessage({ type: 'vehicle-entry', payload: vehicle });
        ch.close();
      } catch { /* ignore */ }
      setEntry(vehicle);
      setStep('success');
      setLoading(false);
    }, 800);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (step === 'success' && entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-xl font-bold font-[Outfit]">Vehicle Logged!</h2>
              <p className="text-indigo-100 text-sm mt-1">Entry recorded successfully</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div className="text-center mb-2">
                  <span className="bg-slate-900 text-white font-mono font-bold text-lg px-4 py-1.5 rounded-lg tracking-widest">
                    {entry.vehicleNo}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Type</span>
                  <span className="font-semibold text-slate-900">{entry.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Owner</span>
                  <span className="font-semibold text-slate-900">{entry.ownerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Apartment</span>
                  <span className="font-semibold text-slate-900">{entry.apartmentNo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Entry Time</span>
                  <span className="font-semibold text-slate-900">{formatTime(entry.entryTime)}</span>
                </div>
              </div>
              <p className="text-center text-xs text-slate-400">Powered by <span className="font-semibold text-indigo-500">ApartmentOS</span></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-[Outfit]">Vehicle Entry</h1>
          <p className="text-slate-400 text-sm mt-1">Register your vehicle at the gate</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vehicle Number */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Vehicle Number *</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.vehicleNo}
                  onChange={e => setForm(f => ({ ...f, vehicleNo: e.target.value.toUpperCase() }))}
                  placeholder="e.g. KA-01-AB-1234"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.vehicleNo ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
              </div>
              {errors.vehicleNo && <p className="text-red-500 text-xs mt-1">{errors.vehicleNo}</p>}
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Vehicle Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['2-Wheeler', '4-Wheeler', 'Commercial', 'Other'] as Vehicle['type'][]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${form.type === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner Name */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Owner / Driver Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                  placeholder="Full name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.ownerName ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
              </div>
              {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
            </div>

            {/* Apartment */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Apartment Number *</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.apartmentNo}
                  onChange={e => setForm(f => ({ ...f, apartmentNo: e.target.value }))}
                  placeholder="e.g. A-101, B-202"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.apartmentNo ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
              </div>
              {errors.apartmentNo && <p className="text-red-500 text-xs mt-1">{errors.apartmentNo}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Logging Entry...</>
              ) : (
                <><CheckCircle className="w-4 h-4" />Log Vehicle Entry</>
              )}
            </button>
          </form>
          <p className="text-center text-xs text-slate-400">Powered by <span className="font-semibold text-indigo-500">ApartmentOS</span></p>
        </div>
      </div>
    </div>
  );
}
