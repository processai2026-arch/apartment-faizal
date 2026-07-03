import { useState, useEffect, useCallback } from 'react';
import { Wallet, Users, CheckCircle2, Clock, Plus, RefreshCcw, ArrowLeft, Printer, Pencil, HandCoins, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DataTable, { Column } from '@/components/features/DataTable';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import { usePayrollStore } from '@/stores/usePayrollStore';
import type { PayrollRun, Payslip } from '@/types';

const PAYMENT_METHODS: Payslip['paymentMethod'][] = ['Bank Transfer', 'Cash', 'Cheque'];

const inr = (n: number) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtMonth = (m?: string) => {
  if (!m) return '—';
  const [y, mo] = m.split('-');
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const currentMonth = () => new Date().toISOString().slice(0, 7);

function escapeHtml(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildPayslipHtml(slip: Payslip): string {
  const baseProrated = Math.max(0, slip.grossPay - slip.overtimeAmount - slip.allowances);
  const rows = [
    ['Base Salary (monthly)', inr(slip.baseSalary)],
    ['Paid Days', String(slip.paidDays)],
    ['Present / Absent Days', `${slip.presentDays} / ${slip.absentDays}`],
    ['Prorated Base', inr(baseProrated)],
    ['Overtime', inr(slip.overtimeAmount)],
    ['Allowances', inr(slip.allowances)],
    ['Deductions', `- ${inr(slip.deductions)}`],
  ];
  const rowsHtml = rows.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td class="amt">${escapeHtml(v)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Payslip ${escapeHtml(slip.staffName ?? '')}</title>
<style>
  @page { size: A5; margin: 10mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; color:#0f172a; font-size:10pt; }
  header { border-bottom:2px solid #0f172a; padding-bottom:4mm; margin-bottom:5mm; }
  .org { font-size:8pt; text-transform:uppercase; letter-spacing:0.12em; color:#475569; }
  h1 { font-size:15pt; margin-top:1mm; }
  .sub { font-size:9pt; color:#475569; margin-top:1mm; }
  table { width:100%; border-collapse:collapse; margin-bottom:4mm; }
  td { padding:2mm 1mm; border-bottom:0.5px solid #e2e8f0; }
  td.amt { text-align:right; font-variant-numeric:tabular-nums; }
  .total { font-weight:700; font-size:12pt; border-top:1.5px solid #0f172a; }
  .net { background:#f1f5f9; }
  .signature { margin-top:14mm; display:flex; justify-content:space-between; gap:8mm; }
  .line { flex:1; border-top:1px solid #0f172a; padding-top:1.5mm; font-size:8pt; text-align:center; color:#334155; }
</style></head><body>
  <header>
    <p class="org">OfficeGate — Building Management</p>
    <h1>Salary Payslip</h1>
    <p class="sub">${escapeHtml(slip.staffName ?? 'Staff')} — ${escapeHtml(slip.staffRole ?? '')} • ${fmtMonth(slip.periodMonth)}</p>
  </header>
  <table><tbody>${rowsHtml}
    <tr class="total"><td>Gross Pay</td><td class="amt">${inr(slip.grossPay)}</td></tr>
    <tr class="total net"><td>Net Pay</td><td class="amt">${inr(slip.netPay)}</td></tr>
    <tr><td>Payment Method</td><td class="amt">${escapeHtml(slip.paymentMethod)}</td></tr>
    <tr><td>Status</td><td class="amt">${slip.paidAt ? 'Paid on ' + fmtDate(slip.paidAt) : 'Pending'}</td></tr>
  </tbody></table>
  <div class="signature"><div class="line">Employee</div><div class="line">Authorised Signatory</div></div>
</body></html>`;
}

function printPayslip(slip: Payslip) {
  const win = window.open('', '_blank', 'width=560,height=794');
  if (!win) { toast.error('Popup blocked — allow popups to print'); return; }
  win.document.write(buildPayslipHtml(slip));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

// ── Payslip edit dialog ──────────────────────────────────────────────────────
function PayslipEditDialog({ slip, onClose, onSave }: { slip: Payslip; onClose: () => void; onSave: (p: Partial<Payslip>) => Promise<void> }) {
  const [overtime, setOvertime] = useState(slip.overtimeAmount);
  const [allowances, setAllowances] = useState(slip.allowances);
  const [deductions, setDeductions] = useState(slip.deductions);
  const [method, setMethod] = useState<Payslip['paymentMethod']>(slip.paymentMethod);
  const [saving, setSaving] = useState(false);

  const baseProrated = Math.max(0, slip.grossPay - slip.overtimeAmount - slip.allowances);
  const previewGross = baseProrated + overtime + allowances;
  const previewNet = previewGross - deductions;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ overtimeAmount: overtime, allowances, deductions, paymentMethod: method });
      onClose();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h3 className="mb-1 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">Adjust Payslip</h3>
        <p className="mb-4 text-sm text-slate-500">{slip.staffName} • {fmtMonth(slip.periodMonth)}</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Overtime (₹)</label>
              <input type="number" min="0" step="0.01" value={overtime} onChange={(e) => setOvertime(Number(e.target.value) || 0)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Allowances (₹)</label>
              <input type="number" min="0" step="0.01" value={allowances} onChange={(e) => setAllowances(Number(e.target.value) || 0)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Deductions (₹)</label>
              <input type="number" min="0" step="0.01" value={deductions} onChange={(e) => setDeductions(Number(e.target.value) || 0)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as Payslip['paymentMethod'])} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
            <div>
              <p className="text-xs text-slate-500">Gross</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{inr(previewGross)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Net Pay</p>
              <p className="font-bold text-emerald-600">{inr(previewNet)}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Payroll() {
  const { runs, summary, currentRun, loading, loadRuns, loadSummary, generateRun, openRun, clearRun, finalizeRun, markRunPaid, updatePayslip, payPayslip } = usePayrollStore();
  const [period, setPeriod] = useState(currentMonth());
  const [genOpen, setGenOpen] = useState(false);
  const [genMonth, setGenMonth] = useState(currentMonth());
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<Payslip | null>(null);

  const refresh = useCallback(() => {
    Promise.all([loadRuns(), loadSummary(period)]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load payroll'));
  }, [loadRuns, loadSummary, period]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const run = await generateRun(genMonth);
      toast.success(`Payroll generated for ${fmtMonth(genMonth)} — ${run.staffCount ?? run.payslips?.length ?? 0} payslips`);
      setGenOpen(false);
      loadSummary(period).catch(() => undefined);
      openRun(run.id).catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to generate payroll'); }
    finally { setGenerating(false); }
  };

  const handleFinalize = async (run: PayrollRun) => {
    try { await finalizeRun(run.id); toast.success(`${fmtMonth(run.periodMonth)} finalized`); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to finalize'); }
  };

  const handleMarkRunPaid = async (run: PayrollRun) => {
    if (!confirm(`Mark all payslips in ${fmtMonth(run.periodMonth)} as paid?`)) return;
    try { await markRunPaid(run.id); toast.success(`${fmtMonth(run.periodMonth)} marked paid`); loadSummary(period).catch(() => undefined); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to mark paid'); }
  };

  const handlePayslipSave = async (id: string, payload: Partial<Payslip>) => {
    await updatePayslip(id, payload);
    toast.success('Payslip updated');
    loadRuns().catch(() => undefined);
  };

  const handlePayPayslip = async (slip: Payslip) => {
    try { await payPayslip(slip.id, slip.paymentMethod); toast.success(`${slip.staffName} marked paid`); loadSummary(period).catch(() => undefined); loadRuns().catch(() => undefined); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to mark paid'); }
  };

  // ── Run detail view ──
  if (currentRun) {
    const slipCols: Column<Payslip>[] = [
      { key: 'staffName', label: 'Staff', render: (p) => (
        <div><p className="font-medium text-slate-900 dark:text-slate-100">{p.staffName ?? `#${p.staffId}`}</p><p className="text-xs text-slate-400">{p.staffRole ?? ''}{p.staffDepartment ? ` • ${p.staffDepartment}` : ''}</p></div>
      ) },
      { key: 'paidDays', label: 'Days', render: (p) => <span className="text-slate-700 dark:text-slate-300">{p.paidDays} paid <span className="text-xs text-slate-400">({p.presentDays}P/{p.absentDays}A)</span></span> },
      { key: 'baseSalary', label: 'Base', render: (p) => <span className="text-slate-600 dark:text-slate-300">{inr(p.baseSalary)}</span> },
      { key: 'allowances', label: 'Allow/Deduct', render: (p) => <span className="text-xs text-slate-500">+{inr(p.allowances)} / -{inr(p.deductions)}{p.overtimeAmount ? ` • OT ${inr(p.overtimeAmount)}` : ''}</span> },
      { key: 'netPay', label: 'Net Pay', render: (p) => <span className="font-semibold text-slate-900 dark:text-slate-100">{inr(p.netPay)}</span> },
      { key: 'paidAt', label: 'Status', render: (p) => p.paidAt ? <StatusBadge status="Paid" size="sm" /> : <StatusBadge status="Pending" size="sm" /> },
    ];
    const editable = currentRun.status !== 'Paid';
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={clearRun} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700"><ArrowLeft className="h-4 w-4" /></button>
            <div>
              <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Payroll — {fmtMonth(currentRun.periodMonth)}</h1>
              <p className="text-sm text-slate-500">{currentRun.payslips?.length ?? 0} payslips • Total net {inr((currentRun.payslips ?? []).reduce((s, p) => s + p.netPay, 0))}</p>
            </div>
            <StatusBadge status={currentRun.status} />
          </div>
          <div className="flex gap-2">
            {currentRun.status === 'Draft' && (
              <button onClick={() => handleFinalize(currentRun)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"><CheckCircle2 className="h-4 w-4" /> Finalize</button>
            )}
            {currentRun.status !== 'Paid' && (
              <button onClick={() => handleMarkRunPaid(currentRun)} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"><HandCoins className="h-4 w-4" /> Mark All Paid</button>
            )}
          </div>
        </div>

        <DataTable
          data={currentRun.payslips ?? []}
          columns={slipCols}
          searchKeys={['staffName', 'staffRole']}
          searchPlaceholder="Search staff…"
          empty={<EmptyState icon={FileText} title="No payslips" description="This run has no payslips." />}
          actions={(p) => (
            <>
              <button title="Print payslip" onClick={() => printPayslip(p)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700"><Printer className="h-3.5 w-3.5" /></button>
              {editable && (
                <button title="Adjust" onClick={() => setEditing(p)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
              )}
              {!p.paidAt && (
                <button title="Mark paid" onClick={() => handlePayPayslip(p)} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /></button>
              )}
            </>
          )}
        />

        {editing && <PayslipEditDialog slip={editing} onClose={() => setEditing(null)} onSave={(p) => handlePayslipSave(editing.id, p)} />}
      </div>
    );
  }

  // ── Runs list view ──
  const runCols: Column<PayrollRun>[] = [
    { key: 'periodMonth', label: 'Period', render: (r) => <span className="font-medium text-slate-900 dark:text-slate-100">{fmtMonth(r.periodMonth)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'staffCount', label: 'Staff', render: (r) => <span className="text-slate-700 dark:text-slate-300">{r.staffCount ?? 0}</span> },
    { key: 'paidCount', label: 'Paid', render: (r) => <span className="text-slate-500">{r.paidCount ?? 0}/{r.staffCount ?? 0}</span> },
    { key: 'totalNet', label: 'Total Net', render: (r) => <span className="font-semibold text-slate-900 dark:text-slate-100">{inr(r.totalNet ?? 0)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Staff Payroll</h1>
          <p className="text-sm text-slate-500">Generate monthly payslips from attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} title="Summary month" className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          <button onClick={refresh} title="Refresh" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700"><RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} /></button>
          <button onClick={() => { setGenMonth(period); setGenOpen(true); }} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Generate Payroll</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={`Payout — ${fmtMonth(summary?.periodMonth ?? period)}`} value={inr(summary?.monthPayout ?? 0)} icon={Wallet} color="indigo" />
        <StatCard label="Active Staff" value={summary?.staffCount ?? 0} icon={Users} color="blue" />
        <StatCard label="Paid" value={`${summary?.paidCount ?? 0} (${inr(summary?.paidAmount ?? 0)})`} icon={CheckCircle2} color="green" />
        <StatCard label="Pending" value={`${summary?.pendingCount ?? 0} (${inr(summary?.pendingAmount ?? 0)})`} icon={Clock} color="amber" />
      </div>

      <DataTable
        data={runs}
        columns={runCols}
        searchKeys={['periodMonth', 'status']}
        searchPlaceholder="Search runs…"
        empty={<EmptyState icon={Wallet} title="No payroll runs" description="Generate a payroll run to create payslips for your staff." />}
        actions={(r) => (
          <>
            <button title="Open" onClick={() => openRun(r.id).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to open'))} className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">Open</button>
            {r.status === 'Draft' && (
              <button title="Finalize" onClick={() => handleFinalize(r)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-700"><CheckCircle2 className="h-3.5 w-3.5" /></button>
            )}
            {r.status !== 'Paid' && (
              <button title="Mark paid" onClick={() => handleMarkRunPaid(r)} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"><HandCoins className="h-3.5 w-3.5" /></button>
            )}
          </>
        )}
      />

      {genOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-1 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">Generate Payroll</h3>
            <p className="mb-4 text-sm text-slate-500">A draft payslip is created for each active staff member, prorated from attendance.</p>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Period Month *</label>
                <input required type="month" value={genMonth} onChange={(e) => setGenMonth(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setGenOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={generating} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{generating ? 'Generating…' : 'Generate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
