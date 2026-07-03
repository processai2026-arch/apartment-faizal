import { useState, useEffect, useMemo } from 'react';
import {
  Camera, Droplets, Zap, Sparkles, ClipboardList, Printer, RefreshCcw,
  Users, Wrench, Wallet, Trash2, Pencil, CheckCircle2, CalendarDays, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import DataTable, { Column } from '@/components/features/DataTable';
import { useDailyOpsStore } from '@/stores/useDailyOpsStore';
import type { CctvCheckStatus, EbLog, HousekeepingLog, WaterLorryLog } from '@/types';

type Tab = 'report' | 'cctv' | 'water' | 'eb' | 'housekeeping';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'report', label: 'Daily Report', icon: ClipboardList },
  { key: 'cctv', label: 'CCTV Checklist', icon: Camera },
  { key: 'water', label: 'Water Lorry', icon: Droplets },
  { key: 'eb', label: 'EB Log', icon: Zap },
  { key: 'housekeeping', label: 'Housekeeping', icon: Sparkles },
];

const CCTV_STATUSES: CctvCheckStatus[] = ['Working', 'Faulty', 'Offline'];
const HK_STATUSES: HousekeepingLog['status'][] = ['Done', 'Pending', 'Partial'];

const today = () => new Date().toISOString().slice(0, 10);
const inr = (v: number) => `₹${v.toLocaleString('en-IN')}`;

const inputCls = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';
const labelCls = 'mb-1 block text-xs font-medium text-slate-500';

const cctvBtnCls: Record<CctvCheckStatus, string> = {
  Working: 'bg-emerald-600 text-white border-emerald-600',
  Faulty: 'bg-amber-500 text-white border-amber-500',
  Offline: 'bg-rose-600 text-white border-rose-600',
};

function SectionCard({ title, icon: Icon, children, aside }: { title: string; icon: React.ElementType; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
        {aside}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PlainTable({ headers, rows, emptyLabel }: { headers: string[]; rows: React.ReactNode[][]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-400">{emptyLabel}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((cells, i) => (
            <tr key={i}>
              {cells.map((c, j) => <td key={j} className="whitespace-nowrap px-3 py-2 text-slate-700">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DailyOperations() {
  const {
    report, checklist, waterLogs, ebLogs, housekeepingLogs, loading,
    loadReport, loadChecklist, saveChecklistBulk,
    loadWaterLogs, createWaterLog, updateWaterLog, deleteWaterLog,
    loadEbLogs, createEbLog, updateEbLog, deleteEbLog,
    loadHousekeepingLogs, createHousekeepingLog, updateHousekeepingLog, deleteHousekeepingLog,
  } = useDailyOpsStore();

  const [date, setDate] = useState(today());
  const [tab, setTab] = useState<Tab>('report');
  const [saving, setSaving] = useState(false);

  // CCTV checklist draft: cameraId → status/remarks
  const [draft, setDraft] = useState<Record<string, { status?: CctvCheckStatus; remarks: string }>>({});

  // Entry forms
  const [waterForm, setWaterForm] = useState<{ id?: string; supplierName: string; vehicleNo: string; capacityLitres: string; trips: string; amount: string; notes: string }>({ supplierName: '', vehicleNo: '', capacityLitres: '', trips: '1', amount: '', notes: '' });
  const [ebForm, setEbForm] = useState<{ id?: string; meterStart: string; meterEnd: string; powerCutMinutes: string; generatorNote: string; notes: string }>({ meterStart: '', meterEnd: '', powerCutMinutes: '0', generatorNote: '', notes: '' });
  const [hkForm, setHkForm] = useState<{ id?: string; area: string; task: string; status: HousekeepingLog['status']; staffName: string; remarks: string }>({ area: '', task: '', status: 'Done', staffName: '', remarks: '' });

  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Request failed');

  const refresh = () => {
    const load =
      tab === 'report' ? loadReport(date)
      : tab === 'cctv' ? loadChecklist(date)
      : tab === 'water' ? loadWaterLogs(date)
      : tab === 'eb' ? loadEbLogs(date)
      : loadHousekeepingLogs(date);
    load.catch(fail);
  };

  useEffect(() => { refresh(); }, [date, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!checklist) return;
    const next: Record<string, { status?: CctvCheckStatus; remarks: string }> = {};
    checklist.checks.forEach((c) => { next[c.cameraId] = { status: c.status, remarks: c.remarks ?? '' }; });
    setDraft(next);
  }, [checklist]);

  // ── CCTV handlers ──────────────────────────────────────────────────────────
  const setDraftStatus = (cameraId: string, status: CctvCheckStatus) =>
    setDraft((d) => ({ ...d, [cameraId]: { ...d[cameraId], remarks: d[cameraId]?.remarks ?? '', status } }));

  const setDraftRemarks = (cameraId: string, remarks: string) =>
    setDraft((d) => ({ ...d, [cameraId]: { ...d[cameraId], status: d[cameraId]?.status, remarks } }));

  const markAllWorking = () =>
    setDraft((d) => {
      const next = { ...d };
      (checklist?.checks ?? []).forEach((c) => { next[c.cameraId] = { status: next[c.cameraId]?.status ?? 'Working', remarks: next[c.cameraId]?.remarks ?? '' }; });
      return next;
    });

  const draftCount = useMemo(() => Object.values(draft).filter((d) => d.status).length, [draft]);

  const saveChecklist = async () => {
    const checks = Object.entries(draft)
      .filter(([, v]) => v.status)
      .map(([cameraId, v]) => ({ cameraId, status: v.status as CctvCheckStatus, remarks: v.remarks || undefined }));
    if (checks.length === 0) { toast.error('Set a status for at least one camera'); return; }
    setSaving(true);
    try {
      await saveChecklistBulk(date, checks);
      toast.success(`${checks.length} camera checks saved`);
    } catch (e) { fail(e); } finally { setSaving(false); }
  };

  // ── Log form handlers ──────────────────────────────────────────────────────
  const submitWater = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterForm.supplierName.trim()) { toast.error('Supplier name is required'); return; }
    const payload: Partial<WaterLorryLog> = {
      logDate: date,
      supplierName: waterForm.supplierName.trim(),
      vehicleNo: waterForm.vehicleNo.trim() || undefined,
      capacityLitres: waterForm.capacityLitres ? Number(waterForm.capacityLitres) : undefined,
      trips: waterForm.trips ? Math.max(1, Number(waterForm.trips)) : 1,
      amount: waterForm.amount ? Number(waterForm.amount) : undefined,
      notes: waterForm.notes.trim() || undefined,
    };
    setSaving(true);
    try {
      if (waterForm.id) { await updateWaterLog(waterForm.id, payload); toast.success('Water lorry entry updated'); }
      else { await createWaterLog(payload); toast.success('Water lorry entry added'); }
      setWaterForm({ supplierName: '', vehicleNo: '', capacityLitres: '', trips: '1', amount: '', notes: '' });
    } catch (err) { fail(err); } finally { setSaving(false); }
  };

  const submitEb = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<EbLog> = {
      logDate: date,
      meterStart: ebForm.meterStart ? Number(ebForm.meterStart) : undefined,
      meterEnd: ebForm.meterEnd ? Number(ebForm.meterEnd) : undefined,
      powerCutMinutes: ebForm.powerCutMinutes ? Math.max(0, Number(ebForm.powerCutMinutes)) : 0,
      generatorNote: ebForm.generatorNote.trim() || undefined,
      notes: ebForm.notes.trim() || undefined,
    };
    setSaving(true);
    try {
      if (ebForm.id) { await updateEbLog(ebForm.id, payload); toast.success('EB entry updated'); }
      else { await createEbLog(payload); toast.success('EB entry added'); }
      setEbForm({ meterStart: '', meterEnd: '', powerCutMinutes: '0', generatorNote: '', notes: '' });
    } catch (err) { fail(err); } finally { setSaving(false); }
  };

  const submitHk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hkForm.area.trim() || !hkForm.task.trim()) { toast.error('Area and task are required'); return; }
    const payload: Partial<HousekeepingLog> = {
      logDate: date,
      area: hkForm.area.trim(),
      task: hkForm.task.trim(),
      status: hkForm.status,
      staffName: hkForm.staffName.trim() || undefined,
      remarks: hkForm.remarks.trim() || undefined,
    };
    setSaving(true);
    try {
      if (hkForm.id) { await updateHousekeepingLog(hkForm.id, payload); toast.success('Housekeeping entry updated'); }
      else { await createHousekeepingLog(payload); toast.success('Housekeeping entry added'); }
      setHkForm({ area: '', task: '', status: 'Done', staffName: '', remarks: '' });
    } catch (err) { fail(err); } finally { setSaving(false); }
  };

  const confirmDelete = async (fn: () => Promise<void>) => {
    if (!confirm('Delete this entry?')) return;
    try { await fn(); toast.success('Entry removed'); } catch (e) { fail(e); }
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const waterColumns: Column<WaterLorryLog>[] = [
    { key: 'supplierName', label: 'Supplier' },
    { key: 'vehicleNo', label: 'Vehicle No', render: (l) => l.vehicleNo ?? '—' },
    { key: 'capacityLitres', label: 'Capacity (L)', render: (l) => l.capacityLitres != null ? l.capacityLitres.toLocaleString('en-IN') : '—' },
    { key: 'trips', label: 'Trips' },
    { key: 'amount', label: 'Amount', render: (l) => l.amount != null ? inr(l.amount) : '—' },
    { key: 'notes', label: 'Notes', render: (l) => l.notes ?? '—', className: 'max-w-[220px] truncate' },
  ];

  const ebColumns: Column<EbLog>[] = [
    { key: 'meterStart', label: 'Meter Start', render: (l) => l.meterStart != null ? String(l.meterStart) : '—' },
    { key: 'meterEnd', label: 'Meter End', render: (l) => l.meterEnd != null ? String(l.meterEnd) : '—' },
    { key: 'units', label: 'Units', render: (l) => l.meterStart != null && l.meterEnd != null ? (l.meterEnd - l.meterStart).toFixed(1) : '—' },
    { key: 'powerCutMinutes', label: 'Power Cut (min)' },
    { key: 'generatorNote', label: 'Generator', render: (l) => l.generatorNote ?? '—', className: 'max-w-[200px] truncate' },
    { key: 'notes', label: 'Notes', render: (l) => l.notes ?? '—', className: 'max-w-[200px] truncate' },
  ];

  const hkColumns: Column<HousekeepingLog>[] = [
    { key: 'area', label: 'Area / Block' },
    { key: 'task', label: 'Task', className: 'max-w-[240px] truncate' },
    { key: 'status', label: 'Status', render: (l) => <StatusBadge status={l.status} /> },
    { key: 'staffName', label: 'Staff', render: (l) => l.staffName ?? '—' },
    { key: 'remarks', label: 'Remarks', render: (l) => l.remarks ?? '—', className: 'max-w-[220px] truncate' },
  ];

  const summary = checklist?.summary;

  return (
    <div className="space-y-6">
      <style>{`@media print {
        body * { visibility: hidden; }
        #daily-ops-print, #daily-ops-print * { visibility: visible; }
        #daily-ops-print { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
      }`}</style>

      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900">Daily Operations</h1>
          <p className="text-sm text-slate-500">CCTV, water, electricity & housekeeping daily checks with an aggregated report</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value || today())}
              className="bg-transparent text-sm text-slate-700 focus:outline-none"
            />
          </div>
          <button onClick={refresh} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50" title="Refresh">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          {tab === 'report' && (
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              <Printer className="h-4 w-4" /> Print
            </button>
          )}
        </div>
      </div>

      <div className="no-print flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Daily Report ─────────────────────────────────────────────────── */}
      {tab === 'report' && (
        report ? (
          <div id="daily-ops-print" className="space-y-6">
            <div className="hidden print:block">
              <h1 className="text-xl font-bold text-slate-900">Daily Activity Report — {report.date}</h1>
              <p className="text-sm text-slate-500">OfficeGate • Facility & Daily Operations</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              <StatCard label="Cameras Working" value={`${report.cctv.working}/${report.cctv.totalCameras}`} icon={Camera} color={report.cctv.faulty + report.cctv.offline > 0 ? 'amber' : 'green'} subtitle={`${report.cctv.unchecked} unchecked`} />
              <StatCard label="Water Trips" value={report.waterLorry.totalTrips} icon={Droplets} color="blue" subtitle={`${report.waterLorry.totalLitres.toLocaleString('en-IN')} L • ${inr(report.waterLorry.totalAmount)}`} />
              <StatCard label="Power Cut" value={`${report.eb.totalPowerCutMinutes} min`} icon={Zap} color={report.eb.totalPowerCutMinutes > 0 ? 'amber' : 'green'} subtitle={`${report.eb.logs.length} EB entries`} />
              <StatCard label="Housekeeping" value={`${report.housekeeping.completion}%`} icon={Sparkles} color={report.housekeeping.completion >= 80 ? 'green' : 'amber'} subtitle={`${report.housekeeping.done}/${report.housekeeping.total} done`} />
              <StatCard label="Staff Present" value={`${report.staffAttendance.present}/${report.staffAttendance.totalStaff}`} icon={Users} color="indigo" subtitle={`${report.staffAttendance.absent} absent • ${report.staffAttendance.halfDay} half day`} />
            </div>

            <SectionCard title={`CCTV Status (${report.cctv.checked}/${report.cctv.totalCameras} checked)`} icon={Camera}
              aside={<span className="text-xs text-slate-500">Working {report.cctv.working} • Faulty {report.cctv.faulty} • Offline {report.cctv.offline}</span>}>
              <PlainTable
                headers={['Camera', 'Location', 'Zone', 'Status', 'Remarks']}
                rows={report.cctv.checks.map((c) => [
                  <span className="font-medium text-slate-900">{c.cameraName}</span>,
                  c.location ?? '—',
                  c.zone ?? '—',
                  c.status
                    ? <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', c.status === 'Working' ? 'bg-emerald-50 text-emerald-700' : c.status === 'Faulty' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700')}>{c.status}</span>
                    : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Not checked</span>,
                  c.remarks ?? '—',
                ])}
                emptyLabel="No cameras registered"
              />
            </SectionCard>

            <SectionCard title="Water Lorry Deliveries" icon={Droplets}
              aside={<span className="text-xs text-slate-500">{report.waterLorry.entries} entries • {report.waterLorry.totalTrips} trips • {inr(report.waterLorry.totalAmount)}</span>}>
              <PlainTable
                headers={['Supplier', 'Vehicle', 'Capacity (L)', 'Trips', 'Amount', 'Notes']}
                rows={report.waterLorry.logs.map((l) => [
                  <span className="font-medium text-slate-900">{l.supplierName}</span>,
                  l.vehicleNo ?? '—',
                  l.capacityLitres != null ? l.capacityLitres.toLocaleString('en-IN') : '—',
                  l.trips,
                  l.amount != null ? inr(l.amount) : '—',
                  l.notes ?? '—',
                ])}
                emptyLabel="No water lorry deliveries recorded"
              />
            </SectionCard>

            <SectionCard title="Electricity (EB) Log" icon={Zap}
              aside={<span className="text-xs text-slate-500">{report.eb.totalPowerCutMinutes} min power cut</span>}>
              <PlainTable
                headers={['Meter Start', 'Meter End', 'Units', 'Power Cut (min)', 'Generator', 'Notes']}
                rows={report.eb.logs.map((l) => [
                  l.meterStart ?? '—',
                  l.meterEnd ?? '—',
                  l.meterStart != null && l.meterEnd != null ? (l.meterEnd - l.meterStart).toFixed(1) : '—',
                  l.powerCutMinutes,
                  l.generatorNote ?? '—',
                  l.notes ?? '—',
                ])}
                emptyLabel="No EB readings recorded"
              />
            </SectionCard>

            <SectionCard title={`Housekeeping (${report.housekeeping.completion}% complete)`} icon={Sparkles}
              aside={<span className="text-xs text-slate-500">Done {report.housekeeping.done} • Partial {report.housekeeping.partial} • Pending {report.housekeeping.pending}</span>}>
              <PlainTable
                headers={['Area / Block', 'Task', 'Status', 'Staff', 'Remarks']}
                rows={report.housekeeping.logs.map((l) => [
                  <span className="font-medium text-slate-900">{l.area}</span>,
                  l.task,
                  <StatusBadge status={l.status} />,
                  l.staffName ?? '—',
                  l.remarks ?? '—',
                ])}
                emptyLabel="No housekeeping tasks logged"
              />
            </SectionCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Staff Attendance" icon={Users}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ['Present', report.staffAttendance.present, 'bg-emerald-500'],
                    ['Absent', report.staffAttendance.absent, 'bg-rose-500'],
                    ['Half Day', report.staffAttendance.halfDay, 'bg-amber-500'],
                    ['Unmarked', report.staffAttendance.unmarked, 'bg-slate-400'],
                  ].map(([label, value, color]) => (
                    <div key={String(label)} className="rounded-xl border border-slate-100 p-3">
                      <div className={cn('mb-2 h-1.5 w-8 rounded-full', String(color))} />
                      <p className="text-lg font-bold text-slate-900">{value}</p>
                      <p className="text-xs text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">{report.staffAttendance.totalStaff} active staff</p>
              </SectionCard>

              <SectionCard title="Vendor Payments" icon={Wallet}
                aside={<span className="text-xs font-semibold text-slate-700">{inr(report.vendorPayments.totalAmount)}</span>}>
                <PlainTable
                  headers={['Invoice', 'Description', 'Mode', 'Reference', 'Amount']}
                  rows={report.vendorPayments.payments.map((p) => [
                    <span className="font-medium text-slate-900">{p.invoiceNo ?? `#${p.invoiceId}`}</span>,
                    p.invoiceDescription ?? '—',
                    p.mode ?? '—',
                    p.referenceNo ?? '—',
                    inr(p.amount),
                  ])}
                  emptyLabel="No payments recorded on this date"
                />
              </SectionCard>
            </div>

            <SectionCard title="Maintenance & Utility Schedules" icon={Wrench}
              aside={<span className="text-xs text-slate-500">{report.maintenanceDue.length + report.utilityTasks.length} due</span>}>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Maintenance requests due</p>
                  <PlainTable
                    headers={['Title', 'Category', 'Priority', 'Status', 'Office', 'Assigned Staff']}
                    rows={report.maintenanceDue.map((m) => [
                      <span className="font-medium text-slate-900">{m.title}</span>,
                      m.category ?? '—',
                      <StatusBadge status={m.priority} />,
                      <StatusBadge status={m.status} />,
                      m.officeName ? `${m.officeBlock ?? ''} ${m.officeName}`.trim() : '—',
                      m.staffName ?? '—',
                    ])}
                    emptyLabel="No maintenance requests due"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Utility tasks scheduled</p>
                  <PlainTable
                    headers={['Task', 'Type', 'Status', 'Assigned Staff', 'Notes']}
                    rows={report.utilityTasks.map((u) => [
                      <span className="font-medium text-slate-900">{u.description}</span>,
                      u.type ?? '—',
                      <StatusBadge status={u.status} />,
                      u.assignedStaff ?? '—',
                      u.notes ?? '—',
                    ])}
                    emptyLabel="No utility tasks scheduled"
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title={loading ? 'Loading report…' : 'No report data'} description="Pick a date to view the aggregated daily activity report." />
        )
      )}

      {/* ── CCTV Checklist ───────────────────────────────────────────────── */}
      {tab === 'cctv' && (
        <div className="space-y-4">
          {summary && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Total Cameras" value={summary.totalCameras} icon={Camera} color="indigo" subtitle={`${summary.unchecked} unchecked today`} />
              <StatCard label="Working" value={summary.working} icon={CheckCircle2} color="green" />
              <StatCard label="Faulty" value={summary.faulty} icon={Wrench} color="amber" />
              <StatCard label="Offline" value={summary.offline} icon={Zap} color="red" />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">{draftCount}/{checklist?.checks.length ?? 0} cameras marked for {date}</p>
            <div className="flex gap-2">
              <button onClick={markAllWorking} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                Mark all Working
              </button>
              <button onClick={saveChecklist} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Checklist'}
              </button>
            </div>
          </div>

          {(checklist?.checks.length ?? 0) === 0 ? (
            <EmptyState icon={Camera} title="No cameras registered" description="Add cameras in CCTV Management first — the daily checklist covers every registered camera." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {checklist?.checks.map((c) => {
                const d = draft[c.cameraId] ?? { status: undefined, remarks: '' };
                return (
                  <div key={c.cameraId} className={cn('rounded-2xl border bg-white p-4 shadow-sm', d.status ? 'border-slate-100' : 'border-dashed border-slate-300')}>
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{c.cameraName}</p>
                        <p className="truncate text-xs text-slate-400">{[c.location, c.zone].filter(Boolean).join(' • ') || '—'}</p>
                      </div>
                      {!d.status && <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">Unchecked</span>}
                    </div>
                    <div className="mb-2 flex gap-1.5">
                      {CCTV_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setDraftStatus(c.cameraId, s)}
                          className={cn(
                            'flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                            d.status === s ? cctvBtnCls[s] : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <input
                      value={d.remarks}
                      onChange={(e) => setDraftRemarks(c.cameraId, e.target.value)}
                      placeholder="Remarks (optional)"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Water Lorry ──────────────────────────────────────────────────── */}
      {tab === 'water' && (
        <div className="space-y-4">
          <form onSubmit={submitWater} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">{waterForm.id ? 'Edit delivery' : `New delivery — ${date}`}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="lg:col-span-2">
                <label className={labelCls}>Supplier / Vendor *</label>
                <input value={waterForm.supplierName} onChange={(e) => setWaterForm({ ...waterForm, supplierName: e.target.value })} className={inputCls} placeholder="e.g. AquaFlow Tankers" required />
              </div>
              <div>
                <label className={labelCls}>Vehicle No</label>
                <input value={waterForm.vehicleNo} onChange={(e) => setWaterForm({ ...waterForm, vehicleNo: e.target.value })} className={inputCls} placeholder="TN 01 AB 1234" />
              </div>
              <div>
                <label className={labelCls}>Capacity (litres)</label>
                <input type="number" min="0" value={waterForm.capacityLitres} onChange={(e) => setWaterForm({ ...waterForm, capacityLitres: e.target.value })} className={inputCls} placeholder="12000" />
              </div>
              <div>
                <label className={labelCls}>Trips</label>
                <input type="number" min="1" value={waterForm.trips} onChange={(e) => setWaterForm({ ...waterForm, trips: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={waterForm.amount} onChange={(e) => setWaterForm({ ...waterForm, amount: e.target.value })} className={inputCls} placeholder="0.00" />
              </div>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="flex-1">
                <label className={labelCls}>Notes</label>
                <input value={waterForm.notes} onChange={(e) => setWaterForm({ ...waterForm, notes: e.target.value })} className={inputCls} placeholder="Optional notes" />
              </div>
              {waterForm.id && (
                <button type="button" onClick={() => setWaterForm({ supplierName: '', vehicleNo: '', capacityLitres: '', trips: '1', amount: '', notes: '' })} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                <Plus className="h-4 w-4" /> {waterForm.id ? 'Update' : 'Add Entry'}
              </button>
            </div>
          </form>

          <DataTable
            data={waterLogs}
            columns={waterColumns}
            hideSearch
            empty={<EmptyState icon={Droplets} title="No deliveries logged" description={`No water lorry entries for ${date} yet.`} />}
            actions={(l) => (
              <>
                <button onClick={() => setWaterForm({ id: l.id, supplierName: l.supplierName, vehicleNo: l.vehicleNo ?? '', capacityLitres: l.capacityLitres != null ? String(l.capacityLitres) : '', trips: String(l.trips), amount: l.amount != null ? String(l.amount) : '', notes: l.notes ?? '' })} className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => confirmDelete(() => deleteWaterLog(l.id))} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          />
        </div>
      )}

      {/* ── EB Log ───────────────────────────────────────────────────────── */}
      {tab === 'eb' && (
        <div className="space-y-4">
          <form onSubmit={submitEb} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">{ebForm.id ? 'Edit EB entry' : `New EB entry — ${date}`}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelCls}>Meter Reading — Start</label>
                <input type="number" step="0.1" value={ebForm.meterStart} onChange={(e) => setEbForm({ ...ebForm, meterStart: e.target.value })} className={inputCls} placeholder="e.g. 45210.5" />
              </div>
              <div>
                <label className={labelCls}>Meter Reading — End</label>
                <input type="number" step="0.1" value={ebForm.meterEnd} onChange={(e) => setEbForm({ ...ebForm, meterEnd: e.target.value })} className={inputCls} placeholder="e.g. 45390.0" />
              </div>
              <div>
                <label className={labelCls}>Power Cut (minutes)</label>
                <input type="number" min="0" value={ebForm.powerCutMinutes} onChange={(e) => setEbForm({ ...ebForm, powerCutMinutes: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Generator Run Note</label>
                <input value={ebForm.generatorNote} onChange={(e) => setEbForm({ ...ebForm, generatorNote: e.target.value })} className={inputCls} placeholder="e.g. DG ran 6:10–6:55 PM" />
              </div>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="flex-1">
                <label className={labelCls}>Notes</label>
                <input value={ebForm.notes} onChange={(e) => setEbForm({ ...ebForm, notes: e.target.value })} className={inputCls} placeholder="Optional notes" />
              </div>
              {ebForm.id && (
                <button type="button" onClick={() => setEbForm({ meterStart: '', meterEnd: '', powerCutMinutes: '0', generatorNote: '', notes: '' })} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                <Plus className="h-4 w-4" /> {ebForm.id ? 'Update' : 'Add Entry'}
              </button>
            </div>
          </form>

          <DataTable
            data={ebLogs}
            columns={ebColumns}
            hideSearch
            empty={<EmptyState icon={Zap} title="No EB entries" description={`No electricity readings for ${date} yet.`} />}
            actions={(l) => (
              <>
                <button onClick={() => setEbForm({ id: l.id, meterStart: l.meterStart != null ? String(l.meterStart) : '', meterEnd: l.meterEnd != null ? String(l.meterEnd) : '', powerCutMinutes: String(l.powerCutMinutes), generatorNote: l.generatorNote ?? '', notes: l.notes ?? '' })} className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => confirmDelete(() => deleteEbLog(l.id))} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          />
        </div>
      )}

      {/* ── Housekeeping ─────────────────────────────────────────────────── */}
      {tab === 'housekeeping' && (
        <div className="space-y-4">
          <form onSubmit={submitHk} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">{hkForm.id ? 'Edit task' : `New task — ${date}`}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className={labelCls}>Area / Block *</label>
                <input value={hkForm.area} onChange={(e) => setHkForm({ ...hkForm, area: e.target.value })} className={inputCls} placeholder="e.g. Block A Lobby" required />
              </div>
              <div className="lg:col-span-2">
                <label className={labelCls}>Task *</label>
                <input value={hkForm.task} onChange={(e) => setHkForm({ ...hkForm, task: e.target.value })} className={inputCls} placeholder="e.g. Floor mopping & dusting" required />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={hkForm.status} onChange={(e) => setHkForm({ ...hkForm, status: e.target.value as HousekeepingLog['status'] })} className={inputCls}>
                  {HK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Staff Name</label>
                <input value={hkForm.staffName} onChange={(e) => setHkForm({ ...hkForm, staffName: e.target.value })} className={inputCls} placeholder="Assigned staff" />
              </div>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <div className="flex-1">
                <label className={labelCls}>Remarks</label>
                <input value={hkForm.remarks} onChange={(e) => setHkForm({ ...hkForm, remarks: e.target.value })} className={inputCls} placeholder="Optional remarks" />
              </div>
              {hkForm.id && (
                <button type="button" onClick={() => setHkForm({ area: '', task: '', status: 'Done', staffName: '', remarks: '' })} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                <Plus className="h-4 w-4" /> {hkForm.id ? 'Update' : 'Add Task'}
              </button>
            </div>
          </form>

          <DataTable
            data={housekeepingLogs}
            columns={hkColumns}
            hideSearch
            empty={<EmptyState icon={Sparkles} title="No housekeeping entries" description={`No housekeeping tasks for ${date} yet.`} />}
            actions={(l) => (
              <>
                <button onClick={() => setHkForm({ id: l.id, area: l.area, task: l.task, status: l.status, staffName: l.staffName ?? '', remarks: l.remarks ?? '' })} className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => confirmDelete(() => deleteHousekeepingLog(l.id))} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          />
        </div>
      )}
    </div>
  );
}
