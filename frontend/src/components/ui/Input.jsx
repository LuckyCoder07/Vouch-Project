import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Input({
  label,
  error,
  hint,
  icon,
  iconRight,
  size = 'md',
  className,
  id,
  ...rest
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const sizeClass = {
    sm: 'py-1.5 text-xs',
    md: '',
    lg: 'py-3 text-base',
  }[size] || '';

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          className={twMerge(clsx(
            'input',
            sizeClass,
            icon     && 'pl-10',
            iconRight && 'pr-10',
            error && 'border-red-400 dark:border-red-500 focus:ring-red-500/30 focus:border-red-500',
            className
          ))}
          aria-invalid={!!error}
          aria-describedby={
            error   ? `${inputId}-error` :
            hint    ? `${inputId}-hint`  : undefined
          }
          {...rest}
        />

        {iconRight && (
          <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            {iconRight}
          </span>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}
