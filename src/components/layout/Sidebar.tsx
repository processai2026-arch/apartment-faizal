import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { hasPermission } from '@/types/auth';
import {
  LayoutDashboard, Building2, UserPlus, UserCheck, Car, CarFront,
  Users, Wrench, HardHat, Package, Droplets, Wallet, BarChart3,
  ChevronLeft, ShieldCheck, QrCode, Home, MessageSquare, Phone,
  CreditCard, Bell
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  permission?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
  roles?: string[];
}

// Admin navigation
const adminNavItems: NavGroup[] = [
  { group: 'Main', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/apartments', label: 'Manage Apartments', icon: Building2 },
  ]},
  { group: 'Visitor & Security', items: [
    { to: '/visitors/entry', label: 'Entry Visitors', icon: UserPlus },
    { to: '/visitors/checkout', label: 'Check-Out Visitors', icon: UserCheck, badge: 'inside' },
    { to: '/vehicles/entry', label: 'Vehicle Registry', icon: Car },
    { to: '/vehicles/checkout', label: 'Check-Out Vehicle', icon: CarFront, badge: 'vehicle' },
    { to: '/visitors/manage', label: 'Visitor Management', icon: Users },
  ]},
  { group: 'Operations', items: [
    { to: '/vendors', label: 'Vendor Management', icon: Wrench },
    { to: '/staff', label: 'Staff Attendance', icon: HardHat },
    { to: '/inventory', label: 'Inventory & Audit', icon: Package },
    { to: '/utilities', label: 'Utility Management', icon: Droplets },
    { to: '/financials', label: 'Financial Tracking', icon: Wallet },
  ]},
  { group: 'Analytics', items: [
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ]},
  { group: 'QR & Access', items: [
    { to: '/qr-codes', label: 'QR Codes & Gates', icon: QrCode },
  ]},
];

// Resident navigation (Owner/Tenant/Owner-Resident)
const residentNavItems: NavGroup[] = [
  { group: 'Main', items: [
    { to: '/resident', label: 'Dashboard', icon: Home },
  ]},
  { group: 'Visitors', items: [
    { to: '/visitors/entry', label: 'Invite Visitor', icon: UserPlus, permission: 'visitors.invite' },
    { to: '/visitors/manage', label: 'My Visitors', icon: Users, permission: 'visitors.view' },
  ]},
  { group: 'Services', items: [
    { to: '/workers', label: 'Daily Workers', icon: HardHat, permission: 'workers.register' },
    { to: '/vehicles', label: 'My Vehicles', icon: Car, permission: 'vehicles.view' },
    { to: '/complaints', label: 'Complaints', icon: MessageSquare, permission: 'complaints.raise' },
  ]},
  { group: 'Property', items: [
    { to: '/property', label: 'Property Details', icon: Building2, permission: 'property.view' },
    { to: '/payments', label: 'Payments', icon: CreditCard, permission: 'payments.view' },
  ]},
  { group: 'Emergency', items: [
    { to: '/emergency', label: 'Emergency Contacts', icon: Phone, permission: 'emergency.view' },
  ]},
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, visitors, vehicles } = useAppStore();
  const { user } = useAuthStore();
  const location = useLocation();

  const insideCount = visitors.filter(v => v.status === 'Inside').length;
  const vehicleCount = vehicles.filter(v => v.status === 'Inside').length;

  const getBadge = (badge?: string) => {
    if (badge === 'inside') return insideCount;
    if (badge === 'vehicle') return vehicleCount;
    return 0;
  };

  // Determine which nav items to show based on user role
  const getNavItems = (): NavGroup[] => {
    if (!user) return [];
    
    switch (user.role) {
      case 'admin':
        return adminNavItems;
      case 'security':
        // Security uses a separate dashboard without sidebar
        return [];
      case 'owner':
      case 'tenant':
      case 'owner-resident':
        // Filter items based on permissions
        return residentNavItems.map(group => ({
          ...group,
          items: group.items.filter(item => 
            !item.permission || hasPermission(user.role, item.permission)
          )
        })).filter(group => group.items.length > 0);
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Don't render sidebar for security role
  if (user?.role === 'security') {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside className={cn(
        'fixed left-0 top-0 h-full z-30 flex flex-col sidebar-transition overflow-hidden',
        'bg-[#0F172A] border-r border-slate-800',
        sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
      )}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 overflow-hidden">
              <span className="text-white font-bold text-lg font-[Outfit] whitespace-nowrap">ApartmentOS</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0"
          >
            {sidebarCollapsed ? <ChevronLeft className="w-4 h-4 rotate-180" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Role Badge */}
        {!sidebarCollapsed && user && (
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={cn(
                'px-2 py-1 rounded-lg text-xs font-medium capitalize',
                user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' :
                user.role === 'owner' ? 'bg-amber-500/20 text-amber-400' :
                user.role === 'tenant' ? 'bg-cyan-500/20 text-cyan-400' :
                user.role === 'owner-resident' ? 'bg-green-500/20 text-green-400' :
                'bg-slate-500/20 text-slate-400'
              )}>
                {user.role.replace('-', ' ')}
              </span>
              {user.apartmentNo && (
                <span className="text-xs text-slate-500">{user.apartmentNo}</span>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2">
          {navItems.map((group) => (
            <div key={group.group} className="mb-4">
              {!sidebarCollapsed && (
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">{group.group}</p>
              )}
              {group.items.map(({ to, label, icon: Icon, badge }) => {
                const badgeCount = getBadge(badge);
                const isActive = to === '/' || to === '/resident' 
                  ? location.pathname === to 
                  : location.pathname.startsWith(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
                        {badgeCount > 0 && (
                          <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-bold">
                            {badgeCount}
                          </span>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && badgeCount > 0 && (
                      <span className="absolute left-8 top-1 bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {badgeCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && user && (
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                user.role === 'admin' ? 'bg-indigo-500' :
                user.role === 'owner' ? 'bg-amber-500' :
                user.role === 'tenant' ? 'bg-cyan-500' :
                user.role === 'owner-resident' ? 'bg-green-500' :
                'bg-slate-500'
              )}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-slate-500 text-xs truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}