import { cn } from '@/lib/utils';

type Status = 'Inside' | 'Exited' | 'Occupied' | 'Vacant' | 'Paid' | 'Pending' | 'Overdue' | 'Active' | 'Inactive' | 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed' | 'Upcoming' | 'Done' | 'Paused' | 'Blacklisted' | 'Approved' | 'Rejected' | 'Low' | 'Medium' | 'High' | 'Emergency';

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  Inside: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Occupied: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Paid: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Done: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Resolved: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Exited: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  Vacant: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Overdue: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  Rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  Blacklisted: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  Emergency: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  High: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  Inactive: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  Closed: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  Paused: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  Open: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Approved: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Upcoming: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Assigned: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  'In Progress': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  Low: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
}

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.bg, config.text)}>
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />}
      {status}
    </span>
  );
}
