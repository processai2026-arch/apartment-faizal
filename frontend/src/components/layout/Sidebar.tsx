import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEntitlementsStore } from '@/stores/useEntitlementsStore';
import { featureKeyForNav } from '@/lib/featureRegistry';
import {
  LayoutDashboard, Building2, UserPlus, UserCheck, Car, CarFront,
  Users, Wrench, HardHat, Package, Droplets, Wallet, BarChart3,
  ChevronLeft, ShieldCheck, QrCode, Settings, Bell, User, Home, UserCog, MessageSquareWarning, Store,
  Megaphone, ShieldAlert, Briefcase, ClipboardList, MessageCircle, BadgeCheck, CalendarDays,
  LayoutGrid, Camera, TrendingUp, CreditCard, Receipt, BadgeDollarSign, Cpu, PackageCheck,
  HandCoins, Stethoscope,
  FileText, ArrowLeftRight, FileCheck, Fuel
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
    { to: '/offices', label: 'Manage User/Tenant', icon: Building2 },
    { to: '/users', label: 'Security Management', icon: UserCog },
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
    { to: '/payroll', label: 'Payroll', icon: HandCoins },
    { to: '/medical', label: 'Medical Reports', icon: Stethoscope },
    { to: '/inventory', label: 'Inventory & Audit', icon: Package },
    { to: '/assets', label: 'Asset Tracking', icon: PackageCheck },
    { to: '/utilities', label: 'Utility Management', icon: Droplets },
    { to: '/financials', label: 'Financial Tracking', icon: Wallet },
    { to: '/expenses', label: 'Office Expenses', icon: Receipt },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/name-transfers', label: 'Name Transfer', icon: ArrowLeftRight },
    { to: '/complaints', label: 'Complaint Management', icon: MessageSquareWarning },
    { to: '/maintenance', label: 'Maintenance Requests', icon: Wrench },
    { to: '/daily-ops', label: 'Daily Operations', icon: ClipboardList },
  ]},
  { group: 'Community', items: [
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/emergency-contacts', label: 'Emergency Contacts', icon: ShieldAlert },
    { to: '/events', label: 'Community Events', icon: CalendarDays },
    { to: '/enquiry', label: 'Apartment Enquiry', icon: MessageSquareWarning },
  ]},
  { group: 'Reports', items: [
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/compliance', label: 'Accounts & Compliance', icon: FileCheck },
    { to: '/analytics', label: 'Community Analytics', icon: TrendingUp },
    { to: '/payments', label: 'Payment Dashboard', icon: CreditCard },
  ]},
  { group: 'QR & Access', items: [
    { to: '/qr-codes', label: 'QR Codes & Gates', icon: QrCode },
    { to: '/iot', label: 'IoT Monitoring', icon: Cpu },
    { to: '/home-automation', label: 'Home Automation', icon: Home },
    { to: '/notifications', label: 'Notification Center', icon: Bell },
  ]},
  { group: 'Settings', items: [
    { to: '/settings', label: 'UI Settings', icon: Settings },
  ]},
];

// Rendered ONLY for the super_admin role — SaaS provisioning operator view.
const superAdminNavItems: NavGroup[] = [
  { group: 'Platform', items: [
    { to: '/super', label: 'Organizations', icon: ShieldCheck },
    { to: '/subscriptions', label: 'Subscriptions', icon: BadgeDollarSign },
  ]},
  { group: 'Revenue', items: [
    { to: '/business-ads', label: 'Business Ads', icon: Briefcase },
    { to: '/ad-billing', label: 'Ad Billing', icon: Receipt },
    { to: '/amc', label: 'AMC', icon: Fuel },
  ]},
  { group: 'Settings', items: [
    { to: '/settings', label: 'UI Settings', icon: Settings },
  ]},
];

const tenantNavItems: NavGroup[] = [
  { group: 'Main', items: [
    { to: '/tenant/hub', label: 'Service Hub', icon: LayoutGrid },
    { to: '/tenant', label: 'Dashboard', icon: Home },
    { to: '/tenant/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { to: '/tenant/maintenance', label: 'Maintenance', icon: Wrench },
    { to: '/tenant/home-automation', label: 'My Home', icon: Home },
    { to: '/tenant/marketplace', label: 'Vendor Marketplace', icon: Store },
    { to: '/tenant/notifications', label: 'Notifications', icon: Bell },
  ]},
  { group: 'Community', items: [
    { to: '/tenant/rental', label: 'Rental Marketplace', icon: Home },
    { to: '/tenant/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/tenant/emergency-contacts', label: 'Emergency Contacts', icon: ShieldAlert },
    { to: '/tenant/events', label: 'Events', icon: CalendarDays },
    { to: '/tenant/business-ads', label: 'Local Businesses', icon: Briefcase },
  ]},
  { group: 'Account', items: [
    { to: '/tenant/profile', label: 'My Profile', icon: User },
    { to: '/tenant/change-password', label: 'Change Password', icon: Settings },
  ]},
];

const securityNavItems: NavGroup[] = [
  { group: 'Security Ops', items: [
    { to: '/security', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/security/visitors/entry', label: 'Visitor Entry', icon: UserPlus },
    { to: '/security/visitors/checkout', label: 'Visitor Checkout', icon: UserCheck, badge: 'inside' },
    { to: '/security/vehicles/entry', label: 'Vehicle Entry', icon: Car },
    { to: '/security/vehicles/checkout', label: 'Vehicle Checkout', icon: CarFront, badge: 'vehicle' },
    { to: '/security/visitor-passes', label: 'Scan Visitor Pass', icon: BadgeCheck },
    { to: '/security/daily-workers', label: 'Daily Workers', icon: Users },
  ]},
  { group: 'Information', items: [
    { to: '/security/emergency-contacts', label: 'Emergency Contacts', icon: ShieldAlert },
    { to: '/security/notifications', label: 'Notifications', icon: Bell },
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
  const entitledFeatures = useEntitlementsStore((s) => s.features);
  const location = useLocation();

  const insideCount = visitors.filter(v => v.status === 'Inside').length;
  const vehicleCount = vehicles.filter(v => v.status === 'Inside').length;

  const getBadge = (badge?: string) => {
    if (badge === 'inside') return insideCount;
    if (badge === 'vehicle') return vehicleCount;
    if (badge === 'notifications') return unreadCount;
    return 0;
  };

  const isSecretary = user?.role === 'admin' && user?.isSecretary === true;
  const secretaryModules: string[] = user?.secretaryPermissions ?? [];

  let navItems: NavGroup[];
  if (user?.role === 'tenant') {
    navItems = tenantNavItems;
  } else if (user?.role === 'super_admin') {
    navItems = superAdminNavItems;
  } else if (user?.role === 'security') {
    navItems = securityNavItems;
  } else if (isSecretary) {
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

  // Entitlement filtering: hide nav items whose `to` maps to a feature key that
  // is disabled for this organization. super_admin sees everything (no filter);
  // always-on items (featureKeyForNav → undefined) are always kept. Fail-soft:
  // when entitlements are unknown (null — not loaded or endpoint errored) we
  // keep every item so the nav never flashes empty and no one is locked out.
  if (user?.role !== 'super_admin' && entitledFeatures !== null) {
    navItems = navItems
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const key = featureKeyForNav(item.to);
          return key === undefined || entitledFeatures.includes(key);
        }),
      }))
      .filter((group) => group.items.length > 0);
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
                {user.role.replace('_', ' ')}
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
                const isActive = to === '/' || to === '/tenant' || to === '/security'
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
