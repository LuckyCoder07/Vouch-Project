import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Card({
  children,
  className,
  hover = false,
  padding = true,
  as: Tag = 'div',
  ...rest
}) {
  return (
    <Tag
      className={twMerge(clsx(
        hover ? 'card-hover' : 'card',
        padding && 'p-6',
        className
      ))}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, children, className, ...rest }) {
  return (
    <div
      className={twMerge(clsx('px-6 pt-6 pb-0', className))}
      {...rest}
    >
      {title && (
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...rest }) {
  return (
    <div
      className={twMerge(clsx('p-6', className))}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...rest }) {
  return (
    <div
      className={twMerge(clsx(
        'px-6 pb-6 pt-0 flex items-center justify-end gap-3',
        className
      ))}
      {...rest}
    >
      {children}
    </div>
  );
}
