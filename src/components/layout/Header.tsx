import { useState } from 'react';
import { Bell, Search, Menu, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/apartments': 'Manage Apartments',
  '/visitors/entry': 'Entry Visitors',
  '/visitors/checkout': 'Check-Out Visitors',
  '/visitors/manage': 'Visitor Management',
  '/vehicles/entry': 'Vehicle Registry',
  '/vehicles/checkout': 'Check-Out Vehicles',
  '/vendors': 'Vendor Management',
  '/staff': 'Staff Attendance',
  '/inventory': 'Inventory & Audit',
  '/utilities': 'Utility Management',
  '/financials': 'Financial Tracking',
  '/reports': 'Reports & Analytics',
  '/qr-codes': 'QR Codes & Gates',
  '/resident': 'My Dashboard',
  '/workers': 'Daily Workers',
  '/complaints': 'Complaints',
  '/property': 'Property Details',
  '/payments': 'Payments',
  '/emergency': 'Emergency Contacts',
};

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { sidebarCollapsed, toggleSidebar, visitors } = useAppStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const title = pageTitles[location.pathname] || 'ApartmentOS';
  const unreadCount = visitors.filter(v => v.status === 'Inside').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't render header for security role (they have their own)
  if (user?.role === 'security') {
    return null;
  }

  return (
    <header 
      className="fixed top-0 right-0 z-10 h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 transition-all duration-300"
      style={{ left: sidebarCollapsed ? '72px' : '240px' }}
    >
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div>
        <h1 className="text-lg font-semibold text-slate-900 font-[Outfit]">{title}</h1>
        <p className="text-xs text-slate-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold',
              user?.role === 'admin' ? 'bg-indigo-500' :
              user?.role === 'owner' ? 'bg-amber-500' :
              user?.role === 'tenant' ? 'bg-cyan-500' :
              user?.role === 'owner-resident' ? 'bg-green-500' :
              'bg-slate-500'
            )}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-900">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('-', ' ') || 'Guest'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium capitalize',
                      user?.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                      user?.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                      user?.role === 'tenant' ? 'bg-cyan-100 text-cyan-700' :
                      user?.role === 'owner-resident' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    )}>
                      {user?.role?.replace('-', ' ')}
                    </span>
                    {user?.apartmentNo && (
                      <span className="text-xs text-slate-500">{user.apartmentNo}</span>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to profile
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to settings
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Settings
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
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