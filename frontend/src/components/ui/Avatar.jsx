import clsx from 'clsx';

const COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-teal-500',
  'bg-pink-500',
  'bg-indigo-500',
];

const SIZES = {
  xs: { box: 'w-6 h-6',   text: 'text-[10px]', dot: 'w-1.5 h-1.5 border' },
  sm: { box: 'w-8 h-8',   text: 'text-xs',      dot: 'w-2 h-2 border'     },
  md: { box: 'w-10 h-10', text: 'text-sm',      dot: 'w-2.5 h-2.5 border' },
  lg: { box: 'w-14 h-14', text: 'text-lg',      dot: 'w-3 h-3 border-2'   },
};

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getColor(name = '') {
  const code = (name.charCodeAt(0) || 0) % COLORS.length;
  return COLORS[code];
}

export default function Avatar({
  name = '',
  src,
  size = 'md',
  online = false,
  className,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;

  return (
    <div className={clsx('relative inline-flex shrink-0', className)} {...rest}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={clsx(s.box, 'rounded-full object-cover')}
        />
      ) : (
        <div
          className={clsx(
            s.box,
            'rounded-full flex items-center justify-center',
            'text-white font-semibold select-none',
            getColor(name)
          )}
          title={name}
        >
          <span className={s.text}>{getInitials(name)}</span>
        </div>
      )}

      {online && (
        <span
          className={clsx(
            s.dot,
            'absolute bottom-0 right-0 rounded-full',
            'bg-green-500 border-white dark:border-gray-900'
          )}
        />
      )}
    </div>
  );
}
