import clsx from 'clsx';
import Button from './Button';

export default function EmptyState({
  icon,
  title = 'Nothing here yet',
  description,
  action,
  actionLabel = 'Get started',
  className,
}) {
  return (
    <div className={clsx(
      'flex flex-col items-center justify-center text-center',
      'py-16 px-6',
      className
    )}>
      {icon && (
        <div className="mb-4 text-gray-300 dark:text-gray-600 [&>svg]:w-12 [&>svg]:h-12">
          {icon}
        </div>
      )}

      <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 text-sm text-gray-400 dark:text-gray-500 max-w-xs text-balance">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-6">
          <Button variant="primary" onClick={action}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
