import { useState, useEffect, useCallback } from 'react';
import { Receipt, Plus, RefreshCcw, Printer, Wallet, Banknote, FileText, Clock, Pencil, Trash2, CheckCircle2, BadgeCheck, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DataTable, { Column } from '@/components/features/DataTable';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import { api } from '@/lib/api';
import { useExpenseStore } from '@/stores/useExpenseStore';
import type { OfficeExpense, ExpenseReport } from '@/types';

const CATEGORIES = ['Maintenance', 'Utilities', 'Supplies', 'Salary', 'Repairs', 'Security', 'Housekeeping', 'Other'];
const PAYMENT_METHODS: OfficeExpense['paymentMethod'][] = ['Petty Cash', 'Cheque', 'Bank Transfer', 'Cash'];

type Tab = 'All' | 'Petty Cash' | 'Cheque';
const TABS: Tab[] = ['All', 'Petty Cash', 'Cheque'];

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// ── A5 printable report (rendered in a new window with inline styles) ────────
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildA5ReportHtml(report: ExpenseReport, opts: { from?: string; to?: string; method?: string }): string {
  const rangeLabel = opts.from || opts.to
    ? `${opts.from ? fmtDate(opts.from) : 'Beginning'} — ${opts.to ? fmtDate(opts.to) : 'Today'}`
    : 'All dates';
  const methodLabel = opts.method ? escapeHtml(opts.method) : 'All payment methods';
  const generated = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const rowsHtml = report.rows.map((r, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td>${escapeHtml(r.expenseNo)}</td>
      <td>${fmtDate(r.expenseDate)}</td>
      <td>${escapeHtml(r.payee ?? '—')}</td>
      <td>${escapeHtml(r.category)}</td>
      <td>${escapeHtml(r.paymentMethod)}${r.chequeNo ? `<br/><span class="sub">Chq ${escapeHtml(r.chequeNo)}</span>` : ''}</td>
      <td class="amt">${r.amount.toLocaleString('en-IN')}</td>
    </tr>`).join('');

  const byMethodHtml = Object.entries(report.totals.byMethod)
    .map(([method, amount]) => `<span class="pill">${escapeHtml(method)}: ₹${Number(amount).toLocaleString('en-IN')}</span>`)
    .join(' ');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Office Expense Report</title>
<style>
  @page { size: A5; margin: 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; font-size: 9pt; }
  .report { width: 100%; }
  header { border-bottom: 2px solid #0f172a; padding-bottom: 4mm; margin-bottom: 4mm; }
  header h1 { font-size: 13pt; letter-spacing: 0.02em; }
  header .org { font-size: 8pt; color: #475569; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 1mm; }
  header .meta { display: flex; justify-content: space-between; margin-top: 2mm; font-size: 8pt; color: #334155; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
  thead th { text-align: left; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; border-bottom: 1px solid #94a3b8; padding: 1.5mm 1mm; }
  tbody td { padding: 1.5mm 1mm; border-bottom: 0.5px solid #e2e8f0; vertical-align: top; font-size: 8pt; }
  td.num { color: #64748b; width: 6mm; }
  td.amt, th.amt { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .sub { color: #64748b; font-size: 7pt; }
  tfoot td { padding: 2mm 1mm; font-weight: 700; border-top: 1.5px solid #0f172a; font-size: 9pt; }
  .pills { margin-bottom: 6mm; font-size: 7.5pt; color: #334155; }
  .pill { display: inline-block; border: 0.5px solid #cbd5e1; border-radius: 3mm; padding: 0.8mm 2.5mm; margin-right: 1.5mm; margin-bottom: 1mm; }
  .empty { text-align: center; color: #64748b; padding: 8mm 0; }
  .signature { margin-top: 12mm; display: flex; justify-content: space-between; gap: 8mm; }
  .signature .line { flex: 1; border-top: 1px solid #0f172a; padding-top: 1.5mm; font-size: 7.5pt; color: #334155; text-align: center; }
  footer.pagefoot { margin-top: 6mm; font-size: 7pt; color: #94a3b8; text-align: center; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="report">
  <header>
    <p class="org">OfficeGate — Building Management</p>
    <h1>Office Expense Report</h1>
    <div class="meta">
      <span>Period: ${rangeLabel}</span>
      <span>${methodLabel}</span>
      <span>Generated: ${generated}</span>
    </div>
  </header>
  ${report.rows.length === 0 ? '<p class="empty">No expenses found for the selected filters.</p>' : `
  <table>
    <thead>
      <tr>
        <th>#</th><th>Expense No</th><th>Date</th><th>Payee</th><th>Category</th><th>Payment</th><th class="amt">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
    <tfoot>
      <tr>
        <td colspan="5">Total (${report.totals.count} ${report.totals.count === 1 ? 'entry' : 'entries'})</td>
        <td colspan="2" class="amt">₹${report.totals.amount.toLocaleString('en-IN')}</td>
      </tr>
    </tfoot>
  </table>
  <div class="pills">${byMethodHtml}</div>`}
  <div class="signature">
    <div class="line">Prepared by</div>
    <div class="line">Approved by (Secretary / Treasurer)</div>
  </div>
  <footer class="pagefoot">This is a system-generated report (A5).</footer>
</div>
</body>
</html>`;
}

// ── Attachment upload field ──────────────────────────────────────────────────
function UploadField({ label, value, onChange }: { label: string; value?: string; onChange: (id?: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploads.create(file, 'expenses');
      onChange(String(uploaded.id));
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="flex items-center gap-2">
        <label className={cn('flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm transition-colors', value ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600')}>
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading…' : value ? `Attached (#${value})` : 'Upload image / PDF'}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {value && (
          <button type="button" title="Remove attachment" onClick={() => onChange(undefined)} className="rounded-lg bg-slate-100 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function OfficeExpenses() {
  const { expenses, summary, loading, loadExpenses, loadSummary, createExpense, updateExpense, deleteExpense, setStatus } = useExpenseStore();
  const [tab, setTab] = useState<Tab>('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [category, setCategory] = useState('');
  const [form, setForm] = useState<Partial<OfficeExpense> | null>(null);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([
      loadExpenses({
        payment_method: tab === 'All' ? undefined : tab,
        from: fromDate || undefined,
        to: toDate || undefined,
        category: category || undefined,
      }),
      loadSummary(),
    ]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load expenses'));
  }, [tab, fromDate, toDate, category, loadExpenses, loadSummary]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      if (form.id) { await updateExpense(form.id, form); toast.success('Expense updated'); }
      else { const created = await createExpense(form); toast.success(`Expense recorded — ${created.expenseNo}`); }
      setForm(null);
      loadSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save expense'); }
    finally { setSaving(false); }
  };

  const handleStatus = async (expense: OfficeExpense, status: OfficeExpense['status']) => {
    try {
      await setStatus(expense.id, status);
      toast.success(`${expense.expenseNo} marked ${status}`);
      loadSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to update status'); }
  };

  const handleDelete = async (expense: OfficeExpense) => {
    if (!confirm(`Delete expense ${expense.expenseNo}?`)) return;
    try {
      await deleteExpense(expense.id);
      toast.success('Expense deleted');
      loadSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  const handlePrintA5 = async () => {
    const win = window.open('', '_blank', 'width=560,height=794');
    if (!win) { toast.error('Popup blocked — allow popups to print the report'); return; }
    win.document.write('<p style="font-family:sans-serif;padding:2rem;color:#475569">Preparing A5 report…</p>');
    setPrinting(true);
    try {
      const report = await api.officeExpenses.report({
        from: fromDate || undefined,
        to: toDate || undefined,
        payment_method: tab === 'All' ? undefined : tab,
      });
      win.document.open();
      win.document.write(buildA5ReportHtml(report, { from: fromDate || undefined, to: toDate || undefined, method: tab === 'All' ? undefined : tab }));
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 300);
    } catch (err) {
      win.close();
      toast.error(err instanceof Error ? err.message : 'Failed to build report');
    } finally { setPrinting(false); }
  };

  const isCheque = form?.paymentMethod === 'Cheque';

  const columns: Column<OfficeExpense>[] = [
    {
      key: 'expenseNo', label: 'Expense',
      render: (e) => (
        <div>
          <p className="font-medium text-slate-900">{e.expenseNo}</p>
          <p className="text-xs text-slate-400">{fmtDate(e.expenseDate)}</p>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (e) => <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{e.category}</span> },
    { key: 'payee', label: 'Payee', render: (e) => <span className="text-slate-700">{e.payee ?? '—'}</span> },
    {
      key: 'paymentMethod', label: 'Payment',
      render: (e) => (
        <div>
          <p className="text-slate-700">{e.paymentMethod}</p>
          {e.paymentMethod === 'Cheque' && (
            <p className="text-xs text-slate-400">
              {e.chequeNo ? `Chq ${e.chequeNo}` : 'No cheque no'}{e.bankName ? ` • ${e.bankName}` : ''}
            </p>
          )}
        </div>
      ),
    },
    { key: 'amount', label: 'Amount', render: (e) => <span className="font-semibold text-slate-900">{inr(e.amount)}</span> },
    { key: 'status', label: 'Status', render: (e) => <StatusBadge status={e.status} size="sm" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Office Expenses</h1>
          <p className="text-sm text-slate-500">Petty cash, cheque and bank payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} title="Refresh" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button onClick={handlePrintA5} disabled={printing} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
            <Printer className="h-4 w-4" /> {printing ? 'Preparing…' : 'Print A5 Report'}
          </button>
          <button onClick={() => setForm({ category: 'Other', paymentMethod: 'Petty Cash', status: 'Pending', expenseDate: new Date().toISOString().slice(0, 10) })} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="This Month Total" value={inr(summary?.monthTotal ?? 0)} icon={Wallet} color="indigo" />
        <StatCard label="Petty Cash (Month)" value={inr(summary?.pettyCashTotal ?? 0)} icon={Banknote} color="green" />
        <StatCard label="Cheque (Month)" value={inr(summary?.chequeTotal ?? 0)} icon={FileText} color="blue" />
        <StatCard label="Pending Approval" value={summary?.pendingCount ?? 0} icon={Clock} color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', tab === t ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}>
            {t}
          </button>
        ))}
      </div>

      <DataTable
        data={expenses}
        columns={columns}
        searchKeys={['expenseNo', 'payee', 'description', 'chequeNo', 'category']}
        searchPlaceholder="Search expenses…"
        toolbar={
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            {(fromDate || toDate || category) && (
              <button onClick={() => { setFromDate(''); setToDate(''); setCategory(''); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-700">
                Clear filters
              </button>
            )}
          </div>
        }
        empty={<EmptyState icon={Receipt} title="No expenses found" description="Record your first office expense." />}
        actions={(e) => (
          <>
            {e.status === 'Pending' && (
              <button title="Approve" onClick={() => handleStatus(e, 'Approved')} className="rounded-lg bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100"><BadgeCheck className="h-3.5 w-3.5" /></button>
            )}
            {(e.status === 'Pending' || e.status === 'Approved') && (
              <button title="Mark Paid" onClick={() => handleStatus(e, 'Paid')} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /></button>
            )}
            <button title="Edit" onClick={() => setForm(e)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"><Pencil className="h-3.5 w-3.5" /></button>
            <button title="Delete" onClick={() => handleDelete(e)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
          </>
        )}
      />

      {/* Add / Edit dialog */}
      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">
              {form.id ? `Edit Expense ${form.expenseNo ?? ''}` : 'Add Expense'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category *</label>
                  <select required value={form.category ?? 'Other'} onChange={(e) => setForm((f) => f && { ...f, category: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Method *</label>
                  <select required value={form.paymentMethod ?? 'Petty Cash'} onChange={(e) => setForm((f) => f && { ...f, paymentMethod: e.target.value as OfficeExpense['paymentMethod'] })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount (₹) *</label>
                  <input required type="number" min="0" step="0.01" value={form.amount ?? ''} onChange={(e) => setForm((f) => f && { ...f, amount: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Expense Date *</label>
                  <input required type="date" value={form.expenseDate ?? ''} onChange={(e) => setForm((f) => f && { ...f, expenseDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Payee</label>
                <input value={form.payee ?? ''} onChange={(e) => setForm((f) => f && { ...f, payee: e.target.value })} placeholder="Paid to (vendor / staff / supplier)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea rows={2} value={form.description ?? ''} onChange={(e) => setForm((f) => f && { ...f, description: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>

              {/* Cheque-only fields */}
              {isCheque && (
                <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Cheque details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Cheque No *</label>
                      <input required value={form.chequeNo ?? ''} onChange={(e) => setForm((f) => f && { ...f, chequeNo: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Cheque Date</label>
                      <input type="date" value={form.chequeDate ?? ''} onChange={(e) => setForm((f) => f && { ...f, chequeDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Bank Name</label>
                    <input value={form.bankName ?? ''} onChange={(e) => setForm((f) => f && { ...f, bankName: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <UploadField label="Cheque Front (image)" value={form.chequeFrontAttachmentId} onChange={(id) => setForm((f) => f && { ...f, chequeFrontAttachmentId: id })} />
                    <UploadField label="Cheque Back (xerox)" value={form.chequeBackAttachmentId} onChange={(id) => setForm((f) => f && { ...f, chequeBackAttachmentId: id })} />
                  </div>
                </div>
              )}

              <UploadField label="Receipt / Bill" value={form.receiptAttachmentId} onChange={(id) => setForm((f) => f && { ...f, receiptAttachmentId: id })} />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                <input value={form.notes ?? ''} onChange={(e) => setForm((f) => f && { ...f, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : form.id ? 'Update Expense' : 'Save Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
