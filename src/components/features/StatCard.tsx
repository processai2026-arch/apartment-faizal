import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  color?: 'indigo' | 'green' | 'amber' | 'red' | 'blue';
  subtitle?: string;
}

const colorMap = {
  indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-500', text: 'text-indigo-600' },
  green: { bg: 'bg-green-50', icon: 'bg-green-500', text: 'text-green-600' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-600' },
  red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-600' },
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', text: 'text-blue-600' },
};

export default function StatCard({ label, value, icon: Icon, trend, color = 'indigo', subtitle }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className={cn('bg-white rounded-2xl p-5 border border-slate-100 card-hover shadow-sm')}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', colors.icon)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg',
            trend.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          )}>
            {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 font-[Outfit]">{value}</p>
        <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
