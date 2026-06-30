import { useState, useMemo } from 'react';
import { Bell, Menu, User, Power, CheckCheck } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/offices': 'Manage Offices',
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
  '/profile': 'My Profile',
  '/change-password': 'Change Password',
};

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const { sidebarCollapsed, toggleSidebar, visitors } = useAppStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const title = pageTitles[location.pathname] || 'OfficeGate';

  // Build notifications from visitors currently inside the building.
  const notifications = useMemo(() => {
    return visitors
      .filter(v => v.status === 'Inside' && !dismissedIds.includes(v.id))
      .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
      .map(v => ({
        id: v.id,
        name: v.name || 'Visitor',
        entryTime: v.entryTime,
        whomToMeet: v.whomToMeet || v.companyName || '',
      }));
  }, [visitors, dismissedIds]);

  const unreadCount = notifications.length;

  const handleClearAll = () => {
    setDismissedIds(visitors.filter(v => v.status === 'Inside').map(v => v.id));
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

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
      className={cn(
        'fixed top-0 right-0 left-0 z-10 h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 transition-all duration-300',
        sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-[240px]'
      )}
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
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl z-20 overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    <p className="text-xs text-slate-500">
                      {unreadCount > 0 ? `${unreadCount} visitor${unreadCount > 1 ? 's' : ''} currently inside` : 'You are all caught up'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Clear all
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{n.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {n.whomToMeet ? `Visiting ${n.whomToMeet}` : 'Currently inside'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {n.entryTime ? new Date(n.entryTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDismiss(n.id)}
                          className="text-[11px] text-slate-400 hover:text-slate-700 flex-shrink-0"
                        >
                          Dismiss
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white/20">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="text-white text-sm font-medium hidden md:block">{user?.name || 'Admin User'}</span>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl z-20 overflow-hidden border border-white/10"
                style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.15)'
                }}
              >
                {/* User Info Header */}
                <div className="px-4 py-5 text-center border-b border-white/10">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden shadow-lg border-3 border-indigo-400/30"
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #A855F7 100%)',
                      boxShadow: '0 0 20px rgba(139,92,246,0.4)'
                    }}
                  >
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white font-semibold text-sm">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-indigo-300/80 text-xs mt-0.5 capitalize">
                    {user?.role || 'admin'}
                  </p>
                  <p className="text-indigo-300/70 text-xs mt-1">
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2024'}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="flex-1 py-2.5 px-4 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm text-center whitespace-nowrap"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/change-password');
                    }}
                    className="flex-1 py-2.5 px-4 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-all border border-white/10 backdrop-blur-sm text-center whitespace-nowrap"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-all shadow-lg shadow-red-500/25"
                    title="Logout"
                  >
                    <Power className="w-4 h-4" />
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