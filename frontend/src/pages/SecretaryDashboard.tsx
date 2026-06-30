import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, AlertCircle, Wrench, Home, Briefcase, HardHat,
  ClipboardList, Megaphone, ArrowRight, RefreshCw
} from 'lucide-react';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSecretaryStore } from '@/stores/useSecretaryStore';
import { useAuthStore } from '@/stores/useAuthStore';

const MODULE_LINKS: Record<string, string> = {
  complaints: '/complaints',
  maintenance: '/maintenance',
  visitors: '/visitors/manage',
  vendors: '/vendor-marketplace',
  rentals: '/rental',
  announcements: '/announcements',
  emergency_contacts: '/emergency-contacts',
  daily_workers: '/daily-workers',
  reports: '/reports',
  payments: '/financials',
  occupancy: '/offices',
};

const MODULE_LABELS: Record<string, string> = {
  complaints: 'Complaint Mgmt',
  maintenance: 'Maintenance',
  visitors: 'Visitors',
  vendors: 'Vendors',
  rentals: 'Rental Marketplace',
  announcements: 'Announcements',
  emergency_contacts: 'Emergency Contacts',
  daily_workers: 'Daily Workers',
  reports: 'Reports',
  payments: 'Financials',
  occupancy: 'Offices',
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export default function SecretaryDashboard() {
  const { dashboard, loading, loadDashboard, loadMyPermissions, permissions } = useSecretaryStore();
  const { user } = useAuthStore();

  const userModules: string[] = user?.secretaryPermissions ?? permissions;

  const hasAccess = (module: string) => {
    // If no modules configured, show nothing
    if (!userModules.length) return false;
    return userModules.includes(module);
  };

  useEffect(() => {
    loadMyPermissions();
    loadDashboard();
  }, [loadDashboard, loadMyPermissions]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-[Outfit]">Secretary Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Welcome back, {user?.name ?? 'Secretary'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadDashboard()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {hasAccess('visitors') && (
            <StatCard
              label="Today's Visitors"
              value={dashboard.todayVisitors}
              icon={Users}
              color="indigo"
              subtitle={`${dashboard.activeVisitors} currently inside`}
            />
          )}
          {hasAccess('complaints') && (
            <StatCard
              label="Open Complaints"
              value={dashboard.openComplaints}
              icon={AlertCircle}
              color="red"
            />
          )}
          {hasAccess('maintenance') && (
            <StatCard
              label="Pending Maintenance"
              value={dashboard.pendingMaintenance}
              icon={Wrench}
              color="amber"
            />
          )}
          {hasAccess('rentals') && (
            <StatCard
              label="Pending Rentals"
              value={dashboard.pendingRentals}
              icon={Home}
              color="green"
            />
          )}
          {hasAccess('vendors') && (
            <StatCard
              label="Pending Vendor Requests"
              value={dashboard.pendingVendorRequests}
              icon={Briefcase}
              color="blue"
            />
          )}
          {hasAccess('daily_workers') && (
            <StatCard
              label="Today's Workers"
              value={dashboard.todayWorkers}
              icon={HardHat}
              color="indigo"
            />
          )}
        </div>
      )}

      {/* Quick Actions */}
      {userModules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userModules.map((mod) => (
                MODULE_LINKS[mod] ? (
                  <Link key={mod} to={MODULE_LINKS[mod]}>
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      {MODULE_LABELS[mod] ?? mod}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                ) : null
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        {hasAccess('complaints') && dashboard && dashboard.recentComplaints.length > 0 && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Recent Complaints
              </CardTitle>
              <Link to="/complaints">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {dashboard.recentComplaints.map((c) => (
                  <div key={c.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{c.subject}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.category} &bull; {formatDate(c.created_at)}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Maintenance */}
        {hasAccess('maintenance') && dashboard && dashboard.recentMaintenance.length > 0 && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-500" />
                Recent Maintenance
              </CardTitle>
              <Link to="/maintenance">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {dashboard.recentMaintenance.map((m) => (
                  <div key={m.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.category} &bull; {formatDate(m.created_at)}</p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Announcements */}
      {hasAccess('announcements') && dashboard && dashboard.pendingAnnouncements.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-indigo-500" />
              Pending Announcements
            </CardTitle>
            <Link to="/announcements">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {dashboard.pendingAnnouncements.map((a) => (
                <div key={a.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(a.created_at)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state when no permissions granted */}
      {userModules.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">No Modules Assigned</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm">
            Your administrator has not yet assigned any module permissions to your secretary account.
            Please contact your admin.
          </p>
        </div>
      )}
    </div>
  );
}
