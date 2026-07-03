import { useState, useEffect, useCallback } from 'react';
import { Printer, RefreshCcw, ShieldOff, ShieldCheck, ReceiptText, Landmark, Scale, UserX, Store, Building2, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import StatCard from '@/components/features/StatCard';
import EmptyState from '@/components/features/EmptyState';
import StatusBadge from '@/components/features/StatusBadge';
import { api } from '@/lib/api';
import { useComplianceStore } from '@/stores/useComplianceStore';
import type { Office, Vendor, SuspendEntityType } from '@/types';
import type { ManagedUser } from '@/types/auth';

type Tab = 'GST Report' | 'Audit Report' | 'Suspend List';
const TABS: Tab[] = ['GST Report', 'Audit Report', 'Suspend List'];

const inr = (n: number) => '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

const th = 'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500';
const td = 'px-4 py-2.5 text-slate-700';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <h3 className="font-[Outfit] text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function AccountsCompliance() {
  const {
    gstReport, auditReport, suspended, loading,
    loadGstReport, loadAuditReport, loadSuspended, suspend, unsuspend,
  } = useComplianceStore();

  const [tab, setTab] = useState<Tab>('GST Report');
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayStr());

  // Suspend dialog state
  const [suspendFor, setSuspendFor] = useState<SuspendEntityType | null>(null);
  const [suspendId, setSuspendId] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [busy, setBusy] = useState(false);

  // Active entity pickers for the suspend dialog
  const [activeUsers, setActiveUsers] = useState<ManagedUser[]>([]);
  const [activeVendors, setActiveVendors] = useState<Vendor[]>([]);
  const [activeOffices, setActiveOffices] = useState<Office[]>([]);

  const refresh = useCallback(() => {
    const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to load report');
    if (tab === 'GST Report') loadGstReport(from, to).catch(fail);
    else if (tab === 'Audit Report') loadAuditReport(from, to).catch(fail);
    else loadSuspended().catch(fail);
  }, [tab, from, to, loadGstReport, loadAuditReport, loadSuspended]);

  useEffect(() => { refresh(); }, [refresh]);

  // Load pickers once the suspend tab is opened.
  useEffect(() => {
    if (tab !== 'Suspend List') return;
    api.users.list().then((rows) => setActiveUsers(rows.filter((u) => u.status === 'active'))).catch(() => undefined);
    api.vendors.list().then((rows) => setActiveVendors(rows.filter((v) => v.status === 'Active'))).catch(() => undefined);
    api.offices.list().then((rows) => setActiveOffices(rows.filter((o) => o.status !== 'Inactive'))).catch(() => undefined);
  }, [tab, suspended]);

  const openSuspend = (type: SuspendEntityType) => {
    setSuspendFor(type);
    setSuspendId('');
    setSuspendReason('');
  };

  const submitSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendFor || !suspendId) { toast.error('Select an entity to suspend'); return; }
    setBusy(true);
    try {
      await suspend(suspendFor, suspendId, suspendReason || undefined);
      toast.success(`${suspendFor.charAt(0).toUpperCase()}${suspendFor.slice(1)} suspended`);
      setSuspendFor(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Suspend failed'); }
    finally { setBusy(false); }
  };

  const handleUnsuspend = async (type: SuspendEntityType, id: string, label: string) => {
    if (!confirm(`Reactivate ${label}?`)) return;
    setBusy(true);
    try {
      await unsuspend(type, id);
      toast.success(`${label} reactivated`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Unsuspend failed'); }
    finally { setBusy(false); }
  };

  const output = gstReport?.outputTax;
  const input = gstReport?.inputTax;
  const netGst = gstReport?.netGst ?? 0;

  return (
    <div className="space-y-6">
      {/* Print stylesheet: only the report area is printed */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #compliance-print-area, #compliance-print-area * { visibility: visible; }
          #compliance-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900">Accounts &amp; Compliance</h1>
          <p className="text-sm text-slate-500">GST returns data, consolidated audit report and the suspend list</p>
        </div>
        <button onClick={refresh} title="Refresh" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
          <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Tabs */}
      <div className="no-print flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-colors', tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            {t}
          </button>
        ))}
      </div>

      {/* Date range + print (report tabs only) */}
      {tab !== 'Suspend List' && (
        <div className="no-print flex flex-wrap items-end gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <button onClick={() => window.print()} className="ml-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      )}

      <div id="compliance-print-area" className="space-y-6">
        {/* ── GST Report ─────────────────────────────────────────────────── */}
        {tab === 'GST Report' && (
          <>
            <div className="hidden print:block">
              <h2 className="font-[Outfit] text-lg font-bold">GST Report — {fmtDate(gstReport?.from)} to {fmtDate(gstReport?.to)}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <StatCard label="Output GST (on invoices)" value={inr(output?.total ?? 0)} icon={ReceiptText} color="indigo" subtitle={`Taxable value ${inr(output?.taxable ?? 0)}`} />
              <StatCard label="Input GST (on expenses)" value={inr(input?.total ?? 0)} icon={Landmark} color="blue" subtitle={`Taxable value ${inr(input?.taxable ?? 0)}`} />
              <StatCard label={netGst >= 0 ? 'Net GST payable' : 'Net GST credit'} value={inr(Math.abs(netGst))} icon={Scale} color={netGst >= 0 ? 'amber' : 'green'} subtitle="Output − Input" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard title="Output tax by rate">
                {(output?.byRate ?? []).length === 0 ? (
                  <EmptyState icon={ReceiptText} title="No GST invoices in this period" description="Add GST details on invoices to see output tax." />
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50"><th className={th}>Rate</th><th className={th}>Taxable</th><th className={th}>CGST</th><th className={th}>SGST</th><th className={th}>Tax</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {(output?.byRate ?? []).map((r) => (
                        <tr key={r.rate}>
                          <td className={cn(td, 'font-medium')}>{r.rate}%</td>
                          <td className={td}>{inr(r.taxable)}</td>
                          <td className={td}>{inr(r.tax / 2)}</td>
                          <td className={td}>{inr(r.tax / 2)}</td>
                          <td className={cn(td, 'font-medium')}>{inr(r.tax)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/60 font-semibold">
                        <td className={td}>Total</td>
                        <td className={td}>{inr(output?.taxable ?? 0)}</td>
                        <td className={td}>{inr(output?.cgst ?? 0)}</td>
                        <td className={td}>{inr(output?.sgst ?? 0)}</td>
                        <td className={td}>{inr(output?.total ?? 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </SectionCard>

              <SectionCard title="Input tax by rate">
                {(input?.byRate ?? []).length === 0 ? (
                  <EmptyState icon={Landmark} title="No GST expenses in this period" description="Record GST on office expenses to claim input credit." />
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50"><th className={th}>Rate</th><th className={th}>Taxable</th><th className={th}>Tax</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {(input?.byRate ?? []).map((r) => (
                        <tr key={r.rate}>
                          <td className={cn(td, 'font-medium')}>{r.rate}%</td>
                          <td className={td}>{inr(r.taxable)}</td>
                          <td className={cn(td, 'font-medium')}>{inr(r.tax)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/60 font-semibold">
                        <td className={td}>Total</td>
                        <td className={td}>{inr(input?.taxable ?? 0)}</td>
                        <td className={td}>{inr(input?.total ?? 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </SectionCard>
            </div>

            {(output?.invoices ?? []).length > 0 && (
              <SectionCard title={`GST invoices (${output?.invoices.length ?? 0})`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50"><th className={th}>Invoice</th><th className={th}>GSTIN</th><th className={th}>Taxable</th><th className={th}>Rate</th><th className={th}>CGST</th><th className={th}>SGST</th><th className={th}>IGST</th><th className={th}>GST</th><th className={th}>Total</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {(output?.invoices ?? []).map((line) => (
                        <tr key={line.id}>
                          <td className={cn(td, 'font-medium text-slate-900')}>{line.invoiceNo}<span className="block text-xs font-normal text-slate-400">{fmtDate(line.date)}</span></td>
                          <td className={td}>{line.gstin ?? '—'}</td>
                          <td className={td}>{inr(line.taxableAmount)}</td>
                          <td className={td}>{line.gstRate}%</td>
                          <td className={td}>{inr(line.cgstAmount)}</td>
                          <td className={td}>{inr(line.sgstAmount)}</td>
                          <td className={td}>{inr(line.igstAmount)}</td>
                          <td className={cn(td, 'font-medium')}>{inr(line.gstTotal)}</td>
                          <td className={td}>{inr(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {(input?.expenses ?? []).length > 0 && (
              <SectionCard title={`GST expenses (${input?.expenses.length ?? 0})`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50"><th className={th}>Expense</th><th className={th}>Payee</th><th className={th}>GSTIN</th><th className={th}>Category</th><th className={th}>Taxable</th><th className={th}>Rate</th><th className={th}>GST</th><th className={th}>Total</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {(input?.expenses ?? []).map((line) => (
                        <tr key={line.id}>
                          <td className={cn(td, 'font-medium text-slate-900')}>{line.expenseNo ?? `#${line.id}`}<span className="block text-xs font-normal text-slate-400">{fmtDate(line.date)}</span></td>
                          <td className={td}>{line.payee ?? '—'}</td>
                          <td className={td}>{line.gstin ?? '—'}</td>
                          <td className={td}>{line.category ?? '—'}</td>
                          <td className={td}>{inr(line.taxableAmount)}</td>
                          <td className={td}>{line.gstRate}%</td>
                          <td className={cn(td, 'font-medium')}>{inr(line.gstAmount)}</td>
                          <td className={td}>{inr(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}
          </>
        )}

        {/* ── Audit Report ───────────────────────────────────────────────── */}
        {tab === 'Audit Report' && (
          <>
            <div className="hidden print:block">
              <h2 className="font-[Outfit] text-lg font-bold">Audit Report — {fmtDate(auditReport?.period.from)} to {fmtDate(auditReport?.period.to)}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Invoiced" value={inr(auditReport?.financials.invoices.billed ?? 0)} icon={ReceiptText} color="indigo" subtitle={`${auditReport?.financials.invoices.count ?? 0} invoices`} />
              <StatCard label="Payments received" value={inr(auditReport?.financials.payments.amount ?? 0)} icon={Landmark} color="green" subtitle={`${auditReport?.financials.payments.count ?? 0} payments`} />
              <StatCard label="Expenses" value={inr(auditReport?.financials.expenses.amount ?? 0)} icon={Scale} color="amber" subtitle={`${auditReport?.financials.expenses.count ?? 0} entries`} />
              <StatCard label="Net cash flow" value={inr(auditReport?.financials.netCashFlow ?? 0)} icon={FileCheck} color={(auditReport?.financials.netCashFlow ?? 0) >= 0 ? 'green' : 'red'} subtitle="Payments − expenses" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard title="Financial summary">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className={td}>Invoices raised</td><td className={cn(td, 'text-right font-medium')}>{auditReport?.financials.invoices.count ?? 0} • {inr(auditReport?.financials.invoices.billed ?? 0)}</td></tr>
                    <tr><td className={td}>Collected against invoices</td><td className={cn(td, 'text-right font-medium')}>{inr(auditReport?.financials.invoices.collected ?? 0)}</td></tr>
                    <tr><td className={td}>GST collected (output)</td><td className={cn(td, 'text-right font-medium')}>{inr(auditReport?.financials.invoices.gstCollected ?? 0)}</td></tr>
                    <tr><td className={td}>GST paid (input)</td><td className={cn(td, 'text-right font-medium')}>{inr(auditReport?.financials.expenses.gstPaid ?? 0)}</td></tr>
                    {(auditReport?.financials.invoices.byStatus ?? []).map((s) => (
                      <tr key={s.status}><td className={cn(td, 'pl-8 text-slate-500')}>Invoices — {s.status}</td><td className={cn(td, 'text-right')}>{s.count} • {inr(s.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </SectionCard>

              <SectionCard title="Expenses by category (incl. GST)">
                {(auditReport?.financials.expenses.byCategory ?? []).length === 0 ? (
                  <EmptyState icon={Scale} title="No expenses in this period" />
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50"><th className={th}>Category</th><th className={th}>Count</th><th className={th}>Amount</th><th className={th}>GST</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {(auditReport?.financials.expenses.byCategory ?? []).map((c) => (
                        <tr key={c.category}><td className={cn(td, 'font-medium')}>{c.category}</td><td className={td}>{c.count}</td><td className={td}>{inr(c.amount)}</td><td className={td}>{inr(c.gst)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </SectionCard>

              <SectionCard title="Inventory & assets snapshot">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className={td}>Inventory items</td><td className={cn(td, 'text-right font-medium')}>{auditReport?.inventory.items ?? 0}</td></tr>
                    <tr><td className={td}>Total quantity (used)</td><td className={cn(td, 'text-right font-medium')}>{auditReport?.inventory.totalQuantity ?? 0} ({auditReport?.inventory.usedQuantity ?? 0})</td></tr>
                    <tr><td className={td}>Stock value</td><td className={cn(td, 'text-right font-medium')}>{inr(auditReport?.inventory.stockValue ?? 0)}</td></tr>
                    <tr><td className={td}>Tracked assets</td><td className={cn(td, 'text-right font-medium')}>{auditReport?.inventory.assets.total ?? 0}</td></tr>
                    {(auditReport?.inventory.assets.byStatus ?? []).map((s) => (
                      <tr key={s.status}><td className={cn(td, 'pl-8 text-slate-500')}>Assets — {s.status}</td><td className={cn(td, 'text-right')}>{s.count}</td></tr>
                    ))}
                  </tbody>
                </table>
              </SectionCard>

              <SectionCard title="Payroll & records (period)">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className={td}>Payroll runs</td><td className={cn(td, 'text-right font-medium')}>{auditReport?.payroll.runs ?? 0}</td></tr>
                    <tr><td className={td}>Payslips (paid)</td><td className={cn(td, 'text-right font-medium')}>{auditReport?.payroll.payslips ?? 0} ({auditReport?.payroll.paidSlips ?? 0})</td></tr>
                    <tr><td className={td}>Gross pay</td><td className={cn(td, 'text-right font-medium')}>{inr(auditReport?.payroll.grossPay ?? 0)}</td></tr>
                    <tr><td className={td}>Net pay</td><td className={cn(td, 'text-right font-medium')}>{inr(auditReport?.payroll.netPay ?? 0)}</td></tr>
                    <tr><td className={td}>Documents on file (active)</td><td className={cn(td, 'text-right font-medium')}>{auditReport?.documents.total ?? 0} ({auditReport?.documents.active ?? 0})</td></tr>
                    <tr><td className={td}>Active AMC contracts</td><td className={cn(td, 'text-right font-medium')}>{auditReport?.amc.active ?? 0}</td></tr>
                    <tr><td className={td}>AMCs expiring soon</td><td className={cn(td, 'text-right font-medium')}>{auditReport?.amc.expiringSoon ?? 0}</td></tr>
                  </tbody>
                </table>
              </SectionCard>
            </div>

            {(auditReport?.amc.contracts ?? []).length > 0 && (
              <SectionCard title="Active AMC contracts">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 bg-slate-50"><th className={th}>Contract</th><th className={th}>Type</th><th className={th}>Vendor</th><th className={th}>Period</th><th className={th}>Amount</th><th className={th}>Frequency</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {(auditReport?.amc.contracts ?? []).map((c) => (
                        <tr key={c.id}>
                          <td className={cn(td, 'font-medium text-slate-900')}>{c.contractNo}<span className="block text-xs font-normal text-slate-400">{c.title}</span></td>
                          <td className={td}>{c.contractType}</td>
                          <td className={td}>{c.vendorName ?? '—'}</td>
                          <td className={td}>{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</td>
                          <td className={td}>{inr(c.amount)}</td>
                          <td className={td}>{c.paymentFrequency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}
          </>
        )}

        {/* ── Suspend List ───────────────────────────────────────────────── */}
        {tab === 'Suspend List' && (
          <div className="space-y-6">
            {/* Users */}
            <SectionCard title={`Suspended users (${suspended?.users.length ?? 0})`}>
              <div className="no-print flex justify-end border-b border-slate-100 px-4 py-2.5">
                <button onClick={() => openSuspend('user')} className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100">
                  <UserX className="h-3.5 w-3.5" /> Suspend a user…
                </button>
              </div>
              {(suspended?.users ?? []).length === 0 ? (
                <EmptyState icon={ShieldCheck} title="No suspended users" description="All user accounts are active." />
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100 bg-slate-50"><th className={th}>User</th><th className={th}>Role</th><th className={th}>Status</th><th className={cn(th, 'text-right')}>Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(suspended?.users ?? []).map((u) => (
                      <tr key={u.id}>
                        <td className={cn(td, 'font-medium text-slate-900')}>{u.name}<span className="block text-xs font-normal text-slate-400">{u.email ?? u.phone ?? ''}</span></td>
                        <td className={cn(td, 'capitalize')}>{u.role}</td>
                        <td className={td}><StatusBadge status="Inactive" size="sm" /></td>
                        <td className={cn(td, 'text-right')}>
                          <button disabled={busy} onClick={() => handleUnsuspend('user', u.id, u.name)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                            <ShieldCheck className="h-3.5 w-3.5" /> Unsuspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>

            {/* Vendors */}
            <SectionCard title={`Suspended vendors (${suspended?.vendors.length ?? 0})`}>
              <div className="no-print flex justify-end border-b border-slate-100 px-4 py-2.5">
                <button onClick={() => openSuspend('vendor')} className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100">
                  <Store className="h-3.5 w-3.5" /> Suspend a vendor…
                </button>
              </div>
              {(suspended?.vendors ?? []).length === 0 ? (
                <EmptyState icon={ShieldCheck} title="No suspended vendors" description="All vendors are active." />
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100 bg-slate-50"><th className={th}>Vendor</th><th className={th}>Service</th><th className={th}>Status</th><th className={cn(th, 'text-right')}>Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(suspended?.vendors ?? []).map((v) => (
                      <tr key={v.id}>
                        <td className={cn(td, 'font-medium text-slate-900')}>{v.name}<span className="block text-xs font-normal text-slate-400">{v.company ?? ''}</span></td>
                        <td className={td}>{v.serviceType ?? '—'}</td>
                        <td className={td}><StatusBadge status="Inactive" size="sm" /></td>
                        <td className={cn(td, 'text-right')}>
                          <button disabled={busy} onClick={() => handleUnsuspend('vendor', v.id, v.name)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                            <ShieldCheck className="h-3.5 w-3.5" /> Unsuspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>

            {/* Offices */}
            <SectionCard title={`Suspended offices (${suspended?.offices.length ?? 0})`}>
              <div className="no-print flex justify-end border-b border-slate-100 px-4 py-2.5">
                <button onClick={() => openSuspend('office')} className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100">
                  <Building2 className="h-3.5 w-3.5" /> Suspend an office…
                </button>
              </div>
              {(suspended?.offices ?? []).length === 0 ? (
                <EmptyState icon={ShieldCheck} title="No suspended offices" description="All offices are active." />
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100 bg-slate-50"><th className={th}>Office</th><th className={th}>Contact</th><th className={th}>Status</th><th className={cn(th, 'text-right')}>Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(suspended?.offices ?? []).map((o) => (
                      <tr key={o.id}>
                        <td className={cn(td, 'font-medium text-slate-900')}>{o.companyName}<span className="block text-xs font-normal text-slate-400">{o.block ? `Block ${o.block} • ` : ''}Floor {o.floorNumber ?? '—'}</span></td>
                        <td className={td}>{o.contactPerson ?? '—'}</td>
                        <td className={td}><StatusBadge status="Inactive" size="sm" /></td>
                        <td className={cn(td, 'text-right')}>
                          <button disabled={busy} onClick={() => handleUnsuspend('office', o.id, o.companyName)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                            <ShieldCheck className="h-3.5 w-3.5" /> Unsuspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SectionCard>
          </div>
        )}
      </div>

      {/* Suspend dialog */}
      {suspendFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 flex items-center gap-2 font-[Outfit] text-lg font-semibold text-slate-900">
              <ShieldOff className="h-5 w-5 text-rose-600" /> Suspend {suspendFor}
            </h3>
            <p className="mb-4 text-sm text-slate-500">The {suspendFor} is marked inactive and can be reactivated any time.</p>
            <form onSubmit={submitSuspend} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Select {suspendFor} *</label>
                <select required value={suspendId} onChange={(e) => setSuspendId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Choose…</option>
                  {suspendFor === 'user' && activeUsers.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
                  {suspendFor === 'vendor' && activeVendors.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.company}</option>)}
                  {suspendFor === 'office' && activeOffices.map((o) => <option key={o.id} value={o.id}>{o.floorNumber}-{o.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason</label>
                <textarea rows={2} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="e.g. Payment default, contract breach…" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSuspendFor(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={busy} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50">{busy ? 'Suspending…' : 'Suspend'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
