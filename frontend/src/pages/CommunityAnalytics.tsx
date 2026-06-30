import { useEffect, useMemo } from 'react';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
import MiniChart from '@/components/features/MiniChart';
import { barChartConfig, lineChartConfig, doughnutChartConfig } from '@/lib/charts';
import { Download, Printer, TrendingUp, Building2, Users, AlertCircle, Wrench, DollarSign, Star, Home, Briefcase } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatRupee(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatNum(n: number) {
  return n.toLocaleString('en-IN');
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'indigo' }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    teal: 'bg-teal-50 text-teal-600',
  };
  const cls = colorMap[color] ?? colorMap.indigo;
  return (
    <div className={`rounded-2xl p-4 ${cls}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold font-[Outfit]">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
        <Icon className="h-4 w-4 text-indigo-600" />
      </span>
      <h2 className="text-base font-semibold text-slate-800 font-[Outfit]">{title}</h2>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 print:shadow-none print:border-slate-200">
      {children}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  );
}

function SkeletonBlock({ h = 'h-24' }: { h?: string }) {
  return <div className={`${h} rounded-xl bg-slate-100 animate-pulse`} />;
}

// ── Export CSV helper ─────────────────────────────────────────────────────────

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CommunityAnalytics() {
  const { summary, loading, loadSummary } = useAnalyticsStore();

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleExportCsv = () => {
    if (!summary) return;

    const { occupancy, visitors, complaints, revenue, workers } = summary;
    const rows: string[][] = [
      ['Section', 'Metric', 'Value'],
      ['Occupancy', 'Total Units', String(occupancy.total)],
      ['Occupancy', 'Occupied', String(occupancy.occupied)],
      ['Occupancy', 'Vacant', String(occupancy.vacant)],
      ['Occupancy', 'Occupancy Rate (%)', String(occupancy.occupancyRate)],
      ['Visitors', 'Today', String(visitors.today)],
      ['Visitors', 'This Week', String(visitors.thisWeek)],
      ['Visitors', 'This Month', String(visitors.thisMonth)],
      ['Complaints', 'Total', String(complaints.total)],
      ['Complaints', 'Open', String(complaints.byStatus['Open'] ?? 0)],
      ['Complaints', 'Resolved', String(complaints.byStatus['Resolved'] ?? 0)],
      ['Revenue', 'Total Invoiced', String(revenue.totalInvoiced)],
      ['Revenue', 'Total Paid', String(revenue.totalPaid)],
      ['Revenue', 'Pending', String(revenue.totalPending)],
      ['Revenue', 'Overdue', String(revenue.totalOverdue)],
      ['Workers', 'Total', String(workers.totalWorkers)],
      ['Workers', 'Active', String(workers.active)],
      ['Workers', 'Today Present', String(workers.todayPresent)],
      ['Workers', 'Attendance Rate This Week (%)', String(workers.attendanceRateThisWeek)],
    ];
    downloadCsv('community-analytics.csv', rows);
  };

  // ── Chart configs (memoised) ──────────────────────────────────────────────

  const occupancyChart = useMemo(() => {
    if (!summary) return null;
    const blocks = summary.occupancy.byBlock;
    return barChartConfig(
      blocks.map((b) => b.block),
      blocks.map((b) => b.occupied),
      'Occupied',
      '#6366f1'
    );
  }, [summary]);

  const visitorMonthlyChart = useMemo(() => {
    if (!summary) return null;
    const trend = summary.visitors.monthlyTrend;
    return lineChartConfig(
      trend.map((t) => t.month),
      [{ label: 'Visitors', data: trend.map((t) => t.count), color: '#6366f1' }]
    );
  }, [summary]);

  const visitorDayChart = useMemo(() => {
    if (!summary) return null;
    const days = summary.visitors.byDayOfWeek;
    return barChartConfig(
      days.map((d) => d.day),
      days.map((d) => d.count),
      'Visits',
      '#22c55e'
    );
  }, [summary]);

  const complaintStatusChart = useMemo(() => {
    if (!summary) return null;
    const entries = Object.entries(summary.complaints.byStatus);
    return doughnutChartConfig(
      entries.map(([k]) => k),
      entries.map(([, v]) => v)
    );
  }, [summary]);

  const complaintMonthlyChart = useMemo(() => {
    if (!summary) return null;
    const trend = summary.complaints.monthlyTrend;
    return barChartConfig(
      trend.map((t) => t.month),
      trend.map((t) => t.count),
      'Complaints',
      '#ef4444'
    );
  }, [summary]);

  const maintStatusChart = useMemo(() => {
    if (!summary) return null;
    const entries = Object.entries(summary.maintenance.byStatus);
    return doughnutChartConfig(
      entries.map(([k]) => k),
      entries.map(([, v]) => v),
      ['#f59e0b', '#6366f1', '#22c55e', '#ef4444', '#3b82f6']
    );
  }, [summary]);

  const maintMonthlyChart = useMemo(() => {
    if (!summary) return null;
    const trend = summary.maintenance.monthlyTrend;
    return lineChartConfig(
      trend.map((t) => t.month),
      [{ label: 'Requests', data: trend.map((t) => t.count), color: '#f59e0b' }]
    );
  }, [summary]);

  const revenueMonthlyChart = useMemo(() => {
    if (!summary) return null;
    const trend = summary.revenue.monthlyRevenue;
    return lineChartConfig(
      trend.map((t) => t.month),
      [
        { label: 'Paid', data: trend.map((t) => t.paid), color: '#22c55e' },
        { label: 'Pending', data: trend.map((t) => t.pending), color: '#f59e0b' },
      ]
    );
  }, [summary]);

  const vendorTopRatedChart = useMemo(() => {
    if (!summary) return null;
    const top = summary.vendors.topRated;
    return barChartConfig(
      top.map((v) => v.name.length > 12 ? v.name.slice(0, 12) + '…' : v.name),
      top.map((v) => v.rating),
      'Rating',
      '#8b5cf6'
    );
  }, [summary]);

  const vendorTopBookedChart = useMemo(() => {
    if (!summary) return null;
    const top = summary.vendors.topBooked;
    return barChartConfig(
      top.map((v) => v.name.length > 12 ? v.name.slice(0, 12) + '…' : v.name),
      top.map((v) => v.bookingCount),
      'Bookings',
      '#14b8a6'
    );
  }, [summary]);

  const rentalMonthlyChart = useMemo(() => {
    if (!summary) return null;
    const trend = summary.rentals.monthlyListings;
    return barChartConfig(
      trend.map((t) => t.month),
      trend.map((t) => t.count),
      'Listings',
      '#f97316'
    );
  }, [summary]);

  const workerTypeChart = useMemo(() => {
    if (!summary) return null;
    const entries = Object.entries(summary.workers.byType);
    return doughnutChartConfig(
      entries.map(([k]) => k),
      entries.map(([, v]) => v)
    );
  }, [summary]);

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-xl bg-slate-100 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-9 w-28 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <SkeletonBlock h="h-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, j) => <SkeletonBlock key={j} />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonBlock h="h-32" />
              <SkeletonBlock h="h-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const { occupancy, visitors, complaints, maintenance, revenue, vendors, rentals, workers } = summary;

  return (
    <div className="space-y-6">
      {/* Print media styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
            <TrendingUp className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-[Outfit]">Community Analytics</h1>
            <p className="text-xs text-slate-500">Real-time insights across all modules</p>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* ── Section 1: Occupancy ── */}
      <Section>
        <SectionHeader icon={Building2} title="Occupancy" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KpiCard label="Total Units" value={formatNum(occupancy.total)} color="indigo" />
          <KpiCard label="Occupied" value={formatNum(occupancy.occupied)} color="green" />
          <KpiCard label="Vacant" value={formatNum(occupancy.vacant)} color="amber" />
          <KpiCard label="Occupancy Rate" value={`${occupancy.occupancyRate}%`} color="blue" />
        </div>
        {occupancyChart && occupancy.byBlock.length > 0 && (
          <ChartCard title="Occupancy by Block">
            <MiniChart config={occupancyChart} height={140} />
          </ChartCard>
        )}
      </Section>

      {/* ── Section 2: Visitors ── */}
      <Section>
        <SectionHeader icon={Users} title="Visitors" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <KpiCard label="Today" value={formatNum(visitors.today)} color="indigo" />
          <KpiCard label="This Week" value={formatNum(visitors.thisWeek)} color="green" />
          <KpiCard label="This Month" value={formatNum(visitors.thisMonth)} color="blue" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visitorMonthlyChart && (
            <ChartCard title="Monthly Visitor Trend">
              <MiniChart config={visitorMonthlyChart} height={140} />
            </ChartCard>
          )}
          {visitorDayChart && (
            <ChartCard title="By Day of Week">
              <MiniChart config={visitorDayChart} height={140} />
            </ChartCard>
          )}
        </div>
      </Section>

      {/* ── Section 3: Complaints ── */}
      <Section>
        <SectionHeader icon={AlertCircle} title="Complaints" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KpiCard label="Total" value={formatNum(complaints.total)} color="indigo" />
          <KpiCard label="Open" value={formatNum(complaints.byStatus['Open'] ?? 0)} color="red" />
          <KpiCard label="Resolved" value={formatNum(complaints.byStatus['Resolved'] ?? 0)} color="green" />
          <KpiCard label="Avg Resolution" value={`${complaints.avgResolutionHours}h`} color="amber" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaintStatusChart && Object.keys(complaints.byStatus).length > 0 && (
            <ChartCard title="By Status">
              <MiniChart config={complaintStatusChart} height={140} />
            </ChartCard>
          )}
          {complaintMonthlyChart && complaints.monthlyTrend.length > 0 && (
            <ChartCard title="Monthly Trend">
              <MiniChart config={complaintMonthlyChart} height={140} />
            </ChartCard>
          )}
        </div>
      </Section>

      {/* ── Section 4: Maintenance ── */}
      <Section>
        <SectionHeader icon={Wrench} title="Maintenance" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <KpiCard label="Total" value={formatNum(maintenance.total)} color="indigo" />
          <KpiCard label="Pending" value={formatNum(maintenance.pending)} color="amber" />
          <KpiCard label="Avg Resolution" value={`${maintenance.avgResolutionHours}h`} color="teal" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {maintStatusChart && Object.keys(maintenance.byStatus).length > 0 && (
            <ChartCard title="By Status">
              <MiniChart config={maintStatusChart} height={140} />
            </ChartCard>
          )}
          {maintMonthlyChart && maintenance.monthlyTrend.length > 0 && (
            <ChartCard title="Monthly Trend">
              <MiniChart config={maintMonthlyChart} height={140} />
            </ChartCard>
          )}
        </div>
      </Section>

      {/* ── Section 5: Revenue ── */}
      <Section>
        <SectionHeader icon={DollarSign} title="Revenue" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KpiCard label="Total Invoiced" value={formatRupee(revenue.totalInvoiced)} color="indigo" />
          <KpiCard label="Paid" value={formatRupee(revenue.totalPaid)} color="green" />
          <KpiCard label="Pending" value={formatRupee(revenue.totalPending)} color="amber" />
          <KpiCard label="Overdue" value={formatRupee(revenue.totalOverdue)} color="red" />
        </div>
        {revenueMonthlyChart && revenue.monthlyRevenue.length > 0 && (
          <ChartCard title="Monthly Revenue (Paid vs Pending)">
            <MiniChart config={revenueMonthlyChart} height={160} />
          </ChartCard>
        )}
      </Section>

      {/* ── Section 6: Vendors ── */}
      <Section>
        <SectionHeader icon={Star} title="Vendors" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <KpiCard label="Total Vendors" value={formatNum(vendors.total)} color="indigo" />
          <KpiCard label="Avg Rating" value={vendors.avgRating.toFixed(2)} color="violet" />
          <KpiCard label="Total Bookings" value={formatNum(vendors.totalBookings)} color="teal" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendorTopRatedChart && vendors.topRated.length > 0 && (
            <ChartCard title="Top 5 Rated Vendors">
              <MiniChart config={vendorTopRatedChart} height={140} />
            </ChartCard>
          )}
          {vendorTopBookedChart && vendors.topBooked.length > 0 && (
            <ChartCard title="Top 5 Most Booked">
              <MiniChart config={vendorTopBookedChart} height={140} />
            </ChartCard>
          )}
        </div>
      </Section>

      {/* ── Section 7: Rentals ── */}
      <Section>
        <SectionHeader icon={Home} title="Rentals" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KpiCard label="Total Listings" value={formatNum(rentals.total)} color="indigo" />
          <KpiCard label="Active" value={formatNum(rentals.active)} color="green" />
          <KpiCard label="Pending Approval" value={formatNum(rentals.pendingApproval)} color="amber" />
          <KpiCard label="Avg Rent" value={formatRupee(rentals.avgRent)} color="blue" />
        </div>
        {rentalMonthlyChart && rentals.monthlyListings.length > 0 && (
          <ChartCard title="Monthly Listings">
            <MiniChart config={rentalMonthlyChart} height={140} />
          </ChartCard>
        )}
      </Section>

      {/* ── Section 8: Daily Workers ── */}
      <Section>
        <SectionHeader icon={Briefcase} title="Daily Workers" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KpiCard label="Total Workers" value={formatNum(workers.totalWorkers)} color="indigo" />
          <KpiCard label="Active" value={formatNum(workers.active)} color="green" />
          <KpiCard label="Today Present" value={formatNum(workers.todayPresent)} color="teal" />
          <KpiCard label="Attendance Rate" value={`${workers.attendanceRateThisWeek}%`} color="violet" />
        </div>
        {workerTypeChart && Object.keys(workers.byType).length > 0 && (
          <ChartCard title="By Worker Type">
            <MiniChart config={workerTypeChart} height={140} />
          </ChartCard>
        )}
      </Section>
    </div>
  );
}
