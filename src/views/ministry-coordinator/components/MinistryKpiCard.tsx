import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface MinistryKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon | React.ComponentType<{ className?: string; size?: number }>;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    label: string;
    positive?: boolean;
  };
  className?: string;
}

/**
 * Polished statistical KPI card for ministry metrics.
 *
 * @param {MinistryKpiCardProps} props - KPI card configuration.
 * @returns {JSX.Element} Formatted metric card.
 */
export const MinistryKpiCard: React.FC<MinistryKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-[#0284c7]',
  iconBg = 'bg-sky-50',
  trend,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        'p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
          {title}
        </span>
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg, iconColor)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      <div className="mt-2.5">
        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={clsx(
                  'font-bold px-1.5 py-0.5 rounded-md text-[10px]',
                  trend.positive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                )}
              >
                {trend.label}
              </span>
            )}
            {subtitle && <span className="text-slate-400 font-medium truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MinistryKpiCard;
