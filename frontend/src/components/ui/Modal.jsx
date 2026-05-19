import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function Modal({
  open = false,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
}) {
  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && open) onClose?.();
  }, [open, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else       document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={clsx(
              'relative w-full z-10',
              sizeClasses[size] || sizeClasses.md,
              'bg-white dark:bg-gray-900',
              'rounded-2xl shadow-xl',
              'border border-gray-100 dark:border-gray-800'
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-desc' : undefined}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-start justify-between px-6 pt-6 pb-0">
                <div>
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-lg font-semibold text-gray-900 dark:text-white"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id="modal-desc"
                      className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                    >
                      {description}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    className={clsx(
                      'ml-4 shrink-0 p-1.5 rounded-lg',
                      'text-gray-400 hover:text-gray-600',
                      'dark:text-gray-500 dark:hover:text-gray-300',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      'transition-colors duration-150'
                    )}
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
