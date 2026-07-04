import { useState, useEffect, useCallback } from 'react';
import {
  BadgeCheck, LayoutDashboard, List, Plus, Search, X, QrCode,
  Printer, MessageCircle, XCircle, ScanLine, Eye, Clock, CheckCircle2,
  AlertTriangle, Ban, User, Phone, Building2, Calendar, Hash, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useVisitorPassStore } from '@/stores/useVisitorPassStore';
import type { VisitorPass, VisitorPassType, VisitorPassStatus } from '@/types';
import { buildWhatsAppUrl, visitorInvitePayload } from '@/lib/whatsapp';

// ── Types ──────────────────────────────────────────────────────────────────────

const PASS_TYPES: VisitorPassType[] = ['Temporary', 'One Day', 'Recurring', 'Delivery', 'Worker', 'Guest'];
const PASS_STATUSES: VisitorPassStatus[] = ['Active', 'Used', 'Expired', 'Cancelled'];

const STATUS_COLORS: Record<VisitorPassStatus, string> = {
  Active:    'bg-green-100 text-green-800 border-green-200',
  Used:      'bg-blue-100 text-blue-800 border-blue-200',
  Expired:   'bg-amber-100 text-amber-800 border-amber-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const TYPE_COLORS: Record<string, string> = {
  Temporary: 'bg-purple-100 text-purple-800 border-purple-200',
  'One Day':  'bg-indigo-100 text-indigo-800 border-indigo-200',
  Recurring: 'bg-teal-100 text-teal-800 border-teal-200',
  Delivery:  'bg-orange-100 text-orange-800 border-orange-200',
  Worker:    'bg-slate-100 text-slate-800 border-slate-200',
  Guest:     'bg-pink-100 text-pink-800 border-pink-200',
};

function StatusBadge({ value, map }: { value: string; map: Record<string, string> }) {
  const cls = map[value] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {value}
    </span>
  );
}

function qrImageUrl(passCode: string) {
  if (!passCode) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(passCode)}&format=png&margin=8`;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' });
}

// ── Create Pass Form ───────────────────────────────────────────────────────────

interface CreatePassFormProps {
  onSuccess: (pass: VisitorPass) => void;
  onCancel: () => void;
}

function CreatePassForm({ onSuccess, onCancel }: CreatePassFormProps) {
  const { createPass } = useVisitorPassStore();
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const nowDatetime = new Date().toISOString().slice(0, 16);
  const tomorrowDatetime = new Date(Date.now() + 86400000).toISOString().slice(0, 16);

  const [form, setForm] = useState({
    passType: 'Guest' as VisitorPassType,
    visitorName: '',
    visitorPhone: '',
    hostName: '',
    purpose: '',
    validFrom: today,
    validUntil: tomorrowDatetime,
    maxUses: 1,
    notes: '',
  });

  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitorName.trim()) { toast.error('Visitor name is required'); return; }
    if (!form.validFrom || !form.validUntil) { toast.error('Valid from and until are required'); return; }

    setSubmitting(true);
    try {
      const pass = await createPass({
        passType: form.passType,
        visitorName: form.visitorName.trim(),
        visitorPhone: form.visitorPhone.trim() || undefined,
        hostName: form.hostName.trim() || undefined,
        purpose: form.purpose.trim() || undefined,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        maxUses: form.passType === 'Recurring' ? 0 : form.maxUses,
        notes: form.notes.trim() || undefined,
      });
      toast.success('Visitor pass created successfully');
      onSuccess(pass);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create pass');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Pass Type *</label>
          <select
            value={form.passType}
            onChange={(e) => set('passType', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {PASS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Visitor Name *</label>
          <input
            value={form.visitorName}
            onChange={(e) => set('visitorName', e.target.value)}
            placeholder="Full name"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Visitor Phone</label>
          <input
            value={form.visitorPhone}
            onChange={(e) => set('visitorPhone', e.target.value)}
            placeholder="+60 12-xxx xxxx"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Host Name</label>
          <input
            value={form.hostName}
            onChange={(e) => set('hostName', e.target.value)}
            placeholder="Person being visited"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Purpose</label>
          <input
            value={form.purpose}
            onChange={(e) => set('purpose', e.target.value)}
            placeholder="Reason for visit"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Max Uses</label>
          <input
            type="number"
            min={0}
            value={form.passType === 'Recurring' ? 0 : form.maxUses}
            onChange={(e) => set('maxUses', parseInt(e.target.value, 10) || 1)}
            disabled={form.passType === 'Recurring'}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
          {form.passType === 'Recurring' && (
            <p className="text-xs text-slate-500 mt-1">Recurring passes have unlimited uses (0)</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Valid From *</label>
          <input
            type="date"
            value={form.validFrom}
            min={today}
            onChange={(e) => set('validFrom', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Valid Until *</label>
          <input
            type="datetime-local"
            value={form.validUntil}
            min={nowDatetime}
            onChange={(e) => set('validUntil', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          placeholder="Any additional notes…"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Creating…' : 'Create Pass'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Pass Detail Dialog ─────────────────────────────────────────────────────────

interface PassDetailDialogProps {
  pass: VisitorPass;
  onClose: () => void;
  onCancelled: (updated: VisitorPass) => void;
  onScanned: (updated: VisitorPass) => void;
}

function PassDetailDialog({ pass, onClose, onCancelled, onScanned }: PassDetailDialogProps) {
  const { cancelPass, scanPass } = useVisitorPassStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);

  // Reset QR loading state whenever the pass changes
  useEffect(() => {
    setQrLoading(true);
    setQrError(false);
  }, [pass.passCode]);

  const handleCancel = async () => {
    setBusy('cancel');
    try {
      const updated = await cancelPass(pass.id);
      toast.success('Pass cancelled');
      onCancelled(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setBusy(null);
    }
  };

  const handleScan = async (action: 'entry' | 'exit') => {
    setBusy(action);
    try {
      const updated = await scanPass(pass.id, action);
      toast.success(`${action === 'entry' ? 'Entry' : 'Exit'} scan recorded`);
      onScanned(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record scan');
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const qrUrl = pass.passCode ? qrImageUrl(pass.passCode) : '';
    const payload = visitorInvitePayload({
      visitorName: pass.visitorName,
      host: pass.hostName ?? 'Host',
      date: pass.validFrom,
      time: pass.validUntil ? new Date(pass.validUntil).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) : '',
      officeNo: pass.purpose ?? 'OfficeGate Building',
      qrUrl,
    });
    if (pass.visitorPhone) {
      payload.phone = pass.visitorPhone;
    }
    window.open(buildWhatsAppUrl(payload), '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Print-only card */}
      <div className="hidden print:block p-8 max-w-sm mx-auto">
        <div className="text-center border-2 border-indigo-600 rounded-2xl p-6">
          <div className="font-bold text-lg text-indigo-700 mb-1">OfficeGate — Visitor Pass</div>
          <div className="text-xs text-slate-500 mb-4">{pass.passCode}</div>
          {pass.passCode && (
            <img src={qrImageUrl(pass.passCode)} alt="QR" className="mx-auto w-40 h-40 mb-4" />
          )}
          <div className="text-sm font-semibold">{pass.visitorName}</div>
          {pass.visitorPhone && <div className="text-xs text-slate-500">{pass.visitorPhone}</div>}
          <div className="mt-2 text-xs text-slate-600">Type: {pass.passType}</div>
          {pass.hostName && <div className="text-xs text-slate-600">Host: {pass.hostName}</div>}
          {pass.purpose && <div className="text-xs text-slate-600">Purpose: {pass.purpose}</div>}
          <div className="mt-2 text-xs">
            <span className="font-medium">Valid until:</span> {formatDate(pass.validUntil)}
          </div>
          <div className="mt-3 text-xs text-slate-400">Max uses: {pass.maxUses === 0 ? 'Unlimited' : pass.maxUses} • Used: {pass.usedCount}</div>
        </div>
      </div>

      {/* Screen overlay */}
      <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold font-[Outfit] text-slate-900">{pass.visitorName}</h2>
                <p className="text-xs text-slate-500 font-mono">{pass.passCode || '—'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl border-2 border-indigo-100 bg-white p-3 shadow-sm flex items-center justify-center" style={{ minWidth: 206, minHeight: 206 }}>
                {!pass.passCode ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400 w-[200px] h-[200px] justify-center">
                    <QrCode className="w-10 h-10" />
                    <p className="text-xs text-center">Pass code not available</p>
                  </div>
                ) : qrError ? (
                  <div className="flex flex-col items-center gap-2 text-red-400 w-[200px] h-[200px] justify-center px-2">
                    <XCircle className="w-10 h-10" />
                    <p className="text-xs text-center text-red-500">
                      QR generation failed - pass code: {pass.passCode}
                    </p>
                  </div>
                ) : (
                  <>
                    {qrLoading && (
                      <div className="absolute flex items-center justify-center w-[200px] h-[200px]">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      </div>
                    )}
                    <img
                      src={qrImageUrl(pass.passCode)}
                      alt="Visitor Pass QR"
                      width={200}
                      height={200}
                      className={`rounded-lg transition-opacity duration-200 ${qrLoading ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => setQrLoading(false)}
                      onError={() => { setQrLoading(false); setQrError(true); }}
                    />
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 text-center">Show or scan this QR at the gate</p>
              <div className="flex flex-wrap justify-center gap-2">
                <StatusBadge value={pass.passType} map={TYPE_COLORS} />
                <StatusBadge value={pass.status} map={STATUS_COLORS} />
              </div>
            </div>

            {/* Pass Info */}
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-sm">
                {[
                  { icon: User, label: 'Visitor', value: pass.visitorName },
                  { icon: Phone, label: 'Phone', value: pass.visitorPhone ?? '—' },
                  { icon: Building2, label: 'Host', value: pass.hostName ?? '—' },
                  { icon: Hash, label: 'Purpose', value: pass.purpose ?? '—' },
                  { icon: Calendar, label: 'Valid From', value: formatDate(pass.validFrom) },
                  { icon: Calendar, label: 'Valid Until', value: formatDate(pass.validUntil) },
                  { icon: Clock, label: 'Usage', value: `${pass.usedCount} / ${pass.maxUses === 0 ? '∞' : pass.maxUses}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-500 min-w-[70px]">{label}:</span>
                    <span className="text-slate-800 font-medium">{value}</span>
                  </div>
                ))}
                {pass.notes && (
                  <div className="pt-1 border-t border-slate-200 text-xs text-slate-600 italic">{pass.notes}</div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleScan('entry')}
                    disabled={pass.status !== 'Active' || busy !== null}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
                  >
                    <ScanLine className="w-4 h-4" />
                    {busy === 'entry' ? 'Recording…' : 'Entry Scan'}
                  </button>
                  <button
                    onClick={() => handleScan('exit')}
                    disabled={pass.status !== 'Active' || busy !== null}
                    className="flex items-center justify-center gap-2 bg-amber-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-40 transition-colors"
                  >
                    <ScanLine className="w-4 h-4" />
                    {busy === 'exit' ? 'Recording…' : 'Exit Scan'}
                  </button>
                </div>
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Pass
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#1da851] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Share via WhatsApp
                </button>
                {pass.status === 'Active' && (
                  <button
                    onClick={handleCancel}
                    disabled={busy !== null}
                    className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-xl py-2.5 text-sm font-medium hover:bg-red-50 disabled:opacity-40 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    {busy === 'cancel' ? 'Cancelling…' : 'Cancel Pass'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Scan History */}
          {pass.scans && pass.scans.length > 0 && (
            <div className="px-6 pb-6">
              <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Scan History
              </h3>
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">When</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pass.scans.map((scan) => (
                      <tr key={scan.id} className="border-t border-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">{formatDate(scan.scannedAt)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${scan.action === 'entry' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {scan.action === 'entry' ? 'Entry' : 'Exit'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────────────────────────

function DashboardTab() {
  const { dashboard, loadDashboard, loading } = useVisitorPassStore();

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const stats = dashboard ? [
    { label: "Today's Passes", value: dashboard.totalToday, icon: BadgeCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active',   value: dashboard.active,    icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Expired',  value: dashboard.expired,   icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Used',     value: dashboard.used,      icon: Clock,        color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Cancelled', value: dashboard.cancelled, icon: Ban,         color: 'text-red-600',    bg: 'bg-red-50' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold font-[Outfit] text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* By Type Breakdown */}
      {dashboard && Object.keys(dashboard.byType).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold font-[Outfit] text-base text-slate-800 mb-4">Passes by Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {PASS_TYPES.map((type) => (
              <div key={type} className="text-center">
                <StatusBadge value={type} map={TYPE_COLORS} />
                <p className="text-xl font-bold mt-2 font-[Outfit] text-slate-800">
                  {dashboard.byType[type] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Passes */}
      {dashboard && dashboard.recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold font-[Outfit] text-base text-slate-800 mb-4">Recent Passes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Code</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Visitor</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Type</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Valid Until</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recent.map((pass) => (
                  <tr key={pass.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-600">{pass.passCode}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{pass.visitorName}</td>
                    <td className="py-2.5 px-3"><StatusBadge value={pass.passType} map={TYPE_COLORS} /></td>
                    <td className="py-2.5 px-3 text-slate-600 text-xs">{formatDate(pass.validUntil)}</td>
                    <td className="py-2.5 px-3"><StatusBadge value={pass.status} map={STATUS_COLORS} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dashboard && dashboard.recent.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No visitor passes created yet.</p>
        </div>
      )}
    </div>
  );
}

// ── All Passes Tab ─────────────────────────────────────────────────────────────

interface AllPassesTabProps {
  onSelectPass: (pass: VisitorPass) => void;
  onCreateClick: () => void;
}

function AllPassesTab({ onSelectPass, onCreateClick }: AllPassesTabProps) {
  const { passes, loadPasses, loading } = useVisitorPassStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(() => {
    loadPasses({
      search: search || undefined,
      status: statusFilter || undefined,
      pass_type: typeFilter || undefined,
      perPage: '50',
    });
  }, [loadPasses, search, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visitor name, phone, code…"
              className="bg-transparent text-sm flex-1 focus:outline-none text-slate-700 placeholder-slate-400"
            />
            {search && (
              <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>
            )}
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            {PASS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {PASS_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={load}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Pass
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading && passes.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : passes.length === 0 ? (
          <div className="py-12 text-center">
            <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No passes found. Try adjusting filters or create a new pass.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pass Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Visitor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valid Until</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {passes.map((pass) => (
                  <tr key={pass.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 rounded-lg px-2 py-1">{pass.passCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{pass.visitorName}</p>
                      {pass.visitorPhone && <p className="text-xs text-slate-500">{pass.visitorPhone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={pass.passType} map={TYPE_COLORS} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDate(pass.validUntil)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {pass.usedCount} / {pass.maxUses === 0 ? '∞' : pass.maxUses}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={pass.status} map={STATUS_COLORS} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectPass(pass)}
                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'passes' | 'create';

export default function VisitorPassManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedPass, setSelectedPass] = useState<VisitorPass | null>(null);
  const { loadPass } = useVisitorPassStore();

  const handleSelectPass = async (pass: VisitorPass) => {
    // Load full pass with scan history before showing dialog
    try {
      const full = await loadPass(pass.id);
      setSelectedPass(full);
    } catch {
      setSelectedPass(pass);
    }
  };

  const handlePassCreated = async (pass: VisitorPass) => {
    // Immediately show the newly created pass (with pass_code from API response)
    setSelectedPass(pass);
    setActiveTab('passes');
    // If pass_code is missing, attempt to reload the full pass from the server
    if (!pass.passCode) {
      try {
        const full = await loadPass(pass.id);
        setSelectedPass(full);
      } catch {
        // keep the original pass object; dialog will show fallback state
      }
    }
  };

  const handleDialogClose = () => setSelectedPass(null);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'passes',    label: 'All Passes', icon: List },
    { id: 'create',   label: 'Create Pass', icon: Plus },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold font-[Outfit] text-xl">Smart QR Visitor Pass System</h1>
            <p className="text-indigo-100 text-sm mt-1 leading-relaxed">
              Issue QR-based passes for visitors, deliveries, workers, and guests.
              Each pass generates a unique QR code that can be scanned at the gate and shared via WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <DashboardTab />}

      {activeTab === 'passes' && (
        <AllPassesTab
          onSelectPass={handleSelectPass}
          onCreateClick={() => setActiveTab('create')}
        />
      )}

      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl">
          <h2 className="font-semibold font-[Outfit] text-lg text-slate-800 mb-5 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            Create New Visitor Pass
          </h2>
          <CreatePassForm
            onSuccess={handlePassCreated}
            onCancel={() => setActiveTab('passes')}
          />
        </div>
      )}

      {/* Pass Detail Dialog — rendered outside tab content so it is always visible */}
      {selectedPass && (
        <PassDetailDialog
          pass={selectedPass}
          onClose={handleDialogClose}
          onCancelled={(updated) => setSelectedPass(updated)}
          onScanned={(updated) => setSelectedPass(updated)}
        />
      )}
    </div>
  );
}
