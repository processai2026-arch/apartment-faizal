import { useEffect, useMemo } from 'react';
import { Bell, CheckCheck, Eye, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/features/StatusBadge';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth';

const POLL_MS = 30000;

function notificationIndexPath(role: UserRole) {
  switch (role) {
    case 'security':
      return '/security/notifications';
    case 'tenant':
      return '/tenant/notifications';
    default:
      // admin and super_admin share the admin notification center
      return '/notifications';
  }
}

function formatWhen(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationBell({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, unreadCount, refreshNotifications, markRead, markAllRead } = useAppStore();

  useEffect(() => {
    if (!user?.role) return;
    refreshNotifications({ perPage: 8 }).catch(() => undefined);
    const timer = window.setInterval(() => {
      refreshNotifications({ perPage: 8 }).catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [refreshNotifications, user?.role]);

  const latest = useMemo(() => notifications.slice(0, 5), [notifications]);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
            className
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] rounded-2xl p-0">
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <div>
            <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'You are all caught up'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => markAllRead().catch(() => undefined)}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="mr-1 h-3.5 w-3.5" />
            Mark all
          </Button>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[360px] overflow-y-auto">
          {latest.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No notifications yet.
            </div>
          ) : (
            latest.map((item) => (
              <div key={item.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('truncate text-sm font-semibold', item.isRead ? 'text-slate-700 dark:text-slate-200' : 'text-slate-900 dark:text-white')}>
                        {item.title}
                      </p>
                      {!item.isRead && <Badge variant="destructive" className="h-5 rounded-full px-1.5 text-[10px]">New</Badge>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.priority} size="sm" />
                      <Badge variant="outline" className="rounded-full text-[11px]">{item.category}</Badge>
                      <span className="text-[11px] text-slate-400">{formatWhen(item.createdAt)}</span>
                    </div>
                  </div>
                  {!item.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg px-2 text-xs"
                      onClick={() => markRead(item.id).catch(() => undefined)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {item.actionUrl && (
                  <DropdownMenuItem
                    className="mt-2 cursor-pointer rounded-lg px-2 py-2 text-xs"
                    onClick={() => navigate(item.actionUrl)}
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Open related page
                  </DropdownMenuItem>
                )}
              </div>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="p-3">
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => navigate(notificationIndexPath(user.role))}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
