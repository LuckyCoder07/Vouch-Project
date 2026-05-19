import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';
import Skeleton from './Skeleton';

const colorMap = {
  blue:   { icon: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'   },
  green:  { icon: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
  red:    { icon: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'       },
  orange: { icon: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
  purple: { icon: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
};

export default function StatCard({
  icon,
  label,
  value,
  change,
  color = 'blue',
  loading = false,
  className,
}) {
  const colors = colorMap[color] || colorMap.blue;
  const isPositive = change?.value >= 0;

  return (
    <div className={clsx('stat-card', className)}>
      {/* Icon */}
      {icon && (
        <div className={clsx('stat-icon shrink-0 [&>svg]:w-5 [&>svg]:h-5', colors.icon)}>
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="stat-label">{label}</p>

        {loading ? (
          <Skeleton className="h-7 w-24 mt-1" />
        ) : (
          <p className="stat-value">{value}</p>
        )}

        {change && !loading && (
          <div className={clsx(
            'mt-1.5 inline-flex items-center gap-1 text-xs font-medium',
            isPositive
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-500 dark:text-red-400'
          )}>
            {isPositive
              ? <TrendingUp className="w-3.5 h-3.5" />
              : <TrendingDown className="w-3.5 h-3.5" />
            }
            <span>
              {isPositive ? '+' : ''}{change.value}
              {change.label ? ` ${change.label}` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
