import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquareWarning,
  Wrench,
  Store,
  Home,
  Megaphone,
  ShieldAlert,
  CalendarDays,
  Briefcase,
  User,
  Bell,
  QrCode,
  Lock,
  Star,
  ArrowRight,
  Search,
  LayoutGrid,
  AlertCircle,
  Phone,
  Mail,
  Download,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';
import { api } from '@/lib/api';
import StatusBadge from '@/components/features/StatusBadge';
import type { Announcement } from '@/types';

// ─── Service definitions ──────────────────────────────────────────────────────

interface ServiceDef {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  route: string;
  colorClass: string;          // icon container bg + icon text
  iconBg: string;
  iconText: string;
}

const SERVICES: ServiceDef[] = [
  {
    key: 'complaints',
    name: 'Complaints',
    description: 'Raise & track issue complaints',
    icon: MessageSquareWarning,
    route: '/tenant/complaints',
    colorClass: 'bg-red-50 text-red-600',
    iconBg: 'bg-red-50',
    iconText: 'text-red-600',
  },
  {
    key: 'maintenance',
    name: 'Maintenance',
    description: 'Book maintenance & repairs',
    icon: Wrench,
    route: '/tenant/maintenance',
    colorClass: 'bg-orange-50 text-orange-600',
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
  },
  {
    key: 'marketplace',
    name: 'Vendor Marketplace',
    description: 'Browse & book trusted vendors',
    icon: Store,
    route: '/tenant/marketplace',
    colorClass: 'bg-indigo-50 text-indigo-600',
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
  },
  {
    key: 'rental',
    name: 'Rental Marketplace',
    description: 'List & find rental properties',
    icon: Home,
    route: '/tenant/rental',
    colorClass: 'bg-green-50 text-green-600',
    iconBg: 'bg-green-50',
    iconText: 'text-green-600',
  },
  {
    key: 'announcements',
    name: 'Announcements',
    description: 'Building news & updates',
    icon: Megaphone,
    route: '/tenant/announcements',
    colorClass: 'bg-blue-50 text-blue-600',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
  },
  {
    key: 'emergency-contacts',
    name: 'Emergency Contacts',
    description: 'Quick access to emergency numbers',
    icon: ShieldAlert,
    route: '/tenant/emergency-contacts',
    colorClass: 'bg-rose-50 text-rose-600',
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
  },
  {
    key: 'events',
    name: 'Events',
    description: 'Discover & join community events',
    icon: CalendarDays,
    route: '/tenant/events',
    colorClass: 'bg-purple-50 text-purple-600',
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
  },
  // 'Business Ads' tile removed: in-app advertisements are super-admin-only
  // (route /tenant/business-ads is unregistered and the API is super_admin-gated).
  {
    key: 'profile',
    name: 'My Profile',
    description: 'View and edit your profile',
    icon: User,
    route: '/tenant/profile',
    colorClass: 'bg-slate-100 text-slate-600',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
  },
  {
    key: 'notifications',
    name: 'Notifications',
    description: 'All your alerts & updates',
    icon: Bell,
    route: '/tenant/notifications',
    colorClass: 'bg-cyan-50 text-cyan-600',
    iconBg: 'bg-cyan-50',
    iconText: 'text-cyan-600',
  },
  {
    key: 'visitor-passes',
    name: 'Visitor Pass Request',
    description: 'Generate QR passes for visitors',
    icon: QrCode,
    route: '/tenant/visitor-passes',
    colorClass: 'bg-teal-50 text-teal-600',
    iconBg: 'bg-teal-50',
    iconText: 'text-teal-600',
  },
  {
    key: 'change-password',
    name: 'Change Password',
    description: 'Update your account password',
    icon: Lock,
    route: '/tenant/change-password',
    colorClass: 'bg-gray-100 text-gray-600',
    iconBg: 'bg-gray-100',
    iconText: 'text-gray-600',
  },
];

// ─── Activity feed item type ──────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  module: 'complaint' | 'maintenance' | 'announcement';
  title: string;
  status?: string;
  date: string;
  route: string;
  icon: React.ElementType;
  iconBg: string;
  iconText: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResidentServiceHub() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { complaintTickets, maintenanceRequests, loadTenantComplaints, loadTenantMaintenanceRequests } = useAppStore();

  const [search, setSearch] = useState('');
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [myListingsCount, setMyListingsCount] = useState(0);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Pinned services stored in localStorage
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('og.pinnedServices') ?? '[]') as string[];
    } catch {
      return [];
    }
  });

  const togglePin = (key: string) => {
    const next = pinned.includes(key) ? pinned.filter((k) => k !== key) : [...pinned, key];
    setPinned(next);
    localStorage.setItem('og.pinnedServices', JSON.stringify(next));
  };

  // Load data on mount
  useEffect(() => {
    // Load complaints if not already loaded
    if (complaintTickets.length === 0) {
      loadTenantComplaints().catch(() => null);
    }
    // Load maintenance if not already loaded
    if (maintenanceRequests.length === 0) {
      loadTenantMaintenanceRequests().catch(() => null);
    }
    // Load unread announcements count
    api.announcements.unreadCount().then(({ count }) => setUnreadAnnouncements(count)).catch(() => null);
    // Load tenant rental listings count
    api.rental.myListings().then((listings) => setMyListingsCount(listings.length)).catch(() => null);
    // Load recent announcements for activity feed
    setLoadingAnnouncements(true);
    api.announcements.tenantList({ perPage: '3' })
      .then((items) => {
        setRecentAnnouncements(items.slice(0, 3));
      })
      .catch(() => null)
      .finally(() => setLoadingAnnouncements(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived counts ─────────────────────────────────────────────────────────

  const openComplaintsCount = complaintTickets.filter(
    (c) => c.status === 'Open' || c.status === 'Assigned' || c.status === 'In Progress'
  ).length;

  const pendingMaintenanceCount = maintenanceRequests.filter(
    (m) => m.status === 'Open' || m.status === 'Assigned' || m.status === 'In Progress'
  ).length;

  // ── Search filtering ───────────────────────────────────────────────────────

  const filteredServices = SERVICES.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredKeys = new Set(filteredServices.map((s) => s.key));

  // ── Activity feed ──────────────────────────────────────────────────────────

  const activityItems: ActivityItem[] = [
    ...complaintTickets.slice(0, 3).map<ActivityItem>((c) => ({
      id: `complaint-${c.id}`,
      module: 'complaint',
      title: c.subject,
      status: c.status,
      date: c.createdAt,
      route: '/tenant/complaints',
      icon: MessageSquareWarning,
      iconBg: 'bg-red-50',
      iconText: 'text-red-500',
    })),
    ...maintenanceRequests.slice(0, 3).map<ActivityItem>((m) => ({
      id: `maintenance-${m.id}`,
      module: 'maintenance',
      title: m.title,
      status: m.status,
      date: m.createdAt,
      route: '/tenant/maintenance',
      icon: Wrench,
      iconBg: 'bg-orange-50',
      iconText: 'text-orange-500',
    })),
    ...recentAnnouncements.map<ActivityItem>((a) => ({
      id: `announcement-${a.id}`,
      module: 'announcement',
      title: a.title,
      status: a.status,
      date: a.createdAt,
      route: '/tenant/announcements',
      icon: Megaphone,
      iconBg: 'bg-blue-50',
      iconText: 'text-blue-500',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // ── Quick action chips ─────────────────────────────────────────────────────

  const quickActions = [
    { label: 'Raise Complaint', route: '/tenant/complaints', colorClass: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' },
    { label: 'Book Maintenance', route: '/tenant/maintenance', colorClass: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' },
    { label: 'Browse Vendors', route: '/tenant/marketplace', colorClass: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100' },
    { label: 'Create Listing', route: '/tenant/rental/create', colorClass: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' },
    { label: 'View Events', route: '/tenant/events', colorClass: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' },
  ];

  // ── Stat card config ───────────────────────────────────────────────────────

  const statCards = [
    { label: 'Open Complaints', value: openComplaintsCount, icon: MessageSquareWarning, colorClass: 'bg-red-500', route: '/tenant/complaints' },
    { label: 'Pending Maintenance', value: pendingMaintenanceCount, icon: Wrench, colorClass: 'bg-orange-500', route: '/tenant/maintenance' },
    { label: 'Unread Announcements', value: unreadAnnouncements, icon: Megaphone, colorClass: 'bg-blue-500', route: '/tenant/announcements' },
    { label: 'My Rental Listings', value: myListingsCount, icon: Home, colorClass: 'bg-green-500', route: '/tenant/rental' },
  ];

  const pinnedServices = SERVICES.filter((s) => pinned.includes(s.key));

  return (
    <div className="space-y-8 pb-8">

      {/* ── Top Hero Section ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="w-5 h-5 opacity-80" />
              <span className="text-indigo-200 text-sm font-medium">Resident Service Hub</span>
            </div>
            <h1 className="text-2xl font-bold font-[Outfit] truncate">
              Welcome, {user?.name?.split(' ')[0] ?? 'Resident'}
            </h1>
            <p className="text-indigo-200 text-sm mt-1">{getTodayLabel()}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Search services, features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/25"
          />
        </div>

        {/* Quick action chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── My Activity – 4 Stat Cards ────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3 font-[Outfit]">My Activity</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={() => navigate(card.route)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 text-left hover:shadow-md hover:border-slate-200 transition-all"
              >
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', card.colorClass)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 font-[Outfit]">{card.value}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Pinned Services (shown only if some are pinned and not filtered away) */}
      {pinnedServices.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-3 font-[Outfit] flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            Pinned Services
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {pinnedServices.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.key}
                  onClick={() => navigate(service.route)}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm w-28 hover:shadow-md hover:border-slate-200 transition-all',
                    search && !filteredKeys.has(service.key) && 'opacity-40'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', service.iconBg)}>
                    <Icon className={cn('w-5 h-5', service.iconText)} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 text-center leading-tight">{service.name}</span>
                  <Star
                    className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(service.key);
                    }}
                  />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Services Grid ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700 font-[Outfit]">All Services</h2>
          {search && (
            <span className="text-xs text-slate-400">
              {filteredServices.length} result{filteredServices.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            const matches = filteredKeys.has(service.key);
            const isPinned = pinned.includes(service.key);

            // Hide non-matching items when searching
            if (search && !matches) return null;

            return (
              <div
                key={service.key}
                className={cn(
                  'relative bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-start gap-3 group transition-all',
                  'hover:shadow-md hover:border-slate-200 cursor-pointer'
                )}
                onClick={() => navigate(service.route)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(service.route);
                }}
              >
                {/* Icon */}
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', service.iconBg)}>
                  <Icon className={cn('w-5 h-5', service.iconText)} />
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm leading-tight">{service.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">{service.description}</p>
                </div>
                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 self-center transition-colors" />
                {/* Pin button */}
                <button
                  className={cn(
                    'absolute top-3 right-3 p-1 rounded-full transition-opacity',
                    isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                  title={isPinned ? 'Unpin' : 'Pin to top'}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(service.key);
                  }}
                >
                  <Star
                    className={cn(
                      'w-3.5 h-3.5',
                      isPinned ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-amber-400'
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Recent Activity Feed ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3 font-[Outfit]">Recent Activity</h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {activityItems.length === 0 && !loadingAnnouncements ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No recent activity found.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {activityItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', item.iconBg)}>
                      <Icon className={cn('w-4 h-4', item.iconText)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{fmtDate(item.date)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status && <StatusBadge status={item.status} size="sm" />}
                      <button
                        onClick={() => navigate(item.route)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Downloads & Quick Info ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3 font-[Outfit]">Quick Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Emergency Contacts Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Emergency Contacts</p>
                <p className="text-xs text-slate-500">Important numbers</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/tenant/emergency-contacts')}
              className="w-full mt-1 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors"
            >
              View All Contacts
            </button>
          </div>

          {/* Download App Guide Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">App Guide</p>
                <p className="text-xs text-slate-500">Resident handbook</p>
              </div>
            </div>
            <button
              onClick={() => toast.info('Coming soon — app guide will be available for download shortly.')}
              className="w-full mt-1 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Guide
            </button>
          </div>

          {/* Contact Management Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Management Contact</p>
                <p className="text-xs text-slate-500">Reach out to us</p>
              </div>
            </div>
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>support@officegate.in</span>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
