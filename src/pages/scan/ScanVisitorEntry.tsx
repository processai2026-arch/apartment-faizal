import { useState } from 'react';
import { CheckCircle, ShieldCheck, User, Phone, Home, FileText, Car } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { Visitor } from '@/types';

type Step = 'form' | 'success';

export default function ScanVisitorEntry() {
  const { addVisitor } = useAppStore();
  const [step, setStep] = useState<Step>('form');
  const [entry, setEntry] = useState<Visitor | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    apartmentNo: '',
    purpose: '',
    vehicleNo: '',
    category: 'Guest' as Visitor['category'],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid 10-digit phone number';
    if (!form.apartmentNo.trim()) e.apartmentNo = 'Apartment number is required';
    if (!form.purpose.trim()) e.purpose = 'Purpose is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    setTimeout(() => {
      const visitor: Visitor = {
        id: `V${Date.now()}`,
        name: form.name.trim(),
        phone: form.phone.trim(),
        apartmentNo: form.apartmentNo.trim(),
        purpose: form.purpose.trim(),
        vehicleNo: form.vehicleNo.trim() || undefined,
        category: form.category,
        status: 'Inside',
        entryTime: new Date().toISOString(),
        guardName: 'Self Check-in',
        otp: Math.floor(100000 + Math.random() * 900000).toString(),
      };
      addVisitor(visitor);
      // Broadcast to admin dashboard open in other tabs
      try {
        const ch = new BroadcastChannel('apartmentos-scan-sync');
        ch.postMessage({ type: 'visitor-entry', payload: visitor });
        ch.close();
      } catch { /* ignore */ }
      setEntry(visitor);
      setStep('success');
      setLoading(false);
    }, 800);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (step === 'success' && entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-xl font-bold font-[Outfit]">Entry Successful!</h2>
              <p className="text-green-100 text-sm mt-1">Your entry has been logged</p>
            </div>

            {/* Entry Pass */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Entry Pass</span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Name</p>
                      <p className="text-sm font-semibold text-slate-900">{entry.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Visiting</p>
                      <p className="text-sm font-semibold text-slate-900">Apartment {entry.apartmentNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Purpose</p>
                      <p className="text-sm font-semibold text-slate-900">{entry.purpose}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-indigo-500 font-medium">Date</p>
                  <p className="text-sm font-bold text-indigo-900 mt-0.5">{formatDate(entry.entryTime)}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-indigo-500 font-medium">Entry Time</p>
                  <p className="text-sm font-bold text-indigo-900 mt-0.5">{formatTime(entry.entryTime)}</p>
                </div>
              </div>

              <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Pass ID</p>
                <p className="text-lg font-bold font-mono text-slate-900 tracking-widest">{entry.id}</p>
              </div>

              <p className="text-center text-xs text-slate-400 leading-relaxed">
                Your visit has been recorded and the resident has been notified. Please check out when leaving.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-[Outfit]">Visitor Check-In</h1>
          <p className="text-slate-400 text-sm mt-1">Fill in your details to register your visit</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.phone ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
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

            {/* Purpose */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Purpose of Visit *</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <textarea
                  value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  placeholder="e.g. Meeting, Personal visit, Work..."
                  rows={2}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors ${errors.purpose ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
              </div>
              {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Visitor Type</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Visitor['category'] }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Guest">Guest / Personal</option>
                <option value="Delivery">Delivery</option>
                <option value="Worker">Worker / Technician</option>
                <option value="Vendor">Vendor / Salesperson</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            {/* Vehicle (optional) */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Vehicle Number <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.vehicleNo}
                  onChange={e => setForm(f => ({ ...f, vehicleNo: e.target.value }))}
                  placeholder="e.g. KA-01-AB-1234"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit & Check In
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Powered by <span className="font-semibold text-indigo-500">ApartmentOS</span>
          </p>
        </div>
      </div>
    </div>
  );
}
