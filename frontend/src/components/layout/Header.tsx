import { useState } from 'react';
import { Menu, User, Power } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/features/NotificationBell';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/offices': 'Manage Offices',
  '/visitors/entry': 'Entry Visitors',
  '/visitors/checkout': 'Check-Out Visitors',
  '/visitors/manage': 'Visitor Management',
  '/vehicles/entry': 'Vehicle Registry',
  '/vehicles/checkout': 'Check-Out Vehicles',
  '/vendors': 'Vendor Management',
  '/vendor-marketplace': 'Vendor Marketplace',
  '/complaints': 'Complaint Management',
  '/maintenance': 'Maintenance Requests',
  '/staff': 'Staff Attendance',
  '/inventory': 'Inventory & Audit',
  '/utilities': 'Utility Management',
  '/financials': 'Financial Tracking',
  '/reports': 'Reports & Analytics',
  '/qr-codes': 'QR Codes & Gates',
  '/notifications': 'Notification Center',
  '/tenant': 'Tenant Dashboard',
  '/tenant/complaints': 'Complaints',
  '/tenant/maintenance': 'Maintenance',
  '/tenant/marketplace': 'Vendor Marketplace',
  '/tenant/notifications': 'My Notifications',
  '/profile': 'My Profile',
  '/tenant/profile': 'My Profile',
  '/change-password': 'Change Password',
  '/tenant/change-password': 'Change Password',
  // P9-14
  '/rental': 'Rental Marketplace',
  '/tenant/rental': 'Rental Marketplace',
  '/tenant/rental/create': 'Post a Listing',
  '/business-ads': 'Business Ads',
  '/tenant/business-ads': 'Local Businesses',
  '/announcements': 'Announcements',
  '/tenant/announcements': 'Announcements',
  '/emergency-contacts': 'Emergency Contacts',
  '/tenant/emergency-contacts': 'Emergency Contacts',
  '/security/emergency-contacts': 'Emergency Contacts',
  '/daily-workers': 'Daily Workers',
  '/security/daily-workers': 'Daily Workers',
};

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const title = pageTitles[location.pathname] || 'OfficeGate';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (user?.role === 'security') {
    return null;
  }

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-10 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 transition-all duration-300',
        sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-[240px]'
      )}
    >
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div>
        <h1 className="font-[Outfit] text-lg font-semibold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-sky-600 px-4 py-2 shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-700 hover:to-sky-700"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/20 bg-white/20 text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="hidden text-sm font-medium text-white md:block">{user?.name || 'OfficeGate User'}</span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 45%, #1D4ED8 100%)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div className="border-b border-white/10 px-4 py-5 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-sky-300/30 bg-white/10 shadow-lg">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-white">{user?.name || 'OfficeGate User'}</p>
                  <p className="mt-0.5 text-xs capitalize text-sky-100/80">{user?.role || 'admin'}</p>
                </div>

                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate(user?.role === 'tenant' ? '/tenant/profile' : '/profile');
                    }}
                    className="flex-1 rounded-lg border border-white/10 bg-white/10 px-4 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-white/20"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate(user?.role === 'tenant' ? '/tenant/change-password' : '/change-password');
                    }}
                    className="flex-1 rounded-lg border border-white/10 bg-white/10 px-4 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-white/20"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/80 text-white transition-all hover:bg-red-500"
                    title="Logout"
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
