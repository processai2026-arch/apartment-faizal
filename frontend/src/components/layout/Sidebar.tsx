import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  LayoutDashboard, Building2, UserPlus, UserCheck, Car, CarFront,
  Users, Wrench, HardHat, Package, Droplets, Wallet, BarChart3,
  ChevronLeft, ShieldCheck, QrCode, Settings, Bell, User, Home, UserCog, MessageSquareWarning, Store,
  Megaphone, ShieldAlert, Briefcase, ClipboardList, MessageCircle, BadgeCheck, TrendingUp, CalendarDays,
  LayoutGrid, Camera, Crown, BarChart2, CreditCard
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const adminNavItems: NavGroup[] = [
  { group: 'Main', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/offices', label: 'Manage Offices', icon: Building2 },
    { to: '/users', label: 'User Management', icon: UserCog },
  ]},
  { group: 'Visitor & Security', items: [
    { to: '/visitors/entry', label: 'Entry Visitors', icon: UserPlus },
    { to: '/visitors/checkout', label: 'Check-Out Visitors', icon: UserCheck, badge: 'inside' },
    { to: '/vehicles/entry', label: 'Vehicle Registry', icon: Car },
    { to: '/vehicles/checkout', label: 'Check-Out Vehicle', icon: CarFront, badge: 'vehicle' },
    { to: '/visitors/manage', label: 'Visitor Management', icon: Users },
    { to: '/visitor-passes', label: 'Visitor Passes', icon: BadgeCheck },
    { to: '/cameras', label: 'CCTV Management', icon: Camera },
  ]},
  { group: 'Operations', items: [
    { to: '/vendors', label: 'Vendor Management', icon: Wrench },
    { to: '/vendor-marketplace', label: 'Vendor Marketplace', icon: Store },
    { to: '/staff', label: 'Staff Attendance', icon: HardHat },
    { to: '/inventory', label: 'Inventory & Audit', icon: Package },
    { to: '/utilities', label: 'Utility Management', icon: Droplets },
    { to: '/financials', label: 'Financial Tracking', icon: Wallet },
    { to: '/complaints', label: 'Complaint Management', icon: MessageSquareWarning },
    { to: '/maintenance', label: 'Maintenance Requests', icon: Wrench },
  ]},
  { group: 'Community', items: [
    { to: '/rental', label: 'Rental Marketplace', icon: Home },
    { to: '/business-ads', label: 'Business Ads', icon: Briefcase },
    { to: '/ad-billing', label: 'Ad Billing', icon: BarChart2 },
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/emergency-contacts', label: 'Emergency Contacts', icon: ShieldAlert },
    { to: '/daily-workers', label: 'Daily Workers', icon: Users },
    { to: '/events', label: 'Community Events', icon: CalendarDays },
  ]},
  { group: 'Analytics', items: [
    { to: '/analytics', label: 'Community Analytics', icon: TrendingUp },
    { to: '/payments', label: 'Payment Dashboard', icon: CreditCard },
    { to: '/subscriptions', label: 'Subscriptions', icon: Crown },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ]},
  { group: 'QR & Access', items: [
    { to: '/qr-codes', label: 'QR Codes & Gates', icon: QrCode },
    { to: '/notifications', label: 'Notification Center', icon: Bell },
  ]},
  { group: 'Settings', items: [
    { to: '/secretary-management', label: 'Secretary Management', icon: UserCog },
    { to: '/whatsapp', label: 'WhatsApp Hub', icon: MessageCircle },
    { to: '/settings', label: 'UI Settings', icon: Settings },
  ]},
];

const tenantNavItems: NavGroup[] = [
  { group: 'Main', items: [
    { to: '/tenant/hub', label: 'Service Hub', icon: LayoutGrid },
    { to: '/tenant', label: 'Dashboard', icon: Home },
    { to: '/tenant/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { to: '/tenant/maintenance', label: 'Maintenance', icon: Wrench },
    { to: '/tenant/marketplace', label: 'Vendor Marketplace', icon: Store },
    { to: '/tenant/notifications', label: 'Notifications', icon: Bell },
  ]},
  { group: 'Community', items: [
    { to: '/tenant/rental', label: 'Rental Marketplace', icon: Home },
    { to: '/tenant/business-ads', label: 'Local Businesses', icon: Briefcase },
    { to: '/tenant/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/tenant/emergency-contacts', label: 'Emergency Contacts', icon: ShieldAlert },
    { to: '/tenant/events', label: 'Events', icon: CalendarDays },
  ]},
  { group: 'Account', items: [
    { to: '/tenant/profile', label: 'My Profile', icon: User },
    { to: '/tenant/subscription', label: 'My Plan', icon: Crown },
    { to: '/tenant/change-password', label: 'Change Password', icon: Settings },
  ]},
];

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

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, visitors, vehicles, unreadCount } = useAppStore();
  const { user } = useAuthStore();
  const location = useLocation();

  const insideCount = visitors.filter(v => v.status === 'Inside').length;
  const vehicleCount = vehicles.filter(v => v.status === 'Inside').length;

  const getBadge = (badge?: string) => {
    if (badge === 'inside') return insideCount;
    if (badge === 'vehicle') return vehicleCount;
    if (badge === 'notifications') return unreadCount;
    return 0;
  };

  if (user?.role === 'security') {
    return null;
  }

  const isSecretary = user?.role === 'admin' && user?.isSecretary === true;
  const secretaryModules: string[] = user?.secretaryPermissions ?? [];

  let navItems: NavGroup[];
  if (user?.role === 'tenant') {
    navItems = tenantNavItems;
  } else if (isSecretary) {
    // Secretary admin: show secretary group first, then all admin nav
    const secretaryGroup: NavGroup = {
      group: 'Secretary',
      items: [
        { to: '/secretary', label: 'Secretary Dashboard', icon: ClipboardList },
        ...secretaryModules
          .filter((mod) => MODULE_LINKS[mod])
          .map((mod) => ({
            to: MODULE_LINKS[mod],
            label: MODULE_LABELS[mod] ?? mod,
            icon: ClipboardList,
          })),
      ],
    };
    navItems = [secretaryGroup, ...adminNavItems];
  } else {
    navItems = adminNavItems;
  }

  return (
    <>
      {!sidebarCollapsed && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside className={cn(
        'fixed left-0 top-0 z-30 flex h-full flex-col overflow-hidden border-r border-slate-800 bg-[#0F172A] sidebar-transition',
        sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
      )}>
        <div className="flex h-16 flex-shrink-0 items-center border-b border-slate-800 px-4">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 overflow-hidden">
              <span className="whitespace-nowrap font-[Outfit] text-lg font-bold text-white">OfficeGate</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto flex-shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            {sidebarCollapsed ? <ChevronLeft className="h-4 w-4 rotate-180" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {!sidebarCollapsed && user && (
          <div className="border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-indigo-500/20 px-2 py-1 text-xs font-medium capitalize text-indigo-400">
                {user.role}
              </span>
              {isSecretary && (
                <span className="rounded-lg bg-purple-500/20 px-2 py-1 text-xs font-medium text-purple-400">
                  Secretary
                </span>
              )}
            </div>
          </div>
        )}

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 py-4">
          {navItems.map((group) => (
            <div key={group.group} className="mb-4">
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{group.group}</p>
              )}
              {group.items.map(({ to, label, icon: Icon, badge }) => {
                const badgeCount = badge === undefined && label.toLowerCase().includes('notification') ? unreadCount : getBadge(badge);
                const isActive = to === '/'
                  ? location.pathname === to
                  : location.pathname.startsWith(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={cn(
                      'mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
                        {badgeCount > 0 && (
                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </span>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && badgeCount > 0 && (
                      <span className="absolute left-8 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
