import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KpiColor = 'green' | 'amber' | 'red' | 'indigo' | 'blue' | 'cyan' | 'violet';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: KpiColor;
  onClick?: () => void;
  className?: string;
}

// Gradient tokens mirror the Financial Tracking cards (the reference style).
const colorMap: Record<KpiColor, { gradient: string; label: string; sub: string }> = {
  green: { gradient: 'from-green-500 to-emerald-600', label: 'text-green-100', sub: 'text-green-200' },
  amber: { gradient: 'from-amber-500 to-orange-500', label: 'text-amber-100', sub: 'text-amber-200' },
  red: { gradient: 'from-red-500 to-rose-600', label: 'text-red-100', sub: 'text-red-200' },
  indigo: { gradient: 'from-indigo-500 to-purple-600', label: 'text-indigo-100', sub: 'text-indigo-200' },
  blue: { gradient: 'from-blue-500 to-indigo-600', label: 'text-blue-100', sub: 'text-blue-200' },
  cyan: { gradient: 'from-cyan-500 to-blue-600', label: 'text-cyan-100', sub: 'text-cyan-200' },
  violet: { gradient: 'from-violet-500 to-fuchsia-600', label: 'text-violet-100', sub: 'text-violet-200' },
};

/**
 * Gradient KPI card (the strong Financial-card style), reusable across modules.
 * Pass onClick to make it interactive (e.g. log a utility reading).
 */
export default function KpiCard({ label, value, subtitle, icon: Icon, color = 'indigo', onClick, className }: KpiCardProps) {
  const c = colorMap[color];
  const interactive = !!onClick;

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      className={cn(
        'bg-gradient-to-br rounded-2xl p-5 text-white shadow-lg relative',
        c.gradient,
        interactive && 'cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/60',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className={cn('text-sm font-medium mb-1', c.label)}>{label}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold font-[Outfit]">{value}</p>
      {subtitle && <p className={cn('text-xs mt-1', c.sub)}>{subtitle}</p>}
    </div>
  );
}
