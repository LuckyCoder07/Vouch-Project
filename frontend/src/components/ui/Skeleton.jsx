import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/* ── Base Skeleton ── */
export default function Skeleton({
  width,
  height,
  rounded = false,
  circle = false,
  className,
  style,
  ...rest
}) {
  return (
    <div
      className={twMerge(clsx(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        circle  ? 'rounded-full' :
        rounded ? 'rounded-xl'   : 'rounded-md',
        className
      ))}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
}

/* ── SkeletonText: paragraph placeholder ── */
export function SkeletonText({ lines = 3, className }) {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-full'];
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx('h-3', widths[i % widths.length])}
        />
      ))}
    </div>
  );
}

/* ── SkeletonCard: card shape with header + 3 lines ── */
export function SkeletonCard({ className }) {
  return (
    <div className={clsx('card p-6 space-y-4', className)}>
      {/* Header row */}
      <div className="flex items-center gap-3">
        <Skeleton circle width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      {/* Body lines */}
      <SkeletonText lines={3} />
    </div>
  );
}

/* ── SkeletonTable: N skeleton rows ── */
export function SkeletonTable({ rows = 5, cols = 4, className }) {
  return (
    <div className={clsx('table-wrapper', className)}>
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, ri) => (
            <tr key={ri}>
              {Array.from({ length: cols }).map((_, ci) => (
                <td key={ci}>
                  <Skeleton className={clsx('h-3', ci === 0 ? 'w-32' : 'w-20')} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
