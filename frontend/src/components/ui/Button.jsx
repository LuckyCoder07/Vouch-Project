import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const variantClasses = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
  outline: [
    'inline-flex items-center justify-center gap-2',
    'border border-gray-200 dark:border-gray-700',
    'rounded-xl px-5 py-2.5 text-sm font-semibold',
    'hover:bg-gray-50 dark:hover:bg-gray-800',
    'transition-all duration-150 active:scale-95',
    'text-gray-700 dark:text-gray-300',
  ].join(' '),
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: '',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  as: Tag = 'button',
  className,
  children,
  disabled,
  ...rest
}) {
  const classes = twMerge(
    clsx(
      variantClasses[variant],
      sizeClasses[size],
      loading && 'opacity-75 cursor-not-allowed',
      className
    )
  );

  return (
    <Tag
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : icon
          ? <span className="shrink-0">{icon}</span>
          : null
      }
      {children}
      {iconRight && !loading && (
        <span className="shrink-0">{iconRight}</span>
      )}
    </Tag>
  );
}
