import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const dotColors = {
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  red:    'bg-red-500',
  orange: 'bg-orange-500',
  gray:   'bg-gray-400',
  purple: 'bg-purple-500',
};

export default function Badge({
  variant = 'gray',
  size = 'md',
  dot = false,
  children,
  className,
  ...rest
}) {
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : '';

  return (
    <span
      className={twMerge(clsx(`badge-${variant}`, sizeClass, className))}
      {...rest}
    >
      {dot && (
        <span
          className={clsx(
            'inline-block w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[variant] || 'bg-gray-400'
          )}
        />
      )}
      {children}
    </span>
  );
}
